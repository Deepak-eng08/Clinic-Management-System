import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      default: 'Antigravity Health Centre',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'info@antigravityhealth.com',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    address: {
      type: String,
      default: '101 Wellness Circle, Medical City',
      trim: true,
    },
    enableChatbot: {
      type: Boolean,
      default: true,
    },
    enableSms: {
      type: Boolean,
      default: false,
    },
    allowedSpecializations: {
      type: [String],
      default: [
        'General Medicine',
        'Cardiology',
        'Pediatrics',
        'Dermatology',
        'Neurology',
        'Orthopedics',
        'Psychiatry',
        'Ophthalmology'
      ],
    },
  },
  {
    timestamps: true,
  }
);

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
