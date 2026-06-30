import mongoose from 'mongoose';

const questionBankAuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['Created', 'Edited', 'Approved', 'Archived', 'Restored', 'Imported', 'Exported', 'Deleted'],
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionBank',
    default: null // null if bulk export/import general log
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ipAddress: {
    type: String,
    default: 'unknown'
  },
  details: {
    type: mongoose.Schema.Types.Mixed, // Storing old vs new version details, or counts for bulk
    default: {}
  }
}, { timestamps: true });

export default mongoose.models.QuestionBankAuditLog || mongoose.model('QuestionBankAuditLog', questionBankAuditLogSchema);
