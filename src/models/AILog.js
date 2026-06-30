import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema({
  jobRole: {
    type: String,
    required: true,
  },
  promptUsed: {
    type: String,
    required: true,
  },
  customInstructions: {
    type: String,
    default: '',
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  retries: {
    type: Number,
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  },
  attemptsDetails: [{
    attemptNumber: Number,
    httpStatus: Number,
    retryReason: String,
    delayMs: Number,
    durationMs: Number,
    result: String
  }],
  totalExecutionTimeMs: {
    type: Number,
    default: 0
  },
  mongoQuestionsCount: {
    type: Number,
    default: 0
  },
  aiQuestionsCount: {
    type: Number,
    default: 0
  },
  finalStatus: {
    type: String,
    default: 'Success'
  }
}, { timestamps: true });

export default mongoose.models.AILog || mongoose.model('AILog', aiLogSchema);
