import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import ActivityLog from '../models/ActivityLog.js';
import CustomError from '../utils/customError.js';
import { generatePrescriptionPDF } from '../services/pdfService.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Get appointments for current doctor
// @route   GET /api/doctors/appointments
// @access  Private (Doctor)
export const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return next(new CustomError('Doctor profile not found', 404));
    }

    const { status, dateFilter } = req.query;
    const query = { doctorId: doctor._id };

    if (status) {
      query.status = status;
    }

    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.date = { $gte: today, $lt: tomorrow };
    } else if (dateFilter === 'upcoming') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phoneNumber profileImage')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor availability slots
// @route   PUT /api/doctors/availability
// @access  Private (Doctor)
export const updateDoctorAvailability = async (req, res, next) => {
  try {
    const { availability } = req.body; // Array: [{ day: 'Monday', slots: ['09:00', '09:30'] }]

    if (!Array.isArray(availability)) {
      return next(new CustomError('Availability must be an array', 400));
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return next(new CustomError('Doctor profile not found', 404));
    }

    doctor.availability = availability;
    await doctor.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'UPDATE_AVAILABILITY',
      ipAddress: req.ip,
      details: 'Doctor updated weekly scheduling hours',
    });

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability: doctor.availability,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create prescription for an appointment
// @route   POST /api/doctors/prescriptions
// @access  Private (Doctor)
export const writePrescription = async (req, res, next) => {
  try {
    const { appointmentId, diagnosis, medicines, advice } = req.body;

    if (!appointmentId || !diagnosis) {
      return next(new CustomError('Appointment ID and diagnosis are required', 400));
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return next(new CustomError('Doctor profile not found', 404));
    }

    // Verify appointment exists, belongs to doctor, and is not cancelled
    const appointment = await Appointment.findById(appointmentId).populate('patientId');
    if (!appointment) {
      return next(new CustomError('Appointment not found', 404));
    }

    if (!appointment.doctorId.equals(doctor._id)) {
      return next(new CustomError('Not authorized to prescribe for this appointment', 403));
    }

    if (appointment.status === 'cancelled') {
      return next(new CustomError('Cannot prescribe for a cancelled appointment', 400));
    }

    // Create Prescription
    const prescription = await Prescription.create({
      appointmentId,
      patientId: appointment.patientId._id,
      doctorId: doctor._id,
      diagnosis,
      medicines: medicines || [],
      advice,
    });

    // Generate PDF
    const dateStr = new Date(appointment.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const pdfUrl = await generatePrescriptionPDF(
      prescription,
      req.user.name,
      appointment.patientId.name,
      dateStr
    );

    // Save PDF Url to Prescription
    prescription.pdfUrl = pdfUrl;
    await prescription.save();

    // Mark appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    // Send notification to patient
    await createNotification(
      appointment.patientId._id,
      'New Prescription Issued',
      `Dr. ${req.user.name} has prescribed medicines for your consultation on ${dateStr}.`,
      'prescription'
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'WRITE_PRESCRIPTION',
      ipAddress: req.ip,
      details: `Doctor issued prescription for appointment ${appointmentId}`,
    });

    res.status(201).json({
      success: true,
      message: 'Prescription written and saved as PDF successfully',
      prescription,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique patients treated by current doctor
// @route   GET /api/doctors/patients
// @access  Private (Doctor)
export const getDoctorPatients = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return next(new CustomError('Doctor profile not found', 404));
    }

    // Find all patient IDs from appointments
    const patientIds = await Appointment.distinct('patientId', { doctorId: doctor._id });

    const patients = await User.find({ _id: { $in: patientIds } })
      .select('name email phoneNumber profileImage createdAt');

    res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor professional profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
export const updateDoctorProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, specialization, qualification, experienceYears, consultationFee, bio } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return next(new CustomError('Doctor profile not found', 404));
    }

    // Update doctor record
    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;
    await doctor.save();

    // Update user record
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      doctor,
    });
  } catch (error) {
    next(error);
  }
};
