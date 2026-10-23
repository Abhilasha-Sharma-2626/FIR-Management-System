const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

/**
 * 1. Fetch IO Workload per police station (FR-M1)
 * Used by SHO to see how many active cases each officer is currently handling
 */
async function getStationIoWorkload(stationId) {
  const query = `
    SELECT o.officer_id, o.badge_no, o.full_name, o.rank,
           COUNT(c.case_id) FILTER (WHERE f.status NOT IN ('CLOSED', 'REJECTED')) AS active_cases_count,
           ARRAY_AGG(f.fir_number) FILTER (WHERE f.status NOT IN ('CLOSED', 'REJECTED')) AS active_firs
    FROM officers o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN cases c ON o.officer_id = c.current_io_id
    LEFT JOIN fir f ON c.fir_id = f.fir_id
    WHERE o.station_id = $1 AND u.is_active = TRUE
    GROUP BY o.officer_id, o.badge_no, o.full_name, o.rank
    ORDER BY active_cases_count ASC, o.full_name ASC;
  `;
  const result = await pool.query(query, [stationId]);
  return result.rows;
}

/**
 * 2. Assign / Reassign IO to Case (SHO only, ACID transaction)
 * Moves FIR: REGISTERED -> ASSIGNED (or reassigns during active investigation)
 */
async function assignCaseIo({ firId, officerId, assignerUserId, stationId, reason, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR row
    const firRes = await client.query(
      `SELECT fir_id, station_id, status, fir_number, complainant_id FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );
    if (firRes.rows.length === 0) {
      const err = new Error('FIR record not found.');
      err.statusCode = 404;
      throw err;
    }
    const fir = firRes.rows[0];

    // Station check
    if (fir.station_id !== stationId) {
      const err = new Error('You do not have jurisdiction to assign cases for another station.');
      err.statusCode = 403;
      throw err;
    }

    // Allowed status check
    const allowedStatuses = ['REGISTERED', 'ASSIGNED', 'UNDER_INVESTIGATION', 'REOPENED'];
    if (!allowedStatuses.includes(fir.status)) {
      const err = new Error(`Cannot assign IO to case in status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Verify IO belongs to station and is active
    const ioRes = await client.query(
      `SELECT o.officer_id, o.full_name, o.user_id, r.code AS role_code
       FROM officers o
       JOIN users u ON o.user_id = u.user_id
       JOIN roles r ON u.role_id = r.role_id
       WHERE o.officer_id = $1 AND o.station_id = $2 AND u.is_active = TRUE`,
      [officerId, stationId]
    );
    if (ioRes.rows.length === 0) {
      const err = new Error('Designated officer is not an active officer at this police station.');
      err.statusCode = 400;
      throw err;
    }
    const targetIo = ioRes.rows[0];

    // 3. Fetch Case row
    const caseRes = await client.query(`SELECT case_id, current_io_id FROM cases WHERE fir_id = $1`, [firId]);
    if (caseRes.rows.length === 0) {
      const err = new Error('Case file not initialized for this FIR.');
      err.statusCode = 500;
      throw err;
    }
    const currentCase = caseRes.rows[0];

    // 4. If reassigning, close previous assignment
    if (currentCase.current_io_id) {
      await client.query(
        `UPDATE case_assignments
         SET to_ts = now(), reason = COALESCE($1, 'Reassigned by SHO')
         WHERE case_id = $2 AND to_ts IS NULL`,
        [reason || 'Officer reassigned', currentCase.case_id]
      );
    }

    // 5. Insert new assignment
    await client.query(
      `INSERT INTO case_assignments (case_id, officer_id, assigned_by, reason)
       VALUES ($1, $2, $3, $4)`,
      [currentCase.case_id, officerId, assignerUserId, reason || 'Initial assignment']
    );

    // 6. Update cases current_io_id
    await client.query(`UPDATE cases SET current_io_id = $1 WHERE case_id = $2`, [officerId, currentCase.case_id]);

    // 7. Transition FIR status if REGISTERED -> ASSIGNED
    const fromStatus = fir.status;
    let toStatus = fir.status;
    if (fir.status === 'REGISTERED') {
      toStatus = 'ASSIGNED';
      await client.query(
        `UPDATE fir SET status = 'ASSIGNED', version = version + 1, updated_at = now() WHERE fir_id = $1`,
        [firId]
      );

      await client.query(
        `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
         VALUES ($1, 'REGISTERED', 'ASSIGNED', $2, $3)`,
        [firId, assignerUserId, `Assigned to IO ${targetIo.full_name}`]
      );
    }

    // 8. Notifications
    await client.query(
      `INSERT INTO notifications (user_id, fir_id, message)
       VALUES ($1, $2, $3)`,
      [targetIo.user_id, firId, `You have been assigned as the Investigating Officer for FIR ${fir.fir_number}.`]
    );

    // 9. Audit Log
    await logAuditEvent({
      actorId: assignerUserId,
      actorRole: 'SHO',
      action: currentCase.current_io_id ? 'IO_REASSIGNED' : 'IO_ASSIGNED',
      entityType: 'case',
      entityId: currentCase.case_id,
      oldData: { current_io_id: currentCase.current_io_id, status: fromStatus },
      newData: { current_io_id: officerId, status: toStatus, assigned_to: targetIo.full_name },
      ipAddress
    });

    await client.query('COMMIT');
    return {
      caseId: currentCase.case_id,
      firId,
      assignedIo: targetIo.full_name,
      status: toStatus
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. IO Accepts Assignment & Commences Investigation
 * Moves FIR: ASSIGNED -> UNDER_INVESTIGATION
 */
async function acceptInvestigation({ firId, officerId, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT c.case_id, c.current_io_id, f.status, f.fir_number
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const caseData = checkRes.rows[0];

    if (caseData.current_io_id !== officerId) {
      const err = new Error('Only the assigned Investigating Officer can accept this case.');
      err.statusCode = 403;
      throw err;
    }

    if (caseData.status !== 'ASSIGNED' && caseData.status !== 'REOPENED') {
      const err = new Error(`Cannot start investigation from status: ${caseData.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Update FIR status
    await client.query(
      `UPDATE fir
       SET status = 'UNDER_INVESTIGATION', version = version + 1, updated_at = now()
       WHERE fir_id = $1`,
      [firId]
    );

    // Update case investigation started timestamp
    await client.query(
      `UPDATE cases SET investigation_started_at = COALESCE(investigation_started_at, now()) WHERE case_id = $1`,
      [caseData.case_id]
    );

    // Record history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, $2, 'UNDER_INVESTIGATION', $3, 'IO accepted case and commenced investigation')`,
      [firId, caseData.status, userId]
    );

    // Audit log
    await logAuditEvent({
      actorId: userId,
      actorRole: 'IO',
      action: 'STATUS_CHANGED',
      entityType: 'fir',
      entityId: firId,
      oldData: { status: caseData.status },
      newData: { status: 'UNDER_INVESTIGATION' },
      ipAddress
    });

    await client.query('COMMIT');
    return { firId, status: 'UNDER_INVESTIGATION' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 4. Add Case Progress Diary Update (FR-M2)
 */
async function addCaseUpdate({ firId, officerId, userId, updateType, body, visibleToCitizen, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const caseRes = await client.query(
      `SELECT c.case_id, c.current_io_id, f.status
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1`,
      [firId]
    );

    if (caseRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = caseRes.rows[0];

    // Ownership check
    if (c.current_io_id !== officerId) {
      const err = new Error('Only the assigned IO can log progress updates for this case.');
      err.statusCode = 403;
      throw err;
    }

    if (c.status !== 'UNDER_INVESTIGATION') {
      const err = new Error(`Progress updates can only be logged when case is UNDER_INVESTIGATION. Status: ${c.status}`);
      err.statusCode = 400;
      throw err;
    }

    const insertRes = await client.query(
      `INSERT INTO case_updates (case_id, officer_id, update_type, body, visible_to_citizen)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [c.case_id, officerId, updateType, body, Boolean(visibleToCitizen)]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'IO',
      action: 'CASE_UPDATE_ADDED',
      entityType: 'case_update',
      entityId: insertRes.rows[0].update_id,
      newData: { case_id: c.case_id, updateType, visibleToCitizen },
      ipAddress
    });

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 5. Add / Manage Accused or Witness Person (FR-M3)
 */
async function addCasePerson({ firId, officerId, personData }) {
  const caseRes = await pool.query(
    `SELECT c.case_id, c.current_io_id, f.status
     FROM cases c
     JOIN fir f ON c.fir_id = f.fir_id
     WHERE f.fir_id = $1`,
    [firId]
  );

  if (caseRes.rows.length === 0) {
    const err = new Error('Case not found.');
    err.statusCode = 404;
    throw err;
  }

  const c = caseRes.rows[0];
  if (c.current_io_id !== officerId) {
    const err = new Error('Only the assigned IO can add persons to this case.');
    err.statusCode = 403;
    throw err;
  }

  const result = await pool.query(
    `INSERT INTO fir_persons (fir_id, person_role, full_name, contact, address, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *;`,
    [
      firId,
      personData.personRole.toUpperCase(),
      personData.fullName,
      personData.contact || null,
      personData.address || null,
      personData.notes || null
    ]
  );

  return result.rows[0];
}

/**
 * 6. Submit Final Report (IO submits CHARGESHEET or CLOSURE -> PENDING_APPROVAL)
 */
async function submitFinalReport({ firId, officerId, userId, reportType, summary, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT c.case_id, c.current_io_id, f.status, f.fir_number
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = checkRes.rows[0];
    if (c.current_io_id !== officerId) {
      const err = new Error('Only the assigned IO can submit the final report.');
      err.statusCode = 403;
      throw err;
    }

    if (c.status !== 'UNDER_INVESTIGATION') {
      const err = new Error(`Cannot submit report when case is in status: ${c.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Guard: Must have at least one diary update
    const countUpdates = await client.query(
      `SELECT COUNT(*) FROM case_updates WHERE case_id = $1`,
      [c.case_id]
    );
    if (parseInt(countUpdates.rows[0].count, 10) === 0) {
      const err = new Error('Cannot submit report without at least one investigation update logged.');
      err.statusCode = 400;
      throw err;
    }

    // Guard: If Chargesheet, at least 1 accused person must be documented
    if (reportType === 'CHARGESHEET') {
      const countAccused = await client.query(
        `SELECT COUNT(*) FROM fir_persons WHERE fir_id = $1 AND person_role = 'ACCUSED'`,
        [firId]
      );
      if (parseInt(countAccused.rows[0].count, 10) === 0) {
        const err = new Error('Chargesheet requires at least one accused person recorded in persons list.');
        err.statusCode = 400;
        throw err;
      }
    }

    // Update case record
    await client.query(
      `UPDATE cases SET report_type = $1, outcome = $2 WHERE case_id = $3`,
      [reportType, summary, c.case_id]
    );

    // Update FIR status -> PENDING_APPROVAL
    await client.query(
      `UPDATE fir SET status = 'PENDING_APPROVAL', version = version + 1, updated_at = now() WHERE fir_id = $1`,
      [firId]
    );

    // Record status history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'UNDER_INVESTIGATION', 'PENDING_APPROVAL', $2, $3)`,
      [firId, userId, `Final Report (${reportType}) submitted for SHO approval: ${summary}`]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'IO',
      action: 'STATUS_CHANGED',
      entityType: 'case',
      entityId: c.case_id,
      oldData: { status: 'UNDER_INVESTIGATION' },
      newData: { status: 'PENDING_APPROVAL', report_type: reportType },
      ipAddress
    });

    await client.query('COMMIT');
    return { firId, status: 'PENDING_APPROVAL', reportType };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 7. SHO Decides on Final Report (Approve Chargesheet / Approve Closure / Send Back)
 */
async function reviewFinalReport({ firId, stationId, userId, decision, remarks, courtDetails, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT c.case_id, c.current_io_id, c.report_type, f.status, f.station_id, f.fir_number, f.complainant_id
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = checkRes.rows[0];
    if (c.station_id !== stationId) {
      const err = new Error('SHO can only review reports for their own police station.');
      err.statusCode = 403;
      throw err;
    }

    if (c.status !== 'PENDING_APPROVAL') {
      const err = new Error(`Case report is not pending approval. Current status: ${c.status}`);
      err.statusCode = 400;
      throw err;
    }

    let nextStatus = '';
    let note = '';

    if (decision === 'SEND_BACK') {
      nextStatus = 'UNDER_INVESTIGATION';
      note = `SHO sent report back for further investigation: ${remarks || 'Incomplete details'}`;
    } else if (decision === 'APPROVE') {
      if (c.report_type === 'CHARGESHEET') {
        nextStatus = 'CHARGESHEET_FILED';
        note = `Chargesheet approved for filing in court (${courtDetails?.courtName || 'District Court'}). Remarks: ${remarks || 'Approved'}`;
      } else {
        nextStatus = 'CLOSED';
        note = `Closure report approved. Case closed. Reason: ${remarks || 'Untraced / No offence made'}`;
        await client.query(`UPDATE cases SET closed_at = now() WHERE case_id = $1`, [c.case_id]);
      }
    } else {
      const err = new Error("Invalid decision. Must be 'APPROVE' or 'SEND_BACK'.");
      err.statusCode = 400;
      throw err;
    }

    // Update FIR Status
    await client.query(
      `UPDATE fir SET status = $1, version = version + 1, updated_at = now() WHERE fir_id = $2`,
      [nextStatus, firId]
    );

    // Status History
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'PENDING_APPROVAL', $2, $3, $4)`,
      [firId, nextStatus, userId, note]
    );

    // Notify Complainant if closed or filed
    if (['CHARGESHEET_FILED', 'CLOSED'].includes(nextStatus)) {
      const citizenUser = await client.query(
        `SELECT user_id FROM citizens WHERE citizen_id = $1`,
        [c.complainant_id]
      );
      if (citizenUser.rows.length > 0) {
        await client.query(
          `INSERT INTO notifications (user_id, fir_id, message)
           VALUES ($1, $2, $3)`,
          [
            citizenUser.rows[0].user_id,
            firId,
            `Update on FIR ${c.fir_number}: Case status changed to ${nextStatus}. ${note}`
          ]
        );
      }
    }

    await logAuditEvent({
      actorId: userId,
      actorRole: 'SHO',
      action: 'STATUS_CHANGED',
      entityType: 'case',
      entityId: c.case_id,
      oldData: { status: 'PENDING_APPROVAL' },
      newData: { status: nextStatus, decision, remarks },
      ipAddress
    });

    await client.query('COMMIT');
    return { firId, status: nextStatus, note };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 8. Reopen Case (SHO / SUPERVISOR only)
 * Moves FIR: CLOSED -> REOPENED -> UNDER_INVESTIGATION
 */
async function reopenCase({ firId, stationId, userRole, userId, reason, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT c.case_id, f.status, f.station_id, f.fir_number, f.complainant_id
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = checkRes.rows[0];

    // Station check (Supervisors have district access, SHO check station)
    if (userRole === 'SHO' && c.station_id !== stationId) {
      const err = new Error('SHO can only reopen cases from their own station.');
      err.statusCode = 403;
      throw err;
    }

    if (c.status !== 'CLOSED') {
      const err = new Error(`Only CLOSED cases can be reopened. Current status: ${c.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Transition to REOPENED then UNDER_INVESTIGATION
    await client.query(
      `UPDATE fir
       SET status = 'REOPENED', version = version + 1, updated_at = now()
       WHERE fir_id = $1`,
      [firId]
    );

    await client.query(
      `UPDATE fir
       SET status = 'UNDER_INVESTIGATION', version = version + 1, updated_at = now()
       WHERE fir_id = $1`,
      [firId]
    );

    await client.query(`UPDATE cases SET closed_at = NULL WHERE case_id = $1`, [c.case_id]);

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'CLOSED', 'REOPENED', $2, $3)`,
      [firId, userId, `Case reopened by ${userRole}. Reason: ${reason}`]
    );

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'REOPENED', 'UNDER_INVESTIGATION', $2, 'Case returned to active investigation')`,
      [firId, userId]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CASE_REOPENED',
      entityType: 'case',
      entityId: c.case_id,
      oldData: { status: 'CLOSED' },
      newData: { status: 'UNDER_INVESTIGATION', reason },
      ipAddress
    });

    await client.query('COMMIT');
    return { firId, status: 'UNDER_INVESTIGATION', reopened: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 9. View Case Detail (including Updates, Persons, Assignments)
 */
async function getCaseDetails(firId, user) {
  const caseRes = await pool.query(
    `SELECT c.case_id, c.investigation_started_at, c.report_type, c.outcome, c.closed_at,
            f.fir_id, f.fir_number, f.tracking_id, f.status, f.priority, f.incident_dt,
            f.location_text, f.description, f.station_id, ps.name AS station_name,
            io.officer_id AS current_io_id, io.full_name AS current_io_name, io.badge_no AS current_io_badge,
            cit.citizen_id, cit.full_name AS complainant_name
     FROM cases c
     JOIN fir f ON c.fir_id = f.fir_id
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     LEFT JOIN officers io ON c.current_io_id = io.officer_id
     LEFT JOIN citizens cit ON f.complainant_id = cit.citizen_id
     WHERE f.fir_id = $1`,
    [firId]
  );

  if (caseRes.rows.length === 0) {
    return null;
  }

  const caseData = caseRes.rows[0];

  // Scoping checks: Citizens only view if owner, IOs view assigned, SHO views station
  if (user.role === 'CITIZEN' && user.citizenId !== caseData.citizen_id) {
    const err = new Error('Forbidden: You can only view your own cases.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch Updates: Citizens only see visible_to_citizen = TRUE
  let updatesQuery = `
    SELECT u.update_id, u.update_type, u.body, u.visible_to_citizen, u.created_at,
           o.full_name AS officer_name, o.badge_no
    FROM case_updates u
    JOIN officers o ON u.officer_id = o.officer_id
    WHERE u.case_id = $1
  `;
  if (user.role === 'CITIZEN') {
    updatesQuery += ` AND u.visible_to_citizen = TRUE`;
  }
  updatesQuery += ` ORDER BY u.created_at DESC`;
  const updatesRes = await pool.query(updatesQuery, [caseData.case_id]);

  // Fetch Persons
  const personsRes = await pool.query(
    `SELECT * FROM fir_persons WHERE fir_id = $1 ORDER BY created_at ASC`,
    [firId]
  );

  // Fetch Assignment History (Officers & Admins only)
  let assignments = [];
  if (user.role !== 'CITIZEN') {
    const assignRes = await pool.query(
      `SELECT ca.assignment_id, ca.from_ts, ca.to_ts, ca.reason,
              o.full_name AS officer_name, o.badge_no,
              u.email AS assigned_by_user
       FROM case_assignments ca
       JOIN officers o ON ca.officer_id = o.officer_id
       JOIN users u ON ca.assigned_by = u.user_id
       WHERE ca.case_id = $1
       ORDER BY ca.from_ts DESC`,
      [caseData.case_id]
    );
    assignments = assignRes.rows;
  }

  return {
    ...caseData,
    updates: updatesRes.rows,
    persons: personsRes.rows,
    assignments
  };
}

/**
 * 10. Record Court Outcome & Final Case Closure (FR-M4, §6.4, §7.1 Step 11)
 * Transition: CHARGESHEET_FILED -> CLOSED
 */
async function recordCourtOutcome({
  caseIdentifier,
  userRole,
  userId,
  stationId,
  courtName,
  caseCourtNumber,
  verdict,
  judgmentDate,
  judgeName,
  sentenceDetails,
  fineAmount,
  remarks,
  ipAddress
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and Lock Case & FIR rows (check fir_id first, then case_id to avoid ID space collision)
    let lockRes = await client.query(
      `SELECT c.case_id, c.current_io_id, c.report_type, c.closed_at,
              f.fir_id, f.fir_number, f.status, f.station_id, f.version, f.complainant_id
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE f.fir_id = $1
       FOR UPDATE OF f, c`,
      [caseIdentifier]
    );

    if (lockRes.rows.length === 0) {
      lockRes = await client.query(
        `SELECT c.case_id, c.current_io_id, c.report_type, c.closed_at,
                f.fir_id, f.fir_number, f.status, f.station_id, f.version, f.complainant_id
         FROM cases c
         JOIN fir f ON c.fir_id = f.fir_id
         WHERE c.case_id = $1
         FOR UPDATE OF f, c`,
        [caseIdentifier]
      );
    }

    if (lockRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = lockRes.rows[0];

    // 2. Jurisdiction Guard: SHO can only record for their own station; SUPERVISOR/ADMIN have cross-station authority
    if (userRole === 'SHO' && c.station_id !== stationId) {
      const err = new Error('SHO can only record court outcomes for cases within their own police station.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Duplicate Check: Single final judicial outcome per case
    const dupRes = await client.query(
      `SELECT outcome_id FROM court_outcomes WHERE case_id = $1 OR fir_id = $2`,
      [c.case_id, c.fir_id]
    );
    if (dupRes.rows.length > 0) {
      const err = new Error('A final court outcome has already been recorded for this case.');
      err.statusCode = 409;
      throw err;
    }

    // 4. Status Guard: Must be in CHARGESHEET_FILED state
    if (c.status !== 'CHARGESHEET_FILED') {
      const err = new Error(
        `Cannot record court outcome for case in status: ${c.status}. A court outcome can only be recorded after a chargesheet has been filed in court (status: CHARGESHEET_FILED).`
      );
      err.statusCode = 400;
      throw err;
    }

    const cleanVerdict = verdict.toUpperCase().trim();
    const parsedFine = fineAmount !== undefined && fineAmount !== null && fineAmount !== '' ? Number(fineAmount) : 0;

    // 5. Insert Court Outcome Record
    const insertRes = await client.query(
      `INSERT INTO court_outcomes (
         case_id, fir_id, court_name, case_court_number, verdict,
         judgment_date, judge_name, sentence_details, fine_amount,
         remarks, recorded_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        c.case_id,
        c.fir_id,
        courtName.trim(),
        caseCourtNumber ? caseCourtNumber.trim() : null,
        cleanVerdict,
        judgmentDate,
        judgeName ? judgeName.trim() : null,
        sentenceDetails ? sentenceDetails.trim() : null,
        parsedFine,
        remarks.trim(),
        userId
      ]
    );
    const recordedOutcome = insertRes.rows[0];

    // 6. Update Case: record closure timestamp and outcome summary
    const outcomeSummary = `${cleanVerdict} - Court: ${courtName.trim()}. Remarks: ${remarks.trim()}`;
    await client.query(
      `UPDATE cases
       SET closed_at = now(),
           outcome = $1
       WHERE case_id = $2`,
      [outcomeSummary, c.case_id]
    );

    // 7. Transition FIR: CHARGESHEET_FILED -> CLOSED
    await client.query(
      `UPDATE fir
       SET status = 'CLOSED',
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $1`,
      [c.fir_id]
    );

    // 8. Record in case_status_history
    const historyNote = `Judicial Outcome Recorded: ${cleanVerdict} by ${courtName.trim()}. Case closed.`;
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'CHARGESHEET_FILED', 'CLOSED', $2, $3)`,
      [c.fir_id, userId, historyNote]
    );

    // 9. Send In-App Notification to Complainant Citizen
    const citizenUser = await client.query(
      `SELECT user_id FROM citizens WHERE citizen_id = $1`,
      [c.complainant_id]
    );
    if (citizenUser.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          citizenUser.rows[0].user_id,
          c.fir_id,
          `Court verdict recorded for FIR ${c.fir_number}: ${cleanVerdict} (${courtName.trim()}). The case has now reached final closure. You can provide feedback on your case resolution.`
        ]
      );
    }

    // 10. Append to Tamper-Evident SHA-256 Cryptographic Audit Log
    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'COURT_OUTCOME_RECORDED',
      entityType: 'case',
      entityId: c.case_id,
      oldData: { status: 'CHARGESHEET_FILED' },
      newData: {
        status: 'CLOSED',
        outcome_id: recordedOutcome.outcome_id,
        verdict: cleanVerdict,
        court_name: recordedOutcome.court_name,
        case_court_number: recordedOutcome.case_court_number,
        judgment_date: recordedOutcome.judgment_date
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      outcome_id: recordedOutcome.outcome_id,
      case_id: c.case_id,
      fir_id: c.fir_id,
      verdict: cleanVerdict,
      court_name: recordedOutcome.court_name,
      case_court_number: recordedOutcome.case_court_number,
      judgment_date: recordedOutcome.judgment_date,
      judge_name: recordedOutcome.judge_name,
      sentence_details: recordedOutcome.sentence_details,
      fine_amount: recordedOutcome.fine_amount,
      remarks: recordedOutcome.remarks,
      fir_status: 'CLOSED',
      closed_at: new Date()
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 11. Fetch Court Outcome Details for a Case
 */
async function getCourtOutcome(caseIdentifier, user) {
  const baseQuery = `
    SELECT co.*, u.email AS recorded_by_email,
           f.fir_number, f.status AS fir_status, f.station_id, f.complainant_id,
           cit.citizen_id, cit.full_name AS complainant_name
    FROM court_outcomes co
    JOIN cases c ON co.case_id = c.case_id
    JOIN fir f ON co.fir_id = f.fir_id
    JOIN users u ON co.recorded_by = u.user_id
    LEFT JOIN citizens cit ON f.complainant_id = cit.citizen_id
  `;
  let res = await pool.query(`${baseQuery} WHERE co.fir_id = $1`, [caseIdentifier]);
  if (res.rows.length === 0) {
    res = await pool.query(`${baseQuery} WHERE co.case_id = $1`, [caseIdentifier]);
  }

  if (res.rows.length === 0) {
    const err = new Error('No court outcome found for this case.');
    err.statusCode = 404;
    throw err;
  }

  const outcome = res.rows[0];

  // Citizen scoping check: only the complainant can view court outcome
  if (user.role === 'CITIZEN' && user.citizenId !== outcome.complainant_id) {
    const err = new Error('Forbidden: You can only view court outcomes for your own cases.');
    err.statusCode = 403;
    throw err;
  }

  return outcome;
}

module.exports = {
  getStationIoWorkload,
  assignCaseIo,
  acceptInvestigation,
  addCaseUpdate,
  addCasePerson,
  submitFinalReport,
  reviewFinalReport,
  reopenCase,
  getCaseDetails,
  recordCourtOutcome,
  getCourtOutcome
};