import express from 'express';
import { upload, getUploadedFileUrl } from '../config/cloudinary.js';
import { protect } from '../middleware/authMiddleware.js';
import CustomError from '../utils/customError.js';

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(new CustomError('No file uploaded or file type rejected', 400));
    }

    const fileUrl = getUploadedFileUrl(req.file);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
