const http = require('http');

async function testApi() {
  try {
    // 1. Login to get token
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin@example.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);

    if (!loginData.success) {
      console.log('Trying another user...');
      // Maybe the user is 'admin test'? 
      const loginRes2 = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: 'admin', password: 'password123' })
      });
      const loginData2 = await loginRes2.json();
      console.log('Login2 Response:', loginData2);
      if (!loginData2.success) return;
      token = loginData2.data.token;
    } else {
      token = loginData.data.token;
    }

    // 2. Fetch materials
    const matRes = await fetch('http://localhost:3000/api/materials', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const matData = await matRes.json();
    console.log('Materials Response Status:', matRes.status);
    console.log('Materials Response:', matData);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testApi();
