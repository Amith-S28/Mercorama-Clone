-- supabase/migrations/012_province_trade.sql
-- Province-by-province trade data backfill infrastructure.
-- Adds: province_products, statcan_exports, comtrade_quota
-- Extends: trade_flows with partner_iso3 + flow_type dimensions

-- ── Extend trade_flows ─────────────────────────────────────────────────────────
ALTER TABLE trade_flows ADD COLUMN IF NOT EXISTS partner_iso3  TEXT NOT NULL DEFAULT 'WLD';
ALTER TABLE trade_flows ADD COLUMN IF NOT EXISTS flow_type     TEXT NOT NULL DEFAULT 'import';
ALTER TABLE trade_flows ADD COLUMN IF NOT EXISTS data_source   TEXT NOT NULL DEFAULT 'UN Comtrade';
ALTER TABLE trade_flows ADD COLUMN IF NOT EXISTS hs_version    TEXT NOT NULL DEFAULT 'HS 2022';

-- Rebuild unique constraint to include new dimensions (safe: drops old if exists)
DO $$
BEGIN
  ALTER TABLE trade_flows DROP CONSTRAINT IF EXISTS trade_flows_hs_code_reporter_country_year_key;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE trade_flows
    ADD CONSTRAINT trade_flows_uq
    UNIQUE (hs_code, reporter_country, partner_iso3, year, flow_type);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- ── province_products ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS province_products (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  province_code        TEXT    NOT NULL,   -- 'NS','NB','QC', ...
  category             TEXT,
  product_name         TEXT    NOT NULL,
  est_export_value_cad NUMERIC,
  hs6_codes            TEXT[], -- populated once by mapping step
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_province_products_province
  ON province_products (province_code);

-- ── statcan_exports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS statcan_exports (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  hs6_code         TEXT    NOT NULL,
  province_code    TEXT    NOT NULL,   -- 'NS','QC',... or 'CA' for national
  partner_iso3     TEXT    NOT NULL,   -- destination market
  year             INTEGER NOT NULL,
  export_value_cad NUMERIC,
  export_qty       NUMERIC,
  source           TEXT    DEFAULT 'Statistics Canada',
  last_synced_at   TIMESTAMPTZ,
  UNIQUE (hs6_code, province_code, partner_iso3, year)
);

CREATE INDEX IF NOT EXISTS idx_statcan_exports_hs6_province
  ON statcan_exports (hs6_code, province_code);

CREATE INDEX IF NOT EXISTS idx_statcan_exports_hs6_partner
  ON statcan_exports (hs6_code, partner_iso3);

-- ── comtrade_quota ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comtrade_quota (
  date       DATE    PRIMARY KEY,
  calls_made INTEGER NOT NULL DEFAULT 0
);

-- ── Seed: Nova Scotia province products ───────────────────────────────────────
INSERT INTO province_products
  (province_code, category, product_name, est_export_value_cad, hs6_codes)
VALUES
  ('NS', 'Seafood',      'Lobster – Live',                    2500000000, ARRAY['030622','030612']),
  ('NS', 'Seafood',      'Lobster – Processed',                400000000, ARRAY['160510']),
  ('NS', 'Seafood',      'Snow Crab',                          500000000, ARRAY['030614']),
  ('NS', 'Seafood',      'Scallop',                            200000000, ARRAY['030742']),
  ('NS', 'Seafood',      'Atlantic Halibut',                    80000000, ARRAY['030289']),
  ('NS', 'Seafood',      'Shrimp',                             150000000, ARRAY['030617']),
  ('NS', 'Seafood',      'Clam',                                50000000, ARRAY['030739']),
  ('NS', 'Agriculture',  'Wild Blueberries & Berries',         120000000, ARRAY['081040','200899']),
  ('NS', 'Horticulture', 'Christmas Trees & Horticulture',      30000000, ARRAY['060420'])
ON CONFLICT DO NOTHING;
