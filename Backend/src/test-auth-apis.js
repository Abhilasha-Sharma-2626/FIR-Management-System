require('dotenv').config();
const http = require('http');
const app = require('./app');

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;

function logResult(step, status, details = '') {
  const icon = status ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${step} ${details ? `-> ${details}` : ''}`);
}

async function runTests() {
  console.log('========================================================');
  console.log('   Starting Authentication & Authorization Test Suite   ');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      logResult(name, true, details);
      passed++;
    } else {
      logResult(name, false, details);
      failed++;
    }
  }

  // Start HTTP server on TEST_PORT
  await new Promise(resolve => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on ${BASE_URL}\n`);
      resolve();
    });
  });

  try {
    // ---------------------------------------------------------
    // TEST 1: Health check endpoint
    // ---------------------------------------------------------
    const healthRes = await fetch(`${BASE_URL}/api/test`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, 'Test 1: GET /api/test (Health check)');

    // ---------------------------------------------------------
    // TEST 2: Citizen registration input validation
    // ---------------------------------------------------------
    const invalidRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bademail', password: '123' })
    });
    const invalidRegData = await invalidRegRes.json();
    assert(
      invalidRegRes.status === 400 && invalidRegData.errors && invalidRegData.errors.length > 0,
      'Test 2: POST /api/auth/register (Validation failure rejection)'
    );

    // ---------------------------------------------------------
    // TEST 3: Citizen registration (ACID transaction)
    // ---------------------------------------------------------
    const uniqueSuffix = Date.now();
    const testCitizenEmail = `test.citizen.${uniqueSuffix}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCitizenEmail,
        password: 'Password@123',
        fullName: 'Test Citizen Kumar',
        phone: `91${uniqueSuffix.toString().slice(-9)}`,
        idProofType: 'AADHAAR',
        idProofLast4: '7890',
        address: '123 Test Colony, Sector 5'
      })
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success && regData.data.userId,
      'Test 3: POST /api/auth/register (Citizen registered with ACID transaction & masked ID)'
    );

    // ---------------------------------------------------------
    // TEST 4: Duplicate registration conflict
    // ---------------------------------------------------------
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCitizenEmail,
        password: 'Password@123',
        fullName: 'Test Citizen Kumar'
      })
    });
    assert(
      dupRes.status === 409,
      'Test 4: POST /api/auth/register (Duplicate email conflict returns 409)'
    );

    // ---------------------------------------------------------
    // TEST 5: Login with invalid credentials
    // ---------------------------------------------------------
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCitizenEmail,
        password: 'WrongPassword@999'
      })
    });
    assert(
      badLoginRes.status === 401,
      'Test 5: POST /api/auth/login (Wrong password rejected with 401)'
    );

    // ---------------------------------------------------------
    // TEST 6: Successful Citizen Login & JWT payload
    // ---------------------------------------------------------
    const citizenLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCitizenEmail,
        password: 'Password@123'
      })
    });
    const citizenLoginData = await citizenLoginRes.json();
    const citizenToken = citizenLoginData.data?.token;
    assert(
      citizenLoginRes.status === 200 &&
        citizenToken &&
        citizenLoginData.data.user.role === 'CITIZEN' &&
        Array.isArray(citizenLoginData.data.user.permissions),
      'Test 6: POST /api/auth/login (Citizen login successful with JWT and permissions)'
    );

    // ---------------------------------------------------------
    // TEST 7: Seed accounts logins (Admin, SHO, IO, Supervisor, Auditor)
    // ---------------------------------------------------------
    async function loginAs(email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    }

    const adminLogin = await loginAs('admin@casesync.gov.in', 'Admin@12345');
    const adminToken = adminLogin.data?.token;

    const shoLogin = await loginAs('sho.central@casesync.gov.in', 'Officer@12345');
    const shoToken = shoLogin.data?.token;

    const ioLogin = await loginAs('io.central@casesync.gov.in', 'Officer@12345');
    const ioToken = ioLogin.data?.token;

    const supervisorLogin = await loginAs('sp.district@casesync.gov.in', 'Officer@12345');
    const supervisorToken = supervisorLogin.data?.token;

    const auditorLogin = await loginAs('auditor@casesync.gov.in', 'Auditor@12345');
    const auditorToken = auditorLogin.data?.token;

    assert(
      adminToken && shoToken && ioToken && supervisorToken && auditorToken,
      'Test 7: Multi-role authentication (ADMIN, SHO, IO, SUPERVISOR, AUDITOR login succeeded)'
    );

    // ---------------------------------------------------------
    // TEST 8: GET /api/auth/me (Protected Profile)
    // ---------------------------------------------------------
    const meWithoutToken = await fetch(`${BASE_URL}/api/auth/me`);
    assert(
      meWithoutToken.status === 401,
      'Test 8a: GET /api/auth/me without token returns 401 Unauthorized'
    );

    const meWithToken = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    const meData = await meWithToken.json();
    assert(
      meWithToken.status === 200 &&
        meData.data.role === 'SHO' &&
        meData.data.officer.badgeNo === 'SHO-CPS-001' &&
        meData.data.officer.stationId === 1,
      'Test 8b: GET /api/auth/me returns enriched officer profile with station jurisdiction'
    );

    // ---------------------------------------------------------
    // TEST 9: Role-based Authorization (RBAC Guard)
    // ---------------------------------------------------------
    // Citizen tries SHO-only endpoint -> 403 Forbidden
    const citizenOnShoRes = await fetch(`${BASE_URL}/api/auth/test/role/sho`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(
      citizenOnShoRes.status === 403,
      'Test 9a: Citizen denied on SHO-only endpoint (403 Forbidden)'
    );

    // SHO accesses SHO-only endpoint -> 200 OK
    const shoOnShoRes = await fetch(`${BASE_URL}/api/auth/test/role/sho`, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    assert(shoOnShoRes.status === 200, 'Test 9b: SHO granted access to SHO-only endpoint (200 OK)');

    // Citizen tries Admin-only endpoint -> 403 Forbidden
    const citizenOnAdminRes = await fetch(`${BASE_URL}/api/auth/test/role/admin`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(
      citizenOnAdminRes.status === 403,
      'Test 9c: Citizen denied on Admin-only endpoint (403 Forbidden)'
    );

    // Admin accesses Admin-only endpoint -> 200 OK
    const adminOnAdminRes = await fetch(`${BASE_URL}/api/auth/test/role/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminOnAdminRes.status === 200,
      'Test 9d: Admin granted access to Admin-only endpoint (200 OK)'
    );

    // ---------------------------------------------------------
    // TEST 10: Data-driven Permission Guard
    // ---------------------------------------------------------
    // Citizen has 'fir:create' -> 200 OK
    const citizenPermCreate = await fetch(`${BASE_URL}/api/auth/test/permission/fir-create`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(
      citizenPermCreate.status === 200,
      "Test 10a: Citizen has 'fir:create' permission (200 OK)"
    );

    // Citizen does NOT have 'user:manage' -> 403 Forbidden
    const citizenPermManage = await fetch(`${BASE_URL}/api/auth/test/permission/user-manage`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(
      citizenPermManage.status === 403,
      "Test 10b: Citizen lacks 'user:manage' permission (403 Forbidden)"
    );

    // Admin has 'user:manage' -> 200 OK
    const adminPermManage = await fetch(`${BASE_URL}/api/auth/test/permission/user-manage`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminPermManage.status === 200,
      "Test 10c: Admin has 'user:manage' permission (200 OK)"
    );

    // Auditor has 'audit:read' -> 200 OK
    const auditorPermRead = await fetch(`${BASE_URL}/api/auth/test/permission/audit-read`, {
      headers: { Authorization: `Bearer ${auditorToken}` }
    });
    assert(
      auditorPermRead.status === 200,
      "Test 10d: Auditor has 'audit:read' permission (200 OK)"
    );

    // ---------------------------------------------------------
    // TEST 11: Police Station Jurisdictional Scope Guard
    // ---------------------------------------------------------
    // SHO is stationed at Station 1. Access Station 1 -> 200 OK
    const shoStation1 = await fetch(`${BASE_URL}/api/auth/test/station/1`, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    assert(
      shoStation1.status === 200,
      'Test 11a: SHO granted access to own police station (Station 1) (200 OK)'
    );

    // SHO accesses Station 2 -> 403 Forbidden (cross-station restriction)
    const shoStation2 = await fetch(`${BASE_URL}/api/auth/test/station/2`, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    assert(
      shoStation2.status === 403,
      'Test 11b: SHO denied access to different police station (Station 2) (403 Forbidden)'
    );

    // SUPERVISOR accesses Station 2 -> 200 OK (District-wide jurisdiction)
    const supStation2 = await fetch(`${BASE_URL}/api/auth/test/station/2`, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    assert(
      supStation2.status === 200,
      'Test 11c: SUPERVISOR granted district-wide jurisdiction across Station 2 (200 OK)'
    );

    // ---------------------------------------------------------
    // TEST 12: Officer Registration by ADMIN only (FR-A4)
    // ---------------------------------------------------------
    // Non-admin attempts -> 403
    const officerEmail = `officer.${uniqueSuffix}@casesync.gov.in`;
    const citizenCreateOfficer = await fetch(`${BASE_URL}/api/auth/register-officer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        email: officerEmail,
        password: 'Officer@12345',
        fullName: 'New Sub-Inspector Amit',
        badgeNo: `IO-NPS-${uniqueSuffix.toString().slice(-4)}`,
        rank: 'Sub-Inspector',
        role: 'IO',
        stationId: 2
      })
    });
    assert(
      citizenCreateOfficer.status === 403,
      'Test 12a: Citizen blocked from creating officer account (403 Forbidden)'
    );

    // Admin creates officer -> 201
    const adminCreateOfficer = await fetch(`${BASE_URL}/api/auth/register-officer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        email: officerEmail,
        password: 'Officer@12345',
        fullName: 'New Sub-Inspector Amit',
        badgeNo: `IO-NPS-${uniqueSuffix.toString().slice(-4)}`,
        rank: 'Sub-Inspector',
        role: 'IO',
        stationId: 2,
        phone: `92${uniqueSuffix.toString().slice(-9)}`
      })
    });
    const newOfficerData = await adminCreateOfficer.json();
    assert(
      adminCreateOfficer.status === 201 && newOfficerData.success && newOfficerData.data.officer,
      'Test 12b: ADMIN successfully created officer account for Station 2 (201 Created)'
    );

    // ---------------------------------------------------------
    // TEST 13: Password Reset Flow (FR-A5)
    // ---------------------------------------------------------
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testCitizenEmail })
    });
    const forgotData = await forgotRes.json();
    const resetToken = forgotData.simulatedResetToken;
    assert(
      forgotRes.status === 200 && resetToken,
      'Test 13a: POST /api/auth/forgot-password issued simulated reset token'
    );

    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        newPassword: 'NewPassword@456'
      })
    });
    assert(
      resetRes.status === 200,
      'Test 13b: POST /api/auth/reset-password updated password successfully'
    );

    // Login with updated password
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCitizenEmail,
        password: 'NewPassword@456'
      })
    });
    assert(
      newLoginRes.status === 200,
      'Test 13c: Logged in successfully with newly reset password'
    );

    // ---------------------------------------------------------
    // TEST 14: User Logout
    // ---------------------------------------------------------
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(logoutRes.status === 200, 'Test 14: POST /api/auth/logout recorded successfully');

    // ---------------------------------------------------------
    // TEST 15: Tamper-Evident Hash Chain Audit Log Verification
    // ---------------------------------------------------------
    const auditVerifyRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${auditorToken}` }
    });
    const auditVerifyData = await auditVerifyRes.json();
    assert(
      auditVerifyRes.status === 200 &&
        auditVerifyData.isValid === true &&
        auditVerifyData.totalRecords > 0,
      `Test 15: Cryptographic audit chain verified: ${auditVerifyData.totalRecords} records, all SHA-256 hashes matched`
    );

    // ---------------------------------------------------------
    // TEST 16: Audit Trail Access & Filter
    // ---------------------------------------------------------
    const auditLogsRes = await fetch(`${BASE_URL}/api/audit?limit=10`, {
      headers: { Authorization: `Bearer ${auditorToken}` }
    });
    const auditLogsData = await auditLogsRes.json();
    const hasAuthEvents = auditLogsData.data?.some(log =>
      ['USER_REGISTERED', 'LOGIN_SUCCESS', 'ACCESS_DENIED', 'OFFICER_CREATED'].includes(log.action)
    );
    assert(
      auditLogsRes.status === 200 && hasAuthEvents,
      'Test 16: Audit log explorer returned tamper-evident auth and access denial entries'
    );

    // ---------------------------------------------------------
    // TEST 17: Account Lockout after 5 failed attempts (FR-A3)
    // ---------------------------------------------------------
    const lockoutEmail = `lockout.${uniqueSuffix}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: lockoutEmail,
        password: 'OriginalPassword@123',
        fullName: 'Lockout Test User'
      })
    });

    let lockoutTriggered = false;
    for (let i = 1; i <= 5; i++) {
      const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: lockoutEmail,
          password: 'BadPassword@123'
        })
      });
      if (failRes.status === 423) {
        lockoutTriggered = true;
        break;
      }
    }
    assert(
      lockoutTriggered,
      'Test 17: Account lockout triggered (HTTP 423) after repeated failed login attempts'
    );
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n========================================================');
  console.log(`   TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
