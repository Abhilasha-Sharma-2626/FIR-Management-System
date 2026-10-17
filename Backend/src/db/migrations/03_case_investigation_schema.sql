CREATE TABLE IF NOT EXISTS case_assignments (
  assignment_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
  officer_id BIGINT NOT NULL REFERENCES officers(officer_id) ON DELETE RESTRICT,
  assigned_by BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  from_ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  to_ts TIMESTAMPTZ,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_case_assignments_active ON case_assignments(case_id) WHERE to_ts IS NULL;
CREATE INDEX IF NOT EXISTS idx_case_assignments_officer ON case_assignments(officer_id);

CREATE TABLE IF NOT EXISTS case_updates (
  update_id BIGSERIAL PRIMARY KEY,
  case_id BIGINT NOT NULL REFERENCES cases(case_id) IN DELETE CASCADE,
  officer_id BIGINT NOT NULL REFERENCES officers(officer_id) ON DELETE RESTRICT,
  update_type VARCHAR(20) NOT NULL CHECK(
    update_type IN ('STATEMENT', 'SITE_VISIT', 'ARREST', 'SEARCH', 'FORENSIC', 'GENERAL')
  ),
  body TEXT NOT NULL,
  visible_to_citizen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_updates_case ON case_updates(case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_current_io ON cases(current_io_id);

INSERT INTO state_transitions (from_state, to_state, required_permission) VALUES ('REGISTERED', 'ASSIGNED', 'case:assign'),
('ASSIGNED', 'UNDER_INVESTIGATION', 'case:investigate'),
('UNDER_INVESTIGATION', 'PENDING_APPROVAL', 'case:submit_report'),
('PENDING_APPROVAL', 'UNDER_INVESTIGATION', 'case:send_back'),
('PENDING_APPROVAL', 'CHARGESHEET_FILED', 'case:approve_chargesheet'),
('PENDING_APPROVAL', 'CLOSED', 'case:approve_closure'),
('CHARGESHEET_FILED', 'CLOSED', 'case:record_outcome'),
('CLOSED', 'REOPENED', 'case:reopen'),
('REOPENED', 'UNDER_INVESTIGATION', 'case:investigate') ON CONFLICT (from_state, to_state) DO NOTHING;