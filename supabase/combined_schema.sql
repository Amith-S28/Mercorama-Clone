-- MIGRATION: 00001_create_client_smes.sql
-- client_smes: primary SME export profile
CREATE TABLE IF NOT EXISTS client_smes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  industry TEXT NOT NULL CHECK (industry IN (
    'Food, Beverage & CPG',
    'Seafood & Ocean Economy',
    'Advanced Manufacturing & Industrial',
    'Defence, Dual-Use & Critical Supply Chains',
    'Other / Unsure'
  )),
  product_description TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  export_quantity INTEGER NOT NULL DEFAULT 0,
  production_cost NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  target_profit_margin NUMERIC(5, 2) NOT NULL,
  contact_email TEXT,
  primary_contact TEXT,
  website TEXT,
  has_local_agent BOOLEAN DEFAULT FALSE,
  employee_range TEXT,
  revenue_range TEXT,
  target_country TEXT NOT NULL,
  target_country_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_smes_advisor_id ON client_smes (advisor_id);
CREATE INDEX IF NOT EXISTS idx_client_smes_hs_code ON client_smes (hs_code);


-- MIGRATION: 00002_create_readiness_assessments.sql
-- client_readiness_assessments: weighted pillar scores + raw responses
CREATE TABLE IF NOT EXISTS client_readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sme_id UUID NOT NULL REFERENCES client_smes(id) ON DELETE CASCADE,
  overall_score NUMERIC(5, 2) NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  pillar_scores JSONB NOT NULL,
  answers JSONB NOT NULL,
  selected_questions TEXT[] NOT NULL,
  ai_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_sme_id ON client_readiness_assessments (sme_id);


-- MIGRATION: 00003_create_market_data_cache.sql
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


-- MIGRATION: 00004_create_fx_rate_cache.sql
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


-- MIGRATION: 00005_create_sanctions_log.sql
-- sanctions_screening_log: append-only audit trail
CREATE TABLE IF NOT EXISTS sanctions_screening_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL,
  input_query TEXT NOT NULL,
  matched_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  source TEXT NOT NULL,
  source_version TEXT,
  screened_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sanctions_log_advisor
  ON sanctions_screening_log (advisor_id, screened_at DESC);

-- Append-only: block UPDATE/DELETE for authenticated roles
REVOKE UPDATE, DELETE ON sanctions_screening_log FROM authenticated, anon;


-- MIGRATION: 00006_create_advisor_notes.sql
-- advisor_notes: per-pillar advisor commentary
CREATE TABLE IF NOT EXISTS advisor_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES client_readiness_assessments(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL,
  pillar TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, pillar)
);

CREATE INDEX IF NOT EXISTS idx_advisor_notes_assessment
  ON advisor_notes (assessment_id);


-- MIGRATION: 00007_create_roadmap_items.sql
-- roadmap_items: 30/60/90-day action columns
CREATE TABLE IF NOT EXISTS roadmap_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES client_readiness_assessments(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL,
  task TEXT NOT NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('30-day', '60-day', '90-day')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_assessment_bucket
  ON roadmap_items (assessment_id, bucket, sort_order);


-- MIGRATION: 00008_create_api_health_status.sql
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


-- MIGRATION: 00009_rls_policies.sql
-- RLS policies: advisor-scoped access with V1 mock advisor fallback
-- Mock advisor: 00000000-0000-0000-0000-000000000001

ALTER TABLE client_smes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE fx_rate_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions_screening_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_health_status ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_advisor_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.uid(),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- client_smes
CREATE POLICY client_smes_select ON client_smes
  FOR SELECT USING (advisor_id = public.current_advisor_id());
CREATE POLICY client_smes_insert ON client_smes
  FOR INSERT WITH CHECK (advisor_id = public.current_advisor_id());
CREATE POLICY client_smes_update ON client_smes
  FOR UPDATE USING (advisor_id = public.current_advisor_id());
CREATE POLICY client_smes_delete ON client_smes
  FOR DELETE USING (advisor_id = public.current_advisor_id());

-- assessments via parent SME ownership
CREATE POLICY assessments_select ON client_readiness_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_smes s
      WHERE s.id = sme_id AND s.advisor_id = public.current_advisor_id()
    )
  );
CREATE POLICY assessments_insert ON client_readiness_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_smes s
      WHERE s.id = sme_id AND s.advisor_id = public.current_advisor_id()
    )
  );
CREATE POLICY assessments_update ON client_readiness_assessments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM client_smes s
      WHERE s.id = sme_id AND s.advisor_id = public.current_advisor_id()
    )
  );

-- market_data_cache: readable by advisors, writable by service role
CREATE POLICY market_data_select ON market_data_cache
  FOR SELECT USING (true);
CREATE POLICY market_data_write ON market_data_cache
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- fx_rate_cache
CREATE POLICY fx_rate_select ON fx_rate_cache
  FOR SELECT USING (true);
CREATE POLICY fx_rate_write ON fx_rate_cache
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- sanctions_screening_log: INSERT only for advisors
CREATE POLICY sanctions_insert ON sanctions_screening_log
  FOR INSERT WITH CHECK (advisor_id = public.current_advisor_id());
CREATE POLICY sanctions_select ON sanctions_screening_log
  FOR SELECT USING (advisor_id = public.current_advisor_id());

-- advisor_notes
CREATE POLICY notes_select ON advisor_notes
  FOR SELECT USING (advisor_id = public.current_advisor_id());
CREATE POLICY notes_insert ON advisor_notes
  FOR INSERT WITH CHECK (advisor_id = public.current_advisor_id());
CREATE POLICY notes_update ON advisor_notes
  FOR UPDATE USING (advisor_id = public.current_advisor_id());
CREATE POLICY notes_delete ON advisor_notes
  FOR DELETE USING (advisor_id = public.current_advisor_id());

-- roadmap_items
CREATE POLICY roadmap_select ON roadmap_items
  FOR SELECT USING (advisor_id = public.current_advisor_id());
CREATE POLICY roadmap_insert ON roadmap_items
  FOR INSERT WITH CHECK (advisor_id = public.current_advisor_id());
CREATE POLICY roadmap_update ON roadmap_items
  FOR UPDATE USING (advisor_id = public.current_advisor_id());
CREATE POLICY roadmap_delete ON roadmap_items
  FOR DELETE USING (advisor_id = public.current_advisor_id());

-- api_health_status: readable by all, writable by service-role only
CREATE POLICY api_health_select ON api_health_status
  FOR SELECT USING (true);
CREATE POLICY api_health_write ON api_health_status
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Atomic V2 migration helper: reassign mock advisor SMEs to a real user
CREATE OR REPLACE FUNCTION public.migrate_mock_advisor_data(new_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE client_smes
  SET advisor_id = new_user_id
  WHERE advisor_id = '00000000-0000-0000-0000-000000000001'::uuid;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  UPDATE advisor_notes
  SET advisor_id = new_user_id
  WHERE advisor_id = '00000000-0000-0000-0000-000000000001'::uuid;

  UPDATE roadmap_items
  SET advisor_id = new_user_id
  WHERE advisor_id = '00000000-0000-0000-0000-000000000001'::uuid;

  UPDATE sanctions_screening_log
  SET advisor_id = new_user_id
  WHERE advisor_id = '00000000-0000-0000-0000-000000000001'::uuid;

  RETURN updated_count;
END;
$$;


-- SEED DATA
-- Seed: mock advisor + two sample SMEs for immediate UI validation
-- Advisor UUID: 00000000-0000-0000-0000-000000000001

INSERT INTO client_smes (
  id, advisor_id, name, province, industry, product_description, hs_code,
  export_quantity, production_cost, unit_price, target_profit_margin,
  contact_email, primary_contact, website, has_local_agent,
  employee_range, revenue_range, target_country, target_country_name
) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Atlantic Maple Foods Inc.',
  'New Brunswick',
  'Food, Beverage & CPG',
  'Organic maple syrup in retail glass bottles (250ml / 500ml)',
  '170220',
  12000,
  4.85,
  11.50,
  18.00,
  'exports@atlanticmaple.ca',
  'Claire Beaumont',
  'https://www.atlanticmaple.ca',
  TRUE,
  '10-49',
  '$1M–$5M',
  'JPN',
  'Japan'
),
(
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000001',
  'Nordic Precision Components Ltd.',
  'Ontario',
  'Advanced Manufacturing & Industrial',
  'CNC-machined aluminum housings for industrial sensors',
  '761699',
  4500,
  22.40,
  48.00,
  22.00,
  'trade@nordicprecision.ca',
  'Marcus Chen',
  'https://www.nordicprecision.ca',
  FALSE,
  '50-199',
  '$5M–$20M',
  'DEU',
  'Germany'
);

-- Completed assessment for Atlantic Maple Foods
INSERT INTO client_readiness_assessments (
  id, sme_id, overall_score, grade, pillar_scores, answers, selected_questions, ai_report
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  72.40,
  'B',
  '{
    "management": 80,
    "product": 90,
    "operations": 70,
    "financial": 65,
    "legal": 75,
    "market": 70,
    "cultural": 55,
    "digital": 60,
    "programs": 68
  }'::jsonb,
  '{
    "Q1.1": "A", "Q1.2": "B", "Q1.3": "B",
    "Q2.1": "A", "Q2.2": "A", "Q2.3": "B",
    "Q3.1": "B", "Q3.2": "B", "Q3.3": "C",
    "Q4.1": "B", "Q4.2": "C", "Q4.3": "B",
    "Q5.1": "B", "Q5.2": "A", "Q5.3": "B",
    "Q6.1": "B", "Q6.2": "B", "Q6.3": "C",
    "Q7.1": "C", "Q7.2": "B", "Q7.3": "C",
    "Q8.1": "B", "Q8.2": "C", "Q8.3": "B",
    "Q9.1": "B", "Q9.2": "B", "Q9.3": "C",
    "Q1.4": "B", "Q2.4": "A", "Q4.4": "C"
  }'::jsonb,
  ARRAY[
    'Q1.1','Q1.2','Q1.3','Q2.1','Q2.2','Q2.3','Q3.1','Q3.2','Q3.3',
    'Q4.1','Q4.2','Q4.3','Q5.1','Q5.2','Q5.3','Q6.1','Q6.2','Q6.3',
    'Q7.1','Q7.2','Q7.3','Q8.1','Q8.2','Q8.3','Q9.1','Q9.2','Q9.3',
    'Q1.4','Q2.4','Q4.4'
  ],
  '{
    "summary": "Atlantic Maple is developing export readiness with strong product credentials and management commitment. Cultural localization and FX hedging remain the primary gaps before Japan market entry.",
    "gaps": [
      "Limited Japanese labeling / localization process",
      "No formal FX volatility hedge on JPY receivables",
      "Digital storefront not localized for JP buyers"
    ],
    "actions": [
      {"task": "Engage certified JP food-label translator", "tool": "CFIA Export Requirements", "regulation": "Japan Food Sanitation Act"},
      {"task": "Open CAD/JPY forward contract facility", "tool": "EDC Account Performance Security", "regulation": null},
      {"task": "Localize B2B catalog and Incoterms sheet", "tool": "CanExport SMEs", "regulation": null}
    ]
  }'::jsonb
);

-- Sample roadmap for completed assessment
INSERT INTO roadmap_items (assessment_id, advisor_id, task, bucket, sort_order, completed) VALUES
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Confirm HS 170220 with CBSA tariff finder', '30-day', 0, TRUE),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Commission Japanese bilingual label set', '30-day', 1, FALSE),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Request EDC country risk brief for Japan', '60-day', 0, FALSE),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Pilot shipment via bonded warehouse in Osaka', '90-day', 0, FALSE);

INSERT INTO advisor_notes (assessment_id, advisor_id, pillar, content) VALUES
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'cultural', 'Buyer expects keiretsu-style relationship cadence. Recommend intro via JETRO Toronto.'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'financial', 'Margin holds at 16% after 2% FX buffer — above 18% target only if freight drops below CAD 5,200/FEU.');

INSERT INTO fx_rate_cache (base_currency, target_currency, rate, volatility_30d, volatility_90d) VALUES
  ('CAD', 'JPY', 109.45000000, 0.012500, 0.018200),
  ('CAD', 'EUR', 0.67200000, 0.009800, 0.014100),
  ('CAD', 'USD', 0.73400000, 0.006200, 0.009500)
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate,
    volatility_30d = EXCLUDED.volatility_30d,
    volatility_90d = EXCLUDED.volatility_90d,
    fetched_at = now();

