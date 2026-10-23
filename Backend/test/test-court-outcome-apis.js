require('dotenv').config();
const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const pool = require('../src/config/db');

const PORT = 5010;
const BASE_URL = `http://localhost:${PORT}`;

async function runCourtOutcomeTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 3: Court Outcome Recording & Case Closure   ');
  console.log('=================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on ${BASE_URL}\n`);

  let adminToken, sho1Token, sho2Token, supervisorToken, io1Token, citizenToken, otherCitizenToken;
  let testFirId, caseId, unregisteredFirId;

  try {
    // ---------------------------------------------------------
    // 1. Authentication & Officer Setup
    // ---------------------------------------------------------
    async function login(email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return { token: data.data?.token, user: data.data?.user };
    }

    const adminLogin = await login('admin@casesync.gov.in', 'Admin@12345');
    adminToken = adminLogin.token;
    assert(adminToken, 'Admin login failed');

    const sho1Login = await login('sho.central@casesync.gov.in', 'Officer@12345');
    sho1Token = sho1Login.token;
    assert(sho1Token, 'Station 1 SHO login failed');
    console.log('✅ 1. Station 1 SHO Login Successful');

    // Station 2 SHO
    const sho2Email = 'sho.north@casesync.gov.in';
    let sho2Login = await login(sho2Email, 'Officer@12345');
    if (!sho2Login.token) {
      await fetch(`${BASE_URL}/api/auth/register-officer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          email: sho2Email,
          password: 'Officer@12345',
          fullName: 'Inspector Harish Rawat',
          phone: '9800000088',
          badgeNo: 'SHO-NPS-002',
          rank: 'Inspector / SHO',
          stationId: 2,
          role: 'SHO'
        })
      });
      sho2Login = await login(sho2Email, 'Officer@12345');
    }
    sho2Token = sho2Login.token;
    assert(sho2Token, 'Station 2 SHO login failed');
    console.log('✅ 2. Station 2 SHO Login Successful');

    const supLogin = await login('sp.district@casesync.gov.in', 'Officer@12345');
    supervisorToken = supLogin.token;
    assert(supervisorToken, 'Supervisor login failed');
    console.log('✅ 3. District Supervisor Login Successful');

    const ioLogin = await login('io.central@casesync.gov.in', 'Officer@12345');
    io1Token = ioLogin.token;
    assert(io1Token, 'Station 1 IO login failed');
    console.log('✅ 4. Station 1 IO Login Successful');

    const citLogin = await login('citizen.priya@casesync.gov.in', 'Citizen@12345');
    citizenToken = citLogin.token;
    assert(citizenToken, 'Citizen login failed');

    // Create / Login second citizen for cross-citizen scoping checks
    const otherCitEmail = 'citizen.rahul@casesync.gov.in';
    let otherCitLogin = await login(otherCitEmail, 'Citizen@12345');
    if (!otherCitLogin.token) {
      await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: otherCitEmail,
          password: 'Citizen@12345',
          fullName: 'Rahul Sharma',
          phone: '9811223344',
          address: '45 Lake View Road, Ward 5'
        })
      });
      otherCitLogin = await login(otherCitEmail, 'Citizen@12345');
    }
    otherCitizenToken = otherCitLogin.token;
    assert(otherCitizenToken, 'Second citizen login failed');
    console.log('✅ 5. Citizens Login Successful\n');

    // ---------------------------------------------------------
    // 2. Setup: File, Register, Investigate & File Chargesheet
    // ---------------------------------------------------------
    // A. Complainant submits complaint
    const createRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        locationText: 'Central Commercial Plaza, Shop 14',
        descriptionText: 'Armed burglary occurred overnight; valuables stolen.',
        incidentDt: new Date().toISOString(),
        priority: 1,
        submitImmediately: true
      })
    });
    const createData = await createRes.json();
    testFirId = createData.data.fir_id;

    // B. Desk reviews & tags legal section
    const deskLogin = await login('desk.central@casesync.gov.in', 'Officer@12345');
    await fetch(`${BASE_URL}/api/firs/${testFirId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deskLogin.token}` }
    });
    await fetch(`${BASE_URL}/api/firs/${testFirId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deskLogin.token}`
      },
      body: JSON.stringify({ sectionIds: [1], isCognizable: true })
    });

    // C. SHO registers FIR
    const regRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    const regData = await regRes.json();
    caseId = regData.data.caseId;
    console.log(`✅ Test 1: FIR Registered (FIR ID: ${testFirId}, Case ID: ${caseId}, Number: ${regData.data.fir.fir_number})`);

    // D. SHO assigns IO
    const ioOfficerId = ioLogin.user.officerId || 2;
    await fetch(`${BASE_URL}/api/cases/${testFirId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        officerId: ioOfficerId,
        reason: 'Assigned for forensic recovery and chargesheet filing'
      })
    });

    // E. IO accepts case
    await fetch(`${BASE_URL}/api/cases/${testFirId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${io1Token}` }
    });

    // F. IO adds accused person
    await fetch(`${BASE_URL}/api/cases/${testFirId}/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${io1Token}`
      },
      body: JSON.stringify({
        fullName: 'Vikram Singh',
        personRole: 'ACCUSED',
        phone: '9899001122',
        address: 'Old Cantonment Quarter 12'
      })
    });

    // G. IO logs diary update
    await fetch(`${BASE_URL}/api/cases/${testFirId}/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${io1Token}`
      },
      body: JSON.stringify({
        updateType: 'STATEMENT',
        body: 'Recorded eye-witness statement confirming identity of accused.',
        visibleToCitizen: true
      })
    });

    // ---------------------------------------------------------
    // 3. Premature Outcome Recording Guard (UNDER_INVESTIGATION)
    // ---------------------------------------------------------
    const prematureRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'CONVICTED',
        judgmentDate: '2026-10-20',
        sentenceDetails: '3 years imprisonment',
        remarks: 'Premature judgment record test'
      })
    });
    assert(prematureRes.status === 400, 'Premature outcome recording should be blocked with 400');
    console.log('✅ Test 2: Premature Outcome Guard (Cannot record outcome while UNDER_INVESTIGATION)');

    // ---------------------------------------------------------
    // 4. Advance Case: Submit Report -> Approve Chargesheet -> CHARGESHEET_FILED
    // ---------------------------------------------------------
    await fetch(`${BASE_URL}/api/cases/${testFirId}/submit-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${io1Token}`
      },
      body: JSON.stringify({
        reportType: 'CHARGESHEET',
        summary: 'Investigation concluded with conclusive forensic proof and confessions.'
      })
    });

    const approveRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/review-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        decision: 'APPROVE',
        remarks: 'Approved for formal court trial.',
        courtDetails: { courtName: 'District Sessions Court' }
      })
    });
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.data.status, 'CHARGESHEET_FILED', 'Status should be CHARGESHEET_FILED');
    console.log('✅ Test 3: Chargesheet Approved by SHO -> Status: CHARGESHEET_FILED');

    // ---------------------------------------------------------
    // 5. RBAC & Jurisdiction Guards
    // ---------------------------------------------------------
    // A. Citizen cannot record court outcome (403 Forbidden)
    const citizenRecordRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'CONVICTED',
        judgmentDate: '2026-10-20',
        sentenceDetails: '3 years imprisonment',
        remarks: 'Citizen unauthorized attempt'
      })
    });
    assert.strictEqual(citizenRecordRes.status, 403, 'Citizen must receive 403');
    console.log('✅ Test 4: RBAC Guard (Citizen cannot record court outcome -> 403 Forbidden)');

    // B. IO cannot record court outcome (403 Forbidden)
    const ioRecordRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${io1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'CONVICTED',
        judgmentDate: '2026-10-20',
        sentenceDetails: '3 years imprisonment',
        remarks: 'IO unauthorized attempt'
      })
    });
    assert.strictEqual(ioRecordRes.status, 403, 'IO must receive 403');
    console.log('✅ Test 5: RBAC Guard (IO cannot record court outcome -> 403 Forbidden)');

    // C. Station 2 SHO cannot record court outcome for Station 1 case (403 Forbidden)
    const otherStationRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho2Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'CONVICTED',
        judgmentDate: '2026-10-20',
        sentenceDetails: '3 years imprisonment',
        remarks: 'Cross-station SHO unauthorized attempt'
      })
    });
    assert.strictEqual(otherStationRes.status, 403, 'Station 2 SHO must receive 403');
    console.log('✅ Test 6: Station Jurisdiction Guard (Station 2 SHO blocked from Station 1 case -> 403 Forbidden)');

    // ---------------------------------------------------------
    // 6. Input Validation Guards
    // ---------------------------------------------------------
    // A. Invalid verdict
    const invalidVerdictRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'INVALID_VERDICT',
        judgmentDate: '2026-10-20',
        remarks: 'Testing invalid verdict validation.'
      })
    });
    assert.strictEqual(invalidVerdictRes.status, 400, 'Invalid verdict must return 400');
    console.log('✅ Test 7: Validation Guard (Invalid verdict rejected with 400 Bad Request)');

    // B. Conviction without sentence details
    const missingSentenceRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'CONVICTED',
        judgmentDate: '2026-10-20',
        remarks: 'Testing conviction without sentence.'
      })
    });
    assert.strictEqual(missingSentenceRes.status, 400, 'Conviction without sentence must return 400');
    console.log('✅ Test 8: Validation Guard (Conviction without sentence details rejected with 400 Bad Request)');

    // C. Future judgment date
    const futureDateRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'ACQUITTED',
        judgmentDate: '2099-12-31',
        remarks: 'Testing future date rejection.'
      })
    });
    assert.strictEqual(futureDateRes.status, 400, 'Future judgment date must return 400');
    console.log('✅ Test 9: Validation Guard (Future judgment date rejected with 400 Bad Request)');

    // D. Remarks too short (< 10 chars)
    const shortRemarksRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        courtName: 'District Sessions Court',
        verdict: 'ACQUITTED',
        judgmentDate: '2026-10-20',
        remarks: 'Short'
      })
    });
    assert.strictEqual(shortRemarksRes.status, 400, 'Short remarks must return 400');
    console.log('✅ Test 10: Validation Guard (Remarks < 10 characters rejected with 400 Bad Request)');

    // ---------------------------------------------------------
    // 7. Successful Court Outcome Recording & Case Closure
    // ---------------------------------------------------------
    const validOutcomePayload = {
      courtName: 'District & Sessions Court, Central Division',
      caseCourtNumber: 'SC-2026/894',
      verdict: 'CONVICTED',
      judgmentDate: '2026-10-20',
      judgeName: 'Hon. Justice P. K. Singhal',
      sentenceDetails: 'Rigorous imprisonment for 3 years under BNS 303(2)',
      fineAmount: 15000.00,
      remarks: 'Accused convicted following forensic evidence examination and full trial hearing.'
    };

    const recordRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify(validOutcomePayload)
    });
    const recordData = await recordRes.json();
    assert.strictEqual(recordRes.status, 200, `Court outcome recording failed: ${JSON.stringify(recordData)}`);
    assert.strictEqual(recordData.data.verdict, 'CONVICTED');
    assert.strictEqual(recordData.data.fir_status, 'CLOSED');
    console.log(`✅ Test 11: Court Outcome Recorded Successfully (Outcome ID: ${recordData.data.outcome_id}, FIR Status: ${recordData.data.fir_status})`);

    // Verify DB states: cases.closed_at is set, fir.status is CLOSED
    const dbCheck = await pool.query(
      `SELECT c.closed_at, c.outcome, f.status, f.version
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1`,
      [testFirId]
    );
    assert(dbCheck.rows[0].closed_at !== null, 'Case closed_at must be populated in DB');
    assert.strictEqual(dbCheck.rows[0].status, 'CLOSED', 'FIR status must be CLOSED in DB');
    console.log('✅ Test 12: Database State Integrity Verified (cases.closed_at set, fir.status = CLOSED)');

    // ---------------------------------------------------------
    // 8. Single Final Adjudication Guard (Duplicate Attempt)
    // ---------------------------------------------------------
    const duplicateRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify(validOutcomePayload)
    });
    assert.strictEqual(duplicateRes.status, 409, 'Duplicate court outcome must return 409 Conflict');
    console.log('✅ Test 13: Duplicate Adjudication Guard (Second outcome attempt rejected with 409 Conflict)');

    // ---------------------------------------------------------
    // 9. Status Guard: Cannot Re-record on CLOSED Case
    // ---------------------------------------------------------
    const closedStatusRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({
        courtName: 'High Court',
        verdict: 'ACQUITTED',
        judgmentDate: '2026-10-21',
        remarks: 'Attempting to record on already closed case'
      })
    });
    // Can be 400 (Status Guard: cannot record for CLOSED) or 409 (Duplicate)
    assert([400, 409].includes(closedStatusRes.status), 'Already closed case must be blocked');
    console.log('✅ Test 14: Status Guard (Already CLOSED case rejected)');

    // ---------------------------------------------------------
    // 10. Query Court Outcome Details: GET /api/cases/:id/court-outcome
    // ---------------------------------------------------------
    // A. Complainant citizen reads court outcome
    const citGetRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const citGetData = await citGetRes.json();
    assert.strictEqual(citGetRes.status, 200, 'Complainant should read outcome with 200 OK');
    assert.strictEqual(citGetData.data.verdict, 'CONVICTED');
    assert.strictEqual(citGetData.data.case_court_number, 'SC-2026/894');
    console.log('✅ Test 15: Complainant Read Access (Complainant retrieved full verdict and sentence details)');

    // B. District Supervisor reads court outcome
    const supGetRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    assert.strictEqual(supGetRes.status, 200, 'Supervisor should read outcome with 200 OK');
    console.log('✅ Test 16: Supervisory Read Access (District Supervisor retrieved verdict details)');

    // C. Other Citizen (not complainant) is blocked (403 Forbidden)
    const otherCitGetRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/court-outcome`, {
      headers: { Authorization: `Bearer ${otherCitizenToken}` }
    });
    assert.strictEqual(otherCitGetRes.status, 403, 'Other citizen must receive 403 Forbidden');
    console.log('✅ Test 17: Scoping Guard (Unrelated citizen blocked with 403 Forbidden)');

    // D. Non-existent case returns 404
    const notFoundRes = await fetch(`${BASE_URL}/api/cases/999999/court-outcome`, {
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent case must return 404 Not Found');
    console.log('✅ Test 18: 404 Not Found Guard (Non-existent case outcome query returns 404)');

    // ---------------------------------------------------------
    // 11. Citizen In-App Notification Delivery
    // ---------------------------------------------------------
    const notifRes = await pool.query(
      `SELECT message, created_at FROM notifications 
       WHERE fir_id = $1 AND message LIKE '%Court verdict recorded%'
       ORDER BY created_at DESC LIMIT 1`,
      [testFirId]
    );
    assert(notifRes.rows.length > 0, 'Complainant closure notification must be delivered');
    console.log(`✅ Test 19: Complainant Notification Verified: "${notifRes.rows[0].message}"`);

    // ---------------------------------------------------------
    // 12. Cryptographic SHA-256 Audit Chain Verification
    // ---------------------------------------------------------
    const auditRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    if (!auditData.isValid) {
      console.error('Audit verification failure details:', JSON.stringify(auditData, null, 2));
    }
    assert.strictEqual(auditData.isValid, true, 'Audit log cryptographic hash chain must remain valid');
    console.log(`✅ Test 20: Tamper-Evident SHA-256 Audit Chain Verified (Records: ${auditData.totalRecords}, Chain Valid: ${auditData.isValid})`);

    console.log('\n=================================================================');
    console.log('   Workflow 3: Court Outcome Recording & Case Closure PASSED   ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ Workflow 3 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runCourtOutcomeTests();
