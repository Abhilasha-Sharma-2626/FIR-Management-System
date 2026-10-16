const pool = require('../config/db');
const { generateNextFirNumber } = require('./fir-counter.service');
const { logAuditEvent } = require('./audit.service');

/**
 * 1. Start review of a submitted complaint (SUBMITTED -> UNDER_REVIEW)
 */
async function startReview({ firId, officerId, userId, stationId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = checkRes.rows[0];

    // Station check (unless Zero FIR pool where station is null)
    if (fir.station_id && fir.station_id !== stationId) {
      const err = new Error('Complaint belongs to another police station jurisdiction.');
      err.statusCode = 403;
      throw err;
    }

    if (fir.status !== 'SUBMITTED') {
      const err = new Error(`Cannot start review from status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'UNDER_REVIEW',
           station_id = COALESCE(station_id, $1),
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [stationId, firId]
    );

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'SUBMITTED', 'UNDER_REVIEW', $2, 'Desk officer started review')`,
      [firId, userId]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'DESK_OFFICER',
      action: 'FIR_REVIEW_STARTED',
      entityType: 'fir',
      entityId: firId,
      newData: { status: 'UNDER_REVIEW' },
      ipAddress
    });

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 2. Request clarification from citizen (UNDER_REVIEW -> INFO_REQUESTED)
 */
async function requestInfo({ firId, questionText, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = checkRes.rows[0];
    if (fir.status !== 'UNDER_REVIEW') {
      const err = new Error(`Cannot request info when complaint status is: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'INFO_REQUESTED',
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $1
       RETURNING *;`,
      [firId]
    );

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'UNDER_REVIEW', 'INFO_REQUESTED', $2, $3)`,
      [firId, userId, questionText]
    );

    // Notify citizen user
    const citizenUserRes = await client.query(
      `SELECT user_id FROM citizens WHERE citizen_id = $1`,
      [fir.complainant_id]
    );
    if (citizenUserRes.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [citizenUserRes.rows[0].user_id, firId, `Police station requested clarification: ${questionText}`]
      );
    }

    await logAuditEvent({
      actorId: userId,
      actorRole: 'DESK_OFFICER',
      action: 'INFO_REQUESTED',
      entityType: 'fir',
      entityId: firId,
      newData: { status: 'INFO_REQUESTED', question: questionText },
      ipAddress
    });

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. Reject complaint (UNDER_REVIEW -> REJECTED)
 */
async function rejectComplaint({ firId, rejectionReason, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = checkRes.rows[0];
    if (fir.status !== 'UNDER_REVIEW') {
      const err = new Error(`Cannot reject complaint in status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'REJECTED',
           rejection_reason = $1,
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [rejectionReason, firId]
    );

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'UNDER_REVIEW', 'REJECTED', $2, $3)`,
      [firId, userId, rejectionReason]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'DESK_OFFICER',
      action: 'FIR_REJECTED',
      entityType: 'fir',
      entityId: firId,
      newData: { status: 'REJECTED', reason: rejectionReason },
      ipAddress
    });

    await client.query('COMMIT');
    return updateRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 4. Tag Legal Sections to Complaint
 */
async function tagLegalSections({ firId, sectionIds, isCognizable }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove existing tagged sections
    await client.query('DELETE FROM fir_sections WHERE fir_id = $1', [firId]);

    for (const sId of sectionIds) {
      await client.query(
        'INSERT INTO fir_sections (fir_id, section_id) VALUES ($1, $2)',
        [firId, sId]
      );
    }

    if (typeof isCognizable === 'boolean') {
      await client.query('UPDATE fir SET is_cognizable = $1 WHERE fir_id = $2', [isCognizable, firId]);
    }

    await client.query('COMMIT');
    return { success: true, count: sectionIds.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 5. SHO Approves Registration (ACID Transaction)
 * Generates FIR number, transitions to REGISTERED, creates `cases` row
 */
async function registerFir({ firId, stationId, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the complaint row
    const firRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Complaint record not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = firRes.rows[0];

    // Status Guard
    if (fir.status !== 'UNDER_REVIEW') {
      const err = new Error(`Only complaints in UNDER_REVIEW status can be registered. Current status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Jurisdiction Guard
    if (fir.station_id !== stationId) {
      const err = new Error('SHO can only approve complaints assigned to their station.');
      err.statusCode = 403;
      throw err;
    }

    // Legal Sections Guard
    const secRes = await client.query(
      `SELECT COUNT(*) FROM fir_sections WHERE fir_id = $1`,
      [firId]
    );
    if (parseInt(secRes.rows[0].count, 10) === 0) {
      const err = new Error('Cannot register FIR without at least one legal section attached.');
      err.statusCode = 400;
      throw err;
    }

    // Cognizable Guard
    if (fir.is_cognizable === false) {
      const err = new Error('Non-cognizable complaints cannot be registered as an FIR (file NCR instead).');
      err.statusCode = 400;
      throw err;
    }

    // 1. Generate Atomic FIR Number
    const firNumber = await generateNextFirNumber(client, stationId);

    // 2. Update FIR row to REGISTERED
    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'REGISTERED',
           fir_number = $1,
           registered_at = now(),
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [firNumber, firId]
    );
    const registeredFir = updateRes.rows[0];

    // 3. Initialize investigative case in `cases` table
    const caseRes = await client.query(
      `INSERT INTO cases (fir_id)
       VALUES ($1)
       RETURNING case_id;`,
      [firId]
    );
    const caseId = caseRes.rows[0].case_id;

    // 4. Record state history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'UNDER_REVIEW', 'REGISTERED', $2, $3)`,
      [firId, userId, `FIR formally registered by SHO. FIR Number: ${firNumber}`]
    );

    // 5. Notify citizen
    const citizenUserRes = await client.query(
      `SELECT user_id FROM citizens WHERE citizen_id = $1`,
      [fir.complainant_id]
    );
    if (citizenUserRes.rows.length > 0) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          citizenUserRes.rows[0].user_id,
          firId,
          `Your FIR has been registered! Formal FIR Number: ${firNumber}`
        ]
      );
    }

    // 6. Audit log entry
    await logAuditEvent({
      actorId: userId,
      actorRole: 'SHO',
      action: 'FIR_REGISTERED',
      entityType: 'fir',
      entityId: firId,
      oldData: { status: 'UNDER_REVIEW' },
      newData: { status: 'REGISTERED', fir_number: firNumber, case_id: caseId },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      fir: registeredFir,
      caseId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  startReview,
  requestInfo,
  rejectComplaint,
  tagLegalSections,
  registerFir
};
