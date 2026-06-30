import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import CustomError from '../utils/customError.js';

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return next(new CustomError('Not authorized to access this route', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token and verify they still exist and are active
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new CustomError('The user belonging to this token no longer exists', 401));
    }

    if (!user.isActive) {
      return next(new CustomError('Your account has been deactivated. Please contact support.', 403));
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    next(new CustomError('Not authorized, token failed', 401));
  }
};

// Restrict to roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new CustomError('User not authenticated', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new CustomError(`Role (${req.user.role}) is not authorized to access this resource`, 403));
    }
    next();
  };
};
