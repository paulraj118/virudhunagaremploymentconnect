import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Setup environment variables before imports
const JWT_SECRET = 'super_secret_key_for_local_dev_only_1234567890';
process.env.JWT_SECRET = JWT_SECRET;
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://sprofileview_db_user:tu4QH0myyZu3fe3C@ac-svs7our-shard-00-00.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-01.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-02.yhdfaab.mongodb.net:27017/jobfair_virudhunagar?authSource=admin&replicaSet=atlas-nbcn94-shard-0&ssl=true&retryWrites=true&w=majority';

const MONGODB_URI = process.env.MONGODB_URI;

// Import models
import User from './src/models/User.js';
import Student from './src/models/Student.js';
import Company from './src/models/Company.js';
import Job from './src/models/Job.js';
import JobApplication from './src/models/JobApplication.js';
import AssessmentResult from './src/models/AssessmentResult.js';
import TechnicalAttempt from './src/models/TechnicalAttempt.js';
import TechnicalTest from './src/models/TechnicalTest.js';
import Interview from './src/models/Interview.js';
import Notification from './src/models/Notification.js';
import AuditTrail from './src/models/AuditTrail.js';

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected.');

  // Clean previous test data
  console.log('Cleaning up previous test data...');
  const testCandidateEmail = 'candidate-test-6.1@jobfair.com';
  const testHREmail = 'hr-test-6.1@jobfair.com';

  const oldCandidateUser = await User.findOne({ email: testCandidateEmail });
  if (oldCandidateUser) {
    await Student.deleteOne({ userId: oldCandidateUser._id });
    await AssessmentResult.deleteMany({ studentId: { $in: [oldCandidateUser._id] } }); // We will also delete based on Student ID below
    await TechnicalAttempt.deleteMany({ candidateId: oldCandidateUser._id });
    await Interview.deleteMany({ candidateId: oldCandidateUser._id });
    await Notification.deleteMany({ recipientId: oldCandidateUser._id.toString() });
    await User.deleteOne({ _id: oldCandidateUser._id });
  }

  const oldHRUser = await User.findOne({ email: testHREmail });
  if (oldHRUser) {
    const company = await Company.findOne({ userId: oldHRUser._id });
    if (company) {
      await Job.deleteMany({ companyId: company._id });
      await JobApplication.deleteMany({ companyId: company._id });
      await Company.deleteOne({ _id: company._id });
    }
    await User.deleteOne({ _id: oldHRUser._id });
  }

  // Create Seed Data
  console.log('Seeding mock entities...');
  
  // 1. Candidate User & Profile
  const candidateUser = await User.create({
    name: 'John Candidate',
    email: testCandidateEmail,
    password: 'password123',
    role: 'student',
    mobile: '9876543210',
    isEmailVerified: true,
    isMobileVerified: true
  });

  const student = await Student.create({
    userId: candidateUser._id,
    collegeName: 'Test College of Engineering',
    degree: 'B.Tech',
    department: 'Computer Science',
    yearOfPassedOut: 2026,
    preferredDomain: 'Software Engineering',
    industryTrack: 'Arts / Engineering'
  });

  // 2. HR User & Company
  const hrUser = await User.create({
    name: 'Jane HR',
    email: testHREmail,
    password: 'password123',
    role: 'hr_company',
    mobile: '9876543211',
    isEmailVerified: true,
    isMobileVerified: true
  });

  const company = await Company.create({
    userId: hrUser._id,
    companyName: 'Acme Test Corp',
    hrName: 'Jane HR',
    hrEmail: testHREmail,
    website: 'https://acmetest.com',
    address: '123 Test Boulevard',
    industrySector: 'Technology',
    contactEmail: testHREmail
  });

  // 3. Job & Application
  const job = await Job.create({
    companyId: company._id,
    title: 'Software Developer Intern',
    description: 'A great internship role',
    location: 'Remote',
    salary: '15000',
    type: 'Internship',
    skills: ['Javascript', 'React', 'Node'],
    experience: 'Fresher',
    vacancyCount: 5,
    deadline: new Date(Date.now() + 86400000 * 30)
  });

  // Technical Test
  const techTest = await TechnicalTest.create({
    companyId: company._id,
    hrId: hrUser._id,
    jobId: job._id,
    jobRole: 'Software Developer Intern',
    title: 'Intern JS Coding Challenge',
    duration: 60,
    passingMarks: 12,
    status: 'Published',
    createdBy: hrUser._id
  });

  const jobApplication = await JobApplication.create({
    jobId: job._id,
    studentId: student._id,
    companyId: company._id,
    stage: 'Shortlisted',
    technicalTestId: techTest._id,
    technicalTestStatus: 'Completed'
  });

  // 4. Scores
  // Assessment Score (max 100)
  const assessmentResult = await AssessmentResult.create({
    studentId: student._id,
    domain: 'Software Engineering',
    correctAnswers: 8,
    score: 85, // out of 100
    percentage: 85,
    passFail: 'Pass'
  });

  // Technical Attempt Score (max 20)
  const technicalAttempt = await TechnicalAttempt.create({
    candidateId: candidateUser._id,
    companyId: company._id,
    hrId: hrUser._id,
    jobId: job._id,
    technicalTestId: techTest._id,
    browserStartedAt: new Date(Date.now() - 3600000),
    submittedAt: new Date(),
    timeTaken: 1800,
    status: 'Completed',
    scores: {
      mcqScore: 5,
      fillBlanksScore: 5,
      programming1Score: 2,
      programming2Score: 3,
      totalScore: 15 // out of 20
    },
    resultStatus: 'Pass'
  });

  console.log('Seeding completed successfully.');

  // Generate JWT tokens
  const candidateToken = jwt.sign({ id: candidateUser._id.toString(), role: 'student' }, JWT_SECRET, { expiresIn: '1h' });
  const hrToken = jwt.sign({ id: hrUser._id.toString(), role: 'hr_company' }, JWT_SECRET, { expiresIn: '1h' });

  console.log('Tokens signed.');
  console.log(`Candidate Token: ${candidateToken.substring(0, 20)}...`);
  console.log(`HR Token: ${hrToken.substring(0, 20)}...`);

  // We are ready to run tests. Since we need next server running on port 3005,
  // we assume it is launched by the runner script.
  // We will export the variables to a file or environment so the test runner knows them.
  const context = {
    hrToken,
    candidateToken,
    candidateUserId: candidateUser._id.toString(),
    studentId: student._id.toString(),
    companyId: company._id.toString(),
    jobId: job._id.toString(),
    applicationId: jobApplication._id.toString(),
    assessmentResultId: assessmentResult._id.toString(),
    technicalAttemptId: technicalAttempt._id.toString(),
    techTestId: techTest._id.toString()
  };

  fs.writeFileSync('testContext.json', JSON.stringify(context, null, 2));
  console.log('Test context written to testContext.json.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Seeding Error:', err);
  process.exit(1);
});
