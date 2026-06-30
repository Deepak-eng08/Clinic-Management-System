import Razorpay from 'razorpay';
import crypto from 'crypto';
import Appointment from '../models/Appointment.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import CustomError from '../utils/customError.js';
import { createNotification } from '../services/notificationService.js';

// Initialize Razorpay only if keys are present
const isRazorpayConfigured = () => {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
};

const getRazorpayInstance = () => {
  if (isRazorpayConfigured()) {
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// @desc    Create Razorpay Order for appointment fee
// @route   POST /api/payments/create-order
// @access  Private (Patient)
export const createOrder = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return next(new CustomError('Appointment ID is required', 400));
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return next(new CustomError('Appointment not found', 404));
    }

    if (!appointment.patientId.equals(req.user._id)) {
      return next(new CustomError('Not authorized to make payment for this appointment', 403));
    }

    if (appointment.paymentStatus === 'paid') {
      return next(new CustomError('Appointment is already paid', 400));
    }

    const doctor = appointment.doctorId;
    const amountInINR = doctor.consultationFee;
    const amountInPaise = amountInINR * 100; // Razorpay expects paise

    let orderId = '';
    let isMock = false;

    if (isRazorpayConfigured()) {
      const razorpay = getRazorpayInstance();
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: appointmentId.toString(),
      };

      const order = await razorpay.orders.create(options);
      orderId = order.id;
    } else {
      // Create mock order ID
      orderId = `order_mock_${Math.random().toString(36).substring(2, 12)}`;
      isMock = true;
      console.log('Razorpay keys not configured. Emulating checkout order:', orderId);
    }

    // Save payment log as pending
    const payment = await Payment.create({
      appointmentId,
      patientId: req.user._id,
      amount: amountInINR,
      currency: 'INR',
      razorpayOrderId: orderId,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      isMock,
      order: {
        id: orderId,
        amount: amountInPaise,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID || 'mock_razorpay_key_id',
      },
      paymentId: payment._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify signature and capture payment
// @route   POST /api/payments/verify
// @access  Private (Patient)
export const verifyPayment = async (req, res, next) => {
  try {
    const { appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!appointmentId || !razorpayOrderId) {
      return next(new CustomError('Missing verification credentials', 400));
    }

    const payment = await Payment.findOne({ appointmentId, razorpayOrderId });
    if (!payment) {
      return next(new CustomError('Payment record not found', 404));
    }

    // Check if it is a mock transaction
    const isMock = razorpayOrderId.startsWith('order_mock_');

    if (isMock) {
      // Immediately approve mock order
      payment.status = 'captured';
      payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${Math.random().toString(36).substring(2, 12)}`;
      payment.razorpaySignature = razorpaySignature || 'mock_signature_approved';
      await payment.save();
    } else {
      // Validate signature for real transaction
      if (!isRazorpayConfigured()) {
        return next(new CustomError('Razorpay credentials missing on backend', 500));
      }

      if (!razorpayPaymentId || !razorpaySignature) {
        return next(new CustomError('Payment ID and Signature are required for verification', 400));
      }

      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        payment.status = 'failed';
        await payment.save();
        return next(new CustomError('Signature verification failed. Potential tampering.', 400));
      }

      payment.status = 'captured';
      payment.razorpayPaymentId = razorpayPaymentId;
      payment.razorpaySignature = razorpaySignature;
      await payment.save();
    }

    // Update appointment status to paid
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    appointment.paymentStatus = 'paid';
    appointment.paymentId = payment._id;
    await appointment.save();

    const dateStr = new Date(appointment.date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Notify patient
    await createNotification(
      appointment.patientId,
      'Payment Successful',
      `Payment of ₹${payment.amount} captured successfully for your appointment on ${dateStr}.`,
      'payment'
    );

    // Notify doctor
    const doctorUser = await User.findById(appointment.doctorId.userId);
    await createNotification(
      doctorUser._id,
      'Consultation Paid',
      `Patient paid the fee of ₹${payment.amount} for the appointment scheduled on ${dateStr}.`,
      'payment'
    );

    await ActivityLog.create({
      userId: req.user._id,
      action: 'PAYMENT_VERIFIED',
      ipAddress: req.ip,
      details: `Payment captured: ₹${payment.amount} for appt ${appointmentId}. Mock: ${isMock}`,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and captured successfully',
      payment,
    });
  } catch (error) {
    next(error);
  }
};
