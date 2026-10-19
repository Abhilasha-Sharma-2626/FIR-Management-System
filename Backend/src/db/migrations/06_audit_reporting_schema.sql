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
