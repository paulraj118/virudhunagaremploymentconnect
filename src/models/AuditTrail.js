import mongoose from 'mongoose';

const AuditTrailSchema = new mongoose.Schema(
  {
    applicationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    actorId: { type: String, required: true },
    actorRole: { type: String, required: true }, // 'admin', 'college', 'company'
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.AuditTrail || mongoose.model('AuditTrail', AuditTrailSchema);
