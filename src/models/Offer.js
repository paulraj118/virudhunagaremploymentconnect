import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema(
  {
    offerId: { type: String, required: true, unique: true }, // e.g., OFF-2026-0001
    applicationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentDrive' },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    jobRole: { type: String, required: true },
    salaryPackage: { type: String, required: true },
    location: { type: String, required: true },
    joiningDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    notes: { type: String },
    status: { 
      type: String, 
      enum: ['Released', 'Accepted', 'Rejected', 'Withdrawn'],
      default: 'Released'
    },
  },
  { timestamps: true }
);

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
