-- =========================================================================
-- Migration 08: Complaint Rejection Appeals & Supervisory Review Schema
-- Aligns with PROJECT_CONTEXT.md §5.3 (FR-R4), §6.4, §7.2, §12.2
-- =========================================================================

-- 1. Create FIR Appeals Table
CREATE TABLE IF NOT EXISTS fir_appeals (
  appeal_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  citizen_id BIGINT NOT NULL REFERENCES citizens(citizen_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  reviewed_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and lookup
CREATE INDEX IF NOT EXISTS idx_appeals_fir ON fir_appeals(fir_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON fir_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_citizen ON fir_appeals(citizen_id);
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON fir_appeals(created_at DESC);

-- 2. Ensure Permissions exist
INSERT INTO permissions (code) VALUES
  ('fir:appeal'),
  ('fir:review_appeal')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to CITIZEN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code = 'CITIZEN'
  AND p.code = 'fir:appeal'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map review permissions to SHO, SUPERVISOR, ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('SHO', 'SUPERVISOR', 'ADMIN')
  AND p.code IN ('fir:appeal', 'fir:review_appeal')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Ensure REJECTED -> UNDER_REVIEW transition exists
INSERT INTO state_transitions (from_state, to_state, required_permission)
VALUES ('REJECTED', 'UNDER_REVIEW', 'fir:appeal')
ON CONFLICT (from_state, to_state) DO NOTHING;
