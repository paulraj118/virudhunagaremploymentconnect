import mongoose from 'mongoose';

const DriveApplicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecruitmentDrive',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    collegeName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Applied', 'College Recommended', 'Admin Verified', 'Company Shortlisted', 'Interview Scheduled', 'Interview Completed', 'Selected', 'Rejected'],
      default: 'Applied',
    },
    interviewDate: { type: Date },
    interviewLocation: { type: String }, // or meeting link
    remarks: { type: String },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    recommendedByCollege: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

DriveApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

export default mongoose.models.DriveApplication || mongoose.model('DriveApplication', DriveApplicationSchema);
