import mongoose from 'mongoose';

// --- Sub-Schemas ---

const MCQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],       // 4 options (A, B, C, D)
  correctOption: { type: String, required: true },    // e.g., 'A', 'B', 'C', or 'D'
  explanation: { type: String },
  marks: { type: Number, default: 1 }
});

const FillBlankSchema = new mongoose.Schema({
  question: { type: String, required: true },
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 }
});

const HiddenTestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true }
});

const ProgrammingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  supportedLanguages: {
    type: [String],
    default: ['javascript', 'python', 'java', 'cpp']
  },
  sampleInput: { type: String, required: true },
  sampleOutput: { type: String, required: true },
  hiddenTestCases: [HiddenTestCaseSchema],            // 5 hidden test cases for Judge0 evaluation
  marks: { type: Number, default: 5 }
});

// --- Main Schema ---

const TechnicalTestSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobRole: { type: String, required: true },

  totalMarks: { type: Number, default: 20 },          // Fixed = 20
  passingMarks: { type: Number, required: true, default: 12 }, // e.g., 60% of 20
  duration: { type: Number, required: true, default: 45 },     // in minutes

  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  publishedAt: { type: Date },

  assignedCandidateCount: { type: Number, default: 0 },
  completedCandidateCount: { type: Number, default: 0 },

  sections: {
    sectionA_MCQ: [MCQSchema],                        // 5 MCQs, 1 mark each = 5 marks
    sectionB_FillBlanks: [FillBlankSchema],            // 5 Fill-in-the-blanks, 1 mark each = 5 marks
    sectionC_Programming1: ProgrammingSchema,          // 1 Programming question = 5 marks
    sectionD_Programming2: ProgrammingSchema           // 1 Programming question = 5 marks
  },

  // Audit Fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true  // Adds createdAt & updatedAt automatically
});

// --- Indexes ---
TechnicalTestSchema.index({ companyId: 1 });
TechnicalTestSchema.index({ hrId: 1 });
TechnicalTestSchema.index({ jobId: 1 });
TechnicalTestSchema.index({ status: 1 });
TechnicalTestSchema.index({ companyId: 1, jobId: 1 });

export default mongoose.models.TechnicalTest || mongoose.model('TechnicalTest', TechnicalTestSchema);
