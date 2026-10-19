# Feature 6: Tamper-Evident Hash-Chained Audit Trail & Statistical Analytics/Reporting Implementation Guide

This guide documents the full architecture, database schema, cryptographic SHA-256 hash chaining, tamper detection engine, and statistical analytics reporting for **Feature 6: Tamper-Evident Hash-Chained Audit Trail & Statistical Analytics/Reporting** (Functional Requirements FR-U1 to FR-U5, PROJECT_CONTEXT.md §5.7, §8.6, §9, §13).

This feature enforces institutional accountability, provides tamper-evident audit logs with cryptographic hash-chaining (blockchain-like verifiable continuity), and offers an analytical reporting engine with window functions and aggregations for police station performance in alignment with **SDG 16: Peace, Justice and Strong Institutions (Targets 16.5 & 16.6)**.

The work is strictly divided for a **team of 2 developers** working in parallel without merge conflicts.

---

## 1. System Contract & Cryptographic Audit Blueprint

```mermaid
flowchart TD
    subgraph Cryptographic Hash Chain
        R0[Genesis Row<br/>prev_hash: 0000...0000]
        R1[Audit Row #1<br/>prev_hash: Row 0 Hash<br/>row_hash: SHA-256(...)]
        R2[Audit Row #2<br/>prev_hash: Row 1 Hash<br/>row_hash: SHA-256(...)]
        R3[Audit Row #3<br/>prev_hash: Row 2 Hash<br/>row_hash: SHA-256(...)]
    end

    R0 --> R1 --> R2 --> R3

    subgraph Defense in Depth
        TRG[DB Trigger: <code>trg_block_mutation</code><br/>Blocks all UPDATE & DELETE]
        CANON[Canonical JSON Serialization<br/>Deterministic key ordering]
        VERIFY[Verification Routine: <code>/api/audit/verify</code><br/>Sequential recomputation]
    end

    R1 -.-> TRG
    R2 -.-> CANON
    R3 -.-> VERIFY
```

### A. Core Architectural Guarantees & Security Guards
1. **Cryptographic SHA-256 Hash Chaining (§9.3):**  
   Every audit record computes its `row_hash` using:
   ```
   row_hash = SHA256( prev_hash || ts || actor_id || action || entity_type || entity_id || canonical_json(old_data) || canonical_json(new_data) )
   ```
   The first record links to `GENESIS_HASH` (64 zeros). Every subsequent record links to the previous row's hash.
2. **Deterministic Canonical JSON Serialization:**  
   PostgreSQL `JSONB` does not guarantee key order. A canonical sorting algorithm ensures keys are sorted deterministically before hashing, preventing hash mismatches.
3. **Database-Level Immutability Guard (§8.5 d):**  
   A `BEFORE UPDATE OR DELETE` trigger (`audit_no_update`) raises an exception on any attempt to alter or delete audit records, preventing even privileged database administrators from tampering with history silently.
4. **Automated Verification Engine (FR-U3):**  
   A dedicated endpoint (`GET /api/audit/verify`) validates chain continuity from row 1 to $N$. If any row's payload or link is modified, the algorithm pinpoints the exact audit ID, row index, and inconsistency.
5. **Role-Based Access Control Scoping (FR-U2):**  
   Audit logs and administrative analytics reports are restricted strictly to supervisory and governance roles: `SUPERVISOR`, `AUDITOR`, and `ADMIN`. Citizens and Desk Officers are blocked with `403 Forbidden`.

---

## 2. Member Responsibilities Split

| Area | Member 1: Database DDL, Hash Engine & Analytical SQL Queries | Member 2: APIs, Request Validators & Test Suite |
|---|---|---|
| **Primary Domain** | Database DDL & Migrations, Immutability Triggers, Cryptographic Hash Chain Generator, Audit Verification Engine, Advanced SQL Showcase Queries | Request Validators, Audit & Report Controllers, CSV Export Streamer, Route Mounting, Automated End-to-End Test Suite |
| **Files to Implement** | 1. `src/db/migrations/06_audit_reporting_schema.sql`<br>2. `src/services/audit.service.js`<br>3. `src/services/report.service.js` | 1. `src/validators/report.validator.js`<br>2. `src/controllers/report.controller.js`<br>3. `src/routes/report.route.js`<br>4. `src/routes/audit.route.js` (Verification & Filters)<br>5. `src/app.js` (Mounting)<br>6. `src/test-audit-reporting-apis.js` |
| **Database Tables & Features** | `audit_log`, `fir`, `cases`, `case_status_history`, `evidence`, `officers`, Window functions (`DENSE_RANK()`, `LAG()`), `DATE_TRUNC`, CSV generation | HTTP status codes, Query string parsing (`entityType`, `actorId`, `fromDate`), `Content-Type: text/csv` streaming |

---

## 3. Database Schema & Migration (`06_audit_reporting_schema.sql`)

### Tables, Triggers & Analytical Indexes:
1. **`audit_log`**: Append-only tamper-evident audit store.
2. **`trg_block_mutation`**: Trigger blocking `UPDATE` and `DELETE`.
3. **BRIN Index**: Block Range Index on `ts` for massive time-series audit queries.
4. **Permissions**: Seeds `audit:read`, `audit:verify`, `report:read`, `report:export`.

```sql
-- =========================================================================
-- Migration 06: Tamper-Evident Audit Trail & Reporting Views Schema
-- Aligns with PROJECT_CONTEXT.md §5.7 (FR-U1 to FR-U5), §8.6, §9, §13
-- =========================================================================

-- 1. Create Audit Log Table if not exists
CREATE TABLE IF NOT EXISTS audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  actor_role VARCHAR(30),
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  prev_hash CHAR(64) NOT NULL,
  row_hash CHAR(64) NOT NULL
);

-- Performance and Indexing (PROJECT_CONTEXT.md §8.6)
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_ts_brin ON audit_log USING BRIN(ts);

-- 2. Immutability Trigger (Blocks direct SQL UPDATE and DELETE mutations)
CREATE OR REPLACE FUNCTION trg_block_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table % is strictly append-only. UPDATE or DELETE operations are forbidden.', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_no_mutation ON audit_log;
CREATE TRIGGER trg_audit_no_mutation 
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();

-- 3. Register Permissions for Audit and Reporting
INSERT INTO permissions (code) VALUES
  ('audit:read'),
  ('audit:verify'),
  ('report:read'),
  ('report:export')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to SUPERVISOR, AUDITOR, and ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('SUPERVISOR', 'AUDITOR', 'ADMIN')
  AND p.code IN ('audit:read', 'audit:verify', 'report:read', 'report:export')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Grant SHO read access to station-specific reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code = 'SHO'
  AND p.code IN ('report:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;
```

---

## 4. API Specification & Endpoints

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/audit` | `SUPERVISOR`, `AUDITOR`, `ADMIN` | Query audit trail with filters (`entityType`, `actorId`, `action`, date range, pagination) |
| `GET` | `/api/audit/verify` | `SUPERVISOR`, `AUDITOR`, `ADMIN` | Sequentially recomputes SHA-256 hashes & validates cryptographic chain integrity |
| `GET` | `/api/reports/cases-by-status` | `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Case volume & lifecycle distribution grouped by police station and status |
| `GET` | `/api/reports/turnaround-time` | `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Average duration from `SUBMITTED` -> `REGISTERED` and `REGISTERED` -> `CLOSED` |
| `GET` | `/api/reports/io-workload` | `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Active case count ranking per IO using SQL window functions (`DENSE_RANK()`) |
| `GET` | `/api/reports/crime-trends` | `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Monthly incident volume by crime category (`DATE_TRUNC('month', incident_dt)`) |
| `GET` | `/api/reports/stale-cases` | `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | SLA violation monitor: Cases with no progress notes or transitions for > 15 days |
| `GET` | `/api/reports/evidence-summary`| `SHO`, `SUPERVISOR`, `AUDITOR`, `ADMIN` | Breakdown of exhibits by status (`COLLECTED`, `IN_STORAGE`, `IN_LAB`) across Malkhanas |
| `GET` | `/api/reports/:reportType/export`| `SUPERVISOR`, `AUDITOR`, `ADMIN` | Export any analytical report directly as an RFC-4180 CSV file |

---

# 👤 Member 1: Database DDL, Hash Engine & Analytical SQL Queries

## Task 1.1: Migration Execution
Create `Backend/src/db/migrations/06_audit_reporting_schema.sql` using the schema from Section 3.

---

## Task 1.2: Audit Engine & Cryptographic Verifier Service
**File:** `Backend/src/services/audit.service.js`  
*(Enforces canonical JSON serialization, SHA-256 hash chaining, and step-by-step cryptographic verification)*

```javascript
const crypto = require('crypto');
const pool = require('../config/db');

const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministic JSON stringifier (canonical sorting)
 * Prevents key reordering from invalidating cryptographic hashes
 */
function canonicalJson(obj) {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

/**
 * Log an audit event with SHA-256 hash-chaining
 */
async function logAuditEvent({
  client = null,
  actorId = null,
  actorRole = null,
  action,
  entityType,
  entityId = null,
  oldData = null,
  newData = null,
  ipAddress = null
}) {
  const db = client || pool;
  try {
    const latestRes = await db.query(
      'SELECT row_hash FROM audit_log ORDER BY audit_id DESC LIMIT 1'
    );
    const prevHash =
      latestRes.rows.length > 0 && latestRes.rows[0].row_hash
        ? latestRes.rows[0].row_hash.trim()
        : GENESIS_HASH;

    const ts = new Date().toISOString();
    const oldDataStr = canonicalJson(oldData);
    const newDataStr = canonicalJson(newData);

    const hashPayload = `${prevHash}${ts}${actorId ?? ''}${action}${entityType}${entityId ?? ''}${oldDataStr}${newDataStr}`;
    const rowHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const insertQuery = `
      INSERT INTO audit_log (
        ts, actor_id, actor_role, action, entity_type, entity_id,
        old_data, new_data, ip_address, prev_hash, row_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING audit_id, ts, action, entity_type, entity_id, row_hash;
    `;

    const res = await db.query(insertQuery, [
      ts,
      actorId || null,
      actorRole || null,
      action,
      entityType,
      entityId || null,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      ipAddress || null,
      prevHash,
      rowHash
    ]);

    return res.rows[0];
  } catch (err) {
    console.error('Audit logging error:', err.message);
    return null;
  }
}

/**
 * Verify cryptographic integrity of the entire audit chain (FR-U3)
 */
async function verifyAuditChain() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM audit_log ORDER BY audit_id ASC');
    const rows = res.rows;

    if (rows.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        message: 'Audit log is empty.'
      };
    }

    let expectedPrevHash = GENESIS_HASH;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const actualPrevHash = (row.prev_hash || '').trim();

      if (actualPrevHash !== expectedPrevHash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          brokenIndex: i,
          brokenAuditId: row.audit_id,
          reason: `Chain broken: prev_hash mismatch at audit_id ${row.audit_id}. Expected ${expectedPrevHash}, found ${actualPrevHash}.`
        };
      }

      const ts = new Date(row.ts).toISOString();
      const oldDataStr = canonicalJson(row.old_data);
      const newDataStr = canonicalJson(row.new_data);
      const hashPayload = `${actualPrevHash}${ts}${row.actor_id ?? ''}${row.action}${row.entity_type}${row.entity_id ?? ''}${oldDataStr}${newDataStr}`;
      const recomputedRowHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

      const storedRowHash = (row.row_hash || '').trim();
      if (recomputedRowHash !== storedRowHash) {
        return {
          isValid: false,
          totalRecords: rows.length,
          brokenIndex: i,
          brokenAuditId: row.audit_id,
          reason: `Payload tampered: row_hash mismatch at audit_id ${row.audit_id}. Stored hash does not match computed data.`
        };
      }

      expectedPrevHash = storedRowHash;
    }

    return {
      isValid: true,
      totalRecords: rows.length,
      message: 'Audit chain integrity verified. All cryptographic hashes match.'
    };
  } finally {
    client.release();
  }
}

/**
 * Filter audit logs with pagination (FR-U2)
 */
async function getAuditLogs({ entityType, entityId, actorId, action, fromDate, toDate, limit = 50, offset = 0 }) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (entityType) {
    conditions.push(`entity_type = $${paramIndex++}`);
    params.push(entityType);
  }
  if (entityId) {
    conditions.push(`entity_id = $${paramIndex++}`);
    params.push(entityId);
  }
  if (actorId) {
    conditions.push(`actor_id = $${paramIndex++}`);
    params.push(actorId);
  }
  if (action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(action);
  }
  if (fromDate) {
    conditions.push(`ts >= $${paramIndex++}`);
    params.push(new Date(fromDate));
  }
  if (toDate) {
    conditions.push(`ts <= $${paramIndex++}`);
    params.push(new Date(toDate));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT audit_id, ts, actor_id, actor_role, action, entity_type, entity_id,
           old_data, new_data, ip_address, prev_hash, row_hash
    FROM audit_log
    ${whereClause}
    ORDER BY audit_id DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  logAuditEvent,
  verifyAuditChain,
  getAuditLogs,
  canonicalJson
};
```

---

## Task 1.3: Statistical Reporting & SQL Analytics Service
**File:** `Backend/src/services/report.service.js`  
**Purpose:** Implements complex aggregation queries, window functions, and time-series metrics.

```javascript
const pool = require('../config/db');

/**
 * 1. Cases per station and status breakdown
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
 * 2. Average Turnaround Time per Lifecycle Phase (SQL Window Functions)
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
      ROUND(AVG(EXTRACT(EPOCH FROM (f.registered_at - f.submitted_at)) / 86400.0), 2) AS avg_days_to_register,
      ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - f.registered_at)) / 86400.0), 2) AS avg_days_to_close,
      ROUND(AVG(EXTRACT(EPOCH FROM (c.closed_at - f.submitted_at)) / 86400.0), 2) AS avg_total_lifecycle_days,
      COUNT(c.case_id)::INT AS sample_closed_cases
    FROM fir f
    JOIN cases c ON f.fir_id = c.fir_id
    WHERE c.closed_at IS NOT NULL ${stationFilter};
  `;
  const result = await pool.query(query, params);
  return result.rows[0];
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
 * 5. Stale / SLA Backlog Cases Monitor (Pending > 15 days without diary update)
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
      COUNT(e.file_sha256) AS digital_items_with_hash
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
```

---

# 👤 Member 2: APIs, Request Validators & Test Suite

## Task 2.1: Request Validators
**File:** `Backend/src/validators/report.validator.js`

```javascript
const ALLOWED_REPORTS = [
  'cases-by-status',
  'turnaround-time',
  'io-workload',
  'crime-trends',
  'stale-cases',
  'evidence-summary'
];

function validateReportType(req, res, next) {
  const { reportType } = req.params;
  if (!ALLOWED_REPORTS.includes(reportType)) {
    return res.status(400).json({
      success: false,
      message: `Invalid report type: '${reportType}'. Allowed types: ${ALLOWED_REPORTS.join(', ')}`
    });
  }
  next();
}

module.exports = {
  validateReportType,
  ALLOWED_REPORTS
};
```

---

## Task 2.2: Report Controller
**File:** `Backend/src/controllers/report.controller.js`

```javascript
const reportService = require('../services/report.service');

async function fetchReportData(reportType, query, user) {
  const stationId = ['DESK_OFFICER', 'SHO'].includes(user.role) ? user.stationId : query.stationId;

  switch (reportType) {
    case 'cases-by-status':
      return await reportService.getCasesByStatus({ stationId });
    case 'turnaround-time':
      return await reportService.getTurnaroundTime({ stationId });
    case 'io-workload':
      return await reportService.getIOWorkload({ stationId });
    case 'crime-trends':
      return await reportService.getCrimeTrends({ months: query.months || 12 });
    case 'stale-cases':
      return await reportService.getStaleCases({ thresholdDays: query.thresholdDays || 15 });
    case 'evidence-summary':
      return await reportService.getEvidenceSummary();
    default:
      throw new Error(`Report ${reportType} not implemented`);
  }
}

async function getReport(req, res, next) {
  try {
    const { reportType } = req.params;
    const data = await fetchReportData(reportType, req.query, req.user);
    return res.status(200).json({
      success: true,
      reportType,
      generatedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    next(error);
  }
}

async function exportReportCsv(req, res, next) {
  try {
    const { reportType } = req.params;
    const data = await fetchReportData(reportType, req.query, req.user);
    const records = Array.isArray(data) ? data : [data];
    const csvContent = reportService.toCsv(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReport,
  exportReportCsv
};
```

---

## Task 2.3: Routes & App Mounting
**File:** `Backend/src/routes/report.route.js`

```javascript
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const { validateReportType } = require('../validators/report.validator');

// Reports accessible to SHO, SUPERVISOR, AUDITOR, ADMIN
router.use(authenticateToken);
router.use(requireRoles('SHO', 'SUPERVISOR', 'AUDITOR', 'ADMIN'));

router.get('/:reportType/export', validateReportType, reportController.exportReportCsv);
router.get('/:reportType', validateReportType, reportController.getReport);

module.exports = router;
```

Update `Backend/src/app.js`:
```javascript
const reportRoutes = require('./routes/report.route');

app.use('/api/reports', reportRoutes);
```

---

## 5. Automated Verification Test Suite

Add script to `Backend/package.json`:
```json
"test:audit": "node src/test-audit-reporting-apis.js"
```

The automated test script validates:
1. Append-Only Trigger: Verifying that direct SQL `DELETE FROM audit_log` and `UPDATE audit_log` are rejected with a PostgreSQL trigger exception.
2. Cryptographic Hash-Chain Verification: Verifying that `/api/audit/verify` returns `isValid: true`.
3. Tamper Simulation Test: Simulating a modified payload and verifying that `/api/audit/verify` catches the broken chain with the exact row index.
4. Audit Explorer Filters: Filtering by `actorId`, `action`, `entityType`.
5. Analytical Reports: Validating JSON responses for all 6 reports (`cases-by-status`, `turnaround-time`, `io-workload`, `crime-trends`, `stale-cases`, `evidence-summary`).
6. CSV Export Stream: Verifying `Content-Type: text/csv` and valid comma-delimited output.
7. RBAC Security: Verifying that `CITIZEN` receives `403 Forbidden` on `/api/audit` and `/api/reports`.

Execute test suite:
```bash
npm run test:audit
```
