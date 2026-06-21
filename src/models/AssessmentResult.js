import mongoose from 'mongoose';

const AssessmentResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: false,
    },
    domain: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 10, // 10 AI generated questions
    },
    correctAnswers: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passFail: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true,
    },
    violations: {
      type: Number,
      default: 0,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    sessionId: {
      type: String,
    },
    browserName: String,
    browserVersion: String,
    operatingSystem: String,
    deviceType: String,
    screenResolution: String,
    loginTimestamp: Date,
    submissionTimestamp: Date,
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    fullscreenExitCount: {
      type: Number,
      default: 0,
    },
    devtoolsAttemptCount: {
      type: Number,
      default: 0,
    },
    clipboardAttemptCount: {
      type: Number,
      default: 0,
    },
    integrityScore: {
      type: Number,
      default: 100,
    }
  },
  { timestamps: true }
);

export default mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', AssessmentResultSchema);
