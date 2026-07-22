-- supabase/migrations/011_live_data_tables.sql
-- EC-1.1 + EC-1.2 + TE-2.1: Live data tables + API cache

-- ── API cache (Redis substitute — Supabase-backed KV with TTL) ────────────────

CREATE TABLE IF NOT EXISTS api_cache (
  cache_key    TEXT PRIMARY KEY,
  value        JSONB    NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cache_expires
  ON api_cache (expires_at);

-- ── trade_flows — Stats Canada + UN Comtrade data ─────────────────────────────

CREATE TABLE IF NOT EXISTS trade_flows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code           TEXT NOT NULL,
  reporter_country  TEXT NOT NULL,   -- importing country ISO-3 code
  year              INTEGER NOT NULL,
  import_value_usd  BIGINT,          -- total imports of this HS code by country
  canada_export_usd BIGINT,          -- CA exports of this HS code to this country
  canada_share_pct  NUMERIC(6,3),    -- (canada_export_usd / import_value_usd) * 100
  source_name       TEXT,
  last_verified_at  TIMESTAMPTZ,
  confidence_level  TEXT CHECK (confidence_level IN ('verified','current','aging','stale','estimated')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (hs_code, reporter_country, year)
);

CREATE INDEX IF NOT EXISTS idx_trade_flows_hs_country
  ON trade_flows (hs_code, reporter_country);

CREATE INDEX IF NOT EXISTS idx_trade_flows_hs_year
  ON trade_flows (hs_code, year);

-- ── ustariffrates — USITC nightly ingest ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS ustariffrates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hts_code          TEXT NOT NULL UNIQUE,
  description       TEXT,
  mfn_rate          NUMERIC(8,4),   -- Most Favoured Nation rate (%)
  special_rates     JSONB,          -- { "CUSMA": "0%", "CPTPP": "0%", ... }
  additional_duties JSONB,          -- { "section_232": "25%", "section_301": "7.5%" }
  effective_date    DATE,
  source_name       TEXT DEFAULT 'USITC HTS',
  last_verified_at  TIMESTAMPTZ,
  confidence_level  TEXT DEFAULT 'verified'
    CHECK (confidence_level IN ('verified','current','aging','stale','estimated')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ustariffrates_hts
  ON ustariffrates (hts_code);

-- ── tariffchanges — diff log for USITC nightly ───────────────────────────────

CREATE TABLE IF NOT EXISTS tariffchanges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  hts_code     TEXT NOT NULL,
  field_name   TEXT NOT NULL,    -- 'mfn_rate' | 'special_rates' | 'additional_duties'
  old_value    TEXT,
  new_value    TEXT,
  source_name  TEXT DEFAULT 'USITC HTS',
  last_verified_at TIMESTAMPTZ,
  confidence_level TEXT DEFAULT 'verified'
);

CREATE INDEX IF NOT EXISTS idx_tariffchanges_hts
  ON tariffchanges (hts_code, created_at DESC);
