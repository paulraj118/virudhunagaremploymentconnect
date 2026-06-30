import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null, // null means it's a global admin question
  },
  jobRole: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['MCQ', 'FILL_BLANK', 'PROGRAMMING'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  language: {
    type: String,
    default: null, // Relevant mostly for programming questions
  },
  
  // Content based on type
  content: {
    questionText: String, // MCQ, FILL_BLANK
    options: [String], // MCQ
    correctAnswer: String, // MCQ (A,B,C,D) or FILL_BLANK
    explanation: String, // MCQ, FILL_BLANK
    
    // Programming specific
    problemStatement: String,
    inputFormat: String,
    outputFormat: String,
    constraints: String,
    sampleInput: String,
    sampleOutput: String,
    hiddenTestCases: [{
      input: String,
      expectedOutput: String
    }],
    starterCode: String,
    expectedSolution: String
  },

  marks: {
    type: Number,
    default: 1,
  },

  // Workflow Status
  status: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Archived'],
    default: 'Approved' // Defaults to approved for manual, pending for AI
  },
  isAiGenerated: {
    type: Boolean,
    default: false
  },

  // Usage Analytics
  analytics: {
    timesUsed: { type: Number, default: 0 },
    lastUsedDate: { type: Date, default: null },
    averageScore: { type: Number, default: 0 },
    passPercentage: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 }
  },

  // Quality Rating
  quality: {
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    hrFeedback: [{ type: String }],
    candidateSuccessRate: { type: Number, default: 0 }
  },

  // Version History
  versionHistory: [{
    version: Number,
    previousContent: mongoose.Schema.Types.Mixed,
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    editedAt: { type: Date, default: Date.now }
  }],
  currentVersion: {
    type: Number,
    default: 1
  },

  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  domain: {
    type: String,
    default: ''
  },
  topic: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'Manual'
  },
  approved: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: String,
    fileUrl: String
  }]
}, { timestamps: true });

// Text index for fast searching and duplicate detection
questionBankSchema.index({ 
  'content.questionText': 'text', 
  'content.problemStatement': 'text',
  'tags': 'text' 
});

// B-Tree indexes for fast filtering
questionBankSchema.index({ companyId: 1 });
questionBankSchema.index({ jobRole: 1 });
questionBankSchema.index({ category: 1 });
questionBankSchema.index({ type: 1 });
questionBankSchema.index({ status: 1 });
questionBankSchema.index({ isDeleted: 1 });

export default mongoose.models.QuestionBank || mongoose.model('QuestionBank', questionBankSchema);
