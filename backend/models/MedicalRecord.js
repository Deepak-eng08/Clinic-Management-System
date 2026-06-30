import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Doctor User ID who uploaded it
      required: true,
    },
    recordType: {
      type: String,
      enum: ['lab-report', 'vaccination', 'history', 'other'],
      default: 'other',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
