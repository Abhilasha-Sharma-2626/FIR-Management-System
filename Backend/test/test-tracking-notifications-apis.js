require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');

const TEST_PORT = 5006;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('=================================================================');
  console.log('   Feature 5: Citizen Tracking, Timeline & Notifications Test   ');
  console.log('=================================================================\n');

  const server = app.listen(TEST_PORT);
  let passedCount = 0;
  let failedCount = 0;

  try {
    // 1. Authenticate Citizen
    const citizenLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'citizen.priya@casesync.gov.in', password: 'Citizen@12345' })
    });
    const citizenData = await citizenLogin.json();
    const citizenToken = citizenData.data?.token;
    const citizenId = citizenData.data?.user?.citizenId;
    const citizenUserId = citizenData.data?.user?.userId;

    if (citizenToken) {
      console.log('✅ [PASS] 1. Citizen Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 1. Citizen Authentication');
      failedCount++;
    }

    // 2. Authenticate SHO
    const shoLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sho.central@casesync.gov.in', password: 'Officer@12345' })
    });
    const shoData = await shoLogin.json();
    const shoToken = shoData.data?.token;

    if (shoToken) {
      console.log('✅ [PASS] 2. SHO Authentication');
      passedCount++;
    } else {
      console.log('❌ [FAIL] 2. SHO Authentication');
      failedCount++;
    }

    // 3. Find or create an FIR with tracking ID belonging to Citizen
    let testFirRes = await pool.query(
      `SELECT fir_id, tracking_id, fir_number, status, complainant_id 
       FROM fir 
       WHERE complainant_id = $1 
       ORDER BY fir_id DESC LIMIT 1`,
      [citizenId]
    );

    let testFir;
    if (testFirRes.rows.length === 0) {
      // Create a test FIR for Priya
      const newFir = await pool.query(
        `INSERT INTO fir (
           tracking_id, fir_number, complainant_id, station_id, incident_dt,
           location_text, description, status, priority, is_cognizable
         ) VALUES (
           'CMP-2026-TEST01', 'FIR/CPS-01/2026/TEST01', $1, 1, NOW(),
           'MG Road, Central', 'Theft of bicycle', 'CLOSED', 2, TRUE
         ) RETURNING fir_id, tracking_id, fir_number, status, complainant_id`,
        [citizenId]
      );
      testFir = newFir.rows[0];

      // Add status history
      await pool.query(
        `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
         VALUES ($1, 'REGISTERED', 'CLOSED', 1, 'Case investigation completed and verified')`,
        [testFir.fir_id]
      );
    } else {
      testFir = testFirRes.rows[0];
    }

    console.log(`📌 Using Test FIR ID: ${testFir.fir_id} (Tracking: ${testFir.tracking_id})`);

    // 4. Test Public Tracking Lookup (Sanitized & Redacted)
    const publicTrackRes = await fetch(`${BASE_URL}/api/track/${testFir.tracking_id}`);
    const publicTrackData = await publicTrackRes.json();

    if (
      publicTrackRes.status === 200 &&
      publicTrackData.success === true &&
      publicTrackData.data?.trackingId === testFir.tracking_id &&
      !publicTrackData.data?.complainant_phone &&
      !publicTrackData.data?.accused
    ) {
      console.log('✅ [PASS] Test 4: Public Tracking Lookup (PII safely redacted)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 4: Public Tracking Lookup (${publicTrackRes.status})`);
      failedCount++;
    }

    // 5. Test Authenticated Case Timeline
    const timelineRes = await fetch(`${BASE_URL}/api/tracking/firs/${testFir.fir_id}/timeline`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const timelineData = await timelineRes.json();

    if (timelineRes.status === 200 && timelineData.success === true && Array.isArray(timelineData.data?.timeline)) {
      console.log(`✅ [PASS] Test 5: Authenticated Chronological Case Timeline (${timelineData.data.timeline.length} events aggregated)`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 5: Authenticated Case Timeline (${timelineRes.status})`);
      failedCount++;
    }

    // 6. Test Internal Diary Notes Confidentiality Guard
    // Add 1 public update and 1 internal police update if case row exists
    const caseRes = await pool.query('SELECT case_id FROM cases WHERE fir_id = $1', [testFir.fir_id]);
    let testCaseId;
    if (caseRes.rows.length === 0) {
      const newCase = await pool.query(
        `INSERT INTO cases (fir_id, current_io_id, report_type)
         VALUES ($1, 2, 'CHARGESHEET') RETURNING case_id`,
        [testFir.fir_id]
      );
      testCaseId = newCase.rows[0].case_id;
    } else {
      testCaseId = caseRes.rows[0].case_id;
    }

    // Insert 1 public update and 1 secret internal police update
    await pool.query(
      `INSERT INTO case_updates (case_id, officer_id, update_type, body, visible_to_citizen)
       VALUES 
         ($1, 2, 'GENERAL', 'Public note: Complainant verified evidence exhibit', TRUE),
         ($1, 2, 'GENERAL', 'INTERNAL SECRET: Informant tip received regarding suspect hideout', FALSE)`,
      [testCaseId]
    );

    const citizenTimelineCheck = await fetch(`${BASE_URL}/api/tracking/firs/${testFir.fir_id}/timeline`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const citizenTimelineJson = await citizenTimelineCheck.json();
    const hasSecretLeaked = citizenTimelineJson.data?.timeline?.some(e =>
      e.description && e.description.includes('INTERNAL SECRET')
    );

    if (!hasSecretLeaked) {
      console.log('✅ [PASS] Test 6: Internal Note Redaction Guard (Secret notes withheld from citizen)');
      passedCount++;
    } else {
      console.log('❌ [FAIL] Test 6: Internal Note Redaction Guard (Internal police note leaked to citizen)');
      failedCount++;
    }

    // 7. Test In-App Notifications Engine
    // Dispatch test notification to Citizen
    await pool.query(
      `INSERT INTO notifications (user_id, fir_id, message, is_read)
       VALUES ($1, $2, 'Your case status has progressed to CLOSED', FALSE)`,
      [citizenUserId, testFir.fir_id]
    );

    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const notifData = await notifRes.json();

    const unreadRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const unreadData = await unreadRes.json();

    if (notifRes.status === 200 && unreadData.unreadCount >= 1) {
      console.log(`✅ [PASS] Test 7: In-App Notifications Listing & Unread Count Badge (${unreadData.unreadCount} unread)`);
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 7: In-App Notifications Listing (${notifRes.status})`);
      failedCount++;
    }

    // 8. Test Mark Single Notification As Read
    const targetNotifId = notifData.data[0]?.notification_id;
    const markReadRes = await fetch(`${BASE_URL}/api/notifications/${targetNotifId}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const markReadData = await markReadRes.json();

    if (markReadRes.status === 200 && markReadData.data?.is_read === true) {
      console.log('✅ [PASS] Test 8: Mark Single Notification As Read');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 8: Mark Single Notification As Read (${markReadRes.status})`);
      failedCount++;
    }

    // 9. Test Mark All Notifications As Read
    const markAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const markAllData = await markAllRes.json();

    const verifyZeroUnread = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    const zeroUnreadData = await verifyZeroUnread.json();

    if (markAllRes.status === 200 && zeroUnreadData.unreadCount === 0) {
      console.log('✅ [PASS] Test 9: Mark All Notifications As Read (Unread count reset to 0)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 9: Mark All Notifications As Read (${markAllRes.status})`);
      failedCount++;
    }

    // 10. Test Citizen Feedback Submission on CLOSED Case
    // Ensure case is CLOSED
    await pool.query("UPDATE fir SET status = 'CLOSED' WHERE fir_id = $1", [testFir.fir_id]);
    // Remove any existing feedback for clean test
    await pool.query('DELETE FROM citizen_feedback WHERE fir_id = $1', [testFir.fir_id]);

    const feedbackRes = await fetch(`${BASE_URL}/api/tracking/firs/${testFir.fir_id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({
        rating: 5,
        comments: 'Prompt response and excellent investigation support from the precinct.',
        timelinessRating: 5,
        conductRating: 5
      })
    });
    const feedbackData = await feedbackRes.json();

    if (feedbackRes.status === 201 && feedbackData.success === true) {
      console.log('✅ [PASS] Test 10: Citizen Feedback Submission on CLOSED Case (Rating: 5 Stars)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 10: Citizen Feedback Submission (${feedbackRes.status}: ${feedbackData.message})`);
      failedCount++;
    }

    // 11. Test Duplicate Feedback Rejection (409 Conflict)
    const dupFeedbackRes = await fetch(`${BASE_URL}/api/tracking/firs/${testFir.fir_id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${citizenToken}`
      },
      body: JSON.stringify({ rating: 4, comments: 'Second attempt' })
    });

    if (dupFeedbackRes.status === 409) {
      console.log('✅ [PASS] Test 11: Duplicate Feedback Guard (Blocked with 409 Conflict)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 11: Duplicate Feedback Guard (${dupFeedbackRes.status})`);
      failedCount++;
    }

    // 12. Test Feedback Retrieval
    const getFeedbackRes = await fetch(`${BASE_URL}/api/tracking/firs/${testFir.fir_id}/feedback`, {
      headers: { 'Authorization': `Bearer ${shoToken}` }
    });
    const getFeedbackData = await getFeedbackRes.json();

    if (getFeedbackRes.status === 200 && getFeedbackData.data?.rating === 5) {
      console.log('✅ [PASS] Test 12: View Submitted Feedback (Complainant rating verified by SHO)');
      passedCount++;
    } else {
      console.log(`❌ [FAIL] Test 12: View Submitted Feedback (${getFeedbackRes.status})`);
      failedCount++;
    }

  } catch (err) {
    console.error('Unhandled Test Execution Error:', err);
    failedCount++;
  } finally {
    server.close();
    await pool.end();
  }

  console.log('\n=================================================================');
  console.log(`   Feature 5 Tests Finished: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('=================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = runTests;
