import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import CustomError from '../utils/customError.js';
import ActivityLog from '../models/ActivityLog.js';

// Helper to sign JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Send Token response as cookie & JSON
const sendTokenResponse = async (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('token', token, cookieOptions);

  // Hide password
  user.password = undefined;

  // Fetch associated doctor/patient profile
  let profile = null;
  if (user.role === 'doctor') {
    profile = await Doctor.findOne({ userId: user._id });
  } else if (user.role === 'patient') {
    profile = await Patient.findOne({ userId: user._id });
  }

  // Log activity
  await ActivityLog.create({
    userId: user._id,
    action: 'USER_LOGIN_OR_REGISTER',
    ipAddress: req.ip,
    details: `Successfully authenticated: ${user.email} as ${user.role}`,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user,
    profile,
  });
};

// @desc    Register a new user (patient or doctor)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber, specialization, qualification, experienceYears, consultationFee } = req.body;

    // Validate role
    if (role && !['patient', 'doctor'].includes(role)) {
      return next(new CustomError('Invalid role specified', 400));
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new CustomError('User already exists with this email', 400));
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      phoneNumber,
    });

    // Create role-specific profile
    if (user.role === 'patient') {
      await Patient.create({
        userId: user._id,
      });
    } else if (user.role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: specialization || 'General Medicine',
        qualification: qualification || 'MBBS',
        experienceYears: experienceYears || 0,
        consultationFee: consultationFee || 300,
        availability: [
          { day: 'Monday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
          { day: 'Wednesday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] },
          { day: 'Friday', slots: ['09:00', '10:00', '11:00', '14:00', '15:00'] }
        ]
      });
    }

    sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log in an existing user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return next(new CustomError('Please provide email and password', 400));
    }

    // Check user & get hashed password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      // Log failed login
      await ActivityLog.create({
        action: 'FAILED_LOGIN_ATTEMPT',
        ipAddress: req.ip,
        details: `Failed attempt for email: ${email}`,
      });
      return next(new CustomError('Invalid credentials', 401));
    }

    if (!user.isActive) {
      return next(new CustomError('Your account has been deactivated', 403));
    }

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Log out user and clear cookie
// @route   POST /api/auth/logout
// @access  Protected
export const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 1000),
      httpOnly: true,
    });

    if (req.user) {
      await ActivityLog.create({
        userId: req.user._id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip,
        details: `User ${req.user.email} logged out`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Protected
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id });
    } else if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};
