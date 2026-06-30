import mongoose from 'mongoose';

const SelfAssessmentQuestionSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      index: true,
    },
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: [true, 'Level is required'],
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      validate: {
        validator: function (v) {
          return v && v.length === 4;
        },
        message: 'Exactly 4 options are required',
      },
      required: true,
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying: domain + level
SelfAssessmentQuestionSchema.index({ domain: 1, level: 1 });
// Unique constraint to prevent duplicate questions
SelfAssessmentQuestionSchema.index({ domain: 1, level: 1, questionText: 1 }, { unique: true });

export default mongoose.models.SelfAssessmentQuestion ||
  mongoose.model('SelfAssessmentQuestion', SelfAssessmentQuestionSchema);
