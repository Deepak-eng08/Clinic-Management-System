import Doctor from '../models/Doctor.js';
import CustomError from '../utils/customError.js';
import { getAIChatResponse, checkSymptomsAI, summarizeMedicalReportAI } from '../services/aiService.js';

// @desc    Analyze symptoms and recommend doctors
// @route   POST /api/ai/symptom-check
// @access  Private
export const symptomCheck = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms) {
      return next(new CustomError('Please enter your symptoms', 400));
    }

    // Get AI assessment
    const assessment = await checkSymptomsAI(symptoms);

    // Fetch active doctors in the recommended specialization
    const recommendedDoctors = await Doctor.find({
      specialization: assessment.specialization,
    }).populate('userId', 'name email profileImage phoneNumber');

    res.status(200).json({
      success: true,
      assessment,
      recommendedDoctors,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    General conversational healthcare chatbot
// @route   POST /api/ai/chat
// @access  Private
export const aiChat = async (req, res, next) => {
  try {
    const { message, history } = req.body; // history: [{ role: 'user', content: '...' }]

    if (!message) {
      return next(new CustomError('Message prompt is required', 400));
    }

    const reply = await getAIChatResponse(message, history || []);

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Summarize medical report text
// @route   POST /api/ai/summarize-report
// @access  Private
export const summarizeReport = async (req, res, next) => {
  try {
    const { reportText } = req.body;

    if (!reportText) {
      return next(new CustomError('Medical report text is required for analysis', 400));
    }

    const summary = await summarizeMedicalReportAI(reportText);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    next(error);
  }
};
