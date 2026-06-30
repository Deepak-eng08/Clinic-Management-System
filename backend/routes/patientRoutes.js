import express from 'express';
import {
  getDoctorsList,
  bookAppointment,
  getPatientAppointments,
  getPatientPrescriptions,
  getMedicalRecords,
  addMedicalRecord,
  updatePatientProfile
} from '../controllers/patientController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Allow any logged in user to fetch doctor listings (e.g. admin or patient)
router.get('/doctors', getDoctorsList);

// Restrict actions specifically to role 'patient'
router.post('/appointments', restrictTo('patient'), bookAppointment);
router.get('/appointments', restrictTo('patient'), getPatientAppointments);
router.get('/prescriptions', restrictTo('patient'), getPatientPrescriptions);
router.route('/medical-records')
  .get(restrictTo('patient'), getMedicalRecords)
  .post(restrictTo('patient'), addMedicalRecord);
router.put('/profile', restrictTo('patient'), updatePatientProfile);

export default router;
