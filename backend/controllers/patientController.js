import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import MedicalRecord from '../models/MedicalRecord.js';
import ActivityLog from '../models/ActivityLog.js';
import CustomError from '../utils/customError.js';
import { createNotification } from '../services/notificationService.js';

// @desc    Search/Filter doctors
// @route   GET /api/patients/doctors
// @access  Private (Patient/All)
export const getDoctorsList = async (req, res, next) => {
  try {
    const { specialization, search, rating } = req.query;
    const filter = {};

    if (specialization) {
      filter.specialization = specialization;
    }

    if (rating) {
      filter['ratings.average'] = { $gte: parseFloat(rating) };
    }

    let doctors = await Doctor.find(filter).populate('userId', 'name email phoneNumber profileImage isActive');

    // If search term is present, filter by doctor name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(doc => doc.userId && searchRegex.test(doc.userId.name));
    }

    // Filter out inactive doctors
    doctors = doctors.filter(doc => doc.userId && doc.userId.isActive);

    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Book an appointment (with time slot collision checks)
// @route   POST /api/patients/appointments
// @access  Private (Patient)
export const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, reason, type, symptoms } = req.body;

    if (!doctorId || !date || !timeSlot) {
      return next(new CustomError('Doctor, date, and timeslot are required', 400));
    }

    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor || !doctor.userId.isActive) {
      return next(new CustomError('Doctor not found or inactive', 404));
    }

    // Verify doctor availability on that specific day
    const bookingDate = new Date(date);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[bookingDate.getDay()];

    const dayAvailability = doctor.availability.find(a => a.day === dayName);
    if (!dayAvailability || !dayAvailability.slots.includes(timeSlot)) {
      return next(new CustomError(`Doctor is not scheduling appointments on ${dayName} at ${timeSlot}`, 400));
    }

    // Check if slot is already booked (and not cancelled)
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: bookingDate,
      timeSlot,
      status: { $ne: 'cancelled' },
    });

    if (existingAppointment) {
      return next(new CustomError('The selected timeslot is already booked. Please choose another.', 400));
    }

    // Create Appointment
    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId,
      date: bookingDate,
      timeSlot,
      reason,
      type: type || 'in-person',
      symptoms: symptoms || [],
    });

    const dateStr = bookingDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Notify Doctor (userId is doctor's User link)
    await createNotification(
      doctor.userId._id,
      'New Appointment Booked',
      `Patient ${req.user.name} has booked an appointment for ${dateStr} at ${timeSlot}.`,
      'appointment'
    );

    // Notify Patient
    await createNotification(
      req.user._id,
      'Appointment Request Received',
      `Your appointment with Dr. ${doctor.userId.name} on ${dateStr} at ${timeSlot} is pending confirmation.`,
      'appointment'
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'BOOK_APPOINTMENT',
      ipAddress: req.ip,
      details: `Patient booked slot ${timeSlot} on ${date} with doctor ${doctor.userId.name}`,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient appointments list
// @route   GET /api/patients/appointments
// @access  Private (Patient)
export const getPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email profileImage phoneNumber' }
      })
      .sort({ date: -1, timeSlot: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient prescriptions list
// @route   GET /api/patients/prescriptions
// @access  Private (Patient)
export const getPatientPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name specialization' }
      })
      .populate('appointmentId', 'date timeSlot')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medical records list
// @route   GET /api/patients/medical-records
// @access  Private (Patient)
export const getMedicalRecords = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user._id })
      .populate('addedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add medical record manually
// @route   POST /api/patients/medical-records
// @access  Private (Patient)
export const addMedicalRecord = async (req, res, next) => {
  try {
    const { fileUrl, recordType, description, date } = req.body;

    if (!fileUrl) {
      return next(new CustomError('File URL is required', 400));
    }

    const record = await MedicalRecord.create({
      patientId: req.user._id,
      addedBy: req.user._id, // Added by patient themselves
      recordType: recordType || 'other',
      fileUrl,
      description,
      date: date ? new Date(date) : undefined,
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADD_MEDICAL_RECORD',
      ipAddress: req.ip,
      details: 'Patient uploaded a new medical document',
    });

    res.status(201).json({
      success: true,
      message: 'Medical record added successfully',
      record,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient clinical demographics
// @route   PUT /api/patients/profile
// @access  Private (Patient)
export const updatePatientProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, dateOfBirth, gender, bloodGroup, address, emergencyContact } = req.body;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return next(new CustomError('Patient profile not found', 404));
    }

    // Update patient record
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    await patient.save();

    // Update user record
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      patient,
    });
  } catch (error) {
    next(error);
  }
};
