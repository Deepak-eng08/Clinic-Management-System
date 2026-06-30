import express from 'express';
import {
  getDoctorAppointments,
  updateDoctorAvailability,
  writePrescription,
  getDoctorPatients,
  updateDoctorProfile
} from '../controllers/doctorController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(restrictTo('doctor'));

router.get('/appointments', getDoctorAppointments);
router.put('/availability', updateDoctorAvailability);
router.post('/prescriptions', writePrescription);
router.get('/patients', getDoctorPatients);
router.put('/profile', updateDoctorProfile);

export default router;
