const crypto = require('crypto');
const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

async function generateTrackingId(client) {
  const currentYear = new Date().getFullYear();
  const countRes = await client.query(
    `SELECT COUNT(*) FROM fir WHERE tracking_id LIKE $1`,
    [`CMP-${currentYear}-%`]
  );
  const nextSeq = parseInt(countRes.rows[0].count, 10) + 1;
  const padded = String(nextSeq).padStart(6, '0');
  return `CMP-${currentYear}-${padded}`;
}

async function createComplaint({ citizenId, userId, data, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const isSubmitted = data.submitImmediately === true;
    const initialStatus = isSubmitted ? 'SUBMITTED' : 'DRAFT';
    const submittedAt = isSubmitted ? new Date() : null;

    let trackingId = null;
    if (isSubmitted) {
      trackingId = await generateTrackingId(client);
    }

    const query = `
      INSERT INTO fir (
        complainant_id, station_id, category_id, incident_dt,
        location_text, latitude, longitude, description,
        priority, status, tracking_id, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const values = [
      citizenId,
      data.stationId || null,
      data.categoryId || null,
      data.incidentDt || new Date(),
      data.locationText || 'Location not specified (Draft)',
      data.latitude || null,
      data.longitude || null,
      data.descriptionText || 'Draft complaint',
      data.priority || 2,
      initialStatus,
      trackingId,
      submittedAt
    ];

    const result = await client.query(query, values);
    const newFir = result.rows[0];

    if (Array.isArray(data.persons) && data.persons.length > 0) {
      for (const p of data.persons) {
        await client.query(
          `INSERT INTO fir_persons (fir_id, person_role, full_name, contact, address, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newFir.fir_id, p.personRole.toUpperCase(), p.fullName, p.contact || null, p.address || null, p.notes || null]
        );
      }
    }

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, NULL, $2, $3, $4)`,
      [newFir.fir_id, initialStatus, userId, isSubmitted ? 'Initial submission' : 'Saved as draft']
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'CITIZEN',
      action: isSubmitted ? 'FIR_SUBMITTED' : 'FIR_DRAFT_CREATED',
      entityType: 'fir',
      entityId: newFir.fir_id,
      newData: { fir_id: newFir.fir_id, status: initialStatus, tracking_id: trackingId },
      ipAddress
    });

    await client.query('COMMIT');
    return newFir;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function submitDraftComplaint({ firId, citizenId, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 AND complainant_id = $2 FOR UPDATE`,
      [firId, citizenId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found or does not belong to user.');
      err.statusCode = 404;
      throw err;
    }

    const currentFir = checkRes.rows[0];
    if (currentFir.status !== 'DRAFT') {
      const err = new Error(`Only complaints in DRAFT status can be submitted. Current status: ${currentFir.status}`);
      err.statusCode = 400;
      throw err;
    }

    if (!currentFir.category_id || !currentFir.location_text || !currentFir.description) {
      const err = new Error('Complaint must have category, location, and description before submission.');
      err.statusCode = 400;
      throw err;
    }

    const trackingId = await generateTrackingId(client);
    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'SUBMITTED',
           tracking_id = $1,
           submitted_at = now(),
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $2
       RETURNING *;`,
      [trackingId, firId]
    );

    const updateFir = updateRes.rows[0];
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'DRAFT', 'SUBMITTED', $2, 'Citizen submitted draft complaint')`,
      [firId, userId]
    );

    await client.query(
      `INSERT INTO notifications (user_id, fir_id, message)
       VALUES ($1, $2, $3)`,
      [userId, firId, `Your complaint has been submitted successfully with Tracking ID: ${trackingId}`]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'CITIZEN',
      action: 'FIR_SUBMITTED',
      entityType: 'fir',
      entityId: firId,
      oldData: { status: 'DRAFT' },
      newData: { status: 'SUBMITTED', tracking_id: trackingId },
      ipAddress
    });

    await client.query('COMMIT');
    return updateFir;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function respondToInfoRequest({ firId, citizenId, userId, responseText, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 AND complainant_id = $2 FOR UPDATE`,
      [firId, citizenId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found.');
      err.statusCode = 404;
      throw err;
    }

    const firRecord = checkRes.rows[0];
    if (firRecord.status !== 'INFO_REQUESTED') {
      const err = new Error(`Complaint is not waiting for info. Current status: ${firRecord.status}`);
      err.statusCode = 400;
      throw err;
    }

    const updateRes = await client.query(
      `UPDATE fir
       SET status = 'UNDER_REVIEW',
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $1
       RETURNING *;`,
      [firId]
    );

    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'INFO_REQUESTED', 'UNDER_REVIEW', $2, $3)`,
      [firId, userId, `Citizen response: ${responseText}`]
    );

    await logAuditEvent({
      actorId: userId,
      actorRole: 'CITIZEN',
      action: 'INFO_REQUESTED_RESPONDED',
      entityType: 'fir',
      entityId: firId,
      newData: { status: 'UNDER_REVIEW', response: responseText },
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

async function getComplaintByTrackingId(trackingId) {
  const firRes = await pool.query(
    `SELECT f.fir_id, f.tracking_id, f.fir_number,
            f.status, f.created_at, f.submitted_at, f.incident_dt, f.location_text,
            cc.name AS category_name, ps.name AS station_name, ps.code AS station_code
     FROM fir f
     LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     WHERE f.tracking_id = $1`,
    [trackingId.trim().toUpperCase()]
  );

  if (firRes.rows.length === 0) {
    return null;
  }

  const fir = firRes.rows[0];
  const historyRes = await pool.query(
    `SELECT csh.from_state, csh.to_state, csh.created_at, csh.note
     FROM case_status_history csh
     WHERE csh.fir_id = $1
     ORDER BY csh.created_at ASC`,
    [fir.fir_id]
  );
  return {
    ...fir,
    timeline: historyRes.rows
  };
}

/**
 * Check for duplicate complaints (FR-C4)
 * Same complainant + category + incident date window (24h) + location hint
 */
async function checkDuplicateHint({ citizenId, categoryId, incidentDt, locationText, excludeFirId = null }) {
  const query = `
    SELECT f.fir_id, f.tracking_id, f.fir_number, f.status, f.incident_dt, f.location_text, f.created_at,
           cc.name AS category_name, ps.name AS station_name
    FROM fir f
    LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
    LEFT JOIN police_stations ps ON f.station_id = ps.station_id
    WHERE f.complainant_id = $1
      AND f.category_id = $2
      AND ABS(EXTRACT(EPOCH FROM (f.incident_dt - $3::timestamptz))) <= 86400
      AND f.location_text ILIKE '%' || $4 || '%'
      AND f.status NOT IN ('REJECTED')
      AND ($5::BIGINT IS NULL OR f.fir_id != $5)
    ORDER BY f.created_at DESC
    LIMIT 5;
  `;

  const cleanLocation = (locationText || '').trim();
  const res = await pool.query(query, [
    citizenId,
    categoryId,
    incidentDt,
    cleanLocation,
    excludeFirId
  ]);

  const matches = res.rows;
  return {
    hasDuplicate: matches.length > 0,
    count: matches.length,
    matches,
    message:
      matches.length > 0
        ? `Notice: ${matches.length} existing complaint(s) matching this date, category and location found.`
        : 'No duplicate complaints detected.'
  };
}

/**
 * Edit Draft Complaint (FR-C3, §5.2, §6.4)
 * Guard: Only complaints in DRAFT status can be modified
 */
async function updateDraftComplaint({ firId, citizenId, userId, data, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Lock FIR row
    const checkRes = await client.query(
      `SELECT * FROM fir WHERE fir_id = $1 FOR UPDATE`,
      [firId]
    );

    if (checkRes.rows.length === 0) {
      const err = new Error('Complaint not found.');
      err.statusCode = 404;
      throw err;
    }

    const currentFir = checkRes.rows[0];

    // 2. Ownership Guard
    if (currentFir.complainant_id !== citizenId) {
      const err = new Error('Forbidden: You can only edit your own draft complaints.');
      err.statusCode = 403;
      throw err;
    }

    // 3. Status Guard: Must be in DRAFT state
    if (currentFir.status !== 'DRAFT') {
      const err = new Error(
        `Only complaints in DRAFT status can be edited. Current status: ${currentFir.status}. Submitted complaints are legally sealed.`
      );
      err.statusCode = 400;
      throw err;
    }

    // 4. Update FIR Fields
    const targetStationId = data.stationId !== undefined ? data.stationId : currentFir.station_id;
    const targetCategoryId = data.categoryId !== undefined ? data.categoryId : currentFir.category_id;
    const targetIncidentDt = data.incidentDt !== undefined ? data.incidentDt : currentFir.incident_dt;
    const targetLocationText = data.locationText !== undefined ? data.locationText.trim() : currentFir.location_text;
    const targetLatitude = data.latitude !== undefined ? data.latitude : currentFir.latitude;
    const targetLongitude = data.longitude !== undefined ? data.longitude : currentFir.longitude;
    const targetDescription = data.descriptionText !== undefined ? data.descriptionText.trim() : currentFir.description;
    const targetPriority = data.priority !== undefined ? data.priority : currentFir.priority;

    const updateRes = await client.query(
      `UPDATE fir
       SET station_id = $1,
           category_id = $2,
           incident_dt = $3,
           location_text = $4,
           latitude = $5,
           longitude = $6,
           description = $7,
           priority = $8,
           version = version + 1,
           updated_at = now()
       WHERE fir_id = $9
       RETURNING *;`,
      [
        targetStationId,
        targetCategoryId,
        targetIncidentDt,
        targetLocationText,
        targetLatitude,
        targetLongitude,
        targetDescription,
        targetPriority,
        firId
      ]
    );

    const updatedFir = updateRes.rows[0];

    // 5. Synchronize Linked Persons
    if (Array.isArray(data.persons)) {
      await client.query(`DELETE FROM fir_persons WHERE fir_id = $1`, [firId]);
      for (const p of data.persons) {
        await client.query(
          `INSERT INTO fir_persons (fir_id, person_role, full_name, contact, address, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [firId, p.personRole.toUpperCase().trim(), p.fullName.trim(), p.contact || null, p.address || null, p.notes || null]
        );
      }
    }

    // 6. Check Duplicate Hint
    let duplicateHint = { hasDuplicate: false, count: 0, matches: [] };
    if (updatedFir.category_id && updatedFir.incident_dt && updatedFir.location_text) {
      duplicateHint = await checkDuplicateHint({
        citizenId,
        categoryId: updatedFir.category_id,
        incidentDt: updatedFir.incident_dt,
        locationText: updatedFir.location_text,
        excludeFirId: firId
      });
    }

    // 7. Audit Log
    await logAuditEvent({
      client,
      actorId: userId,
      actorRole: 'CITIZEN',
      action: 'FIR_DRAFT_UPDATED',
      entityType: 'fir',
      entityId: firId,
      oldData: {
        station_id: currentFir.station_id,
        category_id: currentFir.category_id,
        location_text: currentFir.location_text,
        priority: currentFir.priority
      },
      newData: {
        station_id: updatedFir.station_id,
        category_id: updatedFir.category_id,
        location_text: updatedFir.location_text,
        priority: updatedFir.priority,
        version: updatedFir.version
      },
      ipAddress
    });

    await client.query('COMMIT');

    return {
      ...updatedFir,
      persons_count: Array.isArray(data.persons) ? data.persons.length : undefined,
      duplicateHint
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Generate Official Complaint Acknowledgement Slip / FIR Slip (FR-C6, §5.2, §12.2)
 */
async function generateAcknowledgementSlip(firIdentifier, user) {
  // Query FIR with joined data
  const firRes = await pool.query(
    `SELECT f.*,
            ps.name AS station_name, ps.code AS station_code, ps.district AS station_district,
            ps.contact_phone AS station_phone, ps.email AS station_email,
            cc.name AS category_name, cc.description AS category_desc,
            cit.full_name AS complainant_name, u.phone AS complainant_phone,
            cit.address AS complainant_address, cit.id_proof_type AS complainant_id_type,
            cit.id_proof_last4 AS masked_id_number,
            u.email AS complainant_email
     FROM fir f
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
     LEFT JOIN citizens cit ON f.complainant_id = cit.citizen_id
     LEFT JOIN users u ON cit.user_id = u.user_id
     WHERE f.fir_id::text = $1 OR f.tracking_id = $1 OR f.fir_number = $1`,
    [String(firIdentifier)]
  );

  if (firRes.rows.length === 0) {
    const err = new Error('Complaint or FIR record not found.');
    err.statusCode = 404;
    throw err;
  }

  const fir = firRes.rows[0];

  // Scoping checks:
  if (user && user.role === 'CITIZEN' && user.citizenId !== fir.complainant_id) {
    const err = new Error('Forbidden: You can only view acknowledgement slips for your own complaints.');
    err.statusCode = 403;
    throw err;
  }

  if (user && ['DESK_OFFICER', 'IO', 'SHO'].includes(user.role) && user.stationId && fir.station_id && user.stationId !== fir.station_id) {
    const err = new Error('Forbidden: You can only generate slips for cases within your station jurisdiction.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch Legal sections
  const secRes = await pool.query(
    `SELECT ls.act, ls.section_no, ls.title, ls.is_cognizable, ls.is_bailable, ls.description
     FROM fir_sections fs
     JOIN legal_sections ls ON fs.section_id = ls.section_id
     WHERE fs.fir_id = $1
     ORDER BY ls.act ASC, ls.section_no ASC`,
    [fir.fir_id]
  );

  // Fetch Linked Persons
  const personsRes = await pool.query(
    `SELECT person_role, full_name, contact, address, notes
     FROM fir_persons
     WHERE fir_id = $1
     ORDER BY person_id ASC`,
    [fir.fir_id]
  );

  // Fetch Attachments
  const attachRes = await pool.query(
    `SELECT attachment_id, file_name, mime_type AS file_type, size_bytes AS file_size, sha256 AS sha256_hash, uploaded_at AS created_at
     FROM attachments
     WHERE fir_id = $1
     ORDER BY attachment_id ASC`,
    [fir.fir_id]
  );

  // Fetch Case & IO details if registered
  const caseRes = await pool.query(
    `SELECT c.case_id, c.investigation_started_at, c.report_type, c.outcome, c.closed_at,
            o.officer_id, o.full_name AS io_name, o.badge_no AS io_badge, o.rank AS io_rank,
            u.email AS io_email
     FROM cases c
     LEFT JOIN officers o ON c.current_io_id = o.officer_id
     LEFT JOIN users u ON o.user_id = u.user_id
     WHERE c.fir_id = $1`,
    [fir.fir_id]
  );
  const caseInfo = caseRes.rows.length > 0 ? caseRes.rows[0] : null;

  // Determine Document Category
  const isRegisteredFir = Boolean(fir.fir_number);
  const documentType = isRegisteredFir ? 'OFFICIAL_FIR_SLIP' : 'COMPLAINT_INTAKE_ACKNOWLEDGEMENT';
  const documentTitle = isRegisteredFir
    ? 'FIRST INFORMATION REPORT (FIR) STATUTORY ACKNOWLEDGEMENT SLIP'
    : 'CITIZEN COMPLAINT INTAKE ACKNOWLEDGEMENT SLIP';

  // Digital Anti-Tamper Seal
  const sealPayload = `${fir.fir_id}|${fir.tracking_id || ''}|${fir.fir_number || ''}|${fir.incident_dt}|${fir.complainant_id}|${fir.station_id}|${fir.status}`;
  const verificationDigest = crypto.createHash('sha256').update(sealPayload).digest('hex');

  const statutoryDisclaimer =
    'This is a computer-generated official acknowledgement slip issued under the Online FIR & Case Management System. As per statutory provisions under Section 173(2) BNSS / Section 154(2) CrPC, a copy of the First Information Report (FIR) shall be given forthwith, free of cost, to the complainant or informant. Furnishing false information or filing frivolous complaints is a punishable offence under Bharatiya Nyaya Sanhita (BNS) Section 217.';

  return {
    documentType,
    documentTitle,
    firId: fir.fir_id,
    trackingId: fir.tracking_id,
    firNumber: fir.fir_number,
    status: fir.status,
    priority: fir.priority === 1 ? 'High' : fir.priority === 2 ? 'Medium' : 'Low',
    submittedAt: fir.submitted_at,
    registeredAt: fir.registered_at || null,
    createdAt: fir.created_at,
    policeStation: {
      stationId: fir.station_id,
      name: fir.station_name || 'Station Unassigned / Zero FIR',
      code: fir.station_code || 'ZERO-FIR',
      district: fir.station_district,
      contactPhone: fir.station_phone,
      email: fir.station_email
    },
    complainant: {
      fullName: fir.complainant_name,
      phone: fir.complainant_phone,
      address: fir.complainant_address,
      idType: fir.complainant_id_type,
      maskedIdNumber: fir.masked_id_number,
      email: fir.complainant_email
    },
    incident: {
      incidentDt: fir.incident_dt,
      locationText: fir.location_text,
      latitude: fir.latitude,
      longitude: fir.longitude,
      categoryName: fir.category_name,
      categoryDescription: fir.category_desc,
      description: fir.description
    },
    legalSections: secRes.rows,
    persons: personsRes.rows,
    attachments: attachRes.rows.map(a => ({
      attachmentId: a.attachment_id,
      fileName: a.file_name,
      fileType: a.file_type,
      fileSize: a.file_size,
      sha256: a.sha256_hash,
      uploadedAt: a.created_at
    })),
    investigation: caseInfo
      ? {
          caseId: caseInfo.case_id,
          assignedIoName: caseInfo.io_name || 'Not yet assigned',
          badgeNo: caseInfo.io_badge || null,
          rank: caseInfo.io_rank || null,
          contactEmail: caseInfo.io_email || null,
          investigationStartedAt: caseInfo.investigation_started_at,
          reportType: caseInfo.report_type,
          closedAt: caseInfo.closed_at
        }
      : null,
    digitalSeal: {
      algorithm: 'SHA-256',
      verificationDigest,
      issuedAt: new Date().toISOString()
    },
    disclaimer: statutoryDisclaimer
  };
}

module.exports = {
  createComplaint,
  submitDraftComplaint,
  respondToInfoRequest,
  getComplaintByTrackingId,
  checkDuplicateHint,
  updateDraftComplaint,
  generateAcknowledgementSlip
};