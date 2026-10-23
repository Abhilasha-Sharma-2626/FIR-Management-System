const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

/**
 * 1. Submit an appeal against complaint rejection (Citizen)
 * Aligns with FR-R4 & §6.4
 */
async function submitAppeal({ firId, citizenId, userId, reason, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the FIR row
    const firRes = await client.query(
      `SELECT fir_id, complainant_id, station_id, status, tracking_id, version
       FROM fir
       WHERE fir_id = $1
       FOR UPDATE`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Complaint record not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = firRes.rows[0];

    // Ownership check: Complainant must own this complaint
    if (fir.complainant_id !== citizenId) {
      const err = new Error('Forbidden: You can only appeal against your own rejected complaints.');
      err.statusCode = 403;
      throw err;
    }

    // Status check: Must be REJECTED
    if (fir.status !== 'REJECTED') {
      const err = new Error(`Only complaints in REJECTED status can be appealed. Current status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    // Concurrency / Duplicate active appeal check
    const pendingRes = await client.query(
      `SELECT appeal_id FROM fir_appeals WHERE fir_id = $1 AND status = 'PENDING'`,
      [firId]
    );
    if (pendingRes.rows.length > 0) {
      const err = new Error('An appeal is already pending supervisory review for this complaint.');
      err.statusCode = 409;
      throw err;
    }

    // Insert appeal record
    const insertRes = await client.query(
      `INSERT INTO fir_appeals (fir_id, citizen_id, reason, status)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING *;`,
      [firId, citizenId, reason.trim()]
    );
    const appeal = insertRes.rows[0];

    // Notify Station SHO and District Supervisor
    const officersQuery = `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN officers o ON u.user_id = o.user_id
      WHERE (o.station_id = $1 AND r.code = 'SHO' AND u.is_active = TRUE)
         OR (r.code = 'SUPERVISOR' AND u.is_active = TRUE)
    `;
    const officersRes = await client.query(officersQuery, [fir.station_id]);
    for (const officer of officersRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          officer.user_id,
          firId,
          `New citizen appeal filed for rejected complaint ${fir.tracking_id || '#' + fir.fir_id}. Ground: "${reason.substring(0, 60)}..."`
        ]
      );
    }

    // Audit log entry
    await logAuditEvent({
      actorId: userId,
      actorRole: 'CITIZEN',
      action: 'FIR_APPEAL_SUBMITTED',
      entityType: 'fir_appeal',
      entityId: appeal.appeal_id,
      newData: {
        fir_id: firId,
        tracking_id: fir.tracking_id,
        appeal_id: appeal.appeal_id,
        reason: reason.trim()
      },
      ipAddress
    });

    await client.query('COMMIT');
    return appeal;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 2. Supervisory Review of Appeal (SHO or SUPERVISOR)
 * Accepts appeal (reinstating to UNDER_REVIEW) or Rejects appeal
 */
async function reviewAppeal({ firId, appealId, decision, reviewNotes, userId, userRole, stationId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR row
    const firRes = await client.query(
      `SELECT fir_id, complainant_id, station_id, status, tracking_id, version
       FROM fir
       WHERE fir_id = $1
       FOR UPDATE`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Complaint record not found.');
      err.statusCode = 404;
      throw err;
    }
    const fir = firRes.rows[0];

    // 2. Lock Appeal row
    const appealRes = await client.query(
      `SELECT appeal_id, fir_id, citizen_id, status, reason
       FROM fir_appeals
       WHERE appeal_id = $1 AND fir_id = $2
       FOR UPDATE`,
      [appealId, firId]
    );

    if (appealRes.rows.length === 0) {
      const err = new Error('Appeal record not found for this complaint.');
      err.statusCode = 404;
      throw err;
    }
    const appeal = appealRes.rows[0];

    if (appeal.status !== 'PENDING') {
      const err = new Error(`Appeal has already been processed with status: ${appeal.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 3. Jurisdiction Check: SHO can only decide on station cases; SUPERVISOR has district authority
    if (userRole === 'SHO' && fir.station_id !== stationId) {
      const err = new Error('SHO can only review appeals for complaints within their own station jurisdiction.');
      err.statusCode = 403;
      throw err;
    }

    const decisionUpper = decision.toUpperCase();
    let updatedAppeal;
    let nextFirStatus = fir.status;

    if (decisionUpper === 'ACCEPT') {
      nextFirStatus = 'UNDER_REVIEW';

      // Reopen complaint to UNDER_REVIEW
      await client.query(
        `UPDATE fir
         SET status = 'UNDER_REVIEW',
             version = version + 1,
             updated_at = now()
         WHERE fir_id = $1`,
        [firId]
      );

      // Update appeal record
      const updateAppealRes = await client.query(
        `UPDATE fir_appeals
         SET status = 'ACCEPTED',
             reviewed_by = $1,
             review_notes = $2,
             reviewed_at = now(),
             updated_at = now()
         WHERE appeal_id = $3
         RETURNING *;`,
        [userId, reviewNotes.trim(), appealId]
      );
      updatedAppeal = updateAppealRes.rows[0];

      // Insert into case_status_history
      await client.query(
        `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
         VALUES ($1, 'REJECTED', 'UNDER_REVIEW', $2, $3)`,
        [firId, userId, `Appeal accepted by ${userRole}. Notes: ${reviewNotes.trim()}`]
      );

      // Notify citizen of reinstatement
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
            `Your appeal for complaint ${fir.tracking_id || '#' + fir.fir_id} has been accepted by ${userRole}. The complaint is returned to review.`
          ]
        );
      }

      // Audit log
      await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        action: 'FIR_APPEAL_ACCEPTED',
        entityType: 'fir_appeal',
        entityId: appealId,
        oldData: { fir_status: 'REJECTED', appeal_status: 'PENDING' },
        newData: {
          fir_status: 'UNDER_REVIEW',
          appeal_status: 'ACCEPTED',
          reviewed_by: userId,
          review_notes: reviewNotes.trim()
        },
        ipAddress
      });
    } else {
      // Rejection of appeal
      const updateAppealRes = await client.query(
        `UPDATE fir_appeals
         SET status = 'REJECTED',
             reviewed_by = $1,
             review_notes = $2,
             reviewed_at = now(),
             updated_at = now()
         WHERE appeal_id = $3
         RETURNING *;`,
        [userId, reviewNotes.trim(), appealId]
      );
      updatedAppeal = updateAppealRes.rows[0];

      // Notify citizen of appeal rejection
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
            `Your appeal for complaint ${fir.tracking_id || '#' + fir.fir_id} was reviewed and rejected by ${userRole}. Decision notes: ${reviewNotes.trim()}`
          ]
        );
      }

      // Audit log
      await logAuditEvent({
        actorId: userId,
        actorRole: userRole,
        action: 'FIR_APPEAL_REJECTED',
        entityType: 'fir_appeal',
        entityId: appealId,
        oldData: { appeal_status: 'PENDING' },
        newData: {
          appeal_status: 'REJECTED',
          reviewed_by: userId,
          review_notes: reviewNotes.trim()
        },
        ipAddress
      });
    }

    await client.query('COMMIT');
    return {
      appeal: updatedAppeal,
      firStatus: nextFirStatus
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. Get all appeals for an FIR
 */
async function getFirAppeals(firId, user) {
  // Check FIR existence and permission
  const firRes = await pool.query(
    `SELECT fir_id, complainant_id, station_id FROM fir WHERE fir_id = $1`,
    [firId]
  );
  if (firRes.rows.length === 0) {
    const err = new Error('Complaint not found.');
    err.statusCode = 404;
    throw err;
  }
  const fir = firRes.rows[0];

  // Citizen scope check
  if (user.role === 'CITIZEN' && user.citizenId !== fir.complainant_id) {
    const err = new Error('Forbidden: You can only view appeals for your own complaints.');
    err.statusCode = 403;
    throw err;
  }

  // Station check for station officers (DESK_OFFICER, SHO)
  if (['DESK_OFFICER', 'SHO'].includes(user.role) && fir.station_id !== user.stationId) {
    const err = new Error('Forbidden: You can only view appeals for your station.');
    err.statusCode = 403;
    throw err;
  }

  const query = `
    SELECT 
      a.appeal_id,
      a.fir_id,
      a.citizen_id,
      c.full_name AS citizen_name,
      a.reason,
      a.status,
      a.reviewed_by,
      u.email AS reviewer_email,
      a.review_notes,
      a.reviewed_at,
      a.created_at,
      a.updated_at
    FROM fir_appeals a
    JOIN citizens c ON a.citizen_id = c.citizen_id
    LEFT JOIN users u ON a.reviewed_by = u.user_id
    WHERE a.fir_id = $1
    ORDER BY a.created_at DESC;
  `;
  const result = await pool.query(query, [firId]);
  return result.rows;
}

/**
 * 4. List pending appeals for station or district
 */
async function getPendingAppeals({ stationId, userRole } = {}) {
  const params = [];
  let filter = `WHERE a.status = 'PENDING'`;

  if (userRole === 'SHO' && stationId) {
    params.push(stationId);
    filter += ` AND f.station_id = $${params.length}`;
  }

  const query = `
    SELECT 
      a.appeal_id,
      a.fir_id,
      f.tracking_id,
      f.rejection_reason,
      f.station_id,
      ps.name AS station_name,
      c.full_name AS citizen_name,
      a.reason AS appeal_reason,
      a.status,
      a.created_at
    FROM fir_appeals a
    JOIN fir f ON a.fir_id = f.fir_id
    JOIN citizens c ON a.citizen_id = c.citizen_id
    LEFT JOIN police_stations ps ON f.station_id = ps.station_id
    ${filter}
    ORDER BY a.created_at ASC;
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  submitAppeal,
  reviewAppeal,
  getFirAppeals,
  getPendingAppeals
};
