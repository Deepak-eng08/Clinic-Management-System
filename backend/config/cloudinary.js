import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

let storage;

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'clinic_management',
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
    },
  });
  console.log('Cloudinary storage engine initialized');
} else {
  // Fallback to local storage
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
  });
  console.log('Local disk storage engine initialized (Cloudinary keys missing)');
}

// Multer upload middleware
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (.jpg, .jpeg, .png) and PDFs (.pdf) are allowed!'));
    }
  },
});

// Helper to format file response URL
export const getUploadedFileUrl = (file) => {
  if (file.path) {
    // Cloudinary returns secure_url in path, or file.path directly
    if (isCloudinaryConfigured()) {
      return file.path;
    }
    // Local fallback: convert absolute disk path to web-accessible route
    const filename = path.basename(file.path);
    return `/uploads/${filename}`;
  }
  return '';
};
export { cloudinary };
