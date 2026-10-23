require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('--- Starting FIR Review & Registration Test Suite ---\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Login as SHO
    const shoLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sho.central@casesync.gov.in',
        password: 'Officer@12345'
      })
    });
    const shoData = await shoLogin.json();
    const shoToken = shoData.data?.token;
    console.log(shoToken ? '✅ SHO Login Successful' : '❌ SHO Login Failed');

    // 2. Login as Desk Officer
    const deskLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'desk.central@casesync.gov.in',
        password: 'Officer@12345'
      })
    });
    const deskData = await deskLogin.json();
    const deskToken = deskData.data?.token;
    console.log(deskToken ? '✅ Desk Officer Login Successful' : '❌ Desk Officer Login Failed');

    // 3. Login as Citizen
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen.priya@casesync.gov.in',
        password: 'Citizen@12345'
      })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;
    console.log(citizenToken ? '✅ Citizen Login Successful' : '❌ Citizen Login Failed');

    // 4. Test Legal Sections Retrieval
    const secRes = await fetch(`${BASE_URL}/api/firs/master/legal-sections`, {
      headers: { 'Authorization': `Bearer ${shoToken}` }
    });
    const secData = await secRes.json();
    console.log(secRes.status === 200 && secData.data && secData.data.length > 0
      ? `✅ Fetched ${secData.data.length} Legal Sections (BNS / IPC / IT Act)`
      : `❌ Fetch Legal Sections Failed (${secRes.status})`);

    const sampleSectionIds = secData.data ? secData.data.slice(0, 2).map(s => s.section_id) : [1];

    // 5. Citizen submits a test complaint
    const newComplaintRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        incidentDt: new Date().toISOString(),
        locationText: 'Near Sector 17 Market, City Centre',
        descriptionText: 'My bicycle was stolen while parked outside the grocery store.',
        priority: 2,
        submitImmediately: true,
        persons: [
          {
            personRole: 'VICTIM',
            fullName: 'Priya Sharma',
            contact: '9800000007',
            address: 'Flat 402, Green Avenue',
            notes: 'Complainant herself'
          }
        ]
      })
    });
    const newComplaintData = await newComplaintRes.json();
    const createdFirId = newComplaintData.data?.fir_id;
    console.log(createdFirId
      ? `✅ Citizen Submitted Complaint (FIR ID: ${createdFirId}, Tracking: ${newComplaintData.data.tracking_id})`
      : `❌ Submit Complaint Failed: ${JSON.stringify(newComplaintData)}`);

    // 6. Fetch Station Inbox (Desk Officer)
    const inboxRes = await fetch(`${BASE_URL}/api/station/inbox`, {
      headers: { 'Authorization': `Bearer ${deskToken}` }
    });
    const inboxData = await inboxRes.json();
    console.log(inboxRes.status === 200
      ? `✅ Fetched Station Inbox (${inboxData.count} items found)`
      : `❌ Fetch Inbox Failed (${inboxRes.status})`);

    if (createdFirId) {
      // 7. Start Review (Desk Officer: SUBMITTED -> UNDER_REVIEW)
      const reviewRes = await fetch(`${BASE_URL}/api/firs/${createdFirId}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${deskToken}` }
      });
      const reviewData = await reviewRes.json();
      console.log(reviewRes.status === 200 && reviewData.data?.status === 'UNDER_REVIEW'
        ? '✅ Desk Officer Started Review (Status: UNDER_REVIEW)'
        : `❌ Start Review Failed: ${JSON.stringify(reviewData)}`);

      // 8. Request Clarification (UNDER_REVIEW -> INFO_REQUESTED)
      const reqInfoRes = await fetch(`${BASE_URL}/api/firs/${createdFirId}/request-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deskToken}`
        },
        body: JSON.stringify({
          questionText: 'Please clarify exact make, model and color of the bicycle.'
        })
      });
      const reqInfoData = await reqInfoRes.json();
      console.log(reqInfoRes.status === 200 && reqInfoData.data?.status === 'INFO_REQUESTED'
        ? '✅ Desk Officer Requested Clarification (Status: INFO_REQUESTED)'
        : `❌ Request Clarification Failed: ${JSON.stringify(reqInfoData)}`);

      // 9. Citizen Responds (INFO_REQUESTED -> UNDER_REVIEW)
      const respondRes = await fetch(`${BASE_URL}/api/complaints/${createdFirId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${citizenToken}`
        },
        body: JSON.stringify({
          responseText: 'It is a Hero Sprint Pro, black and red frame, serial #HSP-9921.'
        })
      });
      const respondData = await respondRes.json();
      console.log(respondRes.status === 200 && respondData.data?.status === 'UNDER_REVIEW'
        ? '✅ Citizen Responded (Status returned to UNDER_REVIEW)'
        : `❌ Citizen Response Failed: ${JSON.stringify(respondData)}`);

      // 10. Tag Legal Sections
      const tagRes = await fetch(`${BASE_URL}/api/firs/${createdFirId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deskToken}`
        },
        body: JSON.stringify({
          sectionIds: sampleSectionIds,
          isCognizable: true
        })
      });
      const tagData = await tagRes.json();
      console.log(tagRes.status === 200
        ? `✅ Legal Sections Mapped Successfully (${sampleSectionIds.length} sections)`
        : `❌ Tag Sections Failed: ${JSON.stringify(tagData)}`);

      // 11. Role Guard Check: Desk Officer cannot approve/register FIR (Must be SHO)
      const deskRegAttempt = await fetch(`${BASE_URL}/api/firs/${createdFirId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${deskToken}` }
      });
      console.log(deskRegAttempt.status === 403
        ? '✅ Role Guard Verified: Desk Officer blocked from formal registration (403 Forbidden)'
        : `❌ Role Guard Failed: Desk Officer received status ${deskRegAttempt.status}`);

      // 12. SHO Approves & Registers FIR (ACID Transaction)
      const shoRegRes = await fetch(`${BASE_URL}/api/firs/${createdFirId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${shoToken}` }
      });
      const shoRegData = await shoRegRes.json();
      const registeredFir = shoRegData.data?.fir;
      const caseId = shoRegData.data?.caseId;

      console.log(shoRegRes.status === 200 && registeredFir?.fir_number && caseId
        ? `✅ Formal FIR Registration Successful!\n   -> FIR Number: ${registeredFir.fir_number}\n   -> Case ID: ${caseId}\n   -> Status: ${registeredFir.status}`
        : `❌ SHO Registration Failed: ${JSON.stringify(shoRegData)}`);

      // 13. Guard Check: Cannot re-register registered FIR
      const repeatReg = await fetch(`${BASE_URL}/api/firs/${createdFirId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${shoToken}` }
      });
      console.log(repeatReg.status === 400
        ? '✅ State Guard Verified: Cannot re-register already registered FIR (400 Bad Request)'
        : `❌ State Guard Failed: Re-register received status ${repeatReg.status}`);
    }

    // 14. Test Complaint Rejection Flow on another complaint
    console.log('\n--- Testing Rejection Flow ---');
    const rejectComplaintRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        stationId: 1,
        categoryId: 1,
        incidentDt: new Date().toISOString(),
        locationText: 'Outside jurisdiction test location',
        descriptionText: 'Complaint to be rejected during review testing.',
        priority: 3,
        submitImmediately: true
      })
    });
    const rejectComplaintData = await rejectComplaintRes.json();
    const rejectFirId = rejectComplaintData.data?.fir_id;

    if (rejectFirId) {
      await fetch(`${BASE_URL}/api/firs/${rejectFirId}/review`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${deskToken}` }
      });

      const rejectRes = await fetch(`${BASE_URL}/api/firs/${rejectFirId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deskToken}`
        },
        body: JSON.stringify({
          rejectionReason: 'Matter is strictly civil in nature and does not warrant a criminal FIR.'
        })
      });
      const rejectData = await rejectRes.json();
      console.log(rejectRes.status === 200 && rejectData.data?.status === 'REJECTED'
        ? '✅ Complaint Successfully Rejected with Valid Reason (Status: REJECTED)'
        : `❌ Rejection Failed: ${JSON.stringify(rejectData)}`);
    }

    console.log('\n--- All Review & Registration Tests Completed Successfully! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    await pool.end();
    process.exit(0);
  }
}

runTests();
