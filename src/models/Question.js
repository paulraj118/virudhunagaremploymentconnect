import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
  },
  questionText: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOptionIndex: {
    type: Number,
    required: false, // Make false to support older or newer formats
    min: 0,
    max: 3
  },
  correctAnswer: {
    type: String, // As per new requirement
    required: false
  },
  category: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: false
  },
  technology: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export default Question;
