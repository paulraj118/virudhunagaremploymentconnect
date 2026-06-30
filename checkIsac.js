import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Parse .env file manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
import Company from './src/models/Company.js';
import User from './src/models/User.js';
import JobApplication from './src/models/JobApplication.js';
import Student from './src/models/Student.js';

const run = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    const users = await User.find({ email: /paulraj/i }).lean();
    console.log("Users matching 'paulraj':");
    console.log(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    const students = await Student.find().populate('userId').lean();
    console.log("\nStudents in DB:");
    console.log(students.map(s => ({ id: s._id, name: s.userId?.name, email: s.userId?.email })));

    const applications = await JobApplication.find()
      .populate('studentId')
      .populate('companyId')
      .lean();
    console.log("\nJob Applications in DB:");
    console.log(applications.map(a => ({
      id: a._id,
      studentName: a.studentId?.userId?.name || 'N/A',
      companyName: a.companyId?.companyName || 'N/A',
      stage: a.stage
    })));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
