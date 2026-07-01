import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: {
      type: String,
      required: [true, 'Please provide your college name'],
    },
    degree: {
      type: String,
      required: [true, 'Please provide your degree (e.g., B.Tech, MCA)'],
    },
    department: {
      type: String,
      required: [true, 'Please provide your department'],
    },
    yearOfPassedOut: {
      type: Number,
      required: [true, 'Please provide your year of passing out'],
    },
    // Advanced Academic Information (Optional)
    cgpa: { type: Number },
    currentPercentage: { type: Number },
    tenthPercentage: { type: Number },
    twelfthPercentage: { type: Number },
    currentYear: { type: String },
    currentSemester: { type: Number },
    activeArrears: { type: Number, default: 0 },
    clearedArrears: { type: Number, default: 0 },
    recommendedByCollege: { type: Boolean, default: false },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    skills: [{
      type: String,
    }],
    preferredDomain: {
      type: String,
      required: [true, 'Please select your preferred domain'],
    },
    industryTrack: {
      type: String,
      required: [true, 'Please select your industry track'],
    },
    resumeUrl: {
      type: String,
    },
    enrollmentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    assessmentScore: {
      type: Number,
      default: 0,
    },
    placementStatus: {
      type: String,
      enum: ['enrolled', 'shortlisted', 'interview', 'offered', 'joined'],
      default: 'enrolled',
    },
    certificates: [{
      name: String,
      issuedBy: String,
      fileUrl: String,
      date: { type: Date, default: Date.now }
    }],
    activeSessionId: {
      type: String,
      default: null,
    },
    // New fields for the Self Assessment Profile Form
    preferredJobRole: {
      type: String,
      default: '',
    },
    programmingLanguages: [{
      type: String,
    }],
    areasOfInterest: [{
      type: String,
    }],
    hasInternship: {
      type: String,
      enum: ['Yes', 'No', ''],
      default: '',
    },
    internshipCompany: {
      type: String,
      default: '',
    },
    internshipDuration: {
      type: String,
      default: '',
    },
    numberOfProjects: {
      type: Number,
      default: 0,
    },
    projectTitles: [{
      type: String,
    }],
    selfAssessmentProfileCompleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

StudentSchema.index({ collegeName: 1 });
StudentSchema.index({ enrollmentStatus: 1 });
StudentSchema.index({ placementStatus: 1 });
StudentSchema.index({ degree: 1 });

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
