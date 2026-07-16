import mongoose from 'mongoose';

const TechnicalAttemptSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  technicalTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'TechnicalTest', required: true },

  attemptNumber: { type: Number, default: 1 },        // Always 1 (single attempt only)

  // Session Timing
  browserStartedAt: { type: Date, required: true },   // When the candidate clicked "Start Test"
  submittedAt: { type: Date },                         // When the test was submitted
  timeTaken: { type: Number },                         // Duration in seconds

  autoSubmitted: { type: Boolean, default: false },    // true if timer expired

  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Terminated'],
    default: 'In Progress'
  },

  // Anti-Cheating Tracking
  warningCount: { type: Number, default: 0 },
  cheatingLogs: [{
    eventType: { type: String, required: true }, // TAB_SWITCH, FULLSCREEN_EXIT, COPY_ATTEMPT, etc.
    timestamp: { type: Date, default: Date.now },
    browserVisibilityState: { type: String },
    fullscreenStatus: { type: Boolean }
  }],
  submissionReason: { type: String }, // 'Manual Submission', 'Time Expired', 'Warning Limit Exceeded'


  // Candidate Answers
  answers: {
    mcq: { type: Map, of: String, default: {} },           // { "0": "A", "1": "C", ... } question index → selected option letter
    fillBlanks: { type: Map, of: String, default: {} },     // { "0": "print()", "1": "int", ... }
    programming1: {
      code: { type: String, default: '' },
      languageId: { type: String, default: 'javascript' }
    },
    programming2: {
      code: { type: String, default: '' },
      languageId: { type: String, default: 'javascript' }
    }
  },

  // Section-wise Scores
  scores: {
    mcqScore: { type: Number, default: 0 },                // out of 5
    fillBlanksScore: { type: Number, default: 0 },          // out of 5
    programming1Score: { type: Number, default: 0 },        // out of 5 (Judge0 result)
    programming2Score: { type: Number, default: 0 },        // out of 5 (Judge0 result)
    totalScore: { type: Number, default: 0 }                // out of 20
  },

  resultStatus: {
    type: String,
    enum: ['Pass', 'Fail', 'Pending'],
    default: 'Pending'
  },

  // Audit Fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true  // Adds createdAt & updatedAt automatically
});

// --- Indexes ---
// Unique constraint: one candidate can attempt one test for one job only once
TechnicalAttemptSchema.index({ candidateId: 1, technicalTestId: 1, jobId: 1 }, { unique: true });
TechnicalAttemptSchema.index({ candidateId: 1 });
TechnicalAttemptSchema.index({ companyId: 1 });
TechnicalAttemptSchema.index({ hrId: 1 });
TechnicalAttemptSchema.index({ jobId: 1 });
TechnicalAttemptSchema.index({ technicalTestId: 1 });
TechnicalAttemptSchema.index({ resultStatus: 1 });

export default mongoose.models.TechnicalAttempt || mongoose.model('TechnicalAttempt', TechnicalAttemptSchema);
