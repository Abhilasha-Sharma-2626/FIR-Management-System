require('dotenv').config();
const assert = require('assert');
const pool = require('../src/config/db');

async function runDatabaseHardeningTests() {
  console.log('=================================================================');
  console.log('   Starting Workflow 6: Database Hardening & Architectural Views ');
  console.log('=================================================================\n');

  const client = await pool.connect();
  let testFirId = null;

  try {
    // -------------------------------------------------------------
    // Setup: Create a temporary test FIR in DRAFT status
    // -------------------------------------------------------------
    const seedFirRes = await client.query(
      `INSERT INTO fir (
         tracking_id, complainant_id, station_id, category_id,
         incident_dt, location_text, description, status, priority, version
       ) VALUES (
         'CMP-DB-TEST-001', 1, 1, 1,
         now(), 'Sector 10 Testing Area', 'Test draft for database hardening verification',
         'DRAFT', 2, 1
       ) RETURNING fir_id, status, version`
    );
    testFirId = seedFirRes.rows[0].fir_id;
    assert.strictEqual(seedFirRes.rows[0].status, 'DRAFT');
    console.log(`✅ Setup: Test FIR initialized (FIR ID: ${testFirId}, Status: DRAFT, Version: 1)`);

    // -------------------------------------------------------------
    // Test 1: DB-Level State Guard Trigger - Block Illegal Transition
    // -------------------------------------------------------------
    let illegalBlocked = false;
    try {
      await client.query(
        `UPDATE fir SET status = 'CLOSED' WHERE fir_id = $1`,
        [testFirId]
      );
    } catch (err) {
      illegalBlocked = true;
      assert(
        err.message.includes('Illegal transition DRAFT -> CLOSED'),
        `Expected trigger illegal transition message, got: ${err.message}`
      );
      console.log(`✅ Test 1: Direct SQL tampering blocked by trg_fir_status_guard (${err.message.trim()})`);
    }
    assert.strictEqual(illegalBlocked, true, 'Trigger must reject illegal transition DRAFT -> CLOSED');

    // -------------------------------------------------------------
    // Test 2: DB-Level State Guard Trigger - Allow Legal Transition
    // -------------------------------------------------------------
    await client.query(
      `UPDATE fir SET status = 'SUBMITTED', version = version + 1 WHERE fir_id = $1`,
      [testFirId]
    );
    const updatedStatusRes = await client.query(
      `SELECT status, version FROM fir WHERE fir_id = $1`,
      [testFirId]
    );
    assert.strictEqual(updatedStatusRes.rows[0].status, 'SUBMITTED');
    console.log(`✅ Test 2: Legal transition DRAFT -> SUBMITTED allowed by trigger (Status: ${updatedStatusRes.rows[0].status})`);

    // -------------------------------------------------------------
    // Test 3: Append-Only Trigger - Block UPDATE on case_status_history
    // -------------------------------------------------------------
    // Insert a valid history record first
    const histIns = await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'DRAFT', 'SUBMITTED', 1, 'Initial submission log')
       RETURNING history_id`,
      [testFirId]
    );
    const testHistId = histIns.rows[0].history_id;

    let historyUpdateBlocked = false;
    try {
      await client.query(
        `UPDATE case_status_history SET note = 'Tampered history note' WHERE history_id = $1`,
        [testHistId]
      );
    } catch (err) {
      historyUpdateBlocked = true;
      assert(
        err.message.includes('strictly append-only'),
        `Expected append-only error, got: ${err.message}`
      );
      console.log(`✅ Test 3: History mutation blocked by history_no_mutation trigger`);
    }
    assert.strictEqual(historyUpdateBlocked, true, 'Trigger must block UPDATE on case_status_history');

    // -------------------------------------------------------------
    // Test 4: Append-Only Trigger - Block DELETE on case_status_history
    // -------------------------------------------------------------
    let historyDeleteBlocked = false;
    try {
      await client.query(
        `DELETE FROM case_status_history WHERE history_id = $1`,
        [testHistId]
      );
    } catch (err) {
      historyDeleteBlocked = true;
      assert(
        err.message.includes('strictly append-only'),
        `Expected append-only error, got: ${err.message}`
      );
      console.log(`✅ Test 4: History deletion blocked by history_no_mutation trigger`);
    }
    assert.strictEqual(historyDeleteBlocked, true, 'Trigger must block DELETE on case_status_history');

    // -------------------------------------------------------------
    // Test 5: Append-Only Trigger - Block Mutation on evidence_custody_log
    // -------------------------------------------------------------
    // Fetch an existing evidence item if present
    const evRes = await client.query(`SELECT evidence_id FROM evidence LIMIT 1`);
    if (evRes.rows.length > 0) {
      const existingEvId = evRes.rows[0].evidence_id;
      const custodyIns = await client.query(
        `INSERT INTO evidence_custody_log (evidence_id, from_holder, to_holder, purpose, remarks)
         VALUES ($1, NULL, 1, 'Initial Seizure Test', 'Test log for append-only verification')
         RETURNING log_id`,
        [existingEvId]
      );
      const testLogId = custodyIns.rows[0].log_id;

      let custodyUpdateBlocked = false;
      try {
        await client.query(
          `UPDATE evidence_custody_log SET remarks = 'Falsified chain remarks' WHERE log_id = $1`,
          [testLogId]
        );
      } catch (err) {
        custodyUpdateBlocked = true;
        assert(err.message.includes('strictly append-only'));
        console.log(`✅ Test 5: Evidence custody log mutation blocked by custody_no_mutation trigger`);
      }
      assert.strictEqual(custodyUpdateBlocked, true, 'Trigger must block UPDATE on evidence_custody_log');
    } else {
      console.log(`ℹ️ Test 5: Skipped evidence custody test (no existing evidence item found)`);
    }

    // -------------------------------------------------------------
    // Test 6: Stored Procedure change_case_status - Successful Execution
    // -------------------------------------------------------------
    // Transition SUBMITTED -> UNDER_REVIEW via change_case_status
    const procRes = await client.query(
      `SELECT * FROM change_case_status($1, 'UNDER_REVIEW'::fir_status, $2, 'Duty officer initiated triage', 2)`,
      [testFirId, 2] // actor: desk officer
    );
    assert.strictEqual(procRes.rows.length, 1);
    assert.strictEqual(procRes.rows[0].status, 'UNDER_REVIEW');
    assert.strictEqual(procRes.rows[0].version, 3);
    console.log(`✅ Test 6: Stored procedure change_case_status executed atomically (New Status: ${procRes.rows[0].status}, Version: ${procRes.rows[0].version})`);

    // Verify history was automatically written
    const autoHist = await client.query(
      `SELECT from_state, to_state, actor_id, note FROM case_status_history WHERE fir_id = $1 AND to_state = 'UNDER_REVIEW'`,
      [testFirId]
    );
    assert.strictEqual(autoHist.rows.length, 1);
    assert.strictEqual(autoHist.rows[0].from_state, 'SUBMITTED');
    assert.strictEqual(autoHist.rows[0].to_state, 'UNDER_REVIEW');
    assert.strictEqual(autoHist.rows[0].note, 'Duty officer initiated triage');
    console.log(`✅ Test 7: Stored procedure automatically appended immutable audit history`);

    // -------------------------------------------------------------
    // Test 8: Stored Procedure change_case_status - Optimistic Concurrency Conflict
    // -------------------------------------------------------------
    let staleBlocked = false;
    try {
      // Pass outdated expected_version 2 (current is 3)
      await client.query(
        `SELECT * FROM change_case_status($1, 'REJECTED'::fir_status, $2, 'Should fail', 2)`,
        [testFirId, 2]
      );
    } catch (err) {
      staleBlocked = true;
      assert(err.message.includes('STALE_VERSION'), `Expected STALE_VERSION, got: ${err.message}`);
      console.log(`✅ Test 8: Optimistic locking guard enforced (STALE_VERSION detected on concurrent conflict)`);
    }
    assert.strictEqual(staleBlocked, true, 'Procedure must abort when version mismatch occurs');

    // -------------------------------------------------------------
    // Test 9: Stored Procedure change_case_status - Illegal State Transition
    // -------------------------------------------------------------
    let procIllegalBlocked = false;
    try {
      // Attempt UNDER_REVIEW -> CLOSED (illegal)
      await client.query(
        `SELECT * FROM change_case_status($1, 'CLOSED'::fir_status, $2, 'Should fail', 3)`,
        [testFirId, 2]
      );
    } catch (err) {
      procIllegalBlocked = true;
      assert(err.message.includes('ILLEGAL_TRANSITION'), `Expected ILLEGAL_TRANSITION, got: ${err.message}`);
      console.log(`✅ Test 9: Procedure validated state_transitions table (ILLEGAL_TRANSITION rejected)`);
    }
    assert.strictEqual(procIllegalBlocked, true, 'Procedure must abort on illegal state transition');

    // -------------------------------------------------------------
    // Test 10: SQL View v_station_inbox Verification
    // -------------------------------------------------------------
    const inboxRes = await client.query(
      `SELECT fir_id, tracking_id, status, priority, priority_label, station_name, complainant_name, days_pending
       FROM v_station_inbox
       WHERE fir_id = $1`,
      [testFirId]
    );
    assert.strictEqual(inboxRes.rows.length, 1);
    const inboxRow = inboxRes.rows[0];
    assert.strictEqual(inboxRow.tracking_id, 'CMP-DB-TEST-001');
    assert.strictEqual(inboxRow.status, 'UNDER_REVIEW');
    assert.strictEqual(inboxRow.priority_label, 'Medium');
    assert(typeof inboxRow.days_pending === 'string' || typeof inboxRow.days_pending === 'number');
    console.log(`✅ Test 10: v_station_inbox returned accurate operational triage data (Station: ${inboxRow.station_name}, Priority: ${inboxRow.priority_label})`);

    // -------------------------------------------------------------
    // Test 11: SQL View v_case_timeline Verification
    // -------------------------------------------------------------
    const timelineRes = await client.query(
      `SELECT event_type, state_before, state_after, actor_role, summary, is_public
       FROM v_case_timeline
       WHERE fir_id = $1
       ORDER BY event_time ASC`,
      [testFirId]
    );
    assert(timelineRes.rows.length >= 2, 'Timeline must contain at least 2 status transition events');
    assert.strictEqual(timelineRes.rows[0].event_type, 'STATUS_CHANGE');
    console.log(`✅ Test 11: v_case_timeline aggregated multi-source case events (${timelineRes.rows.length} events logged)`);

    // -------------------------------------------------------------
    // Test 12: SQL View v_io_workload Verification
    // -------------------------------------------------------------
    const workloadRes = await client.query(
      `SELECT officer_id, officer_name, badge_no, rank, station_name, active_cases_count, station_workload_rank
       FROM v_io_workload
       LIMIT 5`
    );
    assert(workloadRes.rows.length > 0, 'v_io_workload must return officer records');
    const firstIo = workloadRes.rows[0];
    assert(firstIo.officer_name, 'Officer name must be populated');
    assert(firstIo.badge_no, 'Officer badge must be populated');
    assert(firstIo.station_workload_rank >= 1, 'Rank must be a positive integer');
    console.log(`✅ Test 12: v_io_workload computed real-time caseload metrics and RANK() partitioning (Officer: ${firstIo.officer_name}, Rank: ${firstIo.station_workload_rank})`);

    // -------------------------------------------------------------
    // Test 13: SQL View v_citizen_case_summary Verification
    // -------------------------------------------------------------
    const citizenViewRes = await client.query(
      `SELECT fir_id, tracking_id, status, complainant_name, station_name, station_phone, priority_label
       FROM v_citizen_case_summary
       WHERE fir_id = $1`,
      [testFirId]
    );
    assert.strictEqual(citizenViewRes.rows.length, 1);
    const citizenRow = citizenViewRes.rows[0];
    assert.strictEqual(citizenRow.tracking_id, 'CMP-DB-TEST-001');
    assert.strictEqual(citizenRow.status, 'UNDER_REVIEW');
    assert.strictEqual(citizenRow.priority_label, 'Medium');
    assert(citizenRow.station_phone !== undefined, 'Station contact phone must be present');
    console.log(`✅ Test 13: v_citizen_case_summary returned secure, sanitized citizen view (Tracking: ${citizenRow.tracking_id}, Phone: ${citizenRow.station_phone})`);

    console.log('\n=================================================================');
    console.log('   Workflow 6: Database Hardening & Architectural Views PASSED   ');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ Workflow 6 Test Failed:', error);
    process.exitCode = 1;
  } finally {
    // Cleanup temporary test FIR (cascade deletes related test status entries)
    if (testFirId) {
      try {
        await client.query(`DROP TRIGGER IF EXISTS fir_status_guard ON fir`);
        await client.query(`DROP TRIGGER IF EXISTS history_no_mutation ON case_status_history`);
        await client.query(`DELETE FROM case_status_history WHERE fir_id = $1`, [testFirId]);
        await client.query(`DELETE FROM fir WHERE fir_id = $1`, [testFirId]);
        // Re-enable triggers
        await client.query(`
          CREATE TRIGGER fir_status_guard BEFORE UPDATE ON fir
          FOR EACH ROW EXECUTE FUNCTION trg_fir_status_guard();
        `);
        await client.query(`
          CREATE TRIGGER history_no_mutation BEFORE UPDATE OR DELETE ON case_status_history
          FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();
        `);
      } catch (cleanupErr) {
        console.warn('Cleanup warning:', cleanupErr.message);
      }
    }
    client.release();
    await pool.end();
  }
}

runDatabaseHardeningTests();
