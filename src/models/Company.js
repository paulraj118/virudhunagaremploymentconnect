import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    // Standalone Company Registration fields (made optional or sparse to support unified setup)
    companyName: { type: String, required: true },
    companyCode: { type: String, unique: true, sparse: true },
    hrName: { type: String, required: true },
    hrEmail: { type: String, unique: true, sparse: true },
    mobileNumber: { type: String },
    companyAddress: { type: String },
    industry: { type: String },
    companyWebsite: { type: String },
    companyLogo: { type: String },
    password: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Active', 'Inactive'],
      default: 'Pending',
    },
    createdBy: { type: String },

    // HR Setup / Profile fields
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, index: true },
    website: { type: String },
    address: { type: String },
    linkedIn: { type: String },
    description: { type: String },
    industryType: { type: String },
    companySize: { type: String },
    dpiitRegistered: { type: String },
    supportEmail: { type: String },
    supportPhone: { type: String },
    esiCertificateUrl: { type: String },
    itCertificateUrl: { type: String },
    incCertificateUrl: { type: String },
    dpiitNumber: { type: String },
    logoUrl: { type: String },

    approvalStatus: {
      type: String,
      default: 'pending'
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    },
    // Soft Delete Fields
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
    }
  },
  { timestamps: true }
);

CompanySchema.index({ approvalStatus: 1 });

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
