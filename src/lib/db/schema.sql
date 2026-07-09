-- HCISPL AI Lead Mining Platform — Phase 1 schema
-- Postgres (Neon). Shape maps directly onto the SRS's Companies/Contacts/Social/Technologies spec.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member',
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  website      TEXT,
  industry     TEXT,
  gst          TEXT,
  cin          TEXT,
  address      TEXT,
  city         TEXT,
  state        TEXT,
  country      TEXT,
  employees    TEXT,
  revenue      TEXT,
  founded      TEXT,
  summary      TEXT,
  lead_score      INTEGER DEFAULT 0,
  priority_score  INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'queued',
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id               SERIAL PRIMARY KEY,
  company_id       INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  designation      TEXT,
  department       TEXT,
  business_email   TEXT,
  business_phone   TEXT,
  linkedin         TEXT,
  confidence_score INTEGER DEFAULT 0,
  source           TEXT
);

CREATE TABLE IF NOT EXISTS social_profiles (
  company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  linkedin   TEXT,
  facebook   TEXT,
  instagram  TEXT,
  x          TEXT,
  youtube    TEXT
);

CREATE TABLE IF NOT EXISTS technologies (
  company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  firewall   TEXT,
  cloud      TEXT,
  email      TEXT,
  erp        TEXT,
  crm        TEXT,
  hosting    TEXT,
  analytics  TEXT,
  cdn        TEXT,
  cms        TEXT
);

CREATE TABLE IF NOT EXISTS search_history (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  query      TEXT NOT NULL,
  query_type TEXT NOT NULL DEFAULT 'name',
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bulk_jobs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id),
  filename      TEXT NOT NULL,
  total_rows    INTEGER NOT NULL DEFAULT 0,
  processed_rows INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'queued',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  label      TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS provider_api_keys (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  provider    TEXT NOT NULL,
  api_key     TEXT NOT NULL,
  key_prefix  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);