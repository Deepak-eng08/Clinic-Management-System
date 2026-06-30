import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  relationship: {
    type: String,
    trim: true,
  },
}, { _id: false });

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: {},
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.pre(/^find/, function (next) {
  this.populate('userId', 'name email phoneNumber profileImage isActive');
  next();
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
