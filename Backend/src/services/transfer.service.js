const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

/**
 * 1. Initiate Inter-Station Case Transfer (SHO / SUPERVISOR)
 * Aligns with FR-M6, §6.4 & §10.1
 */
async function initiateCaseTransfer({ firId, toStationId, reason, userId, userRole, stationId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR & Case rows
    const firRes = await client.query(
      `SELECT f.fir_id, f.status, f.station_id, f.fir_number, f.tracking_id, f.complainant_id,
              c.case_id, c.current_io_id, ps.name AS current_station_name, ps.code AS current_station_code
       FROM fir f
       LEFT JOIN cases c ON f.fir_id = c.fir_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       WHERE f.fir_id = $1
       FOR UPDATE OF f`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Complaint / FIR record not found.');
      err.statusCode = 404;
      throw err;
    }

    const fir = firRes.rows[0];

    if (!fir.case_id) {
      const err = new Error('Case file not initialized. Unregistered complaints cannot be transferred.');
      err.statusCode = 400;
      throw err;
    }

    // Status Guard: Must be registered and active
    const transferableStatuses = ['REGISTERED', 'ASSIGNED', 'UNDER_INVESTIGATION'];
    if (!transferableStatuses.includes(fir.status)) {
      const err = new Error(`Cannot transfer case in current status: ${fir.status}. Only active registered cases can be transferred.`);
      err.statusCode = 400;
      throw err;
    }

    // Jurisdiction Guard: Originating SHO can only transfer cases from their station
    if (userRole === 'SHO' && fir.station_id !== stationId) {
      const err = new Error('Forbidden: SHO can only transfer cases belonging to their own police station.');
      err.statusCode = 403;
      throw err;
    }

    const targetStationIdInt = parseInt(toStationId, 10);

    // Self-transfer Guard
    if (fir.station_id === targetStationIdInt) {
      const err = new Error('Cannot transfer case to the same police station.');
      err.statusCode = 400;
      throw err;
    }

    // Target station existence & active check
    const targetStationRes = await client.query(
      `SELECT station_id, code, name, is_active FROM police_stations WHERE station_id = $1`,
      [targetStationIdInt]
    );
    if (targetStationRes.rows.length === 0) {
      const err = new Error(`Target police station with ID ${targetStationIdInt} does not exist.`);
      err.statusCode = 404;
      throw err;
    }
    const targetStation = targetStationRes.rows[0];
    if (targetStation.is_active === false) {
      const err = new Error(`Target police station '${targetStation.name}' is currently inactive.`);
      err.statusCode = 400;
      throw err;
    }

    // Concurrency / Duplicate pending transfer check
    const pendingTransferRes = await client.query(
      `SELECT transfer_id FROM case_transfers WHERE case_id = $1 AND status = 'PENDING'`,
      [fir.case_id]
    );
    if (pendingTransferRes.rows.length > 0) {
      const err = new Error('A transfer request is already pending review for this case.');
      err.statusCode = 409;
      throw err;
    }

    const previousStatus = fir.status;

    // 2. Close active IO assignment if one exists
    if (fir.current_io_id) {
      await client.query(
        `UPDATE case_assignments
         SET to_ts = now(), reason = $1
         WHERE case_id = $2 AND to_ts IS NULL`,
        [`Relieved due to case transfer to ${targetStation.name}`, fir.case_id]
      );
    }

    // 3. Update FIR status to TRANSFERRED
    const updateFirRes = await client.query(
      `UPDATE fir
       SET status = 'TRANSFERRED',
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $1
       RETURNING *;`,
      [firId]
    );
    const updatedFir = updateFirRes.rows[0];

    // 4. Insert transfer record
    const insertTransferRes = await client.query(
      `INSERT INTO case_transfers (
         case_id, fir_id, from_station_id, to_station_id,
         transferred_by, transfer_reason, previous_status, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
       RETURNING *;`,
      [
        fir.case_id,
        firId,
        fir.station_id,
        targetStationIdInt,
        userId,
        reason.trim(),
        previousStatus
      ]
    );
    const transferRecord = insertTransferRes.rows[0];

    // 5. Case status history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, $2, 'TRANSFERRED', $3, $4)`,
      [
        firId,
        previousStatus,
        userId,
        `Case transferred to ${targetStation.name} (${targetStation.code}). Reason: ${reason.trim()}`
      ]
    );

    // 6. Notify Receiving Station SHO & District Supervisors
    const notifyReceivingQuery = `
      SELECT u.user_id
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN officers o ON u.user_id = o.user_id
      WHERE (o.station_id = $1 AND r.code = 'SHO' AND u.is_active = TRUE)
         OR (r.code = 'SUPERVISOR' AND u.is_active = TRUE)
    `;
    const receivingOfficers = await client.query(notifyReceivingQuery, [targetStationIdInt]);
    for (const officer of receivingOfficers.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          officer.user_id,
          firId,
          `Incoming case transfer for FIR ${fir.fir_number} from ${fir.current_station_name}. Awaiting your acceptance.`
        ]
      );
    }

    // 7. Notify Complainant Citizen
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
          `Your FIR ${fir.fir_number} is being transferred to ${targetStation.name} for territorial jurisdiction.`
        ]
      );
    }

    // 8. Audit log entry
    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CASE_TRANSFERRED',
      entityType: 'case',
      entityId: fir.case_id,
      oldData: { status: previousStatus, station_id: fir.station_id },
      newData: {
        status: 'TRANSFERRED',
        transfer_id: transferRecord.transfer_id,
        to_station_id: targetStationIdInt,
        to_station_name: targetStation.name,
        reason: reason.trim()
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      transfer: transferRecord,
      fir: updatedFir,
      targetStation: {
        station_id: targetStation.station_id,
        name: targetStation.name,
        code: targetStation.code
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 2. Accept Case Transfer (Receiving Station SHO / SUPERVISOR)
 * Aligns with FR-M6, §6.4 & §10.1
 */
async function acceptCaseTransfer({ firId, remarks, userId, userRole, stationId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR and Case
    const firRes = await client.query(
      `SELECT f.fir_id, f.status, f.station_id, f.fir_number, f.complainant_id, c.case_id
       FROM fir f
       JOIN cases c ON f.fir_id = c.fir_id
       WHERE f.fir_id = $1
       FOR UPDATE OF f`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Case record not found.');
      err.statusCode = 404;
      throw err;
    }
    const fir = firRes.rows[0];

    if (fir.status !== 'TRANSFERRED') {
      const err = new Error(`Only cases in TRANSFERRED status can be accepted. Current status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch and Lock Pending Transfer Record
    const transferRes = await client.query(
      `SELECT ct.*,
              fs.name AS from_station_name, fs.code AS from_station_code,
              ts.name AS to_station_name, ts.code AS to_station_code
       FROM case_transfers ct
       JOIN police_stations fs ON ct.from_station_id = fs.station_id
       JOIN police_stations ts ON ct.to_station_id = ts.station_id
       WHERE ct.fir_id = $1 AND ct.status = 'PENDING'
       FOR UPDATE`,
      [firId]
    );

    if (transferRes.rows.length === 0) {
      const err = new Error('No pending transfer request found for this case.');
      err.statusCode = 404;
      throw err;
    }
    const transfer = transferRes.rows[0];

    // Receiving Station Guard: Only target station SHO or SUPERVISOR can accept
    if (userRole === 'SHO' && transfer.to_station_id !== stationId) {
      const err = new Error('Forbidden: Only the SHO of the target receiving police station can accept this case transfer.');
      err.statusCode = 403;
      throw err;
    }

    const resolutionNotes = remarks ? remarks.trim() : 'Transfer accepted and case absorbed into station jurisdiction.';

    // 3. Update FIR: set new station_id, status back to REGISTERED
    const updateFirRes = await client.query(
      `UPDATE fir
       SET station_id = $1,
           status = 'REGISTERED',
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [transfer.to_station_id, firId]
    );
    const updatedFir = updateFirRes.rows[0];

    // 4. Clear current_io_id in cases so new SHO can assign local IO
    await client.query(
      `UPDATE cases
       SET current_io_id = NULL
       WHERE case_id = $1`,
      [fir.case_id]
    );

    // 5. Update transfer record
    const updateTransferRes = await client.query(
      `UPDATE case_transfers
       SET status = 'ACCEPTED',
           accepted_by = $1,
           resolution_remarks = $2,
           resolved_at = now(),
           updated_at = now()
       WHERE transfer_id = $3
       RETURNING *;`,
      [userId, resolutionNotes, transfer.transfer_id]
    );
    const updatedTransfer = updateTransferRes.rows[0];

    // 6. Case status history: TRANSFERRED -> REGISTERED
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'TRANSFERRED', 'REGISTERED', $2, $3)`,
      [
        firId,
        userId,
        `Case transfer accepted at ${transfer.to_station_name} (${transfer.to_station_code}) by ${userRole}. Notes: ${resolutionNotes}`
      ]
    );

    // 7. Notify complainant citizen
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
          `Your FIR ${fir.fir_number} transfer has been accepted by ${transfer.to_station_name}. A local Investigating Officer will be assigned soon.`
        ]
      );
    }

    // 8. Notify originating SHO
    const fromShoRes = await client.query(
      `SELECT u.user_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN officers o ON u.user_id = o.user_id
       WHERE o.station_id = $1 AND r.code = 'SHO' AND u.is_active = TRUE`,
      [transfer.from_station_id]
    );
    for (const sho of fromShoRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          sho.user_id,
          firId,
          `Case transfer for FIR ${fir.fir_number} has been formally accepted by ${transfer.to_station_name}.`
        ]
      );
    }

    // 9. Audit log entry
    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CASE_TRANSFER_ACCEPTED',
      entityType: 'case',
      entityId: fir.case_id,
      oldData: {
        status: 'TRANSFERRED',
        station_id: transfer.from_station_id,
        transfer_id: transfer.transfer_id
      },
      newData: {
        status: 'REGISTERED',
        new_station_id: transfer.to_station_id,
        new_station_name: transfer.to_station_name,
        remarks: resolutionNotes
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      transfer: updatedTransfer,
      fir: updatedFir,
      newStation: {
        station_id: transfer.to_station_id,
        name: transfer.to_station_name,
        code: transfer.to_station_code
      }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. Reject Case Transfer (Receiving Station SHO / SUPERVISOR)
 * Returns case to pre-transfer state at originating station
 */
async function rejectCaseTransfer({ firId, remarks, userId, userRole, stationId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR and Case
    const firRes = await client.query(
      `SELECT f.fir_id, f.status, f.station_id, f.fir_number, f.complainant_id, c.case_id
       FROM fir f
       JOIN cases c ON f.fir_id = c.fir_id
       WHERE f.fir_id = $1
       FOR UPDATE OF f`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      const err = new Error('Case record not found.');
      err.statusCode = 404;
      throw err;
    }
    const fir = firRes.rows[0];

    if (fir.status !== 'TRANSFERRED') {
      const err = new Error(`Only cases in TRANSFERRED status can be rejected. Current status: ${fir.status}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Fetch and Lock Pending Transfer
    const transferRes = await client.query(
      `SELECT ct.*,
              fs.name AS from_station_name, fs.code AS from_station_code,
              ts.name AS to_station_name, ts.code AS to_station_code
       FROM case_transfers ct
       JOIN police_stations fs ON ct.from_station_id = fs.station_id
       JOIN police_stations ts ON ct.to_station_id = ts.station_id
       WHERE ct.fir_id = $1 AND ct.status = 'PENDING'
       FOR UPDATE`,
      [firId]
    );

    if (transferRes.rows.length === 0) {
      const err = new Error('No pending transfer request found for this case.');
      err.statusCode = 404;
      throw err;
    }
    const transfer = transferRes.rows[0];

    // Receiving Station Guard
    if (userRole === 'SHO' && transfer.to_station_id !== stationId) {
      const err = new Error('Forbidden: Only the SHO of the target receiving police station can reject this case transfer.');
      err.statusCode = 403;
      throw err;
    }

    const revertStatus = transfer.previous_status;
    const rejectionRemarks = remarks.trim();

    // 3. Revert FIR status back to previous_status at originating station
    const updateFirRes = await client.query(
      `UPDATE fir
       SET status = $1,
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [revertStatus, firId]
    );
    const updatedFir = updateFirRes.rows[0];

    // 4. Update transfer record to REJECTED
    const updateTransferRes = await client.query(
      `UPDATE case_transfers
       SET status = 'REJECTED',
           accepted_by = $1,
           resolution_remarks = $2,
           resolved_at = now(),
           updated_at = now()
       WHERE transfer_id = $3
       RETURNING *;`,
      [userId, rejectionRemarks, transfer.transfer_id]
    );
    const updatedTransfer = updateTransferRes.rows[0];

    // 5. Case status history: TRANSFERRED -> previous_status
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'TRANSFERRED', $2, $3, $4)`,
      [
        firId,
        revertStatus,
        userId,
        `Case transfer rejected by ${transfer.to_station_name} (${userRole}). Case returned to ${transfer.from_station_name}. Reason: ${rejectionRemarks}`
      ]
    );

    // 6. Notify originating station SHO
    const fromShoRes = await client.query(
      `SELECT u.user_id
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       JOIN officers o ON u.user_id = o.user_id
       WHERE o.station_id = $1 AND r.code = 'SHO' AND u.is_active = TRUE`,
      [transfer.from_station_id]
    );
    for (const sho of fromShoRes.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, fir_id, message)
         VALUES ($1, $2, $3)`,
        [
          sho.user_id,
          firId,
          `Case transfer for FIR ${fir.fir_number} was rejected by ${transfer.to_station_name}. Reason: ${rejectionRemarks}`
        ]
      );
    }

    // 7. Audit log entry
    await logAuditEvent({
      actorId: userId,
      actorRole: userRole,
      action: 'CASE_TRANSFER_REJECTED',
      entityType: 'case',
      entityId: fir.case_id,
      oldData: { status: 'TRANSFERRED', transfer_id: transfer.transfer_id },
      newData: {
        status: revertStatus,
        station_id: transfer.from_station_id,
        rejected_by: userId,
        reason: rejectionRemarks
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      transfer: updatedTransfer,
      fir: updatedFir,
      revertedStatus: revertStatus
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 4. List Incoming Transfers for a Station
 */
async function getStationIncomingTransfers({ stationId, userRole } = {}) {
  const params = [];
  let filter = `WHERE ct.status = 'PENDING'`;

  if (userRole === 'SHO' && stationId) {
    params.push(stationId);
    filter += ` AND ct.to_station_id = $${params.length}`;
  }

  const query = `
    SELECT 
      ct.transfer_id,
      ct.case_id,
      ct.fir_id,
      f.fir_number,
      f.tracking_id,
      f.incident_dt,
      f.priority,
      f.description AS fir_description,
      ct.from_station_id,
      fs.name AS from_station_name,
      fs.code AS from_station_code,
      ct.to_station_id,
      ts.name AS to_station_name,
      ts.code AS to_station_code,
      u.email AS transferred_by_user,
      ct.transfer_reason,
      ct.previous_status,
      ct.status AS transfer_status,
      ct.created_at AS transferred_at
    FROM case_transfers ct
    JOIN fir f ON ct.fir_id = f.fir_id
    JOIN police_stations fs ON ct.from_station_id = fs.station_id
    JOIN police_stations ts ON ct.to_station_id = ts.station_id
    JOIN users u ON ct.transferred_by = u.user_id
    ${filter}
    ORDER BY ct.created_at ASC;
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * 5. Get Transfer History for a Case
 */
async function getCaseTransfers(firId, user) {
  const firRes = await pool.query(
    `SELECT fir_id, complainant_id, station_id FROM fir WHERE fir_id = $1`,
    [firId]
  );
  if (firRes.rows.length === 0) {
    const err = new Error('Case not found.');
    err.statusCode = 404;
    throw err;
  }
  const fir = firRes.rows[0];

  // Citizen owner check
  if (user.role === 'CITIZEN' && user.citizenId !== fir.complainant_id) {
    const err = new Error('Forbidden: You can only view transfer records for your own cases.');
    err.statusCode = 403;
    throw err;
  }

  const query = `
    SELECT 
      ct.transfer_id,
      ct.case_id,
      ct.fir_id,
      ct.from_station_id,
      fs.name AS from_station_name,
      fs.code AS from_station_code,
      ct.to_station_id,
      ts.name AS to_station_name,
      ts.code AS to_station_code,
      u1.email AS transferred_by_user,
      ct.transfer_reason,
      ct.previous_status,
      ct.status AS transfer_status,
      u2.email AS resolved_by_user,
      ct.resolution_remarks,
      ct.resolved_at,
      ct.created_at
    FROM case_transfers ct
    JOIN police_stations fs ON ct.from_station_id = fs.station_id
    JOIN police_stations ts ON ct.to_station_id = ts.station_id
    JOIN users u1 ON ct.transferred_by = u1.user_id
    LEFT JOIN users u2 ON ct.accepted_by = u2.user_id
    WHERE ct.fir_id = $1
    ORDER BY ct.created_at DESC;
  `;

  const result = await pool.query(query, [firId]);
  return result.rows;
}

module.exports = {
  initiateCaseTransfer,
  acceptCaseTransfer,
  rejectCaseTransfer,
  getStationIncomingTransfers,
  getCaseTransfers
};
