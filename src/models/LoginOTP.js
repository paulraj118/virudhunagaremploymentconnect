import mongoose from 'mongoose';

const LoginOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'hr_company', 'college'],
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// TTL index: auto-delete documents 10 minutes after creation
LoginOTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

// Compound index for fast lookups
LoginOTPSchema.index({ email: 1, verified: 0 });

export default mongoose.models.LoginOTP || mongoose.model('LoginOTP', LoginOTPSchema);
