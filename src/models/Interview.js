import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema(
  {
    // Basic Information
    interviewId: { 
      type: String, 
      unique: true, 
      required: true 
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User model (role: student)
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    assessmentResultId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentResult' },
    technicalAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechnicalAttempt' },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Legacy Student reference
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentDrive' }, // Legacy RecruitmentDrive reference

    // Interview Details
    interviewType: { type: String, required: true }, // e.g., "Technical", "HR", "Managerial"
    interviewRound: { type: String, required: true }, // e.g., "Round 1", "Final Round"
    interviewDate: { type: Date, required: true },
    interviewTime: { type: String, required: true }, // e.g. "14:30"
    duration: { type: Number, required: true }, // in minutes
    timezone: { type: String, default: 'UTC' },

    // Interview Mode
    interviewMode: { 
      type: String, 
      enum: ['Online', 'Offline'],
      required: true 
    },

    // Online Interview Details
    meetingLink: { type: String },
    meetingPlatform: { type: String }, // e.g., "Zoom", "Google Meet", "MS Teams"

    // Offline Interview Details
    venue: { type: String },
    venueAddress: { type: String },

    // Interviewer details
    interviewerName: { type: String, required: true },
    interviewerEmail: { type: String, required: true },
    interviewerDesignation: { type: String },

    // Instructions
    interviewInstructions: { type: String },

    // Status
    status: { 
      type: String, 
      enum: [
        'Draft',
        'Scheduled', 
        'Rescheduled', 
        'Cancelled', 
        'In Progress', 
        'Completed', 
        'Selected', 
        'Rejected', 
        'Hold', 
        'No Show'
      ],
      default: 'Draft'
    },

    // Interview Confirmation
    confirmationStatus: {
      type: String,
      enum: ['Pending', 'Accepted', 'Declined', 'Reschedule Requested'],
      default: 'Pending'
    },
    candidateDeclineReason: { type: String },
    candidateRescheduleNotes: { type: String },

    // Interview Feedback Section
    feedback: {
      communication: { type: Number, min: 0, max: 10, default: 0 },
      technicalKnowledge: { type: Number, min: 0, max: 10, default: 0 },
      problemSolving: { type: Number, min: 0, max: 10, default: 0 },
      confidence: { type: Number, min: 0, max: 10, default: 0 },
      professionalism: { type: Number, min: 0, max: 10, default: 0 },
      totalScore: { type: Number, min: 0, max: 50, default: 0 },
      strengths: { type: String },
      weaknesses: { type: String },
      remarks: { type: String },
      hrRemarks: { type: String }
    },

    // Interview Timeline
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        actorId: { type: String },
        actorRole: { type: String },
        remarks: { type: String }
      }
    ],

    // Attachment Support
    attachments: [
      {
        fileType: { type: String }, // 'document', 'instructions', 'evaluation_sheet'
        fileName: { type: String },
        fileUrl: { type: String },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    // Interview Analytics
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    completionPercentage: { type: Number, default: 0 },
    attendanceStatus: {
      type: String,
      enum: ['Present', 'Absent', 'Pending'],
      default: 'Pending'
    },

    // Future Compatibility Fields
    videoRecordingUrl: { type: String },
    aiEvaluation: {
      score: { type: Number },
      summary: { type: String },
      transcriptUrl: { type: String },
      analysisDetails: { type: Map, of: mongoose.Schema.Types.Mixed }
    },
    panelMembers: [
      {
        name: { type: String },
        email: { type: String },
        designation: { type: String }
      }
    ],
    meta: { type: Map, of: mongoose.Schema.Types.Mixed },

    // Automated Reminder Flags
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },

    // Audit and Tracking Fields
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// Indexes for query optimization
InterviewSchema.index({ interviewId: 1 });
InterviewSchema.index({ companyId: 1 });
InterviewSchema.index({ hrId: 1 });
InterviewSchema.index({ candidateId: 1 });
InterviewSchema.index({ jobId: 1 });
InterviewSchema.index({ applicationId: 1 });
InterviewSchema.index({ status: 1 });
InterviewSchema.index({ confirmationStatus: 1 });
InterviewSchema.index({ interviewDate: 1 });

export default mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
