-- =========================================================================
-- Migration 10: Court Outcome Recording & Judicial Case Closure Schema
-- Aligns with PROJECT_CONTEXT.md §2, §5.4 (FR-M4), §6.4, §7.1, §10.1, §12.2
-- =========================================================================

-- 1. Create Court Outcomes Table
CREATE TABLE IF NOT EXISTS court_outcomes (
  outcome_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT UNIQUE NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  fir_id BIGINT UNIQUE NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  court_name VARCHAR(120) NOT NULL,
  case_court_number VARCHAR(60),
  verdict VARCHAR(25) NOT NULL CHECK (
    verdict IN ('CONVICTED', 'ACQUITTED', 'COMPOUNDED', 'QUASHED', 'DISCHARGED')
  ),
  judgment_date DATE NOT NULL,
  judge_name VARCHAR(120),
  sentence_details TEXT,
  fine_amount NUMERIC(12,2) DEFAULT 0,
  remarks TEXT NOT NULL,
  recorded_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance and lookup indexes
CREATE INDEX IF NOT EXISTS idx_court_outcomes_case ON court_outcomes(case_id);
CREATE INDEX IF NOT EXISTS idx_court_outcomes_fir ON court_outcomes(fir_id);
CREATE INDEX IF NOT EXISTS idx_court_outcomes_verdict ON court_outcomes(verdict);

-- 2. Register Permission for Court Outcome Recording
INSERT INTO permissions (code) VALUES
  ('case:record_outcome')
ON CONFLICT (code) DO NOTHING;

-- Map permission to SHO, SUPERVISOR, and ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('SHO', 'SUPERVISOR', 'ADMIN')
  AND p.code = 'case:record_outcome'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 3. Ensure State Transition is Present
INSERT INTO state_transitions (from_state, to_state, required_permission) VALUES
  ('CHARGESHEET_FILED', 'CLOSED', 'case:record_outcome')
ON CONFLICT (from_state, to_state) DO NOTHING;
