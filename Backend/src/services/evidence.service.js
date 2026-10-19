const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { computeFileSha256 } = require('../utils/file.util');
const { logAuditEvent } = require('./audit.service');

/**
 * Generates sequential, collision-free evidence number per case (FR-E2)
 * Format: EVD-<FIR_NUMBER_SANITIZED>-<SEQ_NUMBER>
 */
async function generateNextEvidenceNumber(client, caseId, firNumber) {
  const countRes = await client.query(
    'SELECT COUNT(*) FROM evidence WHERE case_id = $1',
    [caseId]
  );
  const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
  const paddedSeq = String(nextSeq).padStart(2, '0');

  // Sanitize FIR Number by replacing '/' and spaces with '-'
  const cleanFirNo = (firNumber || `CASE-${caseId}`).replace(/[\/\s]/g, '-');
  return `EVD-${cleanFirNo}-${paddedSeq}`;
}

/**
 * 1. Add Evidence Item (FR-E1 & FR-E2)
 * Supports physical, digital, weapons, etc.
 * Computes SHA-256 for digital uploads and records initial custody log.
 */
async function addEvidence({
  caseId,
  officerId,
  userId,
  userRole,
  stationId,
  data,
  file,
  ipAddress
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Case and FIR info
    const caseRes = await client.query(
      `SELECT c.case_id, c.current_io_id, f.fir_id, f.fir_number, f.status AS fir_status, f.station_id
       FROM cases c
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE c.case_id = $1 FOR UPDATE`,
      [caseId]
    );

    if (caseRes.rows.length === 0) {
      const err = new Error('Case not found.');
      err.statusCode = 404;
      throw err;
    }

    const c = caseRes.rows[0];

    // Authorization & Scope check
    if (userRole === 'IO' && c.current_io_id !== officerId) {
      const err = new Error('Forbidden: Only the assigned Investigating Officer can log evidence for this case.');
      err.statusCode = 403;
      throw err;
    }

    if (userRole === 'SHO' && c.station_id !== stationId) {
      const err = new Error('Forbidden: SHO can only manage evidence for cases in their police station.');
      err.statusCode = 403;
      throw err;
    }

    // Status guard
    const activeStatuses = ['UNDER_INVESTIGATION', 'ASSIGNED', 'PENDING_APPROVAL', 'REOPENED'];
    if (!activeStatuses.includes(c.fir_status)) {
      const err = new Error(`Cannot add evidence when case is in status: ${c.fir_status}`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Compute file hash if file was uploaded
    let fileName = null;
    let filePath = null;
    let fileSizeBytes = null;
    let fileSha256 = null;

    if (file) {
      fileName = file.originalname;
      filePath = file.path;
      fileSizeBytes = file.size;
      fileSha256 = await computeFileSha256(file.path);
    }

    // 3. Generate Sequential Evidence Number
    const evidenceNo = await generateNextEvidenceNumber(client, caseId, c.fir_number);

    // 4. Insert into evidence table
    const insertRes = await client.query(
      `INSERT INTO evidence (
         case_id, evidence_no, evidence_type, description,
         collected_at, collected_by, current_holder_id,
         location_stored, status, file_name, file_path,
         file_size_bytes, file_sha256
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COLLECTED', $9, $10, $11, $12)
       RETURNING *;`,
      [
        caseId,
        evidenceNo,
        data.evidenceType.toUpperCase(),
        data.description.trim(),
        data.collectedAt || new Date(),
        officerId,
        officerId, // Current holder is the collecting officer initially
        data.locationStored || 'In transit / with investigating officer',
        fileName,
        filePath,
        fileSizeBytes,
        fileSha256
      ]
    );

    const newEvidence = insertRes.rows[0];

    // 5. Create initial append-only custody log entry (FR-E3)
    await client.query(
      `INSERT INTO evidence_custody_log (
         evidence_id, from_holder, to_holder, purpose, remarks
       ) VALUES ($1, NULL, $2, $3, $4);`,
      [
        newEvidence.evidence_id,
        officerId,
        'INITIAL_COLLECTION',
        `Evidence collected at scene/intake by officer`
      ]
    );

    // 6. Audit log entry (PROJECT_CONTEXT.md §9.1)
    await logAuditEvent({
      client,
      actorId: userId,
      actorRole: userRole,
      action: 'EVIDENCE_LOGGED',
      entityType: 'evidence',
      entityId: newEvidence.evidence_id,
      newData: {
        evidence_no: newEvidence.evidence_no,
        case_id: caseId,
        evidence_type: newEvidence.evidence_type,
        status: 'COLLECTED',
        file_sha256: newEvidence.file_sha256
      },
      ipAddress
    });

    await client.query('COMMIT');
    return newEvidence;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 2. Transfer Evidence Custody (FR-E3 & FR-E4)
 * Handover: e.g. IO -> Malkhana in-charge, or Malkhana -> Forensic Lab, or Court
 * Strictly append-only in evidence_custody_log
 */
async function transferCustody({
  evidenceId,
  officerId,
  userId,
  userRole,
  stationId,
  toHolderId,
  purpose,
  newStatus,
  remarks,
  locationStored,
  ipAddress
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and lock evidence row
    const evRes = await client.query(
      `SELECT e.*, c.case_id, c.current_io_id, f.station_id, f.fir_number
       FROM evidence e
       JOIN cases c ON e.case_id = c.case_id
       JOIN fir f ON c.fir_id = f.fir_id
       WHERE e.evidence_id = $1 FOR UPDATE`,
      [evidenceId]
    );

    if (evRes.rows.length === 0) {
      const err = new Error('Evidence item not found.');
      err.statusCode = 404;
      throw err;
    }

    const ev = evRes.rows[0];

    // Check authorization: must be current holder, SHO of the station, or Admin
    const isCurrentHolder = ev.current_holder_id === officerId;
    const isStationSho = userRole === 'SHO' && ev.station_id === stationId;
    const isAdmin = userRole === 'ADMIN';

    if (!isCurrentHolder && !isStationSho && !isAdmin) {
      const err = new Error('Forbidden: Only the current custody holder or station SHO can transfer this evidence.');
      err.statusCode = 403;
      throw err;
    }

    // 2. Verify destination officer exists and is active
    const destOfficerRes = await client.query(
      `SELECT o.officer_id, o.full_name, o.badge_no, o.rank
       FROM officers o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.officer_id = $1 AND u.is_active = TRUE`,
      [toHolderId]
    );

    if (destOfficerRes.rows.length === 0) {
      const err = new Error('Destination officer does not exist or account is inactive.');
      err.statusCode = 400;
      throw err;
    }

    const destOfficer = destOfficerRes.rows[0];

    // 3. Append to evidence_custody_log (FR-E3: immutable chain of custody)
    await client.query(
      `INSERT INTO evidence_custody_log (
         evidence_id, from_holder, to_holder, purpose, remarks
       ) VALUES ($1, $2, $3, $4, $5);`,
      [
        evidenceId,
        ev.current_holder_id,
        toHolderId,
        purpose.trim(),
        remarks ? remarks.trim() : null
      ]
    );

    // 4. Update evidence table status, holder, location
    const updateRes = await client.query(
      `UPDATE evidence
       SET current_holder_id = $1,
           status = $2,
           location_stored = COALESCE($3, location_stored),
           updated_at = now()
       WHERE evidence_id = $4
       RETURNING *;`,
      [
        toHolderId,
        newStatus.toUpperCase(),
        locationStored ? locationStored.trim() : null,
        evidenceId
      ]
    );

    const updatedEvidence = updateRes.rows[0];

    // 5. Append audit log
    await logAuditEvent({
      client,
      actorId: userId,
      actorRole: userRole,
      action: 'EVIDENCE_CUSTODY_TRANSFERRED',
      entityType: 'evidence',
      entityId: evidenceId,
      oldData: {
        from_holder_id: ev.current_holder_id,
        status: ev.status,
        location_stored: ev.location_stored
      },
      newData: {
        to_holder_id: toHolderId,
        to_officer_name: destOfficer.full_name,
        status: newStatus.toUpperCase(),
        purpose,
        location_stored: updatedEvidence.location_stored
      },
      ipAddress
    });

    await client.query('COMMIT');
    return updatedEvidence;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. Verify Evidence File Integrity (FR-E6)
 * Re-hashes file on disk and verifies against stored cryptographic SHA-256
 */
async function verifyEvidenceIntegrity(evidenceId) {
  const evRes = await pool.query(
    `SELECT evidence_id, evidence_no, file_name, file_path, file_sha256
     FROM evidence
     WHERE evidence_id = $1`,
    [evidenceId]
  );

  if (evRes.rows.length === 0) {
    const err = new Error('Evidence item not found.');
    err.statusCode = 404;
    throw err;
  }

  const ev = evRes.rows[0];

  if (!ev.file_sha256 || !ev.file_path) {
    return {
      evidenceId: ev.evidence_id,
      evidenceNo: ev.evidence_no,
      hasFile: false,
      isValid: true,
      message: 'Physical evidence item without digital file attachment.'
    };
  }

  if (!fs.existsSync(ev.file_path)) {
    return {
      evidenceId: ev.evidence_id,
      evidenceNo: ev.evidence_no,
      hasFile: true,
      isValid: false,
      storedHash: ev.file_sha256,
      computedHash: null,
      message: 'File missing from storage disk. Potential data loss or tampering.'
    };
  }

  const computedHash = await computeFileSha256(ev.file_path);
  const isValid = computedHash.toLowerCase() === ev.file_sha256.trim().toLowerCase();

  return {
    evidenceId: ev.evidence_id,
    evidenceNo: ev.evidence_no,
    hasFile: true,
    isValid,
    storedHash: ev.file_sha256.trim(),
    computedHash,
    verifiedAt: new Date().toISOString(),
    message: isValid
      ? 'Cryptographic integrity verified. File matches SHA-256 hash.'
      : 'INTEGRITY MISMATCH: File has been altered or tampered on disk.'
  };
}

/**
 * 4. Get all evidence items for a given case
 */
async function getCaseEvidence(caseId, user) {
  // Check case access
  const caseRes = await pool.query(
    `SELECT c.case_id, c.fir_id, f.station_id, f.complainant_id
     FROM cases c
     JOIN fir f ON c.fir_id = f.fir_id
     WHERE c.case_id = $1`,
    [caseId]
  );

  if (caseRes.rows.length === 0) {
    const err = new Error('Case not found.');
    err.statusCode = 404;
    throw err;
  }

  const c = caseRes.rows[0];

  // Citizen scoping check
  if (user.role === 'CITIZEN' && user.citizenId !== c.complainant_id) {
    const err = new Error('Forbidden: Citizens can only view evidence for their own complaints.');
    err.statusCode = 403;
    throw err;
  }

  // Station check for station-scoped officers
  if (['DESK_OFFICER', 'IO', 'SHO'].includes(user.role) && user.stationId !== c.station_id) {
    const err = new Error('Forbidden: Officer cannot access evidence outside their police station.');
    err.statusCode = 403;
    throw err;
  }

  const evidenceRes = await pool.query(
    `SELECT e.*,
            cb.full_name AS collected_by_name, cb.badge_no AS collected_by_badge,
            ch.full_name AS current_holder_name, ch.badge_no AS current_holder_badge
     FROM evidence e
     LEFT JOIN officers cb ON e.collected_by = cb.officer_id
     LEFT JOIN officers ch ON e.current_holder_id = ch.officer_id
     WHERE e.case_id = $1
     ORDER BY e.created_at ASC`,
    [caseId]
  );

  return evidenceRes.rows;
}

/**
 * 5. Get detailed evidence info with complete Chain of Custody log (FR-E3)
 */
async function getEvidenceDetails(evidenceId, user) {
  const evRes = await pool.query(
    `SELECT e.*,
            cb.full_name AS collected_by_name, cb.badge_no AS collected_by_badge, cb.rank AS collected_by_rank,
            ch.full_name AS current_holder_name, ch.badge_no AS current_holder_badge, ch.rank AS current_holder_rank,
            c.case_id, f.fir_id, f.fir_number, f.station_id, f.complainant_id, ps.name AS station_name
     FROM evidence e
     JOIN cases c ON e.case_id = c.case_id
     JOIN fir f ON c.fir_id = f.fir_id
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     LEFT JOIN officers cb ON e.collected_by = cb.officer_id
     LEFT JOIN officers ch ON e.current_holder_id = ch.officer_id
     WHERE e.evidence_id = $1`,
    [evidenceId]
  );

  if (evRes.rows.length === 0) {
    const err = new Error('Evidence item not found.');
    err.statusCode = 404;
    throw err;
  }

  const ev = evRes.rows[0];

  // Citizen scoping check
  if (user.role === 'CITIZEN' && user.citizenId !== ev.complainant_id) {
    const err = new Error('Forbidden: You can only view evidence for your own cases.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch full chronological custody log
  const custodyRes = await pool.query(
    `SELECT ecl.log_id, ecl.purpose, ecl.remarks, ecl.transferred_at,
            fh.officer_id AS from_officer_id, fh.full_name AS from_officer_name, fh.badge_no AS from_officer_badge,
            th.officer_id AS to_officer_id, th.full_name AS to_officer_name, th.badge_no AS to_officer_badge
     FROM evidence_custody_log ecl
     LEFT JOIN officers fh ON ecl.from_holder = fh.officer_id
     LEFT JOIN officers th ON ecl.to_holder = th.officer_id
     WHERE ecl.evidence_id = $1
     ORDER BY ecl.transferred_at ASC`,
    [evidenceId]
  );

  return {
    ...ev,
    custodyChain: custodyRes.rows
  };
}

module.exports = {
  addEvidence,
  transferCustody,
  verifyEvidenceIntegrity,
  getCaseEvidence,
  getEvidenceDetails
};
