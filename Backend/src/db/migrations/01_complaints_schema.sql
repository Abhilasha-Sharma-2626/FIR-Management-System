DO && BEGIN
  CREATE TYPE fir_status AS ENUM (
    'DRAFT','SUBMITTED','UNDER_REVIEW','INFO_REQUESTED','REJECTED','REGISTERED','ASSIGNED','UNDER_INVESTIGATION','PENDING_APPROVAL','CHARGESHEET_FILED','CLOSED','TRANSFERED','REOPENED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS crime_categories(
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  present_id INT REFERENCES crime_categories(category_id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO crime_categogries (name,description) VALUES
  ('Theft / burglary', 'Unlawful taking of property'),
  ('Cyber Crime', 'Online fraud, harassment, data breach'),
  ('Physical Assault', 'Infliction of Physical harm'),
  ('Cheating / Financial Fraud', 'Deceptive transaction and fraud')
  ('Missing Person', 'Report of missing child or adult')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS fir (
  fir_id BIGSERIAL PRIMARY KEY,
  tracking_id VARCHAR(25) UNIQUE,
  fir_number VARCHAR(40) UNIQUE,
  complaint_id BIGINT NOT NULL REFERENCES citizens(citizen_id),
  station_id INT REFERENCES police_stations(station_id),
  category_id INT REFERENCES crime_categogries(category_id),
  incident_dt TIMESTAMPTZ NOT NULL,
  location_text TEXT NOT NULL,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  description TEXT NOT NULL,
  status fir_status NOT NULL DEFAULT 'DRAFT',
  priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  is_cognizable BOOLEAN DEFAULT TRUE,
  rejection_reason TEXT,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fir_complainant ON fir(complainant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fir_station_status ON fir(station_id,status,priority DESC);
CREATE INDEX IF NOT EXISTS idx_fir_tracking_id ON fir(tracking_id);

CREATE TABLE IF NOT EXISTS fir_persons(
  person_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  person_role VARCHAR(10) NOT NULL CHECK(person_role IN ('ACCUSED','WITNESS','VICTIM')),
  full_name VARCHAR(120) NOT NULL,
  contact VARCHAR(40),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fir_persons_fir ON fir_persons(fir_id);

CREATE TABLE IF NOT EXISTS attachments(
  attachment_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  uploaded_by BIGINT NOT NULL REFERENCES users(user_id),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes>0),
  sha256 CHAR(64) NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_fir ON attachments(fir_id);

CREATE TABLE IF NOT EXISTS case_status_history(
  history_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT NOT NULL REFERENCES fir(fir_id) ON DELETE CASCADE,
  from_state fir_status,
  to_state fir_status NOT NULL,
  actor_id BIGINT NOT NULL REFERENCES users(user_id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_history_fir ON case_status_history(fir_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications(
  notification_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(user_id),
  fir_id BIGINT REFERENCES fir(fir_id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC);