-- fx_rate_cache: FX pairs with rolling volatility metrics
CREATE TABLE IF NOT EXISTS fx_rate_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC(18, 8) NOT NULL,
  volatility_30d NUMERIC(10, 6),
  volatility_90d NUMERIC(10, 6),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (base_currency, target_currency)
);
