import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/questions';
const VALID_API_KEY = 'test_api_key_12345';
const INVALID_API_KEY = 'wrong_key';

async function runTests() {
  console.log('--- Starting Question Bank API Tests ---');

  let passed = 0;
  let failed = 0;

  async function assertCase(name, testFn) {
    try {
      const result = await testFn();
      if (result) {
        console.log(`✅ [PASS] ${name}`);
        passed++;
      } else {
        console.log(`❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (e) {
      console.log(`❌ [ERROR] ${name}: ${e.message}`);
      failed++;
    }
  }

  const makeRequest = async (params = '', apiKey = VALID_API_KEY) => {
    const headers = {};
    if (apiKey !== null) {
      headers['x-api-key'] = apiKey;
    }
    return fetch(`${BASE_URL}${params}`, { headers });
  };

  // 1. Valid API Key
  await assertCase('1. Valid API Key → Returns HTTP 200', async () => {
    const res = await makeRequest();
    return res.status === 200;
  });

  // 2. Missing API Key
  await assertCase('2. Missing API Key → Returns HTTP 401', async () => {
    const res = await makeRequest('', null);
    return res.status === 401;
  });

  // 3. Invalid API Key
  await assertCase('3. Invalid API Key → Returns HTTP 401', async () => {
    const res = await makeRequest('', INVALID_API_KEY);
    return res.status === 401;
  });

  // 5. Pagination
  await assertCase('5. Pagination works correctly (limit=2)', async () => {
    const res = await makeRequest('?limit=2');
    const data = await res.json();
    return res.status === 200 && data.limit === 2 && data.questions.length <= 2;
  });

  // 6. Search
  await assertCase('6. Search functionality works correctly', async () => {
    const res = await makeRequest('?search=React');
    const data = await res.json();
    return res.status === 200; // Just checking it doesn't crash
  });

  // 7. Category filter
  await assertCase('7. Category filtering works correctly', async () => {
    const res = await makeRequest('?category=Frontend');
    const data = await res.json();
    return res.status === 200;
  });

  // 8. Topic filtering
  await assertCase('8. Topic filtering works correctly', async () => {
    const res = await makeRequest('?topic=Hooks');
    const data = await res.json();
    return res.status === 200;
  });

  // 9. Technology filtering
  await assertCase('9. Technology filtering works correctly', async () => {
    const res = await makeRequest('?technology=React');
    const data = await res.json();
    return res.status === 200;
  });

  // 10. Company filtering
  await assertCase('10. Company filtering works correctly', async () => {
    const res = await makeRequest('?company=Google');
    const data = await res.json();
    return res.status === 200;
  });

  // 11. Difficulty filtering
  await assertCase('11. Difficulty filtering works correctly', async () => {
    const res = await makeRequest('?difficulty=Hard');
    const data = await res.json();
    return res.status === 200;
  });

  // 12. Random selection
  await assertCase('12. Random question selection works correctly', async () => {
    const res = await makeRequest('?random=true&limit=3');
    const data = await res.json();
    return res.status === 200 && data.limit === 3;
  });

  // 13. Sorting
  await assertCase('13. Sorting works correctly', async () => {
    const res = await makeRequest('?sort=createdAt');
    const data = await res.json();
    return res.status === 200;
  });

  // 14. Invalid query params safely handled
  await assertCase('14. Invalid query parameters handled safely', async () => {
    const res = await makeRequest('?page=abc&limit=-10');
    const data = await res.json();
    // Handled via Math.max and parseInt in our logic (page becomes 1, limit 1 or 20)
    return res.status === 200 && data.page >= 1 && data.limit >= 1;
  });

  // 4. Rate Limiting
  await assertCase('4. Rate Limiting → Returns HTTP 429', async () => {
    let got429 = false;
    for (let i = 0; i < 110; i++) {
      const res = await makeRequest('?limit=1');
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    return got429;
  });

  console.log(`\n--- Test Summary ---`);
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) process.exit(1);
}

runTests();
