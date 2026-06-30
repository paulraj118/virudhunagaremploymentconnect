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
    },
    // New fields for viewing detailed assessment reports
    questions: [
      {
        questionText: String,
        options: [String],
        selectedOptionIndex: { type: Number, default: -1 },
        correctOptionIndex: Number,
        isCorrect: { type: Boolean, default: false },
        explanation: String,
        topic: String,
        difficulty: String,
      }
    ],
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    interviewReadiness: {
      type: Number,
      default: 0,
    },
    confidenceLevel: {
      type: String,
      default: 'Low',
    },
    suggestedStudyTime: {
      type: String,
      default: '',
    },
    overallRecommendation: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

AssessmentResultSchema.index({ studentId: 1 });
AssessmentResultSchema.index({ jobId: 1 });

export default mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', AssessmentResultSchema);
