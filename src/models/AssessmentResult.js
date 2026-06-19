import mongoose from 'mongoose';

const AssessmentResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
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
    }
  },
  { timestamps: true }
);

export default mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', AssessmentResultSchema);
