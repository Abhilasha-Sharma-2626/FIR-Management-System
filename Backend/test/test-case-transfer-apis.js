require('dotenv').config();
const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const pool = require('../src/config/db');

const PORT = 5009;
const BASE_URL = `http://localhost:${PORT}`;

async function runCaseTransferTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 2: Inter-Station Case Transfer & Zero FIR  ');
  console.log('=================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on ${BASE_URL}\n`);

  let adminToken, sho1Token, sho2Token, supervisorToken, io1Token, citizenToken;
  let testFirId, caseId, transferId;

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
    console.log('✅ 1. Station 1 SHO (Central PS) Login Successful');

    // Ensure an SHO exists for Station 2 (North Police Station)
    const sho2Email = 'sho.north@casesync.gov.in';
    let sho2Login = await login(sho2Email, 'Officer@12345');
    if (!sho2Login.token) {
      // Create Station 2 SHO account via Admin
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
    console.log('✅ 2. Station 2 SHO (North PS) Login Successful');

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
    console.log('✅ 5. Citizen Complainant Login Successful\n');

    // ---------------------------------------------------------
    // 2. Setup: File, Review, Register & Assign FIR at Station 1
    // ---------------------------------------------------------
    // Citizen submits complaint
    const createRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        locationText: 'Highway Border Crossing, Sector 22',
        descriptionText: 'Truck cargo stolen along border road.',
        incidentDt: new Date().toISOString(),
        priority: 1,
        submitImmediately: true
      })
    });
    const createData = await createRes.json();
    testFirId = createData.data.fir_id;

    // Desk starts review
    const deskLogin = await login('desk.central@casesync.gov.in', 'Officer@12345');
    await fetch(`${BASE_URL}/api/firs/${testFirId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deskLogin.token}` }
    });

    // Tag legal section
    await fetch(`${BASE_URL}/api/firs/${testFirId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deskLogin.token}`
      },
      body: JSON.stringify({ sectionIds: [1], isCognizable: true })
    });

    // SHO 1 registers FIR -> creates case
    const regRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    const regData = await regRes.json();
    caseId = regData.data.caseId;
    console.log(`✅ Test 1: FIR Registered at Station 1 (FIR ID: ${testFirId}, Case ID: ${caseId}, Number: ${regData.data.fir.fir_number})`);

    // SHO 1 assigns IO 1
    const ioOfficerId = ioLogin.user.officerId || 2;
    await fetch(`${BASE_URL}/api/cases/${testFirId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        officerId: ioOfficerId,
        reason: 'Assigned for initial scene inspection'
      })
    });

    // IO 1 accepts case -> UNDER_INVESTIGATION
    await fetch(`${BASE_URL}/api/cases/${testFirId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${io1Token}` }
    });
    console.log('✅ Test 2: Case assigned to IO and commenced -> Status: UNDER_INVESTIGATION');

    // ---------------------------------------------------------
    // 3. Validation Guards on Transfer Initiation
    // ---------------------------------------------------------
    // Short reason guard (< 10 chars)
    const shortReasonRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({ toStationId: 2, reason: 'Short' })
    });
    assert(shortReasonRes.status === 400, 'Short reason should be rejected with 400');
    console.log('✅ Test 3: Validation Guard (Short reason blocked with 400 Bad Request)');

    // Self-transfer guard (toStationId == current station)
    const selfTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        toStationId: 1,
        reason: 'Transferring back to the same police station.'
      })
    });
    assert(selfTransferRes.status === 400, 'Self transfer should be blocked with 400');
    console.log('✅ Test 4: Self-Transfer Guard (Transfer to same station blocked with 400 Bad Request)');

    // ---------------------------------------------------------
    // 4. Jurisdiction Guard: Non-originating officer tries to transfer
    // ---------------------------------------------------------
    const wrongShoTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho2Token}`
      },
      body: JSON.stringify({
        toStationId: 2,
        reason: 'Attempting to transfer a case belonging to another station.'
      })
    });
    assert(wrongShoTransferRes.status === 403, 'Non-originating SHO should be blocked with 403');
    console.log('✅ Test 5: Jurisdiction Guard (SHO 2 blocked from transferring SHO 1 case with 403 Forbidden)');

    // ---------------------------------------------------------
    // 5. Legitimate Transfer Initiation by Station 1 SHO
    // ---------------------------------------------------------
    const transferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        toStationId: 2,
        reason: 'Offence GPS coordinates place crime scene entirely inside North Station territory.'
      })
    });
    const transferData = await transferRes.json();
    assert(transferRes.status === 200, 'Transfer initiation failed');
    transferId = transferData.data.transfer.transfer_id;
    assert(transferData.data.fir.status === 'TRANSFERRED', 'FIR status must be TRANSFERRED');
    console.log(`✅ Test 6: SHO 1 initiated transfer -> Status: TRANSFERRED (Transfer ID: ${transferId}, Target: Station 2)`);

    // Verify IO assignment was relieved/closed in database
    const assignCheck = await pool.query(
      `SELECT to_ts FROM case_assignments WHERE case_id = $1 AND to_ts IS NOT NULL`,
      [caseId]
    );
    assert(assignCheck.rows.length > 0, 'Active assignment must be closed on transfer');
    console.log('✅ Test 7: Active IO assignment safely closed with to_ts timestamp');

    // ---------------------------------------------------------
    // 6. Duplicate Transfer Guard
    // ---------------------------------------------------------
    const dupTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        toStationId: 2,
        reason: 'Second transfer attempt while one is already pending.'
      })
    });
    assert(dupTransferRes.status === 400 || dupTransferRes.status === 409, 'Duplicate transfer blocked');
    console.log('✅ Test 8: Duplicate Transfer Guard (Blocked concurrent transfer attempt)');

    // ---------------------------------------------------------
    // 7. Incoming Transfers Queue Check
    // ---------------------------------------------------------
    // Station 2 SHO sees the incoming transfer
    const queueSho2Res = await fetch(`${BASE_URL}/api/station/transfers`, {
      headers: { Authorization: `Bearer ${sho2Token}` }
    });
    const queueSho2Data = await queueSho2Res.json();
    assert(queueSho2Res.status === 200, 'Failed to fetch incoming transfers');
    const incomingMatch = queueSho2Data.data.find(t => t.transfer_id === transferId);
    assert(incomingMatch, 'Pending transfer must appear in Station 2 incoming queue');
    console.log(`✅ Test 9: GET /api/station/transfers (Station 2 SHO found incoming transfer ID ${transferId})`);

    // Station 1 SHO does NOT see it in their incoming queue
    const queueSho1Res = await fetch(`${BASE_URL}/api/station/transfers`, {
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    const queueSho1Data = await queueSho1Res.json();
    const wrongQueueMatch = queueSho1Data.data.find(t => t.transfer_id === transferId);
    assert(!wrongQueueMatch, 'Outgoing transfer must NOT appear in Station 1 incoming queue');
    console.log('✅ Test 10: Queue Scoping Guard (Originating Station 1 does not see its own outgoing transfer)');

    // ---------------------------------------------------------
    // 8. Rejection of Transfer by Receiving Station (Testing REJECT branch)
    // ---------------------------------------------------------
    // Unauthorized officer (Station 1) tries to accept/reject
    const unauthorizedAcceptRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/accept-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({ remarks: 'Station 1 trying to accept own transfer' })
    });
    assert(unauthorizedAcceptRes.status === 403, 'Non-receiving station blocked from acceptance');
    console.log('✅ Test 11: Receiving Authority Guard (Station 1 blocked from accepting with 403 Forbidden)');

    // Station 2 SHO rejects the transfer
    const rejectTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/reject-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho2Token}`
      },
      body: JSON.stringify({
        remarks: 'Boundary check indicates incident occurred on state highway under Central PS jurisdiction.'
      })
    });
    const rejectTransferData = await rejectTransferRes.json();
    assert(rejectTransferRes.status === 200, 'Failed to reject transfer');
    assert(rejectTransferData.data.revertedStatus === 'UNDER_INVESTIGATION', 'Case must revert to pre-transfer state');
    console.log('✅ Test 12: Station 2 SHO rejected transfer -> Case safely reverted to UNDER_INVESTIGATION at Station 1');

    // ---------------------------------------------------------
    // 9. Re-initiate Transfer & Accept by Receiving Station
    // ---------------------------------------------------------
    // Station 1 SHO re-transfers with conclusive evidence
    const reTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho1Token}`
      },
      body: JSON.stringify({
        toStationId: 2,
        reason: 'Certified revenue map confirms kilometer stone 14 is within North Station boundary.'
      })
    });
    const reTransferData = await reTransferRes.json();
    assert(reTransferRes.status === 200, 'Failed to re-initiate transfer');
    const newTransferId = reTransferData.data.transfer.transfer_id;
    console.log(`✅ Test 13: Station 1 SHO re-initiated transfer (New Transfer ID: ${newTransferId})`);

    // Station 2 SHO accepts transfer
    const acceptTransferRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/accept-transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sho2Token}`
      },
      body: JSON.stringify({
        remarks: 'Certified map reviewed and accepted. Case registered at North Police Station.'
      })
    });
    const acceptTransferData = await acceptTransferRes.json();
    assert(acceptTransferRes.status === 200, 'Failed to accept transfer');
    assert(acceptTransferData.data.fir.status === 'REGISTERED', 'FIR status must become REGISTERED');
    assert(acceptTransferData.data.fir.station_id === 2, 'FIR station_id must be updated to Station 2');
    console.log('✅ Test 14: Station 2 SHO accepted transfer -> Status: REGISTERED, Station ID: 2 (North PS)');

    // Verify in database that current_io_id is reset to NULL
    const caseCheck = await pool.query(`SELECT current_io_id FROM cases WHERE case_id = $1`, [caseId]);
    assert(caseCheck.rows[0].current_io_id === null, 'current_io_id must be cleared on acceptance');
    console.log('✅ Test 15: Database state verified (current_io_id cleared, ready for new station assignment)');

    // ---------------------------------------------------------
    // 10. Query Case Transfers History
    // ---------------------------------------------------------
    const historyRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/transfers`, {
      headers: { Authorization: `Bearer ${sho2Token}` }
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200 && historyData.count === 2, 'Must have 2 transfer records in history');
    console.log(`✅ Test 16: GET /api/cases/:id/transfers (Verified ${historyData.count} transfer audit records)`);

    // ---------------------------------------------------------
    // 11. Cryptographic Audit Chain Verification
    // ---------------------------------------------------------
    const auditVerifyRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${supervisorToken}` }
    });
    const auditVerifyData = await auditVerifyRes.json();
    assert(auditVerifyRes.status === 200 && auditVerifyData.isValid === true, 'Audit chain integrity failed');
    console.log(`✅ Test 17: Cryptographic Audit Chain Verified (${auditVerifyData.totalRecords} records, 0 broken links)`);

    console.log('\n=================================================================');
    console.log('   All Workflow 2: Case Transfer Tests Passed Successfully!     ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runCaseTransferTests();
}

module.exports = runCaseTransferTests;
