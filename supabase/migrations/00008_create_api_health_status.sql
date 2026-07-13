-- api_health_status: live indicators for 7 external services
CREATE TABLE IF NOT EXISTS api_health_status (
  service_id TEXT PRIMARY KEY CHECK (service_id IN (
    'comtrade',
    'exchange_rate',
    'searates',
    'csl',
    'wto',
    'usitc',
    'taric'
  )),
  status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (status IN ('healthy', 'degraded', 'down', 'unconfigured', 'unknown')),
  last_checked_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  latency_ms INTEGER,
  error TEXT,
  is_key_configured BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO api_health_status (service_id, status, is_key_configured) VALUES
  ('comtrade', 'unconfigured', FALSE),
  ('exchange_rate', 'unconfigured', FALSE),
  ('searates', 'unconfigured', FALSE),
  ('csl', 'unconfigured', FALSE),
  ('wto', 'unconfigured', FALSE),
  ('usitc', 'unconfigured', FALSE),
  ('taric', 'unconfigured', FALSE)
ON CONFLICT (service_id) DO NOTHING;
