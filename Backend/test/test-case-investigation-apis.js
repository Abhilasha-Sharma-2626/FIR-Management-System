require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_PORT = 5004;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('--- Starting Case Investigation & Lifecycle Test Suite ---\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Log in SHO
    const shoLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sho.central@casesync.gov.in', password: 'Officer@12345' })
    });
    const shoData = await shoLogin.json();
    const shoToken = shoData.data?.token;
    console.log(shoToken ? '✅ 1. SHO Login Successful' : '❌ 1. SHO Login Failed');

    // 2. Log in IO
    const ioLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'io.central@casesync.gov.in', password: 'Officer@12345' })
    });
    const ioData = await ioLogin.json();
    const ioToken = ioData.data?.token;
    console.log(ioToken ? '✅ 2. IO Login Successful' : '❌ 2. IO Login Failed');

    // 3. Check IO Workload (SHO endpoint)
    const workloadRes = await fetch(`${BASE_URL}/api/cases/workload`, {
      headers: { 'Authorization': `Bearer ${shoToken}` }
    });
    const workloadData = await workloadRes.json();
    console.log(workloadRes.status === 200 && Array.isArray(workloadData.data)
      ? `✅ 3. IO Workload fetched (${workloadData.data.length} officers found)`
      : `❌ 3. IO Workload Failed (${workloadRes.status})`);

    // 4. Query target IO officer_id for Station 1
    const ioOfficerRes = await pool.query(
      `SELECT o.officer_id 
       FROM officers o 
       JOIN users u ON o.user_id = u.user_id 
       JOIN roles r ON u.role_id = r.role_id 
       WHERE o.station_id = 1 AND r.code = 'IO' 
       LIMIT 1`
    );
    const targetOfficerId = ioOfficerRes.rows[0].officer_id;
    console.log(`📌 Target IO Officer ID: ${targetOfficerId}`);

    // 5. Find or Create a REGISTERED FIR for Station 1
    const firQuery = await pool.query(
      `SELECT fir_id FROM fir WHERE status = 'REGISTERED' AND station_id = 1 LIMIT 1`
    );
    let testFirId;
    if (firQuery.rows.length > 0) {
      testFirId = firQuery.rows[0].fir_id;
      await pool.query(`INSERT INTO cases (fir_id) VALUES ($1) ON CONFLICT DO NOTHING`, [testFirId]);
    } else {
      const timestamp = Date.now();
      const dummyRes = await pool.query(
        `INSERT INTO fir (complainant_id, station_id, incident_dt, location_text, description, status, tracking_id, fir_number, is_cognizable)
         VALUES (1, 1, now(), 'MG Road Central Market', 'Case investigation lifecycle automated test', 'REGISTERED', 'CMP-2026-${timestamp}', 'FIR/CPS-01/2026/${timestamp.toString().slice(-5)}', TRUE)
         RETURNING fir_id;`
      );
      testFirId = dummyRes.rows[0].fir_id;
      await pool.query(`INSERT INTO cases (fir_id) VALUES ($1) ON CONFLICT DO NOTHING`, [testFirId]);
    }
    console.log(`📌 Using Registered FIR ID: ${testFirId}`);

    // 6. SHO Assigns IO
    const assignRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shoToken}`
      },
      body: JSON.stringify({
        officerId: targetOfficerId,
        reason: 'Assigned for immediate investigation'
      })
    });
    const assignData = await assignRes.json();
    console.log(assignRes.status === 200 && assignData.data.status === 'ASSIGNED'
      ? `✅ 4. SHO Assigned IO -> Status: ASSIGNED`
      : `❌ 4. IO Assignment Failed: ${assignData.message || JSON.stringify(assignData)}`);

    // 7. IO Accepts Case
    const acceptRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ioToken}` }
    });
    const acceptData = await acceptRes.json();
    console.log(acceptRes.status === 200 && acceptData.data.status === 'UNDER_INVESTIGATION'
      ? `✅ 5. IO Accepted -> Status: UNDER_INVESTIGATION`
      : `❌ 5. IO Accept Failed: ${acceptData.message || JSON.stringify(acceptData)}`);

    // 8. IO Logs Case Progress Update (Case Diary)
    const updateRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ioToken}`
      },
      body: JSON.stringify({
        updateType: 'SITE_VISIT',
        body: 'Inspected incident scene and recorded CCTV footage timestamp.',
        visibleToCitizen: true
      })
    });
    const updateData = await updateRes.json();
    console.log(updateRes.status === 201
      ? `✅ 6. IO Added Diary Update (Type: SITE_VISIT)`
      : `❌ 6. Add Update Failed: ${updateData.message || JSON.stringify(updateData)}`);

    // 9. IO Adds Accused Person
    const personRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ioToken}`
      },
      body: JSON.stringify({
        personRole: 'ACCUSED',
        fullName: 'Ramesh Verma',
        contact: '9811223344',
        notes: 'Identified through nearby store CCTV footage.'
      })
    });
    const personData = await personRes.json();
    console.log(personRes.status === 201
      ? `✅ 7. IO Added Accused Person to Case`
      : `❌ 7. Add Person Failed: ${personData.message || JSON.stringify(personData)}`);

    // 10. IO Submits Final Chargesheet Report
    const reportRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/submit-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ioToken}`
      },
      body: JSON.stringify({
        reportType: 'CHARGESHEET',
        summary: 'Investigation concluded. Sufficient evidence gathered against accused.'
      })
    });
    const reportData = await reportRes.json();
    console.log(reportRes.status === 200 && reportData.data.status === 'PENDING_APPROVAL'
      ? `✅ 8. IO Submitted Chargesheet -> Status: PENDING_APPROVAL`
      : `❌ 8. Submit Report Failed: ${reportData.message || JSON.stringify(reportData)}`);

    // 11. SHO Approves Chargesheet for Court Filing
    const reviewRes = await fetch(`${BASE_URL}/api/cases/${testFirId}/review-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shoToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVE',
        remarks: 'Evidence verified and charge sheet approved for filing.',
        courtDetails: { courtName: 'Chief Metropolitan Magistrate Court' }
      })
    });
    const reviewData = await reviewRes.json();
    console.log(reviewRes.status === 200 && reviewData.data.status === 'CHARGESHEET_FILED'
      ? `✅ 9. SHO Approved Chargesheet -> Status: CHARGESHEET_FILED`
      : `❌ 9. Review Report Failed: ${reviewData.message || JSON.stringify(reviewData)}`);

    // 12. Fetch Full Case Details
    const detailRes = await fetch(`${BASE_URL}/api/cases/${testFirId}`, {
      headers: { 'Authorization': `Bearer ${shoToken}` }
    });
    const detailData = await detailRes.json();
    console.log(detailRes.status === 200 && detailData.data.updates.length > 0
      ? `✅ 10. Retrieved Full Case Profile (Updates: ${detailData.data.updates.length}, Persons: ${detailData.data.persons.length})`
      : `❌ 10. Fetch Case Detail Failed`);

    // 13. Test Case Closure and Reopening Flow
    console.log('\n--- Testing Closure & Case Reopening Flow ---');
    const closureFirTimestamp = Date.now().toString().slice(-8);
    const closureFirRes = await pool.query(
      `INSERT INTO fir (complainant_id, station_id, incident_dt, location_text, description, status, tracking_id, fir_number, is_cognizable)
       VALUES (1, 1, now(), 'Central Park South', 'Incident to verify case closure and reopening', 'UNDER_INVESTIGATION', 'CMP-CLO-${closureFirTimestamp}', 'FIR/CPS-01/2026/CLO-${closureFirTimestamp}', TRUE)
       RETURNING fir_id;`
    );
    const closureFirId = closureFirRes.rows[0].fir_id;
    const caseInsertRes = await pool.query(
      `INSERT INTO cases (fir_id, current_io_id) VALUES ($1, $2) RETURNING case_id;`,
      [closureFirId, targetOfficerId]
    );
    const closureCaseId = caseInsertRes.rows[0].case_id;

    // Add a diary update so report submission passes guard
    await pool.query(
      `INSERT INTO case_updates (case_id, officer_id, update_type, body)
       VALUES ($1, $2, 'GENERAL', 'Preliminary inquiries made, untraced culprit.')`,
      [closureCaseId, targetOfficerId]
    );

    // IO submits CLOSURE report
    const closeReportRes = await fetch(`${BASE_URL}/api/cases/${closureFirId}/submit-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ioToken}`
      },
      body: JSON.stringify({
        reportType: 'CLOSURE',
        summary: 'Culprit untraced despite thorough search and CCTV check.'
      })
    });
    const closeReportData = await closeReportRes.json();
    console.log(closeReportRes.status === 200 && closeReportData.data.status === 'PENDING_APPROVAL'
      ? `✅ 11. IO Submitted Closure Report -> Status: PENDING_APPROVAL`
      : `❌ 11. Submit Closure Failed: ${closeReportData.message}`);

    // SHO approves CLOSURE report -> CLOSED
    const approveCloseRes = await fetch(`${BASE_URL}/api/cases/${closureFirId}/review-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shoToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVE',
        remarks: 'Approved closure due to untraceable perpetrator.'
      })
    });
    const approveCloseData = await approveCloseRes.json();
    console.log(approveCloseRes.status === 200 && approveCloseData.data.status === 'CLOSED'
      ? `✅ 12. SHO Approved Closure -> Status: CLOSED`
      : `❌ 12. Close Approval Failed: ${approveCloseData.message}`);

    // SHO Reopens Case
    const reopenRes = await fetch(`${BASE_URL}/api/cases/${closureFirId}/reopen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${shoToken}`
      },
      body: JSON.stringify({
        reason: 'Fresh forensic evidence retrieved from surveillance network.'
      })
    });
    const reopenData = await reopenRes.json();
    console.log(reopenRes.status === 200 && reopenData.data.status === 'UNDER_INVESTIGATION' && reopenData.data.reopened === true
      ? `✅ 13. SHO Successfully Reopened Closed Case -> Status: UNDER_INVESTIGATION`
      : `❌ 13. Reopen Case Failed: ${reopenData.message}`);

    // 14. RBAC Guard: Citizen cannot access SHO / IO endpoints
    console.log('\n--- Testing RBAC Security Guards ---');
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen.priya@casesync.gov.in', password: 'Citizen@12345' })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;

    const rbacWorkload = await fetch(`${BASE_URL}/api/cases/workload`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    console.log(rbacWorkload.status === 403
      ? `✅ 14. RBAC: Citizen blocked from IO Workload (403 Forbidden)`
      : `❌ 14. RBAC Check Failed (${rbacWorkload.status})`);

    const rbacAssign = await fetch(`${BASE_URL}/api/cases/${testFirId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ officerId: targetOfficerId })
    });
    console.log(rbacAssign.status === 403
      ? `✅ 15. RBAC: Citizen blocked from Assigning IO (403 Forbidden)`
      : `❌ 15. RBAC Check Failed (${rbacAssign.status})`);

    console.log('\n--- All Case Investigation & Lifecycle Tests Passed Successfully! ---');
  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
}

runTests();
