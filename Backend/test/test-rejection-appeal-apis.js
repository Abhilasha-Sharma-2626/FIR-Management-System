require('dotenv').config();
const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const pool = require('../src/config/db');

const PORT = 5008;
const BASE_URL = `http://localhost:${PORT}`;

async function runRejectionAppealTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 1: Rejection Appeal & Supervisory Review   ');
  console.log('=================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on ${BASE_URL}\n`);

  let citizenToken, otherCitizenToken, deskToken, shoToken, supervisorToken;
  let citizenId, otherCitizenId;
  let testFirId, trackingId, appealId;

  try {
    // ---------------------------------------------------------
    // 1. Authentication
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

    const citizenLogin = await login('citizen.priya@casesync.gov.in', 'Citizen@12345');
    citizenToken = citizenLogin.token;
    citizenId = citizenLogin.user.citizenId;
    assert(citizenToken, 'Citizen login failed');
    console.log('✅ 1. Primary Citizen Login Successful');

    // Register second citizen for unauthorized ownership tests
    const uniqueEmail = `other.citizen.${Date.now()}@casesync.gov.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password@123',
        fullName: 'Another Citizen',
        phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        idProofType: 'PAN',
        idProofNumber: 'ABCDE1234F'
      })
    });
    const regData = await regRes.json();
    const otherLogin = await login(uniqueEmail, 'Password@123');
    otherCitizenToken = otherLogin.token;
    otherCitizenId = otherLogin.user.citizenId;
    assert(otherCitizenToken, 'Second Citizen Registration/Login failed');
    console.log('✅ 2. Second Citizen Login Successful (for unauthorized tests)');

    const deskLogin = await login('desk.central@casesync.gov.in', 'Officer@12345');
    deskToken = deskLogin.token;
    assert(deskToken, 'Desk Officer login failed');
    console.log('✅ 3. Desk Officer Login Successful');

    const shoLogin = await login('sho.central@casesync.gov.in', 'Officer@12345');
    shoToken = shoLogin.token;
    assert(shoToken, 'SHO Login Successful');
    console.log('✅ 4. SHO Login Successful');

    const supLogin = await login('sp.district@casesync.gov.in', 'Officer@12345');
    supervisorToken = supLogin.token;
    assert(supervisorToken, 'Supervisor Login Successful');
    console.log('✅ 5. Supervisor Login Successful\n');

    // ---------------------------------------------------------
    // 2. Citizen creates and submits complaint
    // ---------------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        locationText: 'Main Bazaar, Sector 17',
        descriptionText: 'Wallet and mobile phone snatched by two bike riders.',
        incidentDt: new Date().toISOString(),
        priority: 2,
        submitImmediately: true
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.data.fir_id, 'Failed to create complaint');
    testFirId = createData.data.fir_id;
    trackingId = createData.data.tracking_id;
    console.log(`✅ Test 1: Citizen submitted complaint (FIR ID: ${testFirId}, Tracking: ${trackingId})`);

    // ---------------------------------------------------------
    // 3. Desk officer starts review -> UNDER_REVIEW
    // ---------------------------------------------------------
    const reviewRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deskToken}` }
    });
    assert(reviewRes.status === 200, 'Desk officer failed to start review');
    console.log('✅ Test 2: Desk officer started review -> Status: UNDER_REVIEW');

    // ---------------------------------------------------------
    // 4. Desk officer rejects complaint -> REJECTED
    // ---------------------------------------------------------
    const rejectRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deskToken}`
      },
      body: JSON.stringify({
        rejectionReason: 'Civil dispute over vehicle transaction, not a cognizable theft.'
      })
    });
    assert(rejectRes.status === 200, 'Failed to reject complaint');
    console.log('✅ Test 3: Desk officer rejected complaint -> Status: REJECTED');

    // ---------------------------------------------------------
    // 5. Ownership Guard: Another citizen attempts to appeal
    // ---------------------------------------------------------
    const unauthorizedAppeal = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherCitizenToken}`
      },
      body: JSON.stringify({
        reason: 'I am lodging an appeal for this case even though it is not mine.'
      })
    });
    assert(unauthorizedAppeal.status === 403, 'Unauthorized citizen should be blocked with 403');
    console.log('✅ Test 4: Ownership Guard (Unauthorized citizen blocked from appealing with 403 Forbidden)');

    // ---------------------------------------------------------
    // 6. Validation Guard: Short appeal reason (< 10 chars)
    // ---------------------------------------------------------
    const shortReasonRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ reason: 'Short' })
    });
    assert(shortReasonRes.status === 400, 'Short reason should be rejected with 400');
    console.log('✅ Test 5: Validation Guard (Short reason blocked with 400 Bad Request)');

    // ---------------------------------------------------------
    // 7. Legitimate Citizen submits Appeal
    // ---------------------------------------------------------
    const appealRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        reason: 'This was an armed robbery in broad daylight, not a civil dispute. CCTV footage from shop #14 shows violence.'
      })
    });
    const appealData = await appealRes.json();
    assert(appealRes.status === 201 && appealData.data.appeal_id, 'Failed to submit appeal');
    appealId = appealData.data.appeal_id;
    assert(appealData.data.status === 'PENDING', 'New appeal must be PENDING');
    console.log(`✅ Test 6: Citizen submitted appeal (Appeal ID: ${appealId}, Status: PENDING)`);

    // ---------------------------------------------------------
    // 8. Duplicate Appeal Guard: Cannot submit second appeal while first is PENDING
    // ---------------------------------------------------------
    const duplicateAppealRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        reason: 'Submitting duplicate appeal while one is already pending review.'
      })
    });
    assert(duplicateAppealRes.status === 409, 'Duplicate appeal should return 409 Conflict');
    console.log('✅ Test 7: Duplicate Appeal Guard (Blocked with 409 Conflict)');

    // ---------------------------------------------------------
    // 9. Query FIR Appeals History
    // ---------------------------------------------------------
    const listAppealsRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeals`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    const listAppealsData = await listAppealsRes.json();
    assert(listAppealsRes.status === 200 && listAppealsData.count >= 1, 'Failed to list appeals');
    console.log(`✅ Test 8: GET /api/firs/:id/appeals (Listed ${listAppealsData.count} appeal records)`);

    // ---------------------------------------------------------
    // 10. Station Pending Appeals Inbox (SHO)
    // ---------------------------------------------------------
    const stationAppealsRes = await fetch(`${BASE_URL}/api/station/appeals`, {
      headers: { Authorization: `Bearer ${shoToken}` }
    });
    const stationAppealsData = await stationAppealsRes.json();
    assert(stationAppealsRes.status === 200 && Array.isArray(stationAppealsData.data), 'Failed to fetch station appeals');
    const foundPending = stationAppealsData.data.find(a => a.appeal_id === appealId);
    assert(foundPending, 'Pending appeal not found in station queue');
    console.log(`✅ Test 9: GET /api/station/appeals (Found pending appeal in SHO queue)`);

    // ---------------------------------------------------------
    // 11. RBAC Guard: Desk officer attempts to review appeal
    // ---------------------------------------------------------
    const deskReviewRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/review-appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deskToken}`
      },
      body: JSON.stringify({
        appealId,
        decision: 'ACCEPT',
        reviewNotes: 'Desk trying to accept'
      })
    });
    assert(deskReviewRes.status === 403, 'Desk officer should be blocked from reviewing appeal');
    console.log('✅ Test 10: RBAC Guard (Desk Officer blocked from appeal review with 403 Forbidden)');

    // ---------------------------------------------------------
    // 12. SHO Rejects Appeal First (Testing REJECT decision branch)
    // ---------------------------------------------------------
    const rejectAppealRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/review-appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${shoToken}`
      },
      body: JSON.stringify({
        appealId,
        decision: 'REJECT',
        reviewNotes: 'Insufficient supporting evidence provided at this stage.'
      })
    });
    const rejectAppealData = await rejectAppealRes.json();
    assert(rejectAppealRes.status === 200, 'SHO failed to reject appeal');
    assert(rejectAppealData.data.appeal.status === 'REJECTED', 'Appeal status should be REJECTED');
    assert(rejectAppealData.data.firStatus === 'REJECTED', 'FIR status must remain REJECTED');
    console.log('✅ Test 11: SHO reviewed and rejected appeal -> Appeal: REJECTED, FIR remains REJECTED');

    // ---------------------------------------------------------
    // 13. Citizen lodges Second Appeal with fresh proof
    // ---------------------------------------------------------
    const secondAppealRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        reason: 'Attached medico-legal certificate and CCTV clip confirming physical injuries and snatched items.'
      })
    });
    const secondAppealData = await secondAppealRes.json();
    assert(secondAppealRes.status === 201, 'Failed to submit second appeal after first was resolved');
    const secondAppealId = secondAppealData.data.appeal_id;
    console.log(`✅ Test 12: Citizen submitted second appeal (Appeal ID: ${secondAppealId})`);

    // ---------------------------------------------------------
    // 14. District SUPERVISOR Accepts Appeal -> Reopens to UNDER_REVIEW
    // ---------------------------------------------------------
    const acceptAppealRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/review-appeal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({
        appealId: secondAppealId,
        decision: 'ACCEPT',
        reviewNotes: 'Superintendent review: Medico-legal slip confirms cognizable offence. Reopening complaint for immediate registration review.'
      })
    });
    const acceptAppealData = await acceptAppealRes.json();
    assert(acceptAppealRes.status === 200, 'Supervisor failed to accept appeal');
    assert(acceptAppealData.data.appeal.status === 'ACCEPTED', 'Appeal status should be ACCEPTED');
    assert(acceptAppealData.data.firStatus === 'UNDER_REVIEW', 'FIR status must return to UNDER_REVIEW');
    console.log('✅ Test 13: Supervisor accepted appeal -> Appeal: ACCEPTED, FIR status reinstated to UNDER_REVIEW');

    // Verify in database that status history contains transition
    const histRes = await pool.query(
      `SELECT from_state, to_state, note FROM case_status_history WHERE fir_id = $1 ORDER BY history_id DESC LIMIT 1`,
      [testFirId]
    );
    assert(
      histRes.rows[0].from_state === 'REJECTED' && histRes.rows[0].to_state === 'UNDER_REVIEW',
      'Status history must record REJECTED -> UNDER_REVIEW'
    );
    console.log('✅ Test 14: Verified case_status_history reflects REJECTED -> UNDER_REVIEW');

    // Verify citizen received notification
    const notifRes = await pool.query(
      `SELECT message FROM notifications WHERE user_id = $1 ORDER BY notification_id DESC LIMIT 1`,
      [citizenLogin.user.userId]
    );
    assert(notifRes.rows.length > 0 && notifRes.rows[0].message.includes('accepted'), 'Notification to citizen missing');
    console.log('✅ Test 15: Verified in-app notification delivered to complainant citizen');

    // ---------------------------------------------------------
    // 15. Cryptographic Audit Chain Verification
    // ---------------------------------------------------------
    const auditVerifyRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    const auditVerifyData = await auditVerifyRes.json();
    assert(auditVerifyRes.status === 200 && auditVerifyData.isValid === true, 'Audit chain integrity failed');
    console.log(`✅ Test 16: Cryptographic Audit Chain Verified (${auditVerifyData.totalRecords} records, 0 broken links)`);

    console.log('\n=================================================================');
    console.log('   All Workflow 1: Rejection Appeal Tests Passed Successfully!  ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runRejectionAppealTests();
}

module.exports = runRejectionAppealTests;
