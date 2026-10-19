const pool = require('../config/db');

/**
 * 1. Cases per station and status breakdown (FR-U4)
 */
async function getCasesByStatus({ stationId } = {}) {
  const params = [];
  let stationFilter = '';
  if (stationId) {
    params.push(stationId);
    stationFilter = 'WHERE f.station_id = $1';
  }

  const query = `
    SELECT 
      COALESCE(ps.name, 'Zero FIR Pool') AS station_name,
      ps.district,
      f.status,
      COUNT(f.fir_id)::INT AS total_cases,
      COUNT(CASE WHEN f.priority = 1 THEN 1 END)::INT AS high_priority_cases
    FROM fir f
    LEFT JOIN police_stations ps ON f.station_id = ps.station_id
    ${stationFilter}
    GROUP BY ps.name, ps.district, f.status
    ORDER BY station_name, total_cases DESC;
  `;
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * 2. Average Turnaround Time per Lifecycle Phase (SQL Window Functions & Aggregations)
 */
async function getTurnaroundTime({ stationId } = {}) {
  const params = [];
  let stationFilter = '';
  if (stationId) {
    params.push(stationId);
    stationFilter = 'AND f.station_id = $1';
  }

  const query = `
    SELECT 
      COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (f.registered_at - f.submitted_at)) / 86400.0), 2), 0) AS avg_days_to_register,
      COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - f.registered_at)) / 86400.0), 2), 0) AS avg_days_to_close,
      COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - f.submitted_at)) / 86400.0), 2), 0) AS avg_total_lifecycle_days,
      COUNT(c.case_id)::INT AS sample_closed_cases
    FROM fir f
    JOIN cases c ON f.fir_id = c.fir_id
    WHERE c.closed_at IS NOT NULL ${stationFilter};
  `;
  const result = await pool.query(query, params);
  return result.rows[0] || {
    avg_days_to_register: 0,
    avg_days_to_close: 0,
    avg_total_lifecycle_days: 0,
    sample_closed_cases: 0
  };
}

/**
 * 3. IO Workload and Caseload Ranking (Window Function: DENSE_RANK())
 */
async function getIOWorkload({ stationId } = {}) {
  const params = [];
  let stationFilter = '';
  if (stationId) {
    params.push(stationId);
    stationFilter = 'WHERE o.station_id = $1';
  }

  const query = `
    SELECT 
      o.officer_id,
      o.full_name AS officer_name,
      o.badge_no,
      o.rank,
      ps.name AS station_name,
      COUNT(c.case_id) FILTER (WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL'))::INT AS active_cases,
      COUNT(c.case_id) FILTER (WHERE f.status = 'CLOSED')::INT AS closed_cases,
      DENSE_RANK() OVER (
        ORDER BY COUNT(c.case_id) FILTER (WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION', 'PENDING_APPROVAL')) DESC
      )::INT AS workload_rank
    FROM officers o
    JOIN police_stations ps ON o.station_id = ps.station_id
    LEFT JOIN cases c ON o.officer_id = c.current_io_id
    LEFT JOIN fir f ON c.fir_id = f.fir_id
    ${stationFilter}
    GROUP BY o.officer_id, o.full_name, o.badge_no, o.rank, ps.name
    ORDER BY active_cases DESC, o.full_name ASC;
  `;
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * 4. Monthly Crime Trends (DATE_TRUNC)
 */
async function getCrimeTrends({ months = 12 } = {}) {
  const query = `
    SELECT 
      TO_CHAR(DATE_TRUNC('month', f.incident_dt), 'YYYY-MM') AS month_period,
      COALESCE(cc.name, 'Uncategorized') AS category_name,
      COUNT(f.fir_id)::INT AS incident_count
    FROM fir f
    LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
    WHERE f.incident_dt >= NOW() - ($1 || ' months')::INTERVAL
    GROUP BY DATE_TRUNC('month', f.incident_dt), cc.name
    ORDER BY month_period DESC, incident_count DESC;
  `;
  const result = await pool.query(query, [months]);
  return result.rows;
}

/**
 * 5. Stale / SLA Backlog Cases Monitor (Pending without diary update)
 */
async function getStaleCases({ thresholdDays = 15 } = {}) {
  const query = `
    SELECT 
      f.fir_id,
      f.fir_number,
      f.status,
      ps.name AS station_name,
      o.full_name AS assigned_io,
      f.updated_at AS last_activity,
      EXTRACT(DAY FROM (NOW() - f.updated_at))::INT AS days_inactive
    FROM fir f
    LEFT JOIN police_stations ps ON f.station_id = ps.station_id
    LEFT JOIN cases c ON f.fir_id = c.fir_id
    LEFT JOIN officers o ON c.current_io_id = o.officer_id
    WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION')
      AND f.updated_at < NOW() - ($1 || ' days')::INTERVAL
    ORDER BY days_inactive DESC;
  `;
  const result = await pool.query(query, [thresholdDays]);
  return result.rows;
}

/**
 * 6. Evidence Status Breakdown
 */
async function getEvidenceSummary() {
  const query = `
    SELECT 
      e.status,
      e.evidence_type,
      COUNT(e.evidence_id)::INT AS total_items,
      COUNT(e.file_sha256)::INT AS digital_items_with_hash
    FROM evidence e
    GROUP BY e.status, e.evidence_type
    ORDER BY e.status, total_items DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Convert JSON array to RFC-4180 CSV
 */
function toCsv(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers
      .map(fieldName => {
        let val = row[fieldName] ?? '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

module.exports = {
  getCasesByStatus,
  getTurnaroundTime,
  getIOWorkload,
  getCrimeTrends,
  getStaleCases,
  getEvidenceSummary,
  toCsv
};
