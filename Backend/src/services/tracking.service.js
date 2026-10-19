const pool = require('../config/db');

/**
 * Public tracking lookup by tracking_id (FR-T1)
 * Strips all PII and internal sensitive details
 */
async function getPublicTrackingInfo(trackingId) {
  const query = `
    SELECT 
      f.fir_id,
      f.tracking_id,
      f.fir_number,
      f.status,
      f.priority,
      f.incident_dt,
      f.submitted_at,
      f.registered_at,
      ps.name AS station_name,
      ps.district,
      cc.name AS crime_category
    FROM fir f
    LEFT JOIN police_stations ps ON f.station_id = ps.station_id
    LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
    WHERE f.tracking_id = $1;
  `;
  const result = await pool.query(query, [trackingId]);
  if (result.rows.length === 0) {
    const error = new Error('Invalid tracking ID. No record found.');
    error.statusCode = 404;
    throw error;
  }

  const record = result.rows[0];
  return {
    trackingId: record.tracking_id,
    firNumber: record.fir_number,
    status: record.status,
    priority: record.priority,
    station: record.station_name ? `${record.station_name}, ${record.district}` : 'Zero FIR (Unassigned Station)',
    crimeCategory: record.crime_category,
    incidentDate: record.incident_dt,
    submittedAt: record.submitted_at,
    registeredAt: record.registered_at
  };
}

/**
 * Authenticated Unified Chronological Case Timeline (FR-T2)
 * Merges case_status_history and citizen-visible case_updates
 */
async function getCaseTimeline(firId, user) {
  // 1. Fetch FIR details and verify authorization
  const firRes = await pool.query(
    `SELECT f.fir_id, f.tracking_id, f.fir_number, f.status, f.complainant_id, f.station_id,
            ps.name AS station_name,
            c.case_id, c.investigation_started_at, c.outcome, c.closed_at,
            o.full_name AS io_name, o.rank AS io_rank, o.badge_no AS io_badge
     FROM fir f
     LEFT JOIN police_stations ps ON f.station_id = ps.station_id
     LEFT JOIN cases c ON f.fir_id = c.fir_id
     LEFT JOIN officers o ON c.current_io_id = o.officer_id
     WHERE f.fir_id = $1`,
    [firId]
  );

  if (firRes.rows.length === 0) {
    const error = new Error('FIR record not found');
    error.statusCode = 404;
    throw error;
  }

  const fir = firRes.rows[0];

  // Citizen scope check: citizen must be the complainant
  if (user.role === 'CITIZEN' && Number(fir.complainant_id) !== Number(user.citizenId)) {
    const error = new Error('Forbidden: You can only view timeline for your own complaints');
    error.statusCode = 403;
    throw error;
  }

  // Station scope check for DESK_OFFICER and SHO
  if (['DESK_OFFICER', 'SHO'].includes(user.role) && user.stationId && Number(fir.station_id) !== Number(user.stationId)) {
    const error = new Error('Forbidden: Case belongs to another police station');
    error.statusCode = 403;
    throw error;
  }

  // 2. Fetch State Transition History
  const historyRes = await pool.query(
    `SELECT 
       csh.history_id,
       csh.from_state,
       csh.to_state,
       csh.note,
       csh.created_at,
       u.email AS actor_email,
       r.code AS actor_role
     FROM case_status_history csh
     JOIN users u ON csh.actor_id = u.user_id
     JOIN roles r ON u.role_id = r.role_id
     WHERE csh.fir_id = $1
     ORDER BY csh.created_at ASC`,
    [firId]
  );

  // 3. Fetch Case Diary Updates (filter visible_to_citizen for citizens)
  let updatesQuery = `
    SELECT 
      cu.update_id,
      cu.update_type,
      cu.body,
      cu.visible_to_citizen,
      cu.created_at,
      o.full_name AS officer_name,
      o.rank AS officer_rank
    FROM case_updates cu
    JOIN officers o ON cu.officer_id = o.officer_id
    WHERE cu.case_id = $1
  `;
  if (user.role === 'CITIZEN') {
    updatesQuery += ` AND cu.visible_to_citizen = TRUE`;
  }
  updatesQuery += ` ORDER BY cu.created_at ASC`;

  const updatesRes = fir.case_id ? await pool.query(updatesQuery, [fir.case_id]) : { rows: [] };

  // 4. Merge events into a single chronological array
  const events = [];

  historyRes.rows.forEach(h => {
    events.push({
      eventType: 'STATUS_CHANGE',
      timestamp: h.created_at,
      title: `Status changed to ${h.to_state}`,
      description: h.note || `Transition from ${h.from_state || 'INITIAL'} to ${h.to_state}`,
      fromState: h.from_state,
      toState: h.to_state,
      actor: user.role === 'CITIZEN' ? 'Police Administration' : `${h.actor_role} (${h.actor_email})`
    });
  });

  updatesRes.rows.forEach(u => {
    events.push({
      eventType: 'INVESTIGATION_UPDATE',
      timestamp: u.created_at,
      title: `Investigation Activity: ${u.update_type}`,
      description: u.body,
      officer: `${u.officer_rank} ${u.officer_name}`,
      isInternal: !u.visible_to_citizen
    });
  });

  // Sort chronological ascending
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    firId: fir.fir_id,
    trackingId: fir.tracking_id,
    firNumber: fir.fir_number,
    currentStatus: fir.status,
    station: fir.station_name,
    assignedIO: fir.io_name ? `${fir.io_rank} ${fir.io_name} (Badge: ${fir.io_badge})` : 'Not yet assigned',
    outcome: fir.outcome,
    closedAt: fir.closed_at,
    totalEvents: events.length,
    timeline: events
  };
}

/**
 * Submit Citizen Feedback on Closed Case (FR-T4)
 */
async function submitCitizenFeedback(firId, citizenId, { rating, comments, timelinessRating, conductRating }) {
  // 1. Verify case exists and is in CLOSED state
  const firRes = await pool.query(
    'SELECT fir_id, complainant_id, status FROM fir WHERE fir_id = $1',
    [firId]
  );

  if (firRes.rows.length === 0) {
    const error = new Error('FIR not found');
    error.statusCode = 404;
    throw error;
  }

  const fir = firRes.rows[0];

  if (Number(fir.complainant_id) !== Number(citizenId)) {
    const error = new Error('Forbidden: You can only submit feedback for your own cases');
    error.statusCode = 403;
    throw error;
  }

  if (fir.status !== 'CLOSED') {
    const error = new Error(`Feedback can only be submitted for CLOSED cases. Current status: ${fir.status}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Insert feedback
  const insertQuery = `
    INSERT INTO citizen_feedback (
      fir_id, citizen_id, rating, comments, timeliness_rating, police_conduct_rating
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING feedback_id, fir_id, rating, comments, timeliness_rating, police_conduct_rating, created_at;
  `;

  try {
    const result = await pool.query(insertQuery, [
      firId,
      citizenId,
      rating,
      comments || null,
      timelinessRating || null,
      conductRating || null
    ]);
    return result.rows[0];
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      const error = new Error('Feedback has already been submitted for this case');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
}

/**
 * Get feedback for an FIR
 */
async function getCaseFeedback(firId) {
  const query = `
    SELECT cf.*, c.full_name AS complainant_name
    FROM citizen_feedback cf
    JOIN citizens c ON cf.citizen_id = c.citizen_id
    WHERE cf.fir_id = $1;
  `;
  const result = await pool.query(query, [firId]);
  return result.rows[0] || null;
}

module.exports = {
  getPublicTrackingInfo,
  getCaseTimeline,
  submitCitizenFeedback,
  getCaseFeedback
};
