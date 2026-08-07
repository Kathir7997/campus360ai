require('dotenv').config();
const express = require('express');
const http = require('http');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const mentorRoutes = require('./src/routes/mentorRoutes');
const hodRoutes = require('./src/routes/hodRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const iotRoutes = require('./src/routes/iotRoutes');
const odRoutes = require('./src/routes/odRoutes');
const faceRoutes = require('./src/routes/faceRoutes');
const monitoringRoutes = require('./src/routes/monitoringRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/od', odRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Campus360 API is running 🚀' }));
app.use(errorHandler);

const server = http.createServer(app);

const request = async (port, method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => { resData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  console.log('✅ DB Connected!');

  const TEST_PORT = 5055;
  await new Promise((resolve) => server.listen(TEST_PORT, '127.0.0.1', resolve));
  console.log(`🚀 Test server listening on port ${TEST_PORT}\n`);

  let totalTests = 0;
  let passedTests = 0;

  const test = async (name, fn) => {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    }
  };

  console.log('─── 1. Health Check ──────────────────────────────');
  await test('GET /api/health', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/health');
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  console.log('\n─── 2. Authentication Tests ──────────────────────');
  let tokens = {};

  const roles = [
    { role: 'admin', email: 'admin@campus360.edu', pass: 'admin@123' },
    { role: 'hod', email: 'hod@campus360.edu', pass: 'hod@123' },
    { role: 'mentor', email: 'mentor@campus360.edu', pass: 'mentor@123' },
    { role: 'student', email: 'student@campus360.edu', pass: 'student@123' },
  ];

  for (const r of roles) {
    await test(`POST /api/auth/login (${r.role.toUpperCase()})`, async () => {
      const res = await request(TEST_PORT, 'POST', '/api/auth/login', { email: r.email, password: r.pass });
      if (res.status !== 200 || !res.data.token || res.data.user.role !== r.role) {
        throw new Error(`Status: ${res.status}, response: ${JSON.stringify(res.data)}`);
      }
      tokens[r.role] = res.data.token;
    });
  }

  await test('POST /api/auth/login with Invalid Password (should 401)', async () => {
    const res = await request(TEST_PORT, 'POST', '/api/auth/login', { email: 'student@campus360.edu', password: 'wrong' });
    if (res.status !== 401) throw new Error(`Expected 401 but got ${res.status}`);
  });

  for (const r of roles) {
    await test(`GET /api/auth/me (${r.role.toUpperCase()})`, async () => {
      const res = await request(TEST_PORT, 'GET', '/api/auth/me', null, tokens[r.role]);
      if (res.status !== 200 || !res.data.data.user) throw new Error(`Status: ${res.status}`);
    });
  }

  console.log('\n─── 3. Student Routes Tests ──────────────────────');
  await test('GET /api/student/dashboard', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/student/dashboard', null, tokens.student);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/student/attendance', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/student/attendance', null, tokens.student);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/student/marks', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/student/marks', null, tokens.student);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/student/profile', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/student/profile', null, tokens.student);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/student/iot-attendance', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/student/iot-attendance', null, tokens.student);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  console.log('\n─── 4. Mentor Routes Tests ───────────────────────');
  await test('GET /api/mentor/dashboard', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/mentor/dashboard', null, tokens.mentor);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/mentor/students', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/mentor/students', null, tokens.mentor);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/mentor/attendance', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/mentor/attendance', null, tokens.mentor);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  console.log('\n─── 5. HOD Routes Tests ──────────────────────────');
  await test('GET /api/hod/dashboard', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/hod/dashboard', null, tokens.hod);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/hod/students', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/hod/students', null, tokens.hod);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/hod/faculty', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/hod/faculty', null, tokens.hod);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/hod/analytics/marks', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/hod/analytics/marks', null, tokens.hod);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status: ${res.status}`);
  });

  console.log('\n─── 6. Admin Routes Tests ────────────────────────');
  await test('GET /api/admin/dashboard', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/dashboard', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/users', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/users', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/departments', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/departments', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/subjects', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/subjects', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/devices', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/devices', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/configs', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/configs', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/face-registrations', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/face-registrations', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/audit-logs', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/audit-logs', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/notifications', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/notifications', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  await test('GET /api/admin/events', async () => {
    const res = await request(TEST_PORT, 'GET', '/api/admin/events', null, tokens.admin);
    if (res.status !== 200 || !res.data.success) throw new Error(`Status ${res.status}`);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log(`========================================\n`);

  server.close();
  process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch((e) => {
  console.error('Fatal Error:', e);
  server.close();
  process.exit(1);
});
