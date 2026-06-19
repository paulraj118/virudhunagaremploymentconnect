import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    enum: ['React', 'Node.js', 'Python', 'Aptitude', 'Java', 'Data Structures', 'Other'],
    default: 'React'
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
    required: true,
    min: 0,
    max: 3
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
export default Question;
