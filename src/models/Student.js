import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    collegeName: {
      type: String,
      required: [true, 'Please provide your college name'],
    },
    degree: {
      type: String,
      required: [true, 'Please provide your degree (e.g., B.Tech, MCA)'],
    },
    department: {
      type: String,
      required: [true, 'Please provide your department'],
    },
    yearOfPassedOut: {
      type: Number,
      required: [true, 'Please provide your year of passing out'],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    skills: [{
      type: String,
    }],
    preferredDomain: {
      type: String,
      required: [true, 'Please select your preferred domain'],
    },
    industryTrack: {
      type: String,
      enum: ['IT', 'NON-IT'],
      required: [true, 'Please select your industry track'],
    },
    resumeUrl: {
      type: String,
    },
    enrollmentStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    assessmentScore: {
      type: Number,
      default: 0,
    },
    placementStatus: {
      type: String,
      enum: ['enrolled', 'shortlisted', 'interview', 'offered', 'joined'],
      default: 'enrolled',
    },
    certificates: [{
      name: String,
      issuedBy: String,
      fileUrl: String,
      date: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);
