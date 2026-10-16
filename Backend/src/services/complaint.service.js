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

module.exports = {
  createComplaint,
  submitDraftComplaint,
  respondToInfoRequest,
  getComplaintByTrackingId
};