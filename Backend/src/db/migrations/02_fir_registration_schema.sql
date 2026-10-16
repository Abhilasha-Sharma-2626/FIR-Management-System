-- 1. Legal Sections Master Table (Bharatiya Nyaya Sanhita - BNS & IPC)
CREATE TABLE IF NOT EXISTS legal_sections (
  section_id SERIAL PRIMARY KEY,
  act VARCHAR(20) NOT NULL,             -- 'BNS', 'IPC', 'IT_ACT'
  section_no VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  is_cognizable BOOLEAN NOT NULL DEFAULT TRUE,
  is_bailable BOOLEAN DEFAULT FALSE,
  description TEXT,
  UNIQUE (act, section_no)
);

-- Seed common BNS & IPC sections
INSERT INTO legal_sections (act, section_no, title, is_cognizable, is_bailable) VALUES
  ('BNS', '303(2)', 'Theft', TRUE, FALSE),
  ('BNS', '318', 'Cheating and dishonestly inducing delivery of property', TRUE, TRUE),
  ('BNS', '115(2)', 'Voluntarily causing hurt', TRUE, TRUE),
  ('IT_ACT', '66C', 'Identity Theft', TRUE, TRUE),
  ('IT_ACT', '66D', 'Cheating by personation using computer resource', TRUE, FALSE)
ON CONFLICT (act, section_no) DO NOTHING;

-- 2. FIR Legal Sections Bridge Table
CREATE TABLE IF NOT EXISTS fir_sections (
  fir_id BIGINT REFERENCES fir(fir_id) ON DELETE CASCADE,
  section_id INT REFERENCES legal_sections(section_id) ON DELETE RESTRICT,
  PRIMARY KEY (fir_id, section_id)
);

-- 3. Investigation Cases Table (1:1 with Registered FIR)
CREATE TABLE IF NOT EXISTS cases (
  case_id BIGSERIAL PRIMARY KEY,
  fir_id BIGINT UNIQUE NOT NULL REFERENCES fir(fir_id) ON DELETE RESTRICT,
  current_io_id BIGINT REFERENCES officers(officer_id) ON DELETE SET NULL,
  investigation_started_at TIMESTAMPTZ,
  report_type VARCHAR(15) CHECK (report_type IN ('CHARGESHEET','CLOSURE')),
  outcome TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Station Year Sequence Counters for Concurrency Safety
CREATE TABLE IF NOT EXISTS fir_counters (
  station_id INT NOT NULL REFERENCES police_stations(station_id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_seq INT NOT NULL DEFAULT 0,
  PRIMARY KEY (station_id, year)
);

-- 5. State Transitions Configuration Table
CREATE TABLE IF NOT EXISTS state_transitions (
  from_state fir_status NOT NULL,
  to_state fir_status NOT NULL,
  required_permission VARCHAR(60) NOT NULL,
  PRIMARY KEY (from_state, to_state)
);

-- Seed valid transitions for intake & registration
INSERT INTO state_transitions (from_state, to_state, required_permission) VALUES
  ('DRAFT', 'SUBMITTED', 'fir:create'),
  ('SUBMITTED', 'UNDER_REVIEW', 'fir:review'),
  ('UNDER_REVIEW', 'INFO_REQUESTED', 'fir:review'),
  ('INFO_REQUESTED', 'UNDER_REVIEW', 'fir:respond'),
  ('UNDER_REVIEW', 'REJECTED', 'fir:reject'),
  ('REJECTED', 'UNDER_REVIEW', 'fir:appeal'),
  ('UNDER_REVIEW', 'REGISTERED', 'fir:register')
ON CONFLICT (from_state, to_state) DO NOTHING;
