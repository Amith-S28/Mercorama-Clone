-- 009_canada_restriction.sql
-- Layer 3: country field on users (defaults to CA for all founding members)
-- New table: international_waitlist for non-Canadian demand capture

ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CA';

CREATE TABLE IF NOT EXISTS international_waitlist (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email        VARCHAR     NOT NULL UNIQUE,
  country      TEXT,
  country_code TEXT,
  detected_at  TIMESTAMPTZ,
  source       TEXT  -- 'activate_geo_block' | 'waitlist_form'
);

CREATE INDEX IF NOT EXISTS idx_intl_waitlist_country_code
  ON international_waitlist (country_code);
