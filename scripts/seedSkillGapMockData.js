import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobfair_pro';

const SelfAssessmentResultSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  industryTrack: { type: String, required: true },
  preferredDomain: { type: String, required: true },
  level: { type: String, enum: ['low', 'medium', 'high'], required: true },
  attemptNumber: { type: Number, default: 1 },
  totalQuestions: { type: Number, default: 20 },
  questions: [{
    questionId: String,
    questionText: String,
    options: [String],
    selectedOptionIndex: Number,
    correctOptionIndex: Number,
    isCorrect: Boolean,
    explanation: String,
    topic: String,
    difficulty: String,
  }],
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'completed' },
  completionDate: { type: Date, default: Date.now },
}, { timestamps: true });

const StudentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  collegeName: String
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
const SelfAssessmentResult = mongoose.models.SelfAssessmentResult || mongoose.model('SelfAssessmentResult', SelfAssessmentResultSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    // Create a dummy user and student
    let user = await User.findOne({ email: 'dummy_skillgap@example.com' });
    if (!user) {
      user = await User.create({ name: 'Skill Gap Dummy', email: 'dummy_skillgap@example.com', role: 'student' });
    }

    let student = await Student.findOne({ userId: user._id });
    if (!student) {
      student = await Student.create({ userId: user._id, collegeName: 'Dummy College' });
    }

    // Clear old data for clear testing
    await SelfAssessmentResult.deleteMany({ studentId: student._id });

    // Generate dummy data that exactly matches the screenshot
    const domains = ['Data Science', 'Full Stack Development', 'Cloud Computing'];
    const weakTopics = [
      { topic: 'Visualization', count: 8 },
      { topic: 'Statistics', count: 8 },
      { topic: 'Feature Engineering', count: 6 },
      { topic: 'Data Cleaning', count: 4 },
      { topic: 'Regression', count: 4 },
      { topic: 'SQL', count: 3 },
      { topic: 'NumPy', count: 3 }
    ];

    const resultsToInsert = [];

    // Weakest Domain: Data Science (25% avg). To get 25%, we will generate results with 25% score.
    for (let i = 0; i < 10; i++) {
      const qs = [];
      // populate failures for topics
      for (const wt of weakTopics) {
        if (i < wt.count) {
          qs.push({
            topic: wt.topic,
            isCorrect: false,
            questionText: `Dummy question for ${wt.topic}`,
            correctOptionIndex: 0
          });
        }
      }

      resultsToInsert.push({
        studentId: student._id,
        industryTrack: 'IT',
        preferredDomain: 'Data Science',
        level: 'low',
        score: 5,
        percentage: 25,
        status: 'completed',
        questions: qs
      });
    }
    
    // Another domain to act as Strongest Domain (e.g., Cloud Computing at 85%)
    for (let i = 0; i < 5; i++) {
       resultsToInsert.push({
        studentId: student._id,
        industryTrack: 'IT',
        preferredDomain: 'Cloud Computing',
        level: 'low',
        score: 17,
        percentage: 85,
        status: 'completed',
        questions: [ { topic: 'Networking', isCorrect: true, questionText: 'Q1', correctOptionIndex: 0 } ]
      });
    }

    await SelfAssessmentResult.insertMany(resultsToInsert);
    console.log(`✅ Inserted ${resultsToInsert.length} mock results to populate Global Skill Gap Analysis`);

  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
