import mongoose from 'mongoose';

const RecruitmentDriveSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    jobDescription: { type: String, required: true },
    industry: { type: String, required: true },
    preferredDomains: [{ type: String }],
    eligibleDepartments: [{ type: String }],
    
    // Eligibility Criteria
    minAssessmentScore: { type: Number, default: 0 },
    minEmployabilityScore: { type: Number, default: 0 },
    minCgpa: { type: Number },
    maxActiveArrears: { type: Number },
    eligibleDegrees: [{ type: String }],
    passingYear: { type: Number },

    location: { type: String },
    salaryPackage: { type: String },
    lastDate: { type: Date },
    interviewDate: { type: Date },
    vacancies: { type: Number },
    
    // Phase 9 Extensions
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    companyStatus: { type: String }, // e.g., 'Approved' from company
    driveStatus: { type: String }, // duplicate of status, keeping both or migrating
    createdBy: { type: String }, // Admin or Company
    updatedBy: { type: String },
    
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Closed'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

export default mongoose.models.RecruitmentDrive || mongoose.model('RecruitmentDrive', RecruitmentDriveSchema);
