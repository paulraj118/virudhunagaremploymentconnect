const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_key_for_local_dev_only_1234567890';
const BASE_URL = 'http://localhost:3000';

async function fetchWithCookie(url, token, isRsc = false) {
  const headers = {
    'Cookie': `token=${token}`,
  };
  if (isRsc) {
    headers['rsc'] = '1';
    headers['Next-Router-State-Tree'] = '%5B%22%22%2C%7B%22children%22%3A%5B%22college%22%2C%7B%22children%22%3A%5B%22dashboard%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%5D%7D%5D%7D%5D%7D%5D';
  }
  const res = await fetch(url, { headers, redirect: 'manual' });
  return res;
}

async function verify() {
  await mongoose.connect('mongodb://127.0.0.1:27017/jobfair_pro');
  const db = mongoose.connection;
  
  const college = await db.collection('colleges').findOne({ email: 'college@test.com' });
  const student = await db.collection('users').findOne({ role: 'student' });
  const company = await db.collection('users').findOne({ role: 'hr_company' });
  
  if (!college || !student || !company) {
    console.error('Missing test data');
    process.exit(1);
  }

  console.log('--- 1. Testing /api/auth/me for all roles ---');
  const collegeToken = jwt.sign({ id: college._id.toString(), role: 'college' }, JWT_SECRET, { expiresIn: '30d' });
  const studentToken = jwt.sign({ id: student._id.toString(), role: 'student' }, JWT_SECRET, { expiresIn: '30d' });
  const companyToken = jwt.sign({ id: company._id.toString(), role: 'hr_company' }, JWT_SECRET, { expiresIn: '30d' });

  for (const [role, token] of [['College', collegeToken], ['Student', studentToken], ['HR Company', companyToken]]) {
    const res = await fetchWithCookie(`${BASE_URL}/api/auth/me`, token);
    const data = await res.json();
    console.log(`${role} /api/auth/me:`, data.success ? 'PASSED' : 'FAILED', data);
    
    // Check if token cookie is deleted
    const setCookie = res.headers.get('set-cookie');
    if (setCookie && setCookie.includes('Max-Age=0')) {
      console.log(`❌ ERROR: ${role} cookie was deleted!`);
    } else {
      console.log(`✅ ${role} cookie was preserved.`);
    }
  }

  console.log('\n--- 2. Testing College Pages (RSC Client Navigation) ---');
  const pages = ['/college/dashboard', '/college/students', '/college/offers', '/college/drives', '/college/profile'];
  
  for (const page of pages) {
    const res = await fetchWithCookie(`${BASE_URL}${page}`, collegeToken, true);
    if (res.status === 307 || res.status === 308) {
      console.log(`❌ ${page} REDIRECTED to ${res.headers.get('location')}`);
    } else if (res.status === 200) {
      console.log(`✅ ${page} PASSED (200 OK)`);
    } else {
      console.log(`⚠️ ${page} returned status ${res.status}`);
    }
  }

  process.exit(0);
}

verify().catch(console.error);
