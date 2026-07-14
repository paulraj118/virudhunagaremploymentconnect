import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Mock dependencies BEFORE importing the route
import * as authLib from './src/lib/auth.js';
const originalGetCurrentUser = authLib.getCurrentUser;

async function runTests() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- API ROUTE VERIFICATION ---');

  // Dynamic import of the POST route
  const { POST } = await import('./src/app/api/company/technical-tests/send-interview-email/route.js');

  const Company = mongoose.models.Company;
  const company = await Company.findOne({});
  if (!company) {
    console.log('❌ No company found for testing.');
    process.exit(1);
  }

  // Helper to create mocked requests
  const createReq = (body) => ({
    json: async () => body
  });

  // Test 1: Unauthorized
  console.log('\n[Test 1] Unauthorized User');
  authLib.getCurrentUser = async () => null; // Unauthenticated
  let res = await POST(createReq({}));
  console.log(await res.json());

  // Test 2: Invalid Role (Student trying to send email)
  console.log('\n[Test 2] Invalid Role (Student)');
  authLib.getCurrentUser = async () => ({ id: company.userId, role: 'student' });
  res = await POST(createReq({}));
  console.log(await res.json());

  // Test 3: Valid Auth, Missing Required Fields
  console.log('\n[Test 3] Validation - Missing required fields');
  authLib.getCurrentUser = async () => ({ id: company.userId, role: 'hr_company' });
  res = await POST(createReq({}));
  console.log(await res.json());

  // Test 4: Validation - Conditional Fields (Online Mode without Meeting Link)
  console.log('\n[Test 4] Validation - Missing Meeting Link (Online Mode)');
  res = await POST(createReq({
    candidateEmail: 'test@test.com',
    interviewType: 'Technical',
    interviewMode: 'Online',
    interviewDate: new Date(Date.now() + 86400000).toISOString(),
    interviewTime: '10:00',
    emailSubject: 'Test',
    emailContent: 'Test',
    interviewerName: 'John Doe'
  }));
  console.log(await res.json());

  // Test 5: Validation - Past Date
  console.log('\n[Test 5] Validation - Past Date');
  res = await POST(createReq({
    candidateEmail: 'test@test.com',
    interviewType: 'Technical',
    interviewMode: 'Offline',
    venue: 'Office',
    interviewDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    interviewTime: '10:00',
    emailSubject: 'Test',
    emailContent: 'Test',
    interviewerName: 'John Doe'
  }));
  console.log(await res.json());

  // Test 6: Valid Payload execution
  console.log('\n[Test 6] Valid Payload Execution');
  res = await POST(createReq({
    candidateName: 'Test Candidate',
    candidateEmail: 'tnemploymentconnect@gmail.com', // Sending to self for test
    jobTitle: 'Software Engineer',
    interviewType: 'Technical Interview',
    interviewMode: 'Online',
    meetingLink: 'https://meet.google.com/test',
    interviewDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    interviewTime: '14:00',
    duration: '45 Minutes',
    emailSubject: 'Interview Invitation - API Test',
    emailContent: 'This is a valid test of the API endpoint.',
    interviewerName: 'HR Admin',
    sendCopyToHR: true,
    highPriority: true
  }));
  
  const finalResponse = await res.json();
  console.log(finalResponse);
  
  if (finalResponse.success) {
    console.log('✅ API executed successfully, mock email sent!');
  } else {
    console.log('❌ API execution failed.');
  }

  // Restore original
  authLib.getCurrentUser = originalGetCurrentUser;
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch(err => console.error(err));
