import mongoose from 'mongoose';

const QuestionDetailSchema = new mongoose.Schema(
  {
    questionId: String,
    questionText: { type: String, required: true },
    options: [String],
    selectedOptionIndex: { type: Number, default: -1 }, // -1 = skipped
    correctOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, default: false },
    explanation: String,
    topic: String,
    difficulty: String,
  },
  { _id: false }
);

const SelfAssessmentResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    industryTrack: {
      type: String,
      required: true,
    },
    preferredDomain: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    totalQuestions: {
      type: Number,
      default: 20,
    },
    questions: [QuestionDetailSchema],
    // Scoring
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    wrongCount: {
      type: Number,
      required: true,
    },
    skippedCount: {
      type: Number,
      default: 0,
    },
    passFail: {
      type: String,
      enum: ['Pass', 'Fail'],
      required: true,
    },
    // Timing
    timeTaken: {
      type: Number, // seconds
      default: 0,
    },
    startTime: Date,
    endTime: Date,
    // AI-style Personalized Feedback
    strengths: [String],
    weaknesses: [String],
    topicPerformance: {
      type: Map,
      of: Number, // topic name -> percentage
    },
    suggestions: [String],
    interviewReadiness: {
      type: Number, // 0-100
      default: 0,
    },
    confidenceLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Very High'],
      default: 'Low',
    },
    suggestedStudyTime: {
      type: String,
      default: '',
    },
    overallRecommendation: {
      type: String,
      default: '',
    },
    // Meta
    status: {
      type: String,
      enum: ['completed', 'in-progress'],
      default: 'completed',
    },
    completionDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
SelfAssessmentResultSchema.index({ studentId: 1, preferredDomain: 1, level: 1 });
SelfAssessmentResultSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.models.SelfAssessmentResult ||
  mongoose.model('SelfAssessmentResult', SelfAssessmentResultSchema);
