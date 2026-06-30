import express from 'express';
import {
  getAnalytics,
  getAllDoctors,
  onboardDoctor,
  toggleUserStatus,
  getAllPatients,
  getSettings,
  updateSettings,
  getActivityLogs
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection & role check for all routes in this file
router.use(protect);
router.use(restrictTo('admin'));

router.get('/analytics', getAnalytics);
router.get('/doctors', getAllDoctors);
router.post('/doctors', onboardDoctor);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/patients', getAllPatients);
router.route('/settings')
  .get(getSettings)
  .put(updateSettings);
router.get('/logs', getActivityLogs);

export default router;
