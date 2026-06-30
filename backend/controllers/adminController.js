import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import SystemSettings from '../models/SystemSettings.js';
import ActivityLog from '../models/ActivityLog.js';
import CustomError from '../utils/customError.js';

// @desc    Get dashboard metrics and analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
export const getAnalytics = async (req, res, next) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    
    // Group appointments by status
    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedApptStats = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      total: 0
    };

    appointmentStats.forEach(stat => {
      if (formattedApptStats[stat._id] !== undefined) {
        formattedApptStats[stat._id] = stat.count;
      }
      formattedApptStats.total += stat.count;
    });

    // Total revenue from captured payments
    const revenueData = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueData[0] ? revenueData[0].total : 0;

    // Monthly revenue chart data (last 6 months)
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'captured' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 6 }
    ]);

    const formattedRevenueChart = monthlyRevenue.map(item => {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return {
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        amount: item.revenue
      };
    });

    // Specialization distribution
    const specDistribution = await Doctor.aggregate([
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedSpecDist = specDistribution.map(item => ({
      specialization: item._id,
      count: item.count
    }));

    // Recent 5 appointments
    const recentAppointments = await Appointment.find()
      .populate('patientId', 'name email profileImage')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name profileImage' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        totalPatients,
        totalDoctors,
        appointments: formattedApptStats,
        totalRevenue,
        revenueChart: formattedRevenueChart,
        specializationDistribution: formattedSpecDist,
        recentAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors list (with detailed stats)
// @route   GET /api/admin/doctors
// @access  Private (Admin)
export const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email phoneNumber profileImage isActive');
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a doctor profile (Manual onboarding)
// @route   POST /api/admin/doctors
// @access  Private (Admin)
export const onboardDoctor = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, specialization, qualification, experienceYears, consultationFee, bio } = req.body;

    // Check if email already used
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new CustomError('User already exists with this email', 400));
    }

    // Create user object
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phoneNumber,
    });

    // Create Doctor profile
    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      availability: [
        { day: 'Monday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
        { day: 'Tuesday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
        { day: 'Wednesday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
        { day: 'Thursday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
        { day: 'Friday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] }
      ]
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ONBOARD_DOCTOR',
      ipAddress: req.ip,
      details: `Admin created doctor profile for ${email}`,
    });

    res.status(201).json({
      success: true,
      message: 'Doctor onboarded successfully',
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (activate / deactivate doctor/patient)
// @route   PUT /api/admin/users/:id/toggle
// @access  Private (Admin)
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    if (user._id.equals(req.user._id)) {
      return next(new CustomError('You cannot deactivate your own account', 400));
    }

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      ipAddress: req.ip,
      details: `Admin changed status of ${user.email} to ${user.isActive ? 'Active' : 'Inactive'}`,
    });

    res.status(200).json({
      success: true,
      message: `User status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private (Admin)
export const getAllPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().populate('userId', 'name email phoneNumber profileImage isActive');
    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system settings (Create default if not exists)
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      settings = await SystemSettings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
      });
    }

    await ActivityLog.create({
      userId: req.user._id,
      action: 'UPDATE_SYSTEM_SETTINGS',
      ipAddress: req.ip,
      details: 'Admin updated clinical configurations',
    });

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get audit trail activity logs
// @route   GET /api/admin/logs
// @access  Private (Admin)
export const getActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments();

    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        total,
      },
      logs,
    });
  } catch (error) {
    next(error);
  }
};
