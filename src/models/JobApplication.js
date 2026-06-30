import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    stage: {
      type: String,
      enum: [
        'Applied',            // Initial state (Enrolled/Applied)
        'Assessment Completed',
        'Shortlisted',
        'Interview Scheduled',
        'Interview Cleared',
        'Offer Released',
        'Joined',
        'Rejected'
      ],
      default: 'Applied',
    },
    aiResumeScore: {
      type: Number,
    },
    aiSkillMatch: {
      type: Number,
    },
    aiExperienceMatch: {
      type: Number,
    },
    missingSkills: [{
      type: String,
    }],
    technicalTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TechnicalTest',
    },
    technicalTestStatus: {
      type: String,
      enum: ['Not Assigned', 'Assigned', 'In Progress', 'Completed', 'Pass', 'Fail'],
      default: 'Not Assigned',
    },
    interviewDate: {
      type: Date,
    },
    meetingLink: {
      type: String,
    },
    feedback: {
      type: String,
    },
    
    // Phase 6 overall recruitment score integration
    assessmentScore: {
      type: Number,
      default: 0
    },
    technicalScore: {
      type: Number,
      default: 0
    },
    interviewScore: {
      type: Number,
      default: 0
    },
    overallRecruitmentScore: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    finalRank: {
      type: Number,
      default: 0
    },
    finalDecision: {
      type: String,
      enum: ['Selected', 'Rejected', 'Hold', 'Pending'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

JobApplicationSchema.index({ studentId: 1 });
JobApplicationSchema.index({ jobId: 1 });

export default mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema);
