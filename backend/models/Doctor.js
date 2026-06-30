import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  slots: {
    type: [String], // Array of time strings, e.g., ["09:00", "09:30", "10:00"]
    required: true,
  },
}, { _id: false });

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    bio: {
      type: String,
      trim: true,
    },
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    ratings: {
      average: {
        type: Number,
        default: 5.0,
        min: 1.0,
        max: 5.0,
      },
      count: {
        type: Number,
        default: 1,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Populate user info by default on queries
doctorSchema.pre(/^find/, function (next) {
  this.populate('userId', 'name email phoneNumber profileImage isActive');
  next();
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
