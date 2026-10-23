-- =========================================================
-- Migration 04: Evidence Management & Chain of Custody Schema
-- Aligns with PROJECT_CONTEXT.md §5.5 (FR-E1 to FR-E6) & §8.4
-- =========================================================

-- 1. Create Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
  evidence_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  evidence_no VARCHAR(60) UNIQUE NOT NULL,
  evidence_type VARCHAR(20) NOT NULL CHECK (
    evidence_type IN ('PHYSICAL', 'DIGITAL', 'DOCUMENT', 'BIOLOGICAL', 'WEAPON', 'OTHER')
  ),
  description TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  collected_by BIGINT NOT NULL REFERENCES officers(officer_id) ON DELETE RESTRICT,
  current_holder_id BIGINT REFERENCES officers(officer_id) ON DELETE RESTRICT,
  location_stored TEXT,
  status VARCHAR(25) NOT NULL DEFAULT 'COLLECTED' CHECK (
    status IN ('COLLECTED', 'IN_STORAGE', 'IN_LAB', 'PRODUCED_IN_COURT', 'RETURNED', 'DESTROYED')
  ),
  file_name VARCHAR(255),
  file_path TEXT,
  file_size_bytes BIGINT,
  file_sha256 CHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and indexing (PO1 & PO5)
CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_holder ON evidence(current_holder_id);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_no ON evidence(evidence_no);

-- 2. Create Evidence Custody Log (Append-only chain of custody)
CREATE TABLE IF NOT EXISTS evidence_custody_log (
  log_id BIGSERIAL PRIMARY KEY,
  evidence_id BIGINT NOT NULL REFERENCES evidence(evidence_id) ON DELETE CASCADE,
  from_holder BIGINT REFERENCES officers(officer_id) ON DELETE RESTRICT,
  to_holder BIGINT REFERENCES officers(officer_id) ON DELETE RESTRICT,
  purpose VARCHAR(120) NOT NULL,
  remarks TEXT,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custody_evidence ON evidence_custody_log(evidence_id, transferred_at DESC);
CREATE INDEX IF NOT EXISTS idx_custody_to_holder ON evidence_custody_log(to_holder);

-- 3. Register permissions for Evidence Management
INSERT INTO permissions (code) VALUES
  ('evidence:create'),
  ('evidence:transfer'),
  ('evidence:read'),
  ('evidence:verify')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to roles
-- IO and SHO have full create, transfer, read, verify permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('IO', 'SHO')
  AND p.code IN ('evidence:create', 'evidence:transfer', 'evidence:read', 'evidence:verify')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- SUPERVISOR, AUDITOR, ADMIN have read and verify permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('SUPERVISOR', 'AUDITOR', 'ADMIN')
  AND p.code IN ('evidence:read', 'evidence:verify')
ON CONFLICT (role_id, permission_id) DO NOTHING;
