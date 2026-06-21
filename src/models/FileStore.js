import mongoose from 'mongoose';

const FileStoreSchema = new mongoose.Schema(
  {
    buffer: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    }
  },
  { timestamps: true }
);

export default mongoose.models.FileStore || mongoose.model('FileStore', FileStoreSchema);
