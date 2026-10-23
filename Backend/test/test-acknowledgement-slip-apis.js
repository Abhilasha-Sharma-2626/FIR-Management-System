require('dotenv').config();
const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const pool = require('../src/config/db');

const PORT = 5012;
const BASE_URL = `http://localhost:${PORT}`;

async function runAcknowledgementSlipTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 5: Complaint Acknowledgement & FIR Slip    ');
  console.log('=================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on ${BASE_URL}\n`);

  let adminToken, sho1Token, io1Token, desk1Token, citizen1Token, citizen2Token;
  let testFirId, trackingId, registeredFirNo;

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

    const adminLogin = await login('admin@casesync.gov.in', 'Admin@12345');
    adminToken = adminLogin.token;

    const shoLogin = await login('sho.central@casesync.gov.in', 'Officer@12345');
    sho1Token = shoLogin.token;
    assert(sho1Token, 'SHO login failed');
    console.log('✅ 1. Station 1 SHO Login Successful');

    const ioLogin = await login('io.central@casesync.gov.in', 'Officer@12345');
    io1Token = ioLogin.token;
    assert(io1Token, 'IO login failed');
    console.log('✅ 2. Station 1 IO Login Successful');

    const deskLogin = await login('desk.central@casesync.gov.in', 'Officer@12345');
    desk1Token = deskLogin.token;
    assert(desk1Token, 'Desk login failed');

    const cit1Login = await login('citizen.priya@casesync.gov.in', 'Citizen@12345');
    citizen1Token = cit1Login.token;
    assert(citizen1Token, 'Citizen 1 login failed');
    console.log('✅ 3. Citizen 1 (Complainant) Login Successful');

    const cit2Login = await login('citizen.rahul@casesync.gov.in', 'Citizen@12345');
    citizen2Token = cit2Login.token;
    assert(citizen2Token, 'Citizen 2 login failed');
    console.log('✅ 4. Citizen 2 (Cross-Citizen) Login Successful\n');

    // ---------------------------------------------------------
    // 2. Submit Initial Citizen Complaint
    // ---------------------------------------------------------
    const createRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        locationText: 'Central City Market, West Gate, Stall 12',
        descriptionText: 'Laptop bag with official documents and laptop stolen from vehicle boot.',
        incidentDt: new Date().toISOString(),
        priority: 1,
        submitImmediately: true
      })
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201, 'Complaint creation failed');
    testFirId = createData.data.fir_id;
    trackingId = createData.data.tracking_id;
    console.log(`✅ Test 1: Complaint Submitted (FIR ID: ${testFirId}, Tracking ID: ${trackingId}, Status: SUBMITTED)`);

    // ---------------------------------------------------------
    // 3. Complaint Intake Acknowledgement Slip Verification (Pre-Registration)
    // ---------------------------------------------------------
    // A. JSON format
    const ackRes = await fetch(`${BASE_URL}/api/complaints/${testFirId}/acknowledgement`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const ackData = await ackRes.json();
    assert.strictEqual(ackRes.status, 200, 'Acknowledgement retrieval failed');
    assert.strictEqual(ackData.data.documentType, 'COMPLAINT_INTAKE_ACKNOWLEDGEMENT');
    assert.strictEqual(ackData.data.trackingId, trackingId);
    assert.strictEqual(ackData.data.status, 'SUBMITTED');
    assert.strictEqual(ackData.data.firNumber, null, 'FIR number must be null before registration');
    assert.strictEqual(ackData.data.policeStation.code, 'CPS-01');
    assert.strictEqual(ackData.data.complainant.fullName, 'Priya Sharma');
    assert(ackData.data.disclaimer.includes('Section 173(2) BNSS'), 'Disclaimer must reference statutory provisions');
    assert.strictEqual(ackData.data.digitalSeal.verificationDigest.length, 64, 'Digital seal must be SHA-256 (64 hex characters)');
    console.log(`✅ Test 2: Pre-Registration Acknowledgement Slip Verified (Type: ${ackData.data.documentType}, Seal: ${ackData.data.digitalSeal.verificationDigest.substring(0, 16)}...)`);

    // B. Query by Tracking ID
    const ackByTrackingRes = await fetch(`${BASE_URL}/api/complaints/${trackingId}/acknowledgement`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.strictEqual(ackByTrackingRes.status, 200, 'Query by trackingId failed');
    console.log('✅ Test 3: Acknowledgement queryable seamlessly via Tracking ID');

    // C. HTML printable view
    const htmlRes = await fetch(`${BASE_URL}/api/complaints/${testFirId}/acknowledgement?format=html`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const htmlText = await htmlRes.text();
    assert.strictEqual(htmlRes.status, 200);
    assert(htmlRes.headers.get('content-type').includes('text/html'));
    assert(htmlText.includes('State Police Department'));
    assert(htmlText.includes(trackingId));
    assert(htmlText.includes('Digital Verification Seal'));
    console.log('✅ Test 4: Print-Ready HTML Acknowledgement Slip Rendered Successfully');

    // ---------------------------------------------------------
    // 4. Advance Case: Desk Review, Legal Sections, SHO FIR Registration & IO Assignment
    // ---------------------------------------------------------
    // A. Desk review
    await fetch(`${BASE_URL}/api/firs/${testFirId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${desk1Token}` }
    });

    // B. Tag legal section (BNS 303(2) - Theft)
    await fetch(`${BASE_URL}/api/firs/${testFirId}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${desk1Token}`
      },
      body: JSON.stringify({ sectionIds: [1], isCognizable: true })
    });

    // C. SHO approves and registers FIR
    const regRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/register`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 200, 'FIR Registration failed');
    registeredFirNo = regData.data.fir.fir_number;
    console.log(`✅ Test 5: FIR Registered by SHO (FIR Number: ${registeredFirNo})`);

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
        reason: 'Assigned for immediate CCTV seizure and forensic examination'
      })
    });
    console.log('✅ Test 6: IO Assigned to Registered Case');

    // ---------------------------------------------------------
    // 5. Official FIR Slip Verification (Post-Registration)
    // ---------------------------------------------------------
    // A. Complainant fetches official FIR slip
    const firSlipRes = await fetch(`${BASE_URL}/api/complaints/${testFirId}/acknowledgement`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const firSlipData = await firSlipRes.json();
    assert.strictEqual(firSlipRes.status, 200);
    assert.strictEqual(firSlipData.data.documentType, 'OFFICIAL_FIR_SLIP');
    assert.strictEqual(firSlipData.data.firNumber, registeredFirNo);
    assert.strictEqual(firSlipData.data.status, 'ASSIGNED');
    assert(firSlipData.data.legalSections.length > 0, 'Legal sections must be populated');
    assert.strictEqual(firSlipData.data.legalSections[0].act, 'BNS');
    assert.strictEqual(firSlipData.data.legalSections[0].section_no, '303(2)');
    assert(firSlipData.data.investigation !== null, 'Investigation section must be populated');
    assert.strictEqual(firSlipData.data.investigation.assignedIoName, 'Sub-Inspector Vikram Singh');
    console.log(`✅ Test 7: Official FIR Slip Verified (Type: ${firSlipData.data.documentType}, Section: BNS 303(2), IO: ${firSlipData.data.investigation.assignedIoName})`);

    // B. Police Officer fetches slip via alias endpoint /api/firs/:id/slip
    const officerSlipRes = await fetch(`${BASE_URL}/api/firs/${testFirId}/slip`, {
      headers: { Authorization: `Bearer ${sho1Token}` }
    });
    const officerSlipData = await officerSlipRes.json();
    assert.strictEqual(officerSlipRes.status, 200, 'Officer access to FIR slip failed');
    assert.strictEqual(officerSlipData.data.firNumber, registeredFirNo);
    console.log('✅ Test 8: Police Officer accessed FIR Slip via /api/firs/:id/slip');

    // ---------------------------------------------------------
    // 6. Access Control & Scoping Guards
    // ---------------------------------------------------------
    // A. Cross-citizen access blocked (Citizen 2 blocked from Citizen 1 slip)
    const crossSlipRes = await fetch(`${BASE_URL}/api/complaints/${testFirId}/acknowledgement`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    assert.strictEqual(crossSlipRes.status, 403, 'Cross-citizen slip access must return 403 Forbidden');
    console.log('✅ Test 9: Scoping Guard (Citizen 2 blocked from Citizen 1 FIR slip -> 403 Forbidden)');

    // B. Non-existent complaint returns 404
    const notFoundRes = await fetch(`${BASE_URL}/api/complaints/999999/acknowledgement`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent slip must return 404');
    console.log('✅ Test 10: 404 Not Found Guard (Non-existent slip query returns 404)');

    // ---------------------------------------------------------
    // 7. Cryptographic SHA-256 Audit Chain Verification
    // ---------------------------------------------------------
    const auditRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert.strictEqual(auditData.isValid, true, 'Audit log cryptographic hash chain must remain valid');
    console.log(`✅ Test 11: Tamper-Evident SHA-256 Audit Chain Verified (Records: ${auditData.totalRecords}, Chain Valid: ${auditData.isValid})`);

    console.log('\n=================================================================');
    console.log('   Workflow 5: Complaint Acknowledgement & FIR Slip PASSED       ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ Workflow 5 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runAcknowledgementSlipTests();
