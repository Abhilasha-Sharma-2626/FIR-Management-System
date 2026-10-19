-- =========================================================================
-- Migration 05: Citizen Tracking, Notifications & Feedback Schema
-- Aligns with PROJECT_CONTEXT.md §5.6 (FR-T1 to FR-T4) & §8.2
-- =========================================================================

-- 1. Ensure Notifications table exists with complete columns and indexes
CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  fir_id BIGINT REFERENCES fir(fir_id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partial index for fast notification bell icon badge count (PO1 & PO5)
CREATE INDEX IF NOT EXISTS idx_notifications_unread_user 
  ON notifications(user_id, created_at DESC) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all 
  ON notifications(user_id, created_at DESC);

-- 2. Citizen Feedback Table (FR-T4)
CREATE TABLE IF NOT EXISTS citizen_feedback (
  feedback_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT UNIQUE NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  citizen_id BIGINT NOT NULL REFERENCES citizens(citizen_id) ON DELETE RESTRICT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  timeliness_rating SMALLINT CHECK (timeliness_rating BETWEEN 1 AND 5),
  police_conduct_rating SMALLINT CHECK (police_conduct_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_fir ON citizen_feedback(fir_id);
CREATE INDEX IF NOT EXISTS idx_feedback_citizen ON citizen_feedback(citizen_id);

-- 3. Register and Map Permissions
INSERT INTO permissions (code) VALUES
  ('notification:read'),
  ('feedback:create'),
  ('timeline:read')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code = 'CITIZEN'
  AND p.code IN ('notification:read', 'feedback:create', 'timeline:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.code IN ('DESK_OFFICER', 'IO', 'SHO', 'SUPERVISOR', 'ADMIN')
  AND p.code IN ('notification:read', 'timeline:read')
ON CONFLICT (role_id, permission_id) DO NOTHING;
