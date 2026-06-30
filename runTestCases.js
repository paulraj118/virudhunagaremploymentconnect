import fs from 'fs';
import mongoose from 'mongoose';

// Import models for verification
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://sprofileview_db_user:tu4QH0myyZu3fe3C@ac-svs7our-shard-00-00.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-01.yhdfaab.mongodb.net:27017,ac-svs7our-shard-00-02.yhdfaab.mongodb.net:27017/jobfair_virudhunagar?authSource=admin&replicaSet=atlas-nbcn94-shard-0&ssl=true&retryWrites=true&w=majority';
import Interview from './src/models/Interview.js';
import JobApplication from './src/models/JobApplication.js';
import Notification from './src/models/Notification.js';
import AuditTrail from './src/models/AuditTrail.js';
import Student from './src/models/Student.js';
import User from './src/models/User.js';
import Company from './src/models/Company.js';
import Job from './src/models/Job.js';
import AssessmentResult from './src/models/AssessmentResult.js';
import TechnicalAttempt from './src/models/TechnicalAttempt.js';

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;

if (!fs.existsSync('testContext.json')) {
  console.error('Error: testContext.json not found. Run testInterviews.js first.');
  process.exit(1);
}

const ctx = JSON.parse(fs.readFileSync('testContext.json', 'utf8'));

async function fetchAPI(endpoint, method = 'GET', token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Cookie'] = `token=${token}`;
  }

  const options = {
    method,
    headers
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function run() {
  console.log('Starting API Verification Test Suite...\n');
  let interviewId = null;
  let interviewMongoId = null;

  // Test Case 1: Schedule Interview (as Draft)
  console.log('--- Test Case 1: Schedule Interview (Draft) ---');
  const schedulePayload = {
    candidateId: ctx.candidateUserId,
    jobId: ctx.jobId,
    applicationId: ctx.applicationId,
    assessmentResultId: ctx.assessmentResultId,
    technicalAttemptId: ctx.technicalAttemptId,
    interviewType: 'Technical',
    interviewRound: 'Round 1 - Technical Coding',
    interviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    interviewTime: '10:00',
    duration: 45,
    timezone: 'IST',
    interviewMode: 'Online',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    meetingPlatform: 'Google Meet',
    interviewerName: 'Jane HR',
    interviewerEmail: 'hr-test-6.1@jobfair.com',
    interviewerDesignation: 'Senior Technical Recruiter',
    interviewInstructions: 'Please have pen and paper ready.',
    status: 'Draft'
  };

  const tc1 = await fetchAPI('/api/company/interviews', 'POST', ctx.hrToken, schedulePayload);
  console.log('Response status:', tc1.status);
  console.log('Response success:', tc1.data.success);
  console.log('Response message:', tc1.data.message);
  if (!tc1.data.success) {
    console.error('Failed TC1:', tc1.data);
    process.exit(1);
  }
  interviewMongoId = tc1.data.data._id;
  interviewId = tc1.data.data.interviewId;
  console.log(`Interview Created successfully. MongoId: ${interviewMongoId}, InterviewId: ${interviewId}`);
  console.log('Status:', tc1.data.data.status);
  console.log('Confirmation:', tc1.data.data.confirmationStatus);
  console.log('');

  // Test Case 2: Get HR Interview List (Draft)
  console.log('--- Test Case 2: Get HR Interview List (status=Draft) ---');
  const tc2 = await fetchAPI('/api/company/interviews?status=Draft', 'GET', ctx.hrToken);
  console.log('Response status:', tc2.status);
  console.log('List Length:', tc2.data.data?.length);
  if (!tc2.data.success || tc2.data.data?.length !== 1) {
    console.error('Failed TC2:', tc2.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 3: Update Interview (Draft to Scheduled)
  console.log('--- Test Case 3: Update Interview (Draft to Scheduled) ---');
  const tc3 = await fetchAPI(`/api/company/interviews/${interviewMongoId}`, 'PUT', ctx.hrToken, {
    status: 'Scheduled',
    remarks: 'Approved draft and scheduled official interview'
  });
  console.log('Response status:', tc3.status);
  console.log('Updated status:', tc3.data.data.status);
  if (!tc3.data.success || tc3.data.data.status !== 'Scheduled') {
    console.error('Failed TC3:', tc3.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 4: Get Interview Details & Security Checks
  console.log('--- Test Case 4.1: Get Interview (HR token) ---');
  const tc4_1 = await fetchAPI(`/api/company/interviews/${interviewMongoId}`, 'GET', ctx.hrToken);
  console.log('Response status:', tc4_1.status);
  console.log('Success:', tc4_1.data.success);
  console.log('Round:', tc4_1.data.data?.interviewRound);
  if (!tc4_1.data.success) {
    console.error('Failed TC4.1:', tc4_1.data);
    process.exit(1);
  }

  console.log('--- Test Case 4.2: Get Interview (Candidate token) ---');
  const tc4_2 = await fetchAPI(`/api/company/interviews/${interviewMongoId}`, 'GET', ctx.candidateToken);
  console.log('Response status:', tc4_2.status);
  console.log('Success:', tc4_2.data.success);
  if (!tc4_2.data.success) {
    console.error('Failed TC4.2:', tc4_2.data);
    process.exit(1);
  }

  console.log('--- Test Case 4.3: Get Interview (Unauthorized) ---');
  const tc4_3 = await fetchAPI(`/api/company/interviews/${interviewMongoId}`, 'GET'); // no token
  console.log('Response status (should be 401):', tc4_3.status);
  if (tc4_3.status !== 401) {
    console.error('Failed TC4.3: expected 401');
    process.exit(1);
  }
  console.log('');

  // Test Case 5: Candidate Accepts Interview
  console.log('--- Test Case 5: Candidate Accepts Interview ---');
  const tc5 = await fetchAPI(`/api/student/interviews/${interviewMongoId}/confirm`, 'POST', ctx.candidateToken, {
    confirmationStatus: 'Accepted',
    remarks: 'I accept this interview slot.'
  });
  console.log('Response status:', tc5.status);
  console.log('Confirmation Status:', tc5.data.data?.confirmationStatus);
  if (!tc5.data.success || tc5.data.data?.confirmationStatus !== 'Accepted') {
    console.error('Failed TC5:', tc5.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 5.1: Duplicate Candidate Confirmation (should fail with 400)
  console.log('--- Test Case 5.1: Duplicate Candidate Confirmation ---');
  const tc5_1 = await fetchAPI(`/api/student/interviews/${interviewMongoId}/confirm`, 'POST', ctx.candidateToken, {
    confirmationStatus: 'Accepted',
    remarks: 'I accept this interview slot again.'
  });
  console.log('Response status (should be 400):', tc5_1.status);
  console.log('Success:', tc5_1.data.success);
  console.log('Message:', tc5_1.data.message);
  if (tc5_1.status !== 400 || tc5_1.data.success !== false) {
    console.error('Failed TC5.1: expected 400 bad request for duplicate confirmation');
    process.exit(1);
  }
  console.log('');

  // Test Case 6: HR Reschedules Interview
  console.log('--- Test Case 6: HR Reschedules Interview ---');
  const reschedulePayload = {
    interviewDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // day after tomorrow
    interviewTime: '11:00',
    remarks: 'Rescheduled due to recruiter availability'
  };
  const tc6 = await fetchAPI(`/api/company/interviews/${interviewMongoId}/reschedule`, 'POST', ctx.hrToken, reschedulePayload);
  console.log('Response status:', tc6.status);
  console.log('Status (should be Rescheduled):', tc6.data.data?.status);
  console.log('Confirmation (should be Pending):', tc6.data.data?.confirmationStatus);
  if (!tc6.data.success || tc6.data.data?.status !== 'Rescheduled' || tc6.data.data?.confirmationStatus !== 'Pending') {
    console.error('Failed TC6:', tc6.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 7: Candidate Declines Interview
  console.log('--- Test Case 7: Candidate Declines Interview ---');
  const tc7 = await fetchAPI(`/api/student/interviews/${interviewMongoId}/confirm`, 'POST', ctx.candidateToken, {
    confirmationStatus: 'Declined',
    declineReason: 'Personal emergency.',
    remarks: 'Cannot make this slot.'
  });
  console.log('Response status:', tc7.status);
  console.log('Confirmation Status (should be Declined):', tc7.data.data?.confirmationStatus);
  if (!tc7.data.success || tc7.data.data?.confirmationStatus !== 'Declined') {
    console.error('Failed TC7:', tc7.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 8: HR Reschedules again
  console.log('--- Test Case 8: HR Reschedules again ---');
  const tc8 = await fetchAPI(`/api/company/interviews/${interviewMongoId}/reschedule`, 'POST', ctx.hrToken, {
    interviewDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    interviewTime: '15:30',
    remarks: 'Re-arranged after candidate decline'
  });
  console.log('Response status:', tc8.status);
  console.log('Status:', tc8.data.data?.status);
  if (!tc8.data.success || tc8.data.data?.status !== 'Rescheduled') {
    console.error('Failed TC8:', tc8.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 9: Cancel Interview
  console.log('--- Test Case 9: Cancel Interview ---');
  const tc9 = await fetchAPI(`/api/company/interviews/${interviewMongoId}/cancel`, 'POST', ctx.hrToken, {
    remarks: 'Cancelled because position was closed'
  });
  console.log('Response status:', tc9.status);
  console.log('Status (should be Cancelled):', tc9.data.data?.status);
  if (!tc9.data.success || tc9.data.data?.status !== 'Cancelled') {
    console.error('Failed TC9:', tc9.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 9.1: Invalid Status Transitions (should fail with 400)
  console.log('--- Test Case 9.1: Invalid Status Transitions ---');
  const tc9_1a = await fetchAPI(`/api/company/interviews/${interviewMongoId}/select`, 'POST', ctx.hrToken);
  console.log('Select on Cancelled status (should be 400):', tc9_1a.status);
  if (tc9_1a.status !== 400 || tc9_1a.data.success !== false) {
    console.error('Failed TC9.1a: expected 400 bad request for selecting cancelled candidate');
    process.exit(1);
  }

  const tc9_1b = await fetchAPI(`/api/company/interviews/${interviewMongoId}/reject`, 'POST', ctx.hrToken);
  console.log('Reject on Cancelled status (should be 400):', tc9_1b.status);
  if (tc9_1b.status !== 400 || tc9_1b.data.success !== false) {
    console.error('Failed TC9.1b: expected 400 bad request for rejecting cancelled candidate');
    process.exit(1);
  }
  console.log('');

  // Test Case 10: Schedule interview starting in 1 hour (for Reminder testing)
  console.log('--- Test Case 10: Schedule Interview starting in 1 hour (Reminder Testing) ---');
  const reminderScheduleDate = new Date(Date.now() + 3600 * 1000 + 300 * 1000); // 1 hour 5 mins from now
  const reminderSchedulePayload = {
    ...schedulePayload,
    interviewRound: 'Round 2 - Final fit',
    interviewDate: reminderScheduleDate,
    interviewTime: '12:00',
    status: 'Scheduled'
  };

  const tc10 = await fetchAPI('/api/company/interviews', 'POST', ctx.hrToken, reminderSchedulePayload);
  console.log('Response status:', tc10.status);
  if (!tc10.data.success) {
    console.error('Failed TC10:', tc10.data);
    process.exit(1);
  }
  const cronInterviewMongoId = tc10.data.data._id;
  const cronInterviewId = tc10.data.data.interviewId;
  console.log(`Cron test interview scheduled. ID: ${cronInterviewId}`);
  console.log('');

  // Test Case 11: Trigger reminders cron
  console.log('--- Test Case 11: Trigger Reminders Cron ---');
  const tc11 = await fetchAPI('/api/cron/reminders', 'GET');
  console.log('Response status:', tc11.status);
  console.log('Response details:', tc11.data.message);
  console.log('Sent list:', tc11.data.data);
  if (!tc11.data.success || !tc11.data.data.remindersSent1h.includes(cronInterviewId)) {
    console.error('Failed TC11: 1h reminder was not sent for', cronInterviewId);
    process.exit(1);
  }
  console.log('');

  // Test Case 12: Submit Feedback & Score Rankings
  console.log('--- Test Case 12: Submit Feedback & Recalculate Scores/Ranks ---');
  const feedbackPayload = {
    communication: 9,
    technicalKnowledge: 9,
    problemSolving: 9,
    confidence: 8,
    professionalism: 10, // Sum = 45/50
    strengths: 'Excellent JS knowledge',
    weaknesses: 'Needs slight UI architecture guidance',
    hrRemarks: 'Very strong fit.',
    status: 'Completed',
    remarks: 'Evaluation completed.'
  };

  const tc12 = await fetchAPI(`/api/company/interviews/${cronInterviewMongoId}/feedback`, 'POST', ctx.hrToken, feedbackPayload);
  console.log('Response status:', tc12.status);
  console.log('Success:', tc12.data.success);
  console.log('Evaluation result data:', tc12.data.data);
  // Expected Overall Score = 85 (Assessment) + 15 (Technical) + 45 (Interview) = 145/170.
  // Percentage = 145 / 170 * 100 = 85.29%
  if (!tc12.data.success || tc12.data.data.overallRecruitmentScore !== 145) {
    console.error('Failed TC12 score mismatch:', tc12.data);
    process.exit(1);
  }
  // Test Case 12.1: Invalid Reschedule on Completed Interview (should fail with 400)
  console.log('--- Test Case 12.1: Invalid Reschedule on Completed Interview ---');
  const tc12_1 = await fetchAPI(`/api/company/interviews/${cronInterviewMongoId}/reschedule`, 'POST', ctx.hrToken, {
    interviewDate: '2026-07-15',
    interviewTime: '10:00'
  });
  console.log('Reschedule on Completed status (should be 400):', tc12_1.status);
  if (tc12_1.status !== 400 || tc12_1.data.success !== false) {
    console.error('Failed TC12.1: expected 400 bad request for rescheduling completed interview');
    process.exit(1);
  }
  console.log('');

  // Test Case 13: Mark Selected
  console.log('--- Test Case 13: Mark Selected ---');
  const tc13 = await fetchAPI(`/api/company/interviews/${cronInterviewMongoId}/select`, 'POST', ctx.hrToken, { remarks: 'Hiring approved.' });
  console.log('Response status:', tc13.status);
  console.log('Status (should be Selected):', tc13.data.data?.status);
  if (!tc13.data.success || tc13.data.data?.status !== 'Selected') {
    console.error('Failed TC13:', tc13.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 14: Mark Rejected
  console.log('--- Test Case 14: Mark Rejected ---');
  const tc14 = await fetchAPI(`/api/company/interviews/${cronInterviewMongoId}/reject`, 'POST', ctx.hrToken, { remarks: 'Rejected candidate' });
  console.log('Response status:', tc14.status);
  console.log('Status (should be Rejected):', tc14.data.data?.status);
  if (!tc14.data.success || tc14.data.data?.status !== 'Rejected') {
    console.error('Failed TC14:', tc14.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 15: Mark Hold
  console.log('--- Test Case 15: Mark Hold ---');
  const tc15 = await fetchAPI(`/api/company/interviews/${cronInterviewMongoId}/hold`, 'POST', ctx.hrToken, { remarks: 'Hold candidate' });
  console.log('Response status:', tc15.status);
  console.log('Status (should be Hold):', tc15.data.data?.status);
  if (!tc15.data.success || tc15.data.data?.status !== 'Hold') {
    console.error('Failed TC15:', tc15.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 16: Get Candidate Interviews List
  console.log('--- Test Case 16: Get Candidate Interviews ---');
  const tc16 = await fetchAPI('/api/student/interviews', 'GET', ctx.candidateToken);
  console.log('Response status:', tc16.status);
  console.log('Success:', tc16.data.success);
  console.log('Candidate interviews count:', tc16.data.data?.interviews?.length);
  if (!tc16.data.success || tc16.data.data?.interviews?.length !== 2) {
    console.error('Failed TC16:', tc16.data);
    process.exit(1);
  }
  console.log('');

  // Test Case 16.1: Invalid Interview ID & Missing required fields
  console.log('--- Test Case 16.1: Invalid ID format and Missing Fields ---');
  // 1. Invalid format
  const tc16_1a = await fetchAPI('/api/company/interviews/invalid-mongo-id-123', 'GET', ctx.hrToken);
  console.log('Invalid format GET status (should be 400):', tc16_1a.status);
  if (tc16_1a.status !== 400 || tc16_1a.data.success !== false) {
    console.error('Failed TC16.1a: expected 400 bad request for invalid ID format');
    process.exit(1);
  }

  // 2. Missing fields in schedule
  const tc16_1b = await fetchAPI('/api/company/interviews', 'POST', ctx.hrToken, {
    candidateId: ctx.candidateUserId
    // missing date, time, etc.
  });
  console.log('Missing fields POST status (should be 400):', tc16_1b.status);
  if (tc16_1b.status !== 400 || tc16_1b.data.success !== false) {
    console.error('Failed TC16.1b: expected 400 bad request for missing required fields');
    process.exit(1);
  }
  console.log('');

  // Verify Database Audit Logs and Notifications
  console.log('--- Test Case 17: Verify Audit Logs & Notifications ---');
  console.log('Connecting database directly to verify logs...');
  await mongoose.connect(MONGODB_URI);

  const finalJobApp = await JobApplication.findById(ctx.applicationId);
  console.log('Job Application Final Decision:', finalJobApp.finalDecision);
  console.log('Job Application Overall Score:', finalJobApp.overallRecruitmentScore);
  console.log('Job Application Percentage:', finalJobApp.percentage);
  console.log('Job Application Rank:', finalJobApp.finalRank);

  const notifications = await Notification.find({ recipientId: ctx.candidateUserId });
  console.log(`Candidate received ${notifications.length} notifications:`);
  notifications.forEach(n => {
    console.log(`  - Type: ${n.type}, Message: "${n.message}"`);
  });

  const audits = await AuditTrail.find({ applicationId: ctx.applicationId });
  console.log(`Audit trails registered: ${audits.length} events:`);
  audits.forEach(a => {
    console.log(`  - Status: ${a.newStatus}, Remarks: "${a.remarks}"`);
  });

  // Check timeline of second interview
  const testInt = await Interview.findById(cronInterviewMongoId);
  console.log('\nInterview Timeline Log:');
  testInt.timeline.forEach(t => {
    console.log(`  - Status: ${t.status}, Actor: ${t.actorRole}, Remarks: "${t.remarks}"`);
  });

  console.log('\nCleaning up seeder data from database...');
  await Student.deleteOne({ _id: ctx.studentId });
  await User.deleteOne({ _id: ctx.candidateUserId });
  await User.deleteOne({ _id: testInt.hrId }); // Cleanup HR user
  await Company.deleteOne({ _id: ctx.companyId });
  await Job.deleteOne({ _id: ctx.jobId });
  await JobApplication.deleteOne({ _id: ctx.applicationId });
  await AssessmentResult.deleteOne({ _id: ctx.assessmentResultId });
  await TechnicalAttempt.deleteOne({ _id: ctx.technicalAttemptId });
  await Interview.deleteMany({ candidateId: ctx.candidateUserId });
  await Notification.deleteMany({ recipientId: ctx.candidateUserId });
  await Notification.deleteMany({ recipientId: testInt.hrId.toString() }); // Cleanup HR notifications
  await AuditTrail.deleteMany({ applicationId: ctx.applicationId });
  
  await mongoose.disconnect();
  console.log('\nDatabase cleaned.');
  
  fs.unlinkSync('testContext.json');
  console.log('Test context deleted.');

  console.log('\n=== ALL API VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

run().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});
