-- =========================================================================
-- Migration 11: Database Hardening, State Machine Guards & SQL Views Schema
-- Aligns with PROJECT_CONTEXT.md §6.5, §7.2, §8.5, §8.6, §11, §13
-- =========================================================================

-- 1. Database-Level State Transition Guard Trigger
-- Enforces that direct UPDATE on fir.status MUST match state_transitions table
CREATE OR REPLACE FUNCTION trg_fir_status_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM state_transitions
      WHERE from_state = OLD.status AND to_state = NEW.status
    ) THEN
      RAISE EXCEPTION 'Illegal transition % -> %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fir_status_guard ON fir;
CREATE TRIGGER fir_status_guard
BEFORE UPDATE ON fir
FOR EACH ROW EXECUTE FUNCTION trg_fir_status_guard();

-- 2. Append-Only Protection on Status History & Evidence Custody Log
DROP TRIGGER IF EXISTS history_no_mutation ON case_status_history;
CREATE TRIGGER history_no_mutation
BEFORE UPDATE OR DELETE ON case_status_history
FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();

DROP TRIGGER IF EXISTS custody_no_mutation ON evidence_custody_log;
CREATE TRIGGER custody_no_mutation
BEFORE UPDATE OR DELETE ON evidence_custody_log
FOR EACH ROW EXECUTE FUNCTION trg_block_audit_mutation();

-- 3. Stored Procedure: change_case_status
-- Atomic single entry point for state transitions with optimistic concurrency locking
CREATE OR REPLACE FUNCTION change_case_status(
  p_fir_id BIGINT,
  p_new_status fir_status,
  p_actor_id BIGINT,
  p_note TEXT DEFAULT NULL,
  p_expected_version INT DEFAULT NULL
)
RETURNS TABLE (
  fir_id BIGINT,
  status fir_status,
  version INT,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_fir RECORD;
  v_new_version INT;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- A. Lock FIR row for atomic update
  SELECT * INTO v_fir
  FROM fir
  WHERE fir.fir_id = p_fir_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'FIR_NOT_FOUND: Record % does not exist', p_fir_id;
  END IF;

  -- B. Optimistic concurrency locking verification
  IF p_expected_version IS NOT NULL AND v_fir.version <> p_expected_version THEN
    RAISE EXCEPTION 'STALE_VERSION: Expected version %, but current version is %', p_expected_version, v_fir.version;
  END IF;

  -- C. Validate state transition against state_transitions table
  IF NOT EXISTS (
    SELECT 1 FROM state_transitions
    WHERE from_state = v_fir.status AND to_state = p_new_status
  ) THEN
    RAISE EXCEPTION 'ILLEGAL_TRANSITION: Cannot transition from % to %', v_fir.status, p_new_status;
  END IF;

  -- D. Advance version and set timestamp
  v_new_version := v_fir.version + 1;
  v_updated_at := clock_timestamp();

  UPDATE fir
  SET status = p_new_status,
      version = v_new_version,
      updated_at = v_updated_at
  WHERE fir.fir_id = p_fir_id;

  -- E. Append immutable history entry
  INSERT INTO case_status_history (fir_id, from_state, to_state, actor_id, note, created_at)
  VALUES (p_fir_id, v_fir.status, p_new_status, p_actor_id, p_note, v_updated_at);

  -- F. Return updated record state
  RETURN QUERY
  SELECT v_fir.fir_id, p_new_status, v_new_version, v_updated_at;
END;
$$ LANGUAGE plpgsql;

-- 4. High-Performance SQL Views (§13 item 10)

-- A. Station Operations & Triage Inbox View
CREATE OR REPLACE VIEW v_station_inbox AS
SELECT
  f.fir_id,
  f.tracking_id,
  f.fir_number,
  f.status,
  f.priority,
  CASE f.priority WHEN 1 THEN 'High' WHEN 2 THEN 'Medium' WHEN 3 THEN 'Low' ELSE 'Medium' END AS priority_label,
  f.station_id,
  ps.name AS station_name,
  ps.code AS station_code,
  ps.district AS station_district,
  f.complainant_id,
  c.full_name AS complainant_name,
  u_comp.phone AS complainant_phone,
  f.incident_dt,
  f.location_text,
  cat.name AS category_name,
  f.submitted_at,
  f.registered_at,
  f.created_at,
  f.version,
  cs.case_id,
  cs.current_io_id,
  io.full_name AS io_name,
  io.badge_no AS io_badge,
  io.rank AS io_rank,
  ROUND(EXTRACT(EPOCH FROM (now() - COALESCE(f.submitted_at, f.created_at))) / 86400, 1) AS days_pending,
  (
    SELECT string_agg(ls.act || ' ' || ls.section_no, ', ')
    FROM fir_sections fs
    JOIN legal_sections ls ON fs.section_id = ls.section_id
    WHERE fs.fir_id = f.fir_id
  ) AS legal_sections_summary
FROM fir f
JOIN police_stations ps ON f.station_id = ps.station_id
JOIN citizens c ON f.complainant_id = c.citizen_id
JOIN users u_comp ON c.user_id = u_comp.user_id
LEFT JOIN crime_categories cat ON f.category_id = cat.category_id
LEFT JOIN cases cs ON f.fir_id = cs.fir_id
LEFT JOIN officers io ON cs.current_io_id = io.officer_id
WHERE f.status NOT IN ('CLOSED', 'REJECTED');

-- B. Chronological Unified Case Timeline View
CREATE OR REPLACE VIEW v_case_timeline AS
-- B1. Status Transitions
SELECT
  h.fir_id,
  c.case_id,
  h.created_at AS event_time,
  'STATUS_CHANGE'::varchar(30) AS event_type,
  h.from_state::text AS state_before,
  h.to_state::text AS state_after,
  u.user_id AS actor_id,
  COALESCE(o.full_name, cit.full_name, u.email) AS actor_name,
  COALESCE(r.code, 'USER')::varchar(30) AS actor_role,
  ('Status transitioned from ' || COALESCE(h.from_state::text, 'START') || ' to ' || h.to_state::text)::text AS summary,
  h.note AS details,
  TRUE AS is_public
FROM case_status_history h
JOIN users u ON h.actor_id = u.user_id
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN officers o ON u.user_id = o.user_id
LEFT JOIN citizens cit ON u.user_id = cit.user_id
LEFT JOIN cases c ON h.fir_id = c.fir_id

UNION ALL

-- B2. Case Investigation Updates
SELECT
  c.fir_id,
  cu.case_id,
  cu.created_at AS event_time,
  'INVESTIGATION_UPDATE'::varchar(30) AS event_type,
  NULL::text AS state_before,
  NULL::text AS state_after,
  u.user_id AS actor_id,
  o.full_name AS actor_name,
  'IO'::varchar(30) AS actor_role,
  ('Investigation Note: ' || cu.update_type)::text AS summary,
  cu.body AS details,
  cu.visible_to_citizen AS is_public
FROM case_updates cu
JOIN cases c ON cu.case_id = c.case_id
JOIN officers o ON cu.officer_id = o.officer_id
JOIN users u ON o.user_id = u.user_id

UNION ALL

-- B3. Evidence Custody Transfers
SELECT
  c.fir_id,
  e.case_id,
  ecl.transferred_at AS event_time,
  'EVIDENCE_TRANSFER'::varchar(30) AS event_type,
  NULL::text AS state_before,
  NULL::text AS state_after,
  u_to.user_id AS actor_id,
  COALESCE(o_to.full_name, 'Evidence Store') AS actor_name,
  'OFFICER'::varchar(30) AS actor_role,
  ('Evidence ' || e.evidence_no || ' custody transferred: ' || ecl.purpose)::text AS summary,
  ecl.remarks AS details,
  FALSE AS is_public
FROM evidence_custody_log ecl
JOIN evidence e ON ecl.evidence_id = e.evidence_id
JOIN cases c ON e.case_id = c.case_id
LEFT JOIN officers o_to ON ecl.to_holder = o_to.officer_id
LEFT JOIN users u_to ON o_to.user_id = u_to.user_id

UNION ALL

-- B4. Inter-Station Case Transfers
SELECT
  ct.fir_id,
  ct.case_id,
  ct.created_at AS event_time,
  'STATION_TRANSFER'::varchar(30) AS event_type,
  ct.previous_status::text AS state_before,
  'TRANSFERRED'::text AS state_after,
  ct.transferred_by AS actor_id,
  COALESCE(o.full_name, 'Station SHO') AS actor_name,
  'SHO'::varchar(30) AS actor_role,
  ('Case transfer from ' || ps_from.name || ' to ' || ps_to.name || ' (' || ct.status || ')')::text AS summary,
  ct.transfer_reason AS details,
  TRUE AS is_public
FROM case_transfers ct
JOIN police_stations ps_from ON ct.from_station_id = ps_from.station_id
JOIN police_stations ps_to ON ct.to_station_id = ps_to.station_id
JOIN users u ON ct.transferred_by = u.user_id
LEFT JOIN officers o ON u.user_id = o.user_id

UNION ALL

-- B5. Court Outcomes
SELECT
  co.fir_id,
  co.case_id,
  co.judgment_date::timestamptz AS event_time,
  'COURT_OUTCOME'::varchar(30) AS event_type,
  'CHARGESHEET_FILED'::text AS state_before,
  'CLOSED'::text AS state_after,
  co.recorded_by AS actor_id,
  COALESCE(co.judge_name, 'Presiding Magistrate') AS actor_name,
  'JUDICIARY'::varchar(30) AS actor_role,
  ('Court Judgment: ' || co.verdict || ' (' || co.court_name || ')')::text AS summary,
  (co.remarks || COALESCE('; Sentence: ' || co.sentence_details, ''))::text AS details,
  TRUE AS is_public
FROM court_outcomes co;

-- C. IO Workload & Caseload Ranking View
CREATE OR REPLACE VIEW v_io_workload AS
SELECT
  o.officer_id,
  o.full_name AS officer_name,
  o.badge_no,
  o.rank,
  o.station_id,
  ps.name AS station_name,
  ps.code AS station_code,
  u.email AS officer_email,
  u.phone AS officer_phone,
  COUNT(c.case_id) FILTER (WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION')) AS active_cases_count,
  COUNT(c.case_id) FILTER (WHERE f.status = 'PENDING_APPROVAL') AS pending_approval_count,
  COUNT(c.case_id) FILTER (WHERE f.status = 'CHARGESHEET_FILED') AS chargesheet_count,
  COUNT(c.case_id) FILTER (WHERE f.status = 'CLOSED') AS closed_cases_count,
  COUNT(c.case_id) AS total_lifetime_cases,
  MIN(c.investigation_started_at) FILTER (WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION')) AS oldest_active_case_date,
  DENSE_RANK() OVER (
    PARTITION BY o.station_id 
    ORDER BY COUNT(c.case_id) FILTER (WHERE f.status IN ('ASSIGNED', 'UNDER_INVESTIGATION')) DESC
  ) AS station_workload_rank
FROM officers o
JOIN users u ON o.user_id = u.user_id
JOIN police_stations ps ON o.station_id = ps.station_id
LEFT JOIN cases c ON c.current_io_id = o.officer_id
LEFT JOIN fir f ON c.fir_id = f.fir_id
GROUP BY o.officer_id, o.full_name, o.badge_no, o.rank, o.station_id, ps.name, ps.code, u.email, u.phone;

-- D. Citizen-Facing Sanitized Case Summary View
CREATE OR REPLACE VIEW v_citizen_case_summary AS
SELECT
  f.fir_id,
  f.tracking_id,
  f.fir_number,
  f.status,
  f.priority,
  CASE f.priority WHEN 1 THEN 'High' WHEN 2 THEN 'Medium' WHEN 3 THEN 'Low' ELSE 'Medium' END AS priority_label,
  f.complainant_id,
  c.full_name AS complainant_name,
  f.station_id,
  ps.name AS station_name,
  ps.code AS station_code,
  ps.district AS station_district,
  ps.contact_phone AS station_phone,
  cat.name AS category_name,
  f.incident_dt,
  f.location_text,
  f.description,
  f.submitted_at,
  f.registered_at,
  f.created_at,
  f.updated_at,
  cs.case_id,
  io.full_name AS io_name,
  io.badge_no AS io_badge,
  io.rank AS io_rank,
  co.verdict AS court_verdict,
  co.court_name,
  co.judgment_date,
  (
    SELECT COUNT(*)
    FROM case_updates cu
    WHERE cu.case_id = cs.case_id AND cu.visible_to_citizen = TRUE
  ) AS public_updates_count,
  (
    SELECT COUNT(*)
    FROM attachments att
    WHERE att.fir_id = f.fir_id
  ) AS attachments_count
FROM fir f
JOIN citizens c ON f.complainant_id = c.citizen_id
LEFT JOIN police_stations ps ON f.station_id = ps.station_id
LEFT JOIN crime_categories cat ON f.category_id = cat.category_id
LEFT JOIN cases cs ON f.fir_id = cs.fir_id
LEFT JOIN officers io ON cs.current_io_id = io.officer_id
LEFT JOIN court_outcomes co ON cs.case_id = co.case_id;

-- 5. Performance Indexes (§8.6)
CREATE INDEX IF NOT EXISTS idx_fir_complainant ON fir(complainant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fir_station_status ON fir(station_id, status, priority DESC, submitted_at);
CREATE INDEX IF NOT EXISTS idx_fir_active_partial ON fir(station_id, submitted_at) WHERE status IN ('SUBMITTED','UNDER_REVIEW','INFO_REQUESTED');
CREATE INDEX IF NOT EXISTS idx_fir_incident_dt ON fir(incident_dt);
CREATE INDEX IF NOT EXISTS idx_cases_io ON cases(current_io_id);
