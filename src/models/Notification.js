import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: { type: String, required: true }, // Can be studentId, collegeId, companyId, or 'admin'
    recipientRole: { type: String, required: true }, // 'student', 'college', 'company', 'admin'
    message: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'workflow_update'
    readStatus: { type: Boolean, default: false },
    link: { type: String }, // Optional deep link
  },
  { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
