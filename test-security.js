import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Setup Mock Environment
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/job-fair';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_secret';
}

const MONGODB_URI = process.env.MONGODB_URI;

// We will use mongoose directly to seed, then fetch to hit localhost:3000
async function runTests() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  // Schemas
  const User = mongoose.connection.collection('users');
  const Company = mongoose.connection.collection('companies');
  const Job = mongoose.connection.collection('jobs');
  const Student = mongoose.connection.collection('students');
  const JobApplication = mongoose.connection.collection('jobapplications');

  // Clean old test data
  await User.deleteMany({ email: { $regex: 'test_sec_' } });
  await Company.deleteMany({ companyName: { $regex: 'Test Company Sec' } });
  await Job.deleteMany({ title: { $regex: 'Test Job Sec' } });
  await Student.deleteMany({ collegeName: 'Test College Sec' });

  // 1. Create HR A and Company A
  const hrAUser = await User.insertOne({
    name: 'HR A',
    email: 'test_sec_hra@example.com',
    password: 'password123',
    role: 'hr_company',
    isActive: true
  });
  const compA = await Company.insertOne({
    companyName: 'Test Company Sec A',
    userId: hrAUser.insertedId,
    hrName: 'HR A'
  });

  // 2. Create HR B and Company B
  const hrBUser = await User.insertOne({
    name: 'HR B',
    email: 'test_sec_hrb@example.com',
    password: 'password123',
    role: 'hr_company',
    isActive: true
  });
  const compB = await Company.insertOne({
    companyName: 'Test Company Sec B',
    userId: hrBUser.insertedId,
    hrName: 'HR B'
  });

  // 3. Create Jobs
  const jobA = await Job.insertOne({
    title: 'Test Job Sec A',
    companyId: compA.insertedId,
    description: 'A'
  });
  const jobB = await Job.insertOne({
    title: 'Test Job Sec B',
    companyId: compB.insertedId,
    description: 'B'
  });

  // 4. Create Students
  const candAUser = await User.insertOne({ name: 'Cand A', email: 'test_sec_canda@example.com', role: 'student', isActive: true });
  const candA = await Student.insertOne({ userId: candAUser.insertedId, collegeName: 'Test College Sec' });

  const candBUser = await User.insertOne({ name: 'Cand B', email: 'test_sec_candb@example.com', role: 'student', isActive: true });
  const candB = await Student.insertOne({ userId: candBUser.insertedId, collegeName: 'Test College Sec' });

  // 5. Create Applications
  const appA = await JobApplication.insertOne({
    jobId: jobA.insertedId,
    companyId: compA.insertedId,
    studentId: candA.insertedId,
    stage: 'Applied'
  });

  const appB = await JobApplication.insertOne({
    jobId: jobB.insertedId,
    companyId: compB.insertedId,
    studentId: candB.insertedId,
    stage: 'Applied'
  });

  // Tokens
  const tokenA = jwt.sign({ id: hrAUser.insertedId, role: 'hr_company' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const tokenB = jwt.sign({ id: hrBUser.insertedId, role: 'hr_company' }, process.env.JWT_SECRET, { expiresIn: '1d' });

  const baseUrl = 'http://localhost:3000/api/company';
  const headersA = { 'Cookie': `token=${tokenA}`, 'Content-Type': 'application/json' };
  
  let passed = 0;
  let failed = 0;
  const results = [];

  const check = (name, expectedStatus, actualStatus, expectedSubstring, actualBody) => {
    let success = actualStatus === expectedStatus;
    if (expectedSubstring && !actualBody.includes(expectedSubstring)) success = false;
    
    if (success) passed++;
    else failed++;

    results.push({
      test: name,
      status: success ? 'PASSED' : 'FAILED',
      expected: expectedStatus,
      actual: actualStatus,
      body: actualBody
    });
  };

  // Helper to fetch
  const fetchWithToken = async (url, opts) => {
    const res = await fetch(url, opts);
    const text = await res.text();
    return { status: res.status, body: text };
  };

  // Test 1: HR A can update Candidate A
  console.log('Running Test 1...');
  let res1 = await fetchWithToken(`${baseUrl}/applications/${appA.insertedId}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ stage: 'Shortlisted' })
  });
  check('HR A can update Candidate A', 200, res1.status, '', res1.body);

  // Test 2: HR A cannot update Candidate B
  console.log('Running Test 2...');
  let res2 = await fetchWithToken(`${baseUrl}/applications/${appB.insertedId}`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ stage: 'Shortlisted' })
  });
  check('HR A cannot update Candidate B', 403, res2.status, '', res2.body);

  // Test 3: HR A cannot send email to Candidate B
  console.log('Running Test 3...');
  let res3 = await fetchWithToken(`${baseUrl}/applications/${appB.insertedId}/send-email`, {
    method: 'POST',
    headers: headersA,
    body: JSON.stringify({})
  });
  check('HR A cannot send email to Candidate B', 403, res3.status, '', res3.body);

  // Test 4: HR A cannot release offer for Candidate B
  console.log('Running Test 4...');
  let res4 = await fetchWithToken(`${baseUrl}/offers`, {
    method: 'POST',
    headers: headersA, // wait Offers uses formData, lets simulate it roughly or just pass json and see if it fails auth
  });
  // Actually, Offers expects form data. 
  // Let's create proper form data.
  const form = new FormData();
  form.append('applicationId', appB.insertedId.toString());
  form.append('jobRole', 'Hacker');
  
  const headersA_multipart = { 'Cookie': `token=${tokenA}` };
  let res4_real = await fetchWithToken(`${baseUrl}/offers`, {
    method: 'POST',
    headers: headersA_multipart,
    body: form
  });
  check('HR A cannot release offer for Candidate B', 403, res4_real.status, '', res4_real.body);

  // Test 5: HR A cannot access Company B applications
  // Note: GET /applications?jobId=xxx will only return apps matching HR A's company. Let's see if it returns 403 or empty array.
  console.log('Running Test 5...');
  let res5 = await fetchWithToken(`${baseUrl}/applications?jobId=${jobB.insertedId}`, {
    method: 'GET',
    headers: headersA
  });
  check('HR A cannot access Company B applications (empty array)', 200, res5.status, '[]', res5.body); // applications will be empty array, so let's just check 200

  // Test 6: Invalid ObjectId
  console.log('Running Test 6...');
  let res6 = await fetchWithToken(`${baseUrl}/applications/invalid-id-123`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ stage: 'Shortlisted' })
  });
  check('Invalid ObjectId returns 400', 400, res6.status, '', res6.body);

  // Test 7: Deleted application returns 404
  console.log('Running Test 7...');
  let res7 = await fetchWithToken(`${baseUrl}/applications/000000000000000000000000`, {
    method: 'PUT',
    headers: headersA,
    body: JSON.stringify({ stage: 'Shortlisted' })
  });
  check('Deleted application returns 404', 404, res7.status, '', res7.body);

  // Test 8: HR A cannot access Company B interviews
  console.log('Running Test 8...');
  let res8 = await fetchWithToken(`${baseUrl}/interviews?jobId=${jobB.insertedId}`, {
    method: 'GET',
    headers: headersA
  });
  // Should return empty array or 403. Our implementation returns empty arrays for filtered GETs.
  // Actually, we fixed this by scoping to companyId, so it should be empty array. Let's check 200 with empty array
  check('HR A cannot access Company B interviews', 200, res8.status, '[]', res8.body);

  // Test 9: HR A cannot access Company B assessments
  console.log('Running Test 9...');
  let res9 = await fetchWithToken(`${baseUrl}/job-assessments?jobId=${jobB.insertedId}`, {
    method: 'GET',
    headers: headersA
  });
  check('HR A cannot access Company B assessments', 200, res9.status, '[]', res9.body);

  console.log('\n--- RESULTS ---\n');
  console.table(results);
  console.log(`Passed: ${passed} | Failed: ${failed}`);

  // Cleanup
  await User.deleteMany({ email: { $regex: 'test_sec_' } });
  await Company.deleteMany({ companyName: { $regex: 'Test Company Sec' } });
  await Job.deleteMany({ title: { $regex: 'Test Job Sec' } });
  await Student.deleteMany({ collegeName: 'Test College Sec' });
  await JobApplication.deleteMany({ _id: { $in: [appA.insertedId, appB.insertedId] } });

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(console.error);
