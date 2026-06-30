import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const CollegeSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: [true, 'Please provide the college name'],
    },
    collegeCode: {
      type: String,
      required: [true, 'Please provide a unique college code'],
      unique: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Please provide a contact person name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    mobile: {
      type: String,
      required: [true, 'Please provide a mobile number'],
    },
    address: {
      type: String,
      required: [true, 'Please provide an address'],
    },
    district: {
      type: String,
      required: [true, 'Please provide a district'],
    },
    state: {
      type: String,
      required: [true, 'Please provide a state'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: 'college',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
CollegeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
CollegeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.College || mongoose.model('College', CollegeSchema);
