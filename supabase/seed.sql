-- Seed: mock advisor + two sample SMEs for immediate UI validation
-- Advisor UUID: 00000000-0000-0000-0000-000000000001

-- Removed mock data inserts to prepare for production

INSERT INTO fx_rate_cache (base_currency, target_currency, rate, volatility_30d, volatility_90d) VALUES
  ('CAD', 'JPY', 109.45000000, 0.012500, 0.018200),
  ('CAD', 'EUR', 0.67200000, 0.009800, 0.014100),
  ('CAD', 'USD', 0.73400000, 0.006200, 0.009500)
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate,
    volatility_30d = EXCLUDED.volatility_30d,
    volatility_90d = EXCLUDED.volatility_90d,
    fetched_at = now();
