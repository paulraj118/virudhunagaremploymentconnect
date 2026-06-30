import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    department: {
      type: String,
    },
    role: {
      type: String,
    },
    experience: {
      type: String,
      required: true,
    },
    salary: {
      type: String,
      required: true,
    },
    skills: [{
      type: String,
    }],
    vacancyCount: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

JobSchema.index({ companyId: 1 });
JobSchema.index({ isActive: 1 });
JobSchema.index({ role: 1 });

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
