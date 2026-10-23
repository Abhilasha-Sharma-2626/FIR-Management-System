-- =========================================================================
-- Migration 09: Inter-Station Case Transfer & Zero FIR Flow Schema
-- Aligns with PROJECT_CONTEXT.md §2, §5.4 (FR-M6), §6.4, §7.2, §10.1, §12.2
-- =========================================================================

-- 1. Create Case Transfers Table
CREATE TABLE IF NOT EXISTS case_transfers (
  transfer_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  from_station_id INT NOT NULL REFERENCES police_stations(station_id) ON DELETE RESTRICT,
  to_station_id INT NOT NULL REFERENCES police_stations(station_id) ON DELETE RESTRICT,
  transferred_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  transfer_reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  previous_status fir_status NOT NULL,
  accepted_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  resolution_remarks TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_transfers_case ON case_transfers(case_id);
CREATE INDEX IF NOT EXISTS idx_transfers_fir ON case_transfers(fir_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_station ON case_transfers(to_station_id, status);
CREATE INDEX IF NOT EXISTS idx_transfers_from_station ON case_transfers(from_station_id);

-- 2. Register Permissions
INSERT INTO permissions (code) VALUES
  ('case:transfer'),
  ('case:accept_transfer'),
  ('case:reject_transfer')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to SHO, SUPERVISOR, and ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('SHO', 'SUPERVISOR', 'ADMIN')
  AND p.code IN ('case:transfer', 'case:accept_transfer', 'case:reject_transfer')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Seed State Transitions for Inter-Station Transfer
INSERT INTO state_transitions (from_state, to_state, required_permission) VALUES
  ('REGISTERED', 'TRANSFERRED', 'case:transfer'),
  ('ASSIGNED', 'TRANSFERRED', 'case:transfer'),
  ('UNDER_INVESTIGATION', 'TRANSFERRED', 'case:transfer'),
  ('TRANSFERRED', 'REGISTERED', 'case:accept_transfer'),
  ('TRANSFERRED', 'ASSIGNED', 'case:reject_transfer'),
  ('TRANSFERRED', 'UNDER_INVESTIGATION', 'case:reject_transfer')
ON CONFLICT (from_state, to_state) DO NOTHING;
