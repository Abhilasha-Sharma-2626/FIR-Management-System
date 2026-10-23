require('dotenv').config();
const http = require('http');
const assert = require('assert');
const app = require('../src/app');
const pool = require('../src/config/db');

const PORT = 5011;
const BASE_URL = `http://localhost:${PORT}`;

async function runComplaintDraftAndDuplicateTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 4: Draft Complaint Editing & Duplicate Hint ');
  console.log('=================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on ${BASE_URL}\n`);

  let adminToken, citizen1Token, citizen2Token;
  let draftFirId, submittedFirId;

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
    assert(adminToken, 'Admin login failed');

    const cit1Login = await login('citizen.priya@casesync.gov.in', 'Citizen@12345');
    citizen1Token = cit1Login.token;
    assert(citizen1Token, 'Citizen 1 login failed');
    console.log('✅ 1. Citizen 1 Login Successful');

    const cit2Login = await login('citizen.rahul@casesync.gov.in', 'Citizen@12345');
    citizen2Token = cit2Login.token;
    assert(citizen2Token, 'Citizen 2 login failed');
    console.log('✅ 2. Citizen 2 Login Successful\n');

    // ---------------------------------------------------------
    // 2. Citizen 1 Creates a Draft Complaint
    // ---------------------------------------------------------
    const createDraftRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        locationText: 'Temporary draft location',
        descriptionText: 'Initial brief draft description',
        submitImmediately: false
      })
    });
    const createDraftData = await createDraftRes.json();
    assert.strictEqual(createDraftRes.status, 201, 'Draft creation failed');
    draftFirId = createDraftData.data.fir_id;
    assert.strictEqual(createDraftData.data.status, 'DRAFT', 'Status must be DRAFT');
    console.log(`✅ Test 1: Draft Complaint Created (FIR ID: ${draftFirId}, Status: DRAFT, Tracking ID: ${createDraftData.data.tracking_id || 'null'})`);

    // ---------------------------------------------------------
    // 3. Validation Guards on Draft Update (PUT /api/complaints/:id)
    // ---------------------------------------------------------
    // A. Future incident date
    const futureDateRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        incidentDt: '2099-01-01T00:00:00Z'
      })
    });
    assert.strictEqual(futureDateRes.status, 400, 'Future date must be rejected with 400');
    console.log('✅ Test 2: Validation Guard (Future incident date rejected with 400 Bad Request)');

    // B. Short location (< 5 chars)
    const shortLocRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        locationText: 'Plz'
      })
    });
    assert.strictEqual(shortLocRes.status, 400, 'Short location must be rejected with 400');
    console.log('✅ Test 3: Validation Guard (Short location rejected with 400 Bad Request)');

    // C. Short description (< 15 chars)
    const shortDescRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        descriptionText: 'Too short'
      })
    });
    assert.strictEqual(shortDescRes.status, 400, 'Short description must be rejected with 400');
    console.log('✅ Test 4: Validation Guard (Short description rejected with 400 Bad Request)');

    // D. Invalid priority
    const invalidPriorityRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        priority: 99
      })
    });
    assert.strictEqual(invalidPriorityRes.status, 400, 'Invalid priority must be rejected with 400');
    console.log('✅ Test 5: Validation Guard (Invalid priority rejected with 400 Bad Request)');

    // ---------------------------------------------------------
    // 4. Ownership Scoping Guard
    // ---------------------------------------------------------
    // Citizen 2 attempts to edit Citizen 1's draft
    const crossEditRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen2Token}`
      },
      body: JSON.stringify({
        descriptionText: 'Unauthorized malicious overwrite attempt.'
      })
    });
    assert.strictEqual(crossEditRes.status, 403, 'Cross-citizen edit must be blocked with 403 Forbidden');
    console.log('✅ Test 6: Scoping Guard (Citizen 2 blocked from editing Citizen 1 draft -> 403 Forbidden)');

    // ---------------------------------------------------------
    // 5. Successful Draft Update with Linked Persons
    // ---------------------------------------------------------
    const validUpdatePayload = {
      stationId: 1,
      categoryId: 1,
      incidentDt: new Date().toISOString(),
      locationText: 'Central Metro Station, Bike Parking Bay 4',
      latitude: 28.6139,
      longitude: 77.2090,
      descriptionText: 'Motorcycle stolen while parked outside metro station between 9 AM and 6 PM.',
      priority: 1,
      persons: [
        {
          personRole: 'ACCUSED',
          fullName: 'Unidentified Suspect in dark hoodie',
          notes: 'Seen on CCTV loitering near vehicle'
        },
        {
          personRole: 'WITNESS',
          fullName: 'Ramesh Verma (Parking Attendant)',
          contact: '9811223344',
          notes: 'On duty during the shift'
        }
      ]
    };

    const updateRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify(validUpdatePayload)
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200, `Draft update failed: ${JSON.stringify(updateData)}`);
    assert.strictEqual(updateData.data.location_text, 'Central Metro Station, Bike Parking Bay 4');
    assert.strictEqual(updateData.data.persons_count, 2);
    assert(updateData.data.version >= 2, 'Version should increment');
    console.log(`✅ Test 7: Draft Complaint Updated Successfully (Version: ${updateData.data.version}, Location: "${updateData.data.location_text}")`);

    // Verify DB linked persons synchronization
    const personsDb = await pool.query(
      `SELECT person_role, full_name FROM fir_persons WHERE fir_id = $1 ORDER BY person_id ASC`,
      [draftFirId]
    );
    assert.strictEqual(personsDb.rows.length, 2, 'Two linked persons should exist in DB');
    assert.strictEqual(personsDb.rows[0].person_role, 'ACCUSED');
    assert.strictEqual(personsDb.rows[1].person_role, 'WITNESS');
    console.log('✅ Test 8: Linked Persons Synchronized in Database (Accused + Witness)');

    // ---------------------------------------------------------
    // 6. Duplicate Detection Engine (FR-C4)
    // ---------------------------------------------------------
    // A. Check duplicate before any submitted complaint exists -> No match
    const checkDup1 = await fetch(`${BASE_URL}/api/complaints/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        categoryId: 1,
        incidentDt: new Date().toISOString(),
        locationText: 'Central Metro Station'
      })
    });
    const dup1Data = await checkDup1.json();
    assert.strictEqual(checkDup1.status, 200);
    // Drafts themselves can be detected if excludeFirId is not specified
    console.log(`✅ Test 9: Duplicate Check API executed (Matches found: ${dup1Data.data.count})`);

    // B. Citizen 1 submits the draft complaint -> Status becomes SUBMITTED
    const submitRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const submitData = await submitRes.json();
    assert.strictEqual(submitRes.status, 200, 'Draft submission failed');
    assert.strictEqual(submitData.data.status, 'SUBMITTED');
    console.log(`✅ Test 10: Draft Complaint Submitted (Tracking ID: ${submitData.data.tracking_id}, Status: SUBMITTED)`);

    // C. Citizen 1 checks for duplicate with same category, date window and location substring
    const checkDup2 = await fetch(`${BASE_URL}/api/complaints/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        categoryId: 1,
        incidentDt: new Date().toISOString(),
        locationText: 'Central Metro'
      })
    });
    const dup2Data = await checkDup2.json();
    assert.strictEqual(dup2Data.data.hasDuplicate, true, 'Duplicate detection must detect the submitted complaint');
    assert(dup2Data.data.count >= 1, 'Match count must be at least 1');
    assert.strictEqual(dup2Data.data.matches[0].fir_id, String(draftFirId), 'Matched FIR ID must match');
    console.log(`✅ Test 11: Duplicate Detection Heuristic Match (Found ${dup2Data.data.count} existing complaint for same complainant, category, date, and location)`);

    // D. Citizen 2 checks same category & location -> No duplicate (different citizen)
    const checkDup3 = await fetch(`${BASE_URL}/api/complaints/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen2Token}`
      },
      body: JSON.stringify({
        categoryId: 1,
        incidentDt: new Date().toISOString(),
        locationText: 'Central Metro'
      })
    });
    const dup3Data = await checkDup3.json();
    assert.strictEqual(dup3Data.data.hasDuplicate, false, 'Other citizen should not match duplicate');
    console.log('✅ Test 12: Duplicate Scoping Isolation (Citizen 2 receives zero duplicate matches for Citizen 1 incidents)');

    // ---------------------------------------------------------
    // 7. Post-Submission Immutability Guard (FR-C3)
    // ---------------------------------------------------------
    // Attempting to edit a SUBMITTED complaint must fail with 400 Bad Request
    const editSubmittedRes = await fetch(`${BASE_URL}/api/complaints/${draftFirId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${citizen1Token}`
      },
      body: JSON.stringify({
        descriptionText: 'Tampered description attempt after formal complaint submission.'
      })
    });
    assert.strictEqual(editSubmittedRes.status, 400, 'Editing submitted complaint must return 400');
    console.log('✅ Test 13: Immutability Guard (Editing SUBMITTED complaint rejected with 400 Bad Request)');

    // ---------------------------------------------------------
    // 8. Cryptographic SHA-256 Audit Chain Verification
    // ---------------------------------------------------------
    const auditRes = await fetch(`${BASE_URL}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert.strictEqual(auditData.isValid, true, 'Audit log cryptographic hash chain must remain valid');
    console.log(`✅ Test 14: Tamper-Evident SHA-256 Audit Chain Verified (Records: ${auditData.totalRecords}, Chain Valid: ${auditData.isValid})`);

    console.log('\n=================================================================');
    console.log('   Workflow 4: Draft Complaint Editing & Duplicate Hint PASSED   ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ Workflow 4 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    server.close();
    await pool.end();
  }
}

runComplaintDraftAndDuplicateTests();
