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
    interviewDate: {
      type: Date,
    },
    meetingLink: {
      type: String,
    },
    feedback: {
      type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.models.JobApplication || mongoose.model('JobApplication', JobApplicationSchema);
