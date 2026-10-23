require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_PORT = 5005;
const BASE_URL = `http://localhost:${TEST_PORT}`;

let server;

function logResult(step, status, details = '') {
  const icon = status ? '✅ [PASS]' : '❌ [FAIL]';
  console.log(`${icon} ${step} ${details ? `-> ${details}` : ''}`);
}

async function runTests() {
  console.log('=================================================================');
  console.log('   Evidence Management & Chain of Custody Test Suite (FR-E1..E6)');
  console.log('=================================================================\n');

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

  server = app.listen(TEST_PORT);

  try {
    // 1. Log in SHO
    const shoLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sho.central@casesync.gov.in', password: 'Officer@12345' })
    });
    const shoData = await shoLogin.json();
    const shoToken = shoData.data?.token;
    assert(!!shoToken, '1. SHO Authentication');

    // 2. Log in IO
    const ioLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'io.central@casesync.gov.in', password: 'Officer@12345' })
    });
    const ioData = await ioLogin.json();
    const ioToken = ioData.data?.token;
    const ioOfficerId = ioData.data?.user?.officerId;
    assert(!!ioToken, '2. Investigating Officer (IO) Authentication');

    // 3. Log in Citizen
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen.priya@casesync.gov.in', password: 'Citizen@12345' })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;
    assert(!!citizenToken, '3. Citizen Authentication');

    // 4. Ensure an active case under investigation exists for IO
    let caseRes = await pool.query(
      `SELECT c.case_id, f.fir_number
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE c.current_io_id = $1 AND f.status = 'UNDER_INVESTIGATION'
       LIMIT 1`,
      [ioOfficerId]
    );

    let testCaseId;
    let testFirNo;

    if (caseRes.rows.length > 0) {
      testCaseId = caseRes.rows[0].case_id;
      testFirNo = caseRes.rows[0].fir_number;
    } else {
      const ts = Date.now();
      const insertFir = await pool.query(
        `INSERT INTO fir (complainant_id, station_id, incident_dt, location_text, description, status, tracking_id, fir_number, is_cognizable)
         VALUES (1, 1, now(), 'Market Area Sector 17', 'Evidence test case', 'UNDER_INVESTIGATION', 'CMP-2026-${ts}', 'FIR/CPS-01/2026/${ts.toString().slice(-5)}', TRUE)
         RETURNING fir_id, fir_number;`
      );
      const insertCase = await pool.query(
        `INSERT INTO cases (fir_id, current_io_id, investigation_started_at)
         VALUES ($1, $2, now())
         RETURNING case_id;`,
        [insertFir.rows[0].fir_id, ioOfficerId]
      );
      testCaseId = insertCase.rows[0].case_id;
      testFirNo = insertFir.rows[0].fir_number;
    }

    console.log(`📌 Using Active Case ID: ${testCaseId} (FIR: ${testFirNo})\n`);

    // -------------------------------------------------------------
    // TEST 5: Add Physical Evidence (Weapon / No file)
    // -------------------------------------------------------------
    const addPhysicalRes = await fetch(`${BASE_URL}/api/cases/${testCaseId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ioToken}`
      },
      body: JSON.stringify({
        evidenceType: 'WEAPON',
        description: 'Recovered silver metallic folding knife, 6-inch blade',
        locationStored: 'Station Evidence Locker A-12',
        collectedAt: new Date().toISOString()
      })
    });
    const addPhysicalData = await addPhysicalRes.json();
    const physicalEvidence = addPhysicalData.data;

    assert(
      addPhysicalRes.status === 201 &&
      physicalEvidence?.evidence_no &&
      physicalEvidence?.status === 'COLLECTED',
      'Test 5: POST /api/cases/:id/evidence (Physical Weapon Evidence logged)',
      physicalEvidence ? `Evidence No: ${physicalEvidence.evidence_no}` : ''
    );

    // -------------------------------------------------------------
    // TEST 6: Add Digital Evidence with File Attachment & SHA-256
    // -------------------------------------------------------------
    // Create temporary test file for upload
    const tempDir = path.join(__dirname, '../uploads/test-scratch');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const sampleFilePath = path.join(tempDir, 'test_cctv_frame.png');
    fs.writeFileSync(sampleFilePath, 'DUMMY_IMAGE_BINARY_CONTENT_FOR_HASH_VERIFICATION_TEST');

    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fileContent = fs.readFileSync(sampleFilePath);

    let bodyBuffer = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="evidenceType"\r\n\r\nDIGITAL\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nCCTV Surveillance Footage Frame outside storefront\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="locationStored"\r\n\r\nSecure Digital Evidence Vault Server 01\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_cctv_frame.png"\r\nContent-Type: image/png\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const addDigitalRes = await fetch(`${BASE_URL}/api/cases/${testCaseId}/evidence`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${ioToken}`
      },
      body: bodyBuffer
    });
    const addDigitalData = await addDigitalRes.json();
    const digitalEvidence = addDigitalData.data;

    assert(
      addDigitalRes.status === 201 &&
      digitalEvidence?.file_sha256 &&
      digitalEvidence.file_sha256.length === 64,
      'Test 6: POST /api/cases/:id/evidence (Digital Evidence with SHA-256 computed)',
      digitalEvidence ? `SHA-256: ${digitalEvidence.file_sha256}` : ''
    );

    // Clean up temporary test file
    try { fs.unlinkSync(sampleFilePath); } catch (e) {}

    // -------------------------------------------------------------
    // TEST 7: Cryptographic File Integrity Verification (FR-E6)
    // -------------------------------------------------------------
    if (digitalEvidence?.evidence_id) {
      const verifyRes = await fetch(`${BASE_URL}/api/evidence/${digitalEvidence.evidence_id}/verify`, {
        headers: { 'Authorization': `Bearer ${shoToken}` }
      });
      const verifyData = await verifyRes.json();

      assert(
        verifyRes.status === 200 &&
        verifyData.data?.isValid === true &&
        verifyData.data?.computedHash === digitalEvidence.file_sha256,
        'Test 7: GET /api/evidence/:id/verify (SHA-256 File Integrity Verified)',
        verifyData.data?.message
      );
    }

    // -------------------------------------------------------------
    // TEST 8: Transfer Custody to Malkhana / Station SHO (FR-E3)
    // -------------------------------------------------------------
    const shoOfficerRes = await pool.query(
      `SELECT o.officer_id FROM officers o JOIN users u ON o.user_id = u.user_id WHERE u.email = 'sho.central@casesync.gov.in'`
    );
    const shoOfficerId = shoOfficerRes.rows[0]?.officer_id;

    if (physicalEvidence?.evidence_id && shoOfficerId) {
      const transferRes = await fetch(`${BASE_URL}/api/evidence/${physicalEvidence.evidence_id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ioToken}`
        },
        body: JSON.stringify({
          toHolderId: shoOfficerId,
          purpose: 'Secure Storage in Police Station Malkhana',
          newStatus: 'IN_STORAGE',
          locationStored: 'Central Malkhana Secure Vault, Shelf 3',
          remarks: 'Handed over by IO to Station Malkhana In-Charge'
        })
      });
      const transferData = await transferRes.json();

      assert(
        transferRes.status === 200 &&
        transferData.data?.status === 'IN_STORAGE' &&
        transferData.data?.current_holder_id === shoOfficerId,
        'Test 8: POST /api/evidence/:id/transfer (Handover to Malkhana Storage)',
        transferData.data ? `New Status: ${transferData.data.status}` : ''
      );
    }

    // -------------------------------------------------------------
    // TEST 9: View Detailed Evidence & Full Custody Chain Timeline
    // -------------------------------------------------------------
    if (physicalEvidence?.evidence_id) {
      const detailsRes = await fetch(`${BASE_URL}/api/evidence/${physicalEvidence.evidence_id}`, {
        headers: { 'Authorization': `Bearer ${shoToken}` }
      });
      const detailsData = await detailsRes.json();
      const custodyChain = detailsData.data?.custodyChain;

      assert(
        detailsRes.status === 200 &&
        Array.isArray(custodyChain) &&
        custodyChain.length >= 2,
        'Test 9: GET /api/evidence/:id (Complete Chain of Custody History retrieved)',
        custodyChain ? `${custodyChain.length} chronological handover events` : ''
      );
    }

    // -------------------------------------------------------------
    // TEST 10: Unauthorized Custody Transfer Guard (Citizen rejected)
    // -------------------------------------------------------------
    if (physicalEvidence?.evidence_id) {
      const unauthRes = await fetch(`${BASE_URL}/api/evidence/${physicalEvidence.evidence_id}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${citizenToken}`
        },
        body: JSON.stringify({
          toHolderId: 1,
          purpose: 'Unauthorized attempt',
          newStatus: 'RETURNED'
        })
      });

      assert(
        unauthRes.status === 403,
        'Test 10: Unauthorized Transfer Guard (Citizen blocked with 403 Forbidden)'
      );
    }

    // -------------------------------------------------------------
    // TEST 11: List all evidence items for Case
    // -------------------------------------------------------------
    const caseEvidenceRes = await fetch(`${BASE_URL}/api/cases/${testCaseId}/evidence`, {
      headers: { 'Authorization': `Bearer ${ioToken}` }
    });
    const caseEvidenceData = await caseEvidenceRes.json();

    assert(
      caseEvidenceRes.status === 200 &&
      Array.isArray(caseEvidenceData.data) &&
      caseEvidenceData.data.length >= 2,
      'Test 11: GET /api/cases/:caseId/evidence (All case exhibits listed)',
      caseEvidenceData.data ? `Total Exhibits: ${caseEvidenceData.data.length}` : ''
    );

    console.log('\n=================================================================');
    console.log(`   Evidence Management Tests Finished: ${passed} Passed, ${failed} Failed`);
    console.log('=================================================================\n');

  } catch (err) {
    console.error('Test Suite Exception:', err);
  } finally {
    if (server) server.close();
    await pool.end();
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
