-- ─────────────────────────────────────────────────────────────────────────────
-- 006_cohort_beta.sql
-- Cohort launch model: config, applications, waitlist, access codes, plan limits
-- Does NOT modify any existing tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── TABLE 1: cohort_config ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cohort_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_number  INTEGER NOT NULL DEFAULT 1,
  cohort_status  TEXT NOT NULL DEFAULT 'open',
  max_spots      INTEGER NOT NULL DEFAULT 10,
  spots_filled   INTEGER NOT NULL DEFAULT 0,
  opens_at       TIMESTAMP,
  closes_at      TIMESTAMP,
  notes          TEXT,
  updated_at     TIMESTAMP DEFAULT NOW()
);

INSERT INTO cohort_config (cohort_number, cohort_status, max_spots, spots_filled, notes)
VALUES (1, 'open', 10, 0, 'Cohort 1 — hand-selected founding members. Status drives live badge on /beta page. Auto-sets to full when spots_filled = max_spots.');

-- ─── TABLE 2: beta_applications ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS beta_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMP DEFAULT NOW(),
  full_name           TEXT NOT NULL,
  email               VARCHAR NOT NULL UNIQUE,
  company_name        TEXT NOT NULL,
  province            TEXT NOT NULL,
  website             VARCHAR,
  product_description TEXT NOT NULL,
  hs_code             VARCHAR,
  export_experience   TEXT NOT NULL,
  biggest_challenge   TEXT NOT NULL,
  selected_plan       TEXT NOT NULL,
  referral_source     TEXT,
  linkedin_url        VARCHAR,
  cohort_number       INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'pending',
  reviewed_at         TIMESTAMP,
  reviewed_by         UUID,
  admin_notes         TEXT,
  acceptance_sent_at  TIMESTAMP,
  access_code         VARCHAR(20),
  stripe_customer_id  VARCHAR,
  activated_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_beta_applications_email   ON beta_applications(email);
CREATE INDEX IF NOT EXISTS idx_beta_applications_status  ON beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_cohort  ON beta_applications(cohort_number);

-- ─── TABLE 3: waitlist ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waitlist (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMP DEFAULT NOW(),
  full_name      TEXT NOT NULL,
  email          VARCHAR NOT NULL UNIQUE,
  company_name   TEXT,
  province       TEXT,
  how_heard      TEXT,
  cohort_target  INTEGER,
  notified_at    TIMESTAMP,
  converted      BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email         ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_cohort_target ON waitlist(cohort_target);

-- ─── TABLE 4: access_codes ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS access_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           VARCHAR(20) NOT NULL UNIQUE,
  email          VARCHAR NOT NULL,
  cohort_number  INTEGER NOT NULL,
  selected_plan  TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW(),
  expires_at     TIMESTAMP NOT NULL,
  used_at        TIMESTAMP,
  used_by_ip     VARCHAR,
  is_referral    BOOLEAN DEFAULT false,
  referred_by    UUID REFERENCES beta_applications(id),
  is_active      BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code  ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);

-- ─── TABLE 5a: plan_config ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_config (
  plan               TEXT PRIMARY KEY,
  founding_price     DECIMAL(10,2),
  public_price       DECIMAL(10,2),
  currency           TEXT DEFAULT 'CAD',
  price_lock_months  INTEGER,
  is_active          BOOLEAN DEFAULT true
);

INSERT INTO plan_config (plan, founding_price, public_price, currency, price_lock_months, is_active) VALUES
  ('starter',  99.00,  149.00, 'CAD', 6, true),
  ('growth',  299.00,  349.00, 'CAD', 6, true),
  ('advisory',  null,    null, 'CAD', null, true);

-- ─── TABLE 5b: plan_limits ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_limits (
  plan          TEXT NOT NULL,
  limit_key     TEXT NOT NULL,
  limit_value   INTEGER NOT NULL,
  is_unlimited  BOOLEAN DEFAULT false,
  reset_period  TEXT DEFAULT 'monthly',
  PRIMARY KEY (plan, limit_key)
);

INSERT INTO plan_limits (plan, limit_key, limit_value, is_unlimited, reset_period) VALUES
  -- STARTER — $99/mo founding · $149/mo public
  ('starter', 'complete_deals',          10, false, 'monthly'),
  ('starter', 'incoterms_analyzer',      30, false, 'monthly'),
  ('starter', 'hs_classifications',      30, false, 'monthly'),
  ('starter', 'deal_summary_generator',  20, false, 'monthly'),
  ('starter', 'deal_wizard',             10, false, 'monthly'),
  ('starter', 'fund_my_export',          20, false, 'monthly'),
  ('starter', 'fta_diversify_wizard',    20, false, 'monthly'),
  ('starter', 'export_compass',           0, false, 'monthly'),
  ('starter', 'buyer_intelligence',       0, false, 'monthly'),
  ('starter', 'tariff_engine',            0, false, 'monthly'),
  ('starter', 'freight_connect',          0, false, 'monthly'),
  -- GROWTH — $299/mo founding · $349/mo public
  ('growth',  'complete_deals',          50, false, 'monthly'),
  ('growth',  'incoterms_analyzer',     100, false, 'monthly'),
  ('growth',  'hs_classifications',     100, false, 'monthly'),
  ('growth',  'deal_summary_generator',  50, false, 'monthly'),
  ('growth',  'deal_wizard',             30, false, 'monthly'),
  ('growth',  'fund_my_export',          50, false, 'monthly'),
  ('growth',  'fta_diversify_wizard',    50, false, 'monthly'),
  ('growth',  'export_compass',          50, false, 'monthly'),
  ('growth',  'buyer_intelligence',       0, false, 'monthly'),
  ('growth',  'tariff_engine',            0, false, 'monthly'),
  ('growth',  'freight_connect',          0, false, 'monthly');

-- ─── MIGRATION NOTES ─────────────────────────────────────────────────────────
-- Run when each feature ships:
--
-- WHEN Tariff Engine (TE-2.1–TE-2.8) is confirmed live:
--   UPDATE plan_limits SET limit_value = -1, is_unlimited = true WHERE limit_key = 'tariff_engine';
--
-- WHEN Freight Connect is confirmed live:
--   UPDATE plan_limits SET limit_value = 20 WHERE plan = 'starter' AND limit_key = 'freight_connect';
--   UPDATE plan_limits SET limit_value = 50 WHERE plan = 'growth'  AND limit_key = 'freight_connect';
--
-- WHEN Buyer Intelligence is confirmed live:
--   UPDATE plan_limits SET limit_value = 50 WHERE plan = 'growth'  AND limit_key = 'buyer_intelligence';
--
-- IMPORTANT: Never hardcode limit values in application logic.
-- Always read from plan_limits at runtime.
-- ─────────────────────────────────────────────────────────────────────────────
