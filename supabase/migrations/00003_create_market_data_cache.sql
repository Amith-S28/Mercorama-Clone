-- market_data_cache: TTL-backed trade intelligence payloads
CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hs_code TEXT NOT NULL,
  country TEXT NOT NULL,
  source TEXT NOT NULL,
  payload JSONB NOT NULL,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ttl_seconds INTEGER NOT NULL DEFAULT 86400,
  UNIQUE (hs_code, country, source)
);

CREATE INDEX IF NOT EXISTS idx_market_data_lookup
  ON market_data_cache (hs_code, country, source);
