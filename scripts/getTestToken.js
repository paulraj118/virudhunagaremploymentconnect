/**
 * Seed a test HR user and generate a token for verification.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'company', 'college', 'admin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  // Find any company user
  let hr = await User.findOne({ role: 'company' });
  
  if (!hr) {
    // We'll create one if it doesn't exist just to test
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    hr = await User.create({
      name: 'Verification HR',
      email: 'verify_hr@test.com',
      password: hashedPassword,
      role: 'company',
      isActive: true,
      isVerified: true
    });
    console.log('✅ Created temporary HR user for testing');
  } else {
    console.log(`✅ Found existing HR user: ${hr.email}`);
  }

  const token = jwt.sign({ id: hr._id, role: hr.role }, JWT_SECRET, { expiresIn: '1d' });
  
  console.log('\n--- EXPORT THIS TOKEN ---');
  console.log(token);
  console.log('-------------------------');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
