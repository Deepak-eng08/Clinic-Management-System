import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Config & Middleware
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';
import errorHandler from './middleware/errorHandler.js';
import CustomError from './utils/customError.js';

// Models for Seeding
import User from './models/User.js';
import Doctor from './models/Doctor.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load env configuration
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, process.env.CLIENT_URL);

// Apply Security and Request Parsing Middleware
app.use(express.json());
app.use(cookieParser());

// Adjust Helmet headers for cross-origin assets and PDF rendering
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);

// Configure CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Logging middleware in dev mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded assets and prescription PDFs statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root route checking server status
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'Antigravity Clinic API is active.' });
});

// Register API Routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

// Catch-all 404 handler
app.use('*', (req, res, next) => {
  next(new CustomError(`Resource path not found: ${req.originalUrl}`, 404));
});

// Centralized error dispatcher
app.use(errorHandler);

// Database Seeding Logic
const seedDatabase = async () => {
  try {
    // 1. Seed Admin
    const adminEmail = 'admin@clinic.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'adminpassword', // Will be hashed by userSchema pre-save hook
        role: 'admin',
        phoneNumber: '+91 99999 88888',
      });
      console.log('Seeded Admin account: admin@clinic.com / adminpassword');
    }

    // 2. Seed Doctors if none exist
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount === 0) {
      const docData = [
        {
          name: 'Dr. Rajesh Sharma',
          email: 'rajesh.sharma@clinic.com',
          specialization: 'Cardiology',
          qualification: 'MD, DM (Cardiology)',
          experienceYears: 12,
          consultationFee: 800,
          bio: 'Specialist in non-invasive cardiology and cardiovascular preventive care.',
          slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        },
        {
          name: 'Dr. Priya Patel',
          email: 'priya.patel@clinic.com',
          specialization: 'Pediatrics',
          qualification: 'MBBS, DCH (Pediatrics)',
          experienceYears: 8,
          consultationFee: 500,
          bio: 'Compassionate pediatric specialist focused on child growth, vaccines, and infant health.',
          slots: ['09:00', '10:00', '11:00', '15:00', '16:00'],
        },
        {
          name: 'Dr. Amit Verma',
          email: 'amit.verma@clinic.com',
          specialization: 'Dermatology',
          qualification: 'MD (Dermatology)',
          experienceYears: 6,
          consultationFee: 600,
          bio: 'Expert in skin care, chronic eczema, acne treatments, and minor dermal surgeries.',
          slots: ['10:00', '11:00', '12:00', '14:00', '15:00'],
        },
      ];

      for (const doc of docData) {
        const u = await User.create({
          name: doc.name,
          email: doc.email,
          password: 'doctorpassword',
          role: 'doctor',
          phoneNumber: '+91 88888 77777',
        });

        await Doctor.create({
          userId: u._id,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          bio: doc.bio,
          availability: [
            { day: 'Monday', slots: doc.slots },
            { day: 'Wednesday', slots: doc.slots },
            { day: 'Friday', slots: doc.slots },
          ],
        });
      }
      console.log('Seeded 3 Doctor accounts with credentials: doctorpassword');
    }
  } catch (err) {
    console.error('Seeding database failed:', err.message);
  }
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server listening in ${process.env.NODE_ENV} mode on port ${PORT}`);
  await seedDatabase();
});
