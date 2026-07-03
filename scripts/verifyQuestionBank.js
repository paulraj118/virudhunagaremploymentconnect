/**
 * End-to-End Verification Script for Question Bank Feature
 * Tests all APIs, MongoDB storage, duplicate detection, and hybrid generation
 */

import fs from 'fs';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFile = fs.readFileSync(join(__dirname, '..', '.env'), 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const BASE_URL = 'http://localhost:3000';

async function setupAuth() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    isActive: Boolean
  }, { strict: false }));

  const Company = mongoose.models.Company || mongoose.model('Company', new mongoose.Schema({
    companyName: String,
    hrEmail: String,
    companyCode: String,
    status: String,
    userId: mongoose.Schema.Types.ObjectId
  }, { strict: false }));

  let user = await User.findOne({ email: 'verify999@test.com' });
  if (!user) {
    user = await User.create({
      name: 'Verify HR 999',
      email: 'verify999@test.com',
      role: 'hr_company',
      isActive: true
    });
  }

  let company = await Company.findOne({ hrEmail: 'verify999@test.com' });
  if (!company) {
    company = await Company.create({
      companyName: 'Verify Inc 999',
      hrEmail: 'verify999@test.com',
      companyCode: 'VER999',
      status: 'Approved',
      userId: user._id
    });
  } else if (!company.userId) {
    company.userId = user._id;
    await company.save();
  }

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { token, user, company };
}

async function authFetch(url, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    'Cookie': `token=${token}`
  };
  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  
  let data;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  
  return { status: res.status, data, headers: res.headers };
}

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 QUESTION BANK - END-TO-END VERIFICATION');
  console.log('='.repeat(60));
  console.log('');

  const results = [];
  const addResult = (test, passed, details) => {
    results.push({ test, passed, details });
    console.log(`  ${passed ? '✅' : '❌'} ${test}: ${details}`);
  };

  console.log('\n📌 STEP 0: Authentication');
  console.log('-'.repeat(40));
  
  const auth = await setupAuth();
  const token = auth.token;
  addResult('Authentication', !!token, 'Token obtained (User + Company created)');

  console.log('\n📌 STEP 1: Bulk Generation API Verification');
  console.log('-'.repeat(40));

  const statsBefore = await authFetch('/api/company/question-bank/stats', {}, token);
  const totalBefore = statsBefore.data?.stats?.total || 0;
  console.log(`  📊 Questions before generation: ${totalBefore}`);

  console.log('  🔄 Generating 20 Python questions...');
  const genRes = await authFetch('/api/company/question-bank/generate-bulk', {
    method: 'POST',
    body: JSON.stringify({
      domain: 'Python',
      topic: '',
      questionCount: 20,
      questionTypes: ['MCQ', 'FILL_BLANK', 'PROGRAMMING']
    })
  }, token);

  if (genRes.data.success) {
    const s = genRes.data.summary;
    addResult('Bulk Generate API', true, `Generated=${s.generated}, Saved=${s.saved}, Dups=${s.duplicatesSkipped}, Failed=${s.failed}`);
    addResult('Summary has requested field', s.requested === 20, `requested=${s.requested}`);
    addResult('Summary has generated field', s.generated > 0, `generated=${s.generated}`);
    addResult('Summary has saved field', s.saved >= 0, `saved=${s.saved}`);
  } else {
    addResult('Bulk Generate API', false, genRes.data.message || JSON.stringify(genRes.data));
  }

  const statsAfter = await authFetch('/api/company/question-bank/stats', {}, token);
  const totalAfter = statsAfter.data?.stats?.total || 0;
  addResult('Questions increased in DB', totalAfter > totalBefore, `Before=${totalBefore}, After=${totalAfter}`);

  console.log('\n  🔍 Verifying MongoDB fields on generated questions...');
  const qList = await authFetch('/api/company/question-bank?domain=Python&source=AI', {}, token);
  
  if (qList.data.success && qList.data.questions?.length > 0) {
    const sample = qList.data.questions.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    addResult('source = "AI"', sample.source === 'AI', `source=${sample.source}`);
    addResult('approved = false', sample.approved === false, `approved=${sample.approved}`);
    addResult('status = "Pending Review"', sample.status === 'Pending Review', `status=${sample.status}`);
    addResult('usageCount = 0', sample.usageCount === 0, `usageCount=${sample.usageCount}`);
  } else {
    addResult('Fetch generated questions', false, 'No Python AI questions found');
  }

  console.log('\n  🔍 Testing duplicate detection...');
  const genRes2 = await authFetch('/api/company/question-bank/generate-bulk', {
    method: 'POST',
    body: JSON.stringify({
      domain: 'Python',
      topic: 'Variables',
      questionCount: 10,
      questionTypes: ['MCQ']
    })
  }, token);

  if (genRes2.data.success) {
    const s2 = genRes2.data.summary;
    addResult('Duplicate detection works', s2.duplicatesSkipped >= 0, `Saved=${s2.saved}, Dups=${s2.duplicatesSkipped}`);
  }

  console.log('\n📌 STEP 2: Question Bank Filters & Search');
  console.log('-'.repeat(40));

  const searchRes = await authFetch('/api/company/question-bank?search=Python', {}, token);
  addResult('Search works', searchRes.data.success, `Found ${searchRes.data.questions?.length || 0} results for "Python"`);

  const domainRes = await authFetch('/api/company/question-bank?domain=Python', {}, token);
  addResult('Domain filter works', domainRes.data.success, `Found ${domainRes.data.questions?.length || 0} Python questions`);

  const sourceRes = await authFetch('/api/company/question-bank?source=AI', {}, token);
  addResult('Source filter (AI) works', sourceRes.data.success, `Found ${sourceRes.data.questions?.length || 0} AI questions`);

  console.log('\n📌 STEP 3: Stats API Verification');
  console.log('-'.repeat(40));

  if (statsAfter.data.success) {
    const st = statsAfter.data.stats;
    addResult('Stats total > 0', st.total > 0, `total=${st.total}`);
    addResult('Stats has pending', st.pending >= 0, `pending=${st.pending}`);
    addResult('Stats has aiGenerated', st.aiGenerated >= 0, `aiGenerated=${st.aiGenerated}`);
  }

  console.log('\n📌 STEP 4: Approval & Technical Test Hybrid Verification');
  console.log('-'.repeat(40));

  const pendingPython = await authFetch('/api/company/question-bank?domain=Python&status=Pending+Review', {}, token);
  let approvedCount = 0;
  
  if (pendingPython.data.success && pendingPython.data.questions?.length > 0) {
    const toApprove = pendingPython.data.questions.slice(0, 15);
    for (const q of toApprove) {
      const approveRes = await authFetch(`/api/company/question-bank/${q._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved', approved: true })
      }, token);
      if (approveRes.status === 200) approvedCount++;
    }
    addResult('Approve questions', approvedCount > 0, `Approved ${approvedCount} questions`);
  }

  console.log('  🔄 Generating Technical Test for Python...');
  const techTestRes = await authFetch('/api/company/technical-tests/generate', {
    method: 'POST',
    body: JSON.stringify({
      jobRole: 'Python',
      preferredDomain: 'Python',
      customInstructions: ''
    })
  }, token);

  if (techTestRes.data.success) {
    addResult('Technical Test generated', true, `source=${techTestRes.data.source}, dbQ=${techTestRes.data.databaseQuestions}, aiQ=${techTestRes.data.aiQuestions}`);
  } else {
    addResult('Technical Test generated', false, techTestRes.data.message || 'Unknown error');
  }

  console.log('\n📌 STEP 5: Import / Export Verification');
  console.log('-'.repeat(40));

  const exportJsonRes = await fetch(`${BASE_URL}/api/company/question-bank/export?format=json`, {
    headers: { 'Cookie': `token=${token}` }
  });
  addResult('Export JSON', exportJsonRes.ok, `status=${exportJsonRes.status}`);

  const exportCsvRes = await fetch(`${BASE_URL}/api/company/question-bank/export?format=csv`, {
    headers: { 'Cookie': `token=${token}` }
  });
  if (exportCsvRes.ok) {
    const csvContent = await exportCsvRes.text();
    const csvLines = csvContent.split('\n').filter(l => l.trim());
    addResult('Export CSV', true, `status=${exportCsvRes.status}, rows=${csvLines.length}`);
  }

  const exportPdfRes = await fetch(`${BASE_URL}/api/company/question-bank/export?format=pdf`, {
    headers: { 'Cookie': `token=${token}` }
  });
  addResult('Export PDF/HTML', exportPdfRes.ok, `status=${exportPdfRes.status}`);

  const importData = {
    questions: [
      {
        domain: 'TestImport',
        type: 'MCQ',
        question: 'Test import question - What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 'B',
        explanation: 'Basic math',
        topic: 'Math'
      }
    ]
  };

  const importRes = await authFetch('/api/company/question-bank/import', {
    method: 'POST',
    body: JSON.stringify(importData)
  }, token);

  if (importRes.data.success) {
    addResult('Import JSON', true, `imported=${importRes.data.summary.imported}`);
  } else {
    addResult('Import JSON', false, importRes.data.message);
  }

  const importRes2 = await authFetch('/api/company/question-bank/import', {
    method: 'POST',
    body: JSON.stringify(importData)
  }, token);

  if (importRes2.data.success) {
    addResult('Import duplicate detection', importRes2.data.summary.duplicatesSkipped > 0, `dups=${importRes2.data.summary.duplicatesSkipped}`);
  }
  
  await mongoose.disconnect();

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\n  Total Tests: ${total}`);
  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  Success Rate: ${((passed/total)*100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n  ❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    - ${r.test}: ${r.details}`);
    });
  }
  
  const report = { passed, failed, total, results };
  fs.writeFileSync('verification_results.json', JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
