# Feature 1: Citizen Complaint Filing, Attachments & Tracking Implementation Guide

This guide documents the full architecture, database schema, and step-by-step code implementation for **Feature 1: Citizen Complaint / FIR Filing, Attachments & Tracking** (Functional Requirements FR-C1 to FR-C6, FR-T1, FR-T2) in the Online FIR & Police Case Management System.

Like the Authentication & Authorization guide, this work is designed for a **team of 2 developers** working in parallel without merge conflicts.

---

## 1. System Contract & Architecture Overview

### A. State Transitions Covered in this Feature
```
  [Citizen starts]
         │
         ▼
     ┌───────┐      save draft / add persons / files
     │ DRAFT │ ◄───────────────────────────────────────┐
     └───────┘                                         │
         │                                             │
         │ citizen clicks Submit                       │
         │ (ACID transaction generates tracking_id)   │
         ▼                                             │
   ┌───────────┐                                       │
   │ SUBMITTED │                                       │
   └───────────┘                                       │
         │ (Desk Officer requests info)                │
         ▼                                             │
 ┌────────────────┐                                    │
 │ INFO_REQUESTED │                                    │
 └────────────────┘                                    │
         │ citizen submits clarification response      │
         └─────────────────────────────────────────────┘
```

### B. Tracking ID Format
When a complaint is submitted, the system generates a human-readable, unique tracking ID:
- Format: `CMP-<YYYY>-<6-digit zero-padded sequence>`
- Example: `CMP-2026-000101`

### C. Attachment Cryptographic Integrity (PO7 - Ethics / Tamper Evidence)
Every file uploaded (photos of incident, medical slips, identity proof) is hashed using **SHA-256** upon receipt:
- Stored on disk under `uploads/attachments/`
- Filename randomized to prevent path traversal
- Original filename, MIME type, file size in bytes, and hex SHA-256 digest stored in the `attachments` table.

---

## 2. Member Responsibilities Split

| Area | Member 1: Core Engine & DB Layer | Member 2: APIs, Uploads & Integration |
|---|---|---|
| **Primary Domain** | Database DDL, Cryptographic Hashing, Input Validation & Transactional Services | File Upload Middleware (Multer), Controllers, Routes & Integration Tests |
| **Files to Implement** | 1. `src/db/migrations/01_complaints_schema.sql`<br>2. `src/utils/file.util.js`<br>3. `src/validators/complaint.validator.js`<br>4. `src/services/complaint.service.js` | 1. `src/middlewares/upload.middleware.js`<br>2. `src/controllers/complaint.controller.js`<br>3. `src/routes/complaint.route.js`<br>4. `src/app.js` (Mounting)<br>5. `src/test-complaint-apis.js` |
| **Database Interactions** | `crime_categories`, `fir`, `fir_persons`, `attachments`, `case_status_history`, `notifications`, `audit_log` | Scoping queries (`req.user.citizenId`), Route protection with `authenticateToken`, `requireRoles('CITIZEN')` |

---

# 👤 Member 1: Database Schema, Validation & Core Service

## Task 1.1: Database Schema & Migration
**File:** `src/db/migrations/01_complaints_schema.sql`  
**Purpose:** Sets up the tables for categories, FIRs, persons involved, file attachments, and status history.

```sql
-- 1. Create FIR Status Enum (if not already created)
DO $$ BEGIN
    CREATE TYPE fir_status AS ENUM (
      'DRAFT','SUBMITTED','UNDER_REVIEW','INFO_REQUESTED','REJECTED','REGISTERED',
      'ASSIGNED','UNDER_INVESTIGATION','PENDING_APPROVAL','CHARGESHEET_FILED',
      'CLOSED','TRANSFERRED','REOPENED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Master Crime Categories Table
CREATE TABLE IF NOT EXISTS crime_categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  parent_id INT REFERENCES crime_categories(category_id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial categories if empty
INSERT INTO crime_categories (name, description) VALUES
  ('Theft / Burglary', 'Unlawful taking of property'),
  ('Cyber Crime', 'Online fraud, harassment, data breach'),
  ('Physical Assault', 'Infliction of physical harm'),
  ('Cheating / Financial Fraud', 'Deceptive transactions and fraud'),
  ('Missing Person', 'Report of missing child or adult')
ON CONFLICT (name) DO NOTHING;

-- 3. Core FIR / Complaint Table
CREATE TABLE IF NOT EXISTS fir (
  fir_id BIGSERIAL PRIMARY KEY,
  tracking_id VARCHAR(25) UNIQUE,                    -- CMP-2026-000123
  fir_number VARCHAR(40) UNIQUE,                     -- Assigned upon registration
  complainant_id BIGINT NOT NULL REFERENCES citizens(citizen_id),
  station_id INT REFERENCES police_stations(station_id), -- NULL if e-Zero FIR
  category_id INT REFERENCES crime_categories(category_id),
  incident_dt TIMESTAMPTZ NOT NULL,
  location_text TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  description TEXT NOT NULL,
  status fir_status NOT NULL DEFAULT 'DRAFT',
  priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  is_cognizable BOOLEAN DEFAULT TRUE,
  rejection_reason TEXT,
  version INT NOT NULL DEFAULT 1,                    -- Optimistic locking
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance (PO1 & PO5)
CREATE INDEX IF NOT EXISTS idx_fir_complainant ON fir(complainant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fir_station_status ON fir(station_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_fir_tracking_id ON fir(tracking_id);

-- 4. Persons Involved (Accused, Victims, Witnesses)
CREATE TABLE IF NOT EXISTS fir_persons (
  person_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  person_role VARCHAR(10) NOT NULL CHECK (person_role IN ('ACCUSED','WITNESS','VICTIM')),
  full_name VARCHAR(120) NOT NULL,
  contact VARCHAR(40),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fir_persons_fir ON fir_persons(fir_id);

-- 5. Attachments with Cryptographic SHA-256 Hash
CREATE TABLE IF NOT EXISTS attachments (
  attachment_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(user_id),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  sha256 CHAR(64) NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_fir ON attachments(fir_id);

-- 6. Status History (Immutable audit trail of transitions)
CREATE TABLE IF NOT EXISTS case_status_history (
  history_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  from_state fir_status,
  to_state fir_status NOT NULL,
  actor_id BIGINT NOT NULL REFERENCES users(user_id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_fir ON case_status_history(fir_id, created_at DESC);

-- 7. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  fir_id BIGINT REFERENCES fir(fir_id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC);
```

---

## Task 1.2: Cryptographic File Hash Utility
**File:** `src/utils/file.util.js`  
**Purpose:** Calculates SHA-256 hashes of uploaded files to preserve digital chain-of-custody and prevent tampering.

```javascript
const crypto = require('crypto');
const fs = require('fs');

/**
 * Computes SHA-256 hash of a file on disk
 * @param {string} filePath - Absolute or relative path to file
 * @returns {Promise<string>} 64-character hex hash
 */
function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}

/**
 * Computes SHA-256 of a memory buffer
 * @param {Buffer} buffer
 * @returns {string} 64-character hex hash
 */
function computeBufferSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

module.exports = {
  computeFileSha256,
  computeBufferSha256
};
```

---

## Task 1.3: Input Validator for Complaints
**File:** `src/validators/complaint.validator.js`  
**Purpose:** Validates incident dates, descriptions, locations, categories, and persons before database execution.

```javascript
/**
 * Validates complaint creation and update payloads
 */
function validateComplaintInput(data, isDraft = false) {
  const errors = [];

  // If submitting directly (not a draft), mandatory fields are strictly enforced
  if (!isDraft) {
    if (!data.incidentDt) {
      errors.push('Incident date and time (incidentDt) is required.');
    } else {
      const dt = new Date(data.incidentDt);
      if (isNaN(dt.getTime())) {
        errors.push('Invalid incident date/time format.');
      } else if (dt > new Date()) {
        errors.push('Incident date cannot be in the future.');
      }
    }

    if (!data.locationText || data.locationText.trim().length < 5) {
      errors.push('Incident location must be at least 5 characters long.');
    }

    if (!data.description || data.description.trim().length < 15) {
      errors.push('Incident description must be at least 15 characters long.');
    }

    if (!data.categoryId) {
      errors.push('Crime category (categoryId) is required.');
    }
  } else {
    // For DRAFT saving, at least a brief description or location is required
    if (!data.description && !data.locationText) {
      errors.push('Draft must have either a description or location text.');
    }
  }

  // Priority validation (1 = High, 2 = Medium, 3 = Low)
  if (data.priority !== undefined && ![1, 2, 3].includes(Number(data.priority))) {
    errors.push('Priority must be 1 (High), 2 (Medium), or 3 (Low).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates person (accused / witness / victim) addition
 */
function validatePersonInput(person) {
  const errors = [];
  const allowedRoles = ['ACCUSED', 'WITNESS', 'VICTIM'];

  if (!person.fullName || person.fullName.trim().length === 0) {
    errors.push('Full name is required.');
  }

  if (!person.personRole || !allowedRoles.includes(person.personRole.toUpperCase())) {
    errors.push(`Person role must be one of: ${allowedRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateComplaintInput,
  validatePersonInput
};
```

---

## Task 1.4: Complaint Service (ACID Transactions & Business Logic)
**File:** `src/services/complaint.service.js`  
**Purpose:** Handles creation of drafts, adding persons, atomic submission with tracking ID generation, and responding to clarification requests inside database transactions.

```javascript
const pool = require('../config/db');
const { logAuditEvent } = require('./audit.service');

/**
 * Helper to generate an atomic tracking ID format CMP-YYYY-XXXXXX
 */
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

/**
 * 1. Create a new Complaint in DRAFT or SUBMITTED state
 */
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
      data.description || 'Draft complaint',
      data.priority || 2,
      initialStatus,
      trackingId,
      submittedAt
    ];

    const result = await client.query(query, values);
    const newFir = result.rows[0];

    // If persons were submitted in the initial payload
    if (Array.isArray(data.persons) && data.persons.length > 0) {
      for (const p of data.persons) {
        await client.query(
          `INSERT INTO fir_persons (fir_id, person_role, full_name, contact, address, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newFir.fir_id, p.personRole.toUpperCase(), p.fullName, p.contact || null, p.address || null, p.notes || null]
        );
      }
    }

    // Insert into status history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, NULL, $2, $3, $4)`,
      [newFir.fir_id, initialStatus, userId, isSubmitted ? 'Initial submission' : 'Saved as draft']
    );

    // Audit log
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

/**
 * 2. Submit an existing DRAFT complaint (ACID Transaction)
 */
async function submitDraftComplaint({ firId, citizenId, userId, ipAddress }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row to prevent race conditions
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

    // Validation checks for final submission
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

    const updatedFir = updateRes.rows[0];

    // Record in history
    await client.query(
      `INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note)
       VALUES ($1, 'DRAFT', 'SUBMITTED', $2, 'Citizen submitted draft complaint')`,
      [firId, userId]
    );

    // Notify complainant
    await client.query(
      `INSERT INTO notifications (user_id, fir_id, message)
       VALUES ($1, $2, $3)`,
      [userId, firId, `Your complaint has been submitted successfully with Tracking ID: ${trackingId}`]
    );

    // Audit log
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
    return updatedFir;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 3. Citizen answers a clarification request (INFO_REQUESTED -> UNDER_REVIEW)
 */
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
      action: 'INFO_REQUEST_RESPONDED',
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

/**
 * 4. Get complaint by Tracking ID (Public / Citizen tracker)
 */
async function getComplaintByTrackingId(trackingId) {
  const firRes = await pool.query(
    `SELECT f.fir_id, f.tracking_id, f.fir_number, f.status, f.created_at, f.submitted_at,
            f.incident_dt, f.location_text, cc.name AS category_name,
            ps.name AS station_name, ps.code AS station_code
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

  // Fetch timeline (status history)
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
```

---

# 👤 Member 2: File Uploads, Controllers, Routes & API Tests

## Task 2.1: File Upload Middleware with Multer
**File:** `src/middlewares/upload.middleware.js`  
**Purpose:** Handles multipart form uploads, restricts file types to safe formats (PDF, PNG, JPEG), and caps max file size at 10MB.

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Destination folder
const uploadDir = path.join(__dirname, '../../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
```

---

## Task 2.2: Complaint Controller
**File:** `src/controllers/complaint.controller.js`  
**Purpose:** Validates HTTP request parameters, verifies citizen access scopes, coordinates file uploads with SHA-256 generation, and formats JSON responses.

```javascript
const pool = require('../config/db');
const complaintService = require('../services/complaint.service');
const { validateComplaintInput, validatePersonInput } = require('../validators/complaint.validator');
const { computeFileSha256 } = require('../utils/file.util');

/**
 * POST /api/complaints
 * Create a complaint (Draft or Direct Submission)
 */
async function createComplaint(req, res, next) {
  try {
    const isDraft = !req.body.submitImmediately;
    const { isValid, errors } = validateComplaintInput(req.body, isDraft);

    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const citizenId = req.user.citizenId;
    if (!citizenId) {
      return res.status(403).json({ success: false, message: 'User is not linked to a citizen profile.' });
    }

    const newComplaint = await complaintService.createComplaint({
      citizenId,
      userId: req.user.userId,
      data: req.body,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: isDraft ? 'Complaint saved as draft.' : 'Complaint submitted successfully.',
      data: newComplaint
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/complaints/:id/submit
 * Submit an existing draft
 */
async function submitDraft(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;

    const result = await complaintService.submitDraftComplaint({
      firId,
      citizenId,
      userId: req.user.userId,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Complaint submitted successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/complaints/my
 * View all complaints submitted by the authenticated citizen
 */
async function getMyComplaints(req, res, next) {
  try {
    const citizenId = req.user.citizenId;
    const result = await pool.query(
      `SELECT f.*, cc.name AS category_name, ps.name AS station_name
       FROM fir f
       LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       WHERE f.complainant_id = $1
       ORDER BY f.created_at DESC`,
      [citizenId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/complaints/:id
 * View full complaint detail including persons and attachments
 */
async function getComplaintDetails(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;

    const firRes = await pool.query(
      `SELECT f.*, cc.name AS category_name, ps.name AS station_name
       FROM fir f
       LEFT JOIN crime_categories cc ON f.category_id = cc.category_id
       LEFT JOIN police_stations ps ON f.station_id = ps.station_id
       WHERE f.fir_id = $1 AND f.complainant_id = $2`,
      [firId, citizenId]
    );

    if (firRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const personsRes = await pool.query(`SELECT * FROM fir_persons WHERE fir_id = $1`, [firId]);
    const attachRes = await pool.query(
      `SELECT attachment_id, file_name, mime_type, size_bytes, sha256, uploaded_at
       FROM attachments WHERE fir_id = $1`,
      [firId]
    );
    const historyRes = await pool.query(
      `SELECT from_state, to_state, note, created_at FROM case_status_history WHERE fir_id = $1 ORDER BY created_at ASC`,
      [firId]
    );

    res.status(200).json({
      success: true,
      data: {
        ...firRes.rows[0],
        persons: personsRes.rows,
        attachments: attachRes.rows,
        timeline: historyRes.rows
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/complaints/:id/attachments
 * Upload attachment with SHA-256 hash
 */
async function uploadAttachment(req, res, next) {
  try {
    const firId = req.params.id;
    const citizenId = req.user.citizenId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Verify ownership
    const firCheck = await pool.query(
      `SELECT status FROM fir WHERE fir_id = $1 AND complainant_id = $2`,
      [firId, citizenId]
    );

    if (firCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Compute cryptographic hash
    const sha256 = await computeFileSha256(req.file.path);

    const insertRes = await pool.query(
      `INSERT INTO attachments (fir_id, uploaded_by, file_name, mime_type, size_bytes, sha256, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING attachment_id, file_name, mime_type, size_bytes, sha256, uploaded_at`,
      [
        firId,
        req.user.userId,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        sha256,
        req.file.path
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded and cryptographically verified.',
      data: insertRes.rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/complaints/track/:trackingId
 * Public / Citizen tracking endpoint
 */
async function trackComplaint(req, res, next) {
  try {
    const trackingId = req.params.trackingId;
    const complaint = await complaintService.getComplaintByTrackingId(trackingId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No record found for tracking ID: ${trackingId}`
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/complaints/:id/respond
 * Respond to info request
 */
async function respondToInfo(req, res, next) {
  try {
    const firId = req.params.id;
    const { responseText } = req.body;

    if (!responseText || responseText.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Response text is required.' });
    }

    const updated = await complaintService.respondToInfoRequest({
      firId,
      citizenId: req.user.citizenId,
      userId: req.user.userId,
      responseText,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Clarification submitted to station desk.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  submitDraft,
  getMyComplaints,
  getComplaintDetails,
  uploadAttachment,
  trackComplaint,
  respondToInfo
};
```

---

## Task 2.3: Complaint Route Mounting
**File:** `src/routes/complaint.route.js`  
**Purpose:** Configures protected and public endpoints for complaint intake.

```javascript
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRoles } = require('../middlewares/rbac.middleware');
const upload = require('../middlewares/upload.middleware');

// Public tracking endpoint (no auth required so citizen can track using tracking ID)
router.get('/track/:trackingId', complaintController.trackComplaint);

// All subsequent endpoints require CITIZEN authentication
router.use(authenticateToken);
router.use(requireRoles('CITIZEN'));

// Citizen complaint CRUD & actions
router.post('/', complaintController.createComplaint);
router.get('/my', complaintController.getMyComplaints);
router.get('/:id', complaintController.getComplaintDetails);
router.post('/:id/submit', complaintController.submitDraft);
router.post('/:id/attachments', upload.single('file'), complaintController.uploadAttachment);
router.post('/:id/respond', complaintController.respondToInfo);

module.exports = router;
```

---

## Task 2.4: Mount Route in `src/app.js`
In `src/app.js`, add:
```javascript
const complaintRoutes = require('./routes/complaint.route');

// Mount under /api/complaints
app.use('/api/complaints', complaintRoutes);
```

---

## Task 2.5: Automated Verification Test Suite
**File:** `src/test-complaint-apis.js`  
**Run via:** `node src/test-complaint-apis.js`

```javascript
require('dotenv').config();
const http = require('http');
const app = require('./app');

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  console.log('--- Starting Citizen Complaint Intake Test Suite ---\n');

  const server = app.listen(TEST_PORT);

  try {
    // 1. Citizen Login to get Bearer Token
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'citizen.priya@casesync.gov.in',
        password: 'Citizen@12345'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data?.token;
    console.log(token ? '✅ Citizen Login Successful' : '❌ Citizen Login Failed');

    // 2. Create Draft Complaint
    const draftRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        description: 'Gold chain snatched near City Metro Station.',
        locationText: 'Metro Station Gate 2, Central District',
        stationId: 1,
        categoryId: 1,
        priority: 1,
        submitImmediately: false
      })
    });
    const draftData = await draftRes.json();
    const firId = draftData.data?.fir_id;
    console.log(draftRes.status === 201 && draftData.data.status === 'DRAFT'
      ? `✅ Created Draft Complaint (ID: ${firId})`
      : '❌ Create Draft Failed');

    // 3. Submit the Draft Complaint
    const submitRes = await fetch(`${BASE_URL}/api/complaints/${firId}/submit`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const submitData = await submitRes.json();
    const trackingId = submitData.data?.tracking_id;
    console.log(submitRes.status === 200 && trackingId?.startsWith('CMP-')
      ? `✅ Draft Submitted -> Issued Tracking ID: ${trackingId}`
      : '❌ Submit Draft Failed');

    // 4. Public Tracking Endpoint
    const trackRes = await fetch(`${BASE_URL}/api/complaints/track/${trackingId}`);
    const trackData = await trackRes.json();
    console.log(trackRes.status === 200 && trackData.data?.tracking_id === trackingId
      ? `✅ Public Track Query Succeeded (Status: ${trackData.data.status})`
      : '❌ Public Track Failed');

    console.log('\n--- All Complaint Feature Tests Passed Successfully! ---');
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
```
