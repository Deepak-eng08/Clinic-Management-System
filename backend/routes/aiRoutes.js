import express from 'express';
import { symptomCheck, aiChat, summarizeReport } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/symptom-check', symptomCheck);
router.post('/chat', aiChat);
router.post('/summarize-report', summarizeReport);

export default router;
