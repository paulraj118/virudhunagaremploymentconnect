import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Please provide company name'],
    },
    hrName: {
      type: String,
      required: [true, 'Please provide HR name'],
    },
    website: {
      type: String,
    },
    address: {
      type: String,
      required: true,
    },
    linkedIn: {
      type: String,
      required: [true, 'Please provide LinkedIn Profile'],
    },
    description: {
      type: String,
    },
    industryType: {
      type: String,
      required: true,
    },
    companySize: {
      type: String,
      required: true,
    },
    logoUrl: {
      type: String,
    },
    supportEmail: {
      type: String,
    },
    supportPhone: {
      type: String,
    },
    esiCertificateUrl: {
      type: String,
    },
    itCertificateUrl: {
      type: String,
    },
    incCertificateUrl: {
      type: String,
    },
    dpiitNumber: {
      type: String,
    },
    dpiitRegistered: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
      default: 'No'
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    }
  },
  { timestamps: true }
);

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);
