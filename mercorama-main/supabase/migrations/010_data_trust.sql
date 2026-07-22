-- supabase/migrations/010_data_trust.sql
-- DT-2: Add source_name, last_verified_at, confidence_level to data tables
-- DT-4: Create data_quality_flags table
-- DT-8: Create admin_changelog table

-- ── DT-2: Add data trust columns to existing trade data tables ────────────────
-- Only adds columns if they don't already exist (safe to re-run)

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ustariffrates','catariffrates','tariffchanges','market_scores','trade_flows']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'source_name' AND table_schema = 'public') THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN source_name TEXT', t);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'last_verified_at' AND table_schema = 'public') THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN last_verified_at TIMESTAMPTZ', t);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'confidence_level' AND table_schema = 'public') THEN
        EXECUTE format(
          'ALTER TABLE %I ADD COLUMN confidence_level TEXT CHECK (confidence_level IN (''verified'',''current'',''aging'',''stale'',''estimated''))',
          t
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- ── DT-4: data_quality_flags ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_quality_flags (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  table_name    TEXT,
  record_id     UUID,
  flag_type     TEXT,
    -- 'tariff_inconsistency' | 'trade_flow_outlier' | 'stale_data' | 'user_reported'
  details       JSONB DEFAULT '{}',
  status        TEXT DEFAULT 'open',
    -- 'open' | 'reviewing' | 'resolved'
  resolved_at   TIMESTAMPTZ,
  resolved_by   TEXT
);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_status
  ON data_quality_flags (status);

CREATE INDEX IF NOT EXISTS idx_data_quality_flags_table
  ON data_quality_flags (table_name);

-- ── DT-8: admin_changelog ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_changelog (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  entry_type       TEXT,
    -- 'data_correction' | 'rate_update' | 'source_change' | 'incident' | 'validation_run'
  title            TEXT,
  description      TEXT,
  affected_tables  TEXT[],
  created_by       TEXT,
  severity         TEXT
    -- 'low' | 'medium' | 'high' | 'critical'
);

CREATE INDEX IF NOT EXISTS idx_admin_changelog_entry_type
  ON admin_changelog (entry_type);

CREATE INDEX IF NOT EXISTS idx_admin_changelog_severity
  ON admin_changelog (severity);
