import mongoose from 'mongoose';

const ShortlistSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    shortlistedByType: {
      type: String,
      enum: ['Admin', 'College'],
      required: true,
    },
    shortlistedById: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Refers to either User (Admin) or College
    }
  },
  { timestamps: true }
);

// Prevent duplicate shortlisting by the same entity for the same student
ShortlistSchema.index({ studentId: 1, shortlistedByType: 1, shortlistedById: 1 }, { unique: true });

export default mongoose.models.Shortlist || mongoose.model('Shortlist', ShortlistSchema);
