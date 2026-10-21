-- ===================================================================
-- Feature 7: System Administration & Master Data Management Schema
-- (Functional Requirements FR-AD1, FR-AD2, FR-AD3, PROJECT_CONTEXT.md §5.8)
-- ===================================================================

-- 1. Master Ranks Table
CREATE TABLE IF NOT EXISTS ranks (
  rank_id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(60) NOT NULL,
  hierarchy_level INT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed initial ranks if not present
INSERT INTO ranks (code, title, hierarchy_level, description) VALUES
  ('CONSTABLE', 'Police Constable', 1, 'Entry-level frontline policing'),
  ('HEAD_CONSTABLE', 'Head Constable', 2, 'Senior desk and patrol duties'),
  ('ASI', 'Assistant Sub-Inspector', 3, 'Junior investigating officer'),
  ('SI', 'Sub-Inspector', 4, 'Standard Investigating Officer (IO)'),
  ('INSPECTOR', 'Inspector of Police', 5, 'Station House Officer (SHO)'),
  ('DSP', 'Deputy Superintendent of Police', 6, 'Sub-divisional supervisory officer'),
  ('SP', 'Superintendent of Police', 7, 'District police chief / Supervisor')
ON CONFLICT (code) DO NOTHING;

-- 2. Master SLA Configuration Table
CREATE TABLE IF NOT EXISTS sla_configs (
  sla_id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  threshold_hours INT NOT NULL,
  escalation_role VARCHAR(20) NOT NULL DEFAULT 'SUPERVISOR',
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by BIGINT REFERENCES users(user_id)
);

-- Seed default SLA configurations
INSERT INTO sla_configs (config_key, title, threshold_hours, escalation_role, description) VALUES
  ('COMPLAINT_REVIEW', 'Citizen Complaint Initial Review SLA', 24, 'SHO', 'Max time before station desk must accept, reject or review complaint'),
  ('IO_ASSIGNMENT', 'Case IO Assignment SLA', 48, 'SHO', 'Max time to assign Investigating Officer after FIR registration'),
  ('STALE_CASE', 'Stale Investigation Case Inactivity SLA', 360, 'SUPERVISOR', 'Days without diary update (15 days = 360 hours) before flagging stale'),
  ('INVESTIGATION_CLOSURE', 'Investigation Chargesheet / Closure SLA', 1440, 'SUPERVISOR', 'Standard 60-day (1440 hours) statutory timeline for chargesheet submission')
ON CONFLICT (config_key) DO NOTHING;

-- 3. Enhance police_stations with contact and status fields
ALTER TABLE police_stations 
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(120),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 4. Enhance crime_categories with is_active flag
ALTER TABLE crime_categories
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 5. Enhance legal_sections with is_active flag and punishment guideline
ALTER TABLE legal_sections
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS punishment_years INT;

-- 6. Add Administration Permissions to permissions and role_permissions
INSERT INTO permissions (code) VALUES
  ('admin:manage'),
  ('station:manage'),
  ('user:manage'),
  ('sla:manage'),
  ('master_data:manage')
ON CONFLICT (code) DO NOTHING;

-- Map permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN'
  AND p.code IN ('admin:manage', 'station:manage', 'user:manage', 'sla:manage', 'master_data:manage', 'audit:read', 'report:read')
ON CONFLICT DO NOTHING;

-- Map station:manage and user:manage to SUPERVISOR if not present
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPERVISOR'
  AND p.code IN ('station:manage', 'audit:read', 'report:read')
ON CONFLICT DO NOTHING;
