-- 003_fund_my_export.sql
-- Fund My Export: tables, indexes, and seed data

-- ─── 1. funding_programs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funding_programs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  provider            TEXT NOT NULL,           -- e.g. "EDC", "BDC", "AAFC"
  program_type        TEXT NOT NULL,           -- 'grant' | 'loan' | 'insurance' | 'guarantee' | 'advisory'
  description         TEXT NOT NULL,
  eligible_sectors    TEXT[]  NOT NULL DEFAULT '{}',
  eligible_countries  TEXT[]  NOT NULL DEFAULT '{}',  -- empty = any country
  min_revenue_cad     NUMERIC,
  max_revenue_cad     NUMERIC,
  min_employees       INT,
  max_employees       INT,
  min_export_value    NUMERIC,
  max_export_value    NUMERIC,
  is_sme_only         BOOLEAN NOT NULL DEFAULT TRUE,
  requires_fta        BOOLEAN NOT NULL DEFAULT FALSE,
  fta_countries       TEXT[]  NOT NULL DEFAULT '{}',
  website_url         TEXT NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_programs_type     ON funding_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_funding_programs_active   ON funding_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_funding_programs_sectors  ON funding_programs USING GIN(eligible_sectors);
CREATE INDEX IF NOT EXISTS idx_funding_programs_countries ON funding_programs USING GIN(eligible_countries);

-- ─── 2. funding_program_changes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funding_program_changes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID REFERENCES funding_programs(id) ON DELETE CASCADE,
  change_type     TEXT NOT NULL,   -- 'new' | 'updated' | 'deactivated'
  old_data        JSONB,
  new_data        JSONB,
  approved        BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at     TIMESTAMPTZ,
  approved_by     TEXT,
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fpc_program     ON funding_program_changes(program_id);
CREATE INDEX IF NOT EXISTS idx_fpc_approved    ON funding_program_changes(approved);
CREATE INDEX IF NOT EXISTS idx_fpc_detected_at ON funding_program_changes(detected_at);

-- ─── 3. funding_sync_log ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funding_sync_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  programs_checked INT,
  changes_found    INT,
  status          TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'success' | 'failed'
  error_message   TEXT
);

-- ─── 4. fund_my_export_runs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fund_my_export_runs (
  user_id     TEXT NOT NULL,
  year_month  TEXT NOT NULL,        -- 'YYYY-MM'
  run_count   INT  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_fme_runs_user ON fund_my_export_runs(user_id);

-- ─── 5. funding_results_cache ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funding_results_cache (
  cache_key   TEXT PRIMARY KEY,
  results     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_frc_expires ON funding_results_cache(expires_at);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_funding_programs_updated_at
  BEFORE UPDATE ON funding_programs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Seed: 20 Canadian export funding programs ───────────────────────────────
INSERT INTO funding_programs (
  slug, name, provider, program_type, description,
  eligible_sectors, eligible_countries,
  min_revenue_cad, max_revenue_cad, min_employees, max_employees,
  min_export_value, max_export_value,
  is_sme_only, requires_fta, fta_countries,
  website_url, is_active
) VALUES

-- 1
('edc-export-guarantee',
 'Export Guarantee Program',
 'EDC',
 'guarantee',
 'EDC guarantees your bank loans so you can get the financing needed to fulfill export contracts — even when traditional lenders hesitate.',
 ARRAY['manufacturing','technology','agriculture','clean-tech','services'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, 500,
 50000, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://www.edc.ca/en/guide/export-guarantee-program.html',
 TRUE),

-- 2
('edc-accounts-receivable',
 'Accounts Receivable Insurance',
 'EDC',
 'insurance',
 'Protects your export receivables against non-payment due to buyer insolvency, default, or political risk in the buyer''s country.',
 ARRAY['manufacturing','agriculture','technology','services','retail'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://www.edc.ca/en/guide/accounts-receivable-insurance.html',
 TRUE),

-- 3
('edc-foreign-buyer-financing',
 'Foreign Buyer Financing',
 'EDC',
 'loan',
 'EDC lends directly to your foreign buyer so they can afford to purchase your Canadian goods and services — reducing your payment risk.',
 ARRAY['manufacturing','clean-tech','infrastructure','aerospace'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 500000, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://www.edc.ca/en/guide/foreign-buyer-financing.html',
 TRUE),

-- 4
('bdc-export-working-capital',
 'Export Working Capital Loan',
 'BDC',
 'loan',
 'Flexible working capital financing to help SMEs bridge the gap between shipping goods and receiving payment from foreign buyers.',
 ARRAY['manufacturing','technology','agriculture','services'],
 ARRAY[]::TEXT[],
 NULL, 50000000, NULL, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.bdc.ca/en/financing/business-loans/working-capital-line-credit',
 TRUE),

-- 5
('bdc-growth-equity',
 'Growth & Transition Capital',
 'BDC',
 'loan',
 'Patient, subordinate financing (quasi-equity) for SMEs pursuing international market expansion, including export scale-up.',
 ARRAY['manufacturing','technology','life-sciences','clean-tech'],
 ARRAY[]::TEXT[],
 5000000, 150000000, 20, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.bdc.ca/en/financing/growth-transition-capital',
 TRUE),

-- 6
('tradecommissioner-cef',
 'CanExport SMEs',
 'TCS / Global Affairs Canada',
 'grant',
 'Non-repayable contribution covering up to 75% of eligible costs for Canadian SMEs developing new export markets, including travel, translation, and trade show participation.',
 ARRAY['manufacturing','technology','agri-food','clean-tech','services','creative-industries'],
 ARRAY[]::TEXT[],
 100000, 50000000, NULL, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.tradecommissioner.gc.ca/funding-financement/canexport/sme-pme/index.aspx',
 TRUE),

-- 7
('tradecommissioner-cef-innovators',
 'CanExport Innovators',
 'TCS / Global Affairs Canada',
 'grant',
 'Covers up to 75% of eligible costs for Canadian start-ups and innovators entering global markets — focused on IP protection, market validation, and investor introductions abroad.',
 ARRAY['technology','life-sciences','clean-tech','digital-media'],
 ARRAY[]::TEXT[],
 200000, 50000000, NULL, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.tradecommissioner.gc.ca/funding-financement/canexport/innovators-innovateurs/index.aspx',
 TRUE),

-- 8
('aafc-agri-marketing',
 'Agri-Marketing Program',
 'AAFC',
 'grant',
 'Cost-sharing funding for industry associations to build and expand markets for Canadian agricultural and food products abroad.',
 ARRAY['agriculture','agri-food','food-processing'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://agriculture.canada.ca/en/agricultural-programs-and-services/agri-marketing',
 TRUE),

-- 9
('nrc-irap-export',
 'IRAP Export Assistance',
 'NRC-IRAP',
 'grant',
 'NRC-IRAP industrial technology advisors help SMEs commercialise innovations abroad with advisory support and co-funding for international market development.',
 ARRAY['technology','clean-tech','life-sciences','manufacturing','advanced-manufacturing'],
 ARRAY[]::TEXT[],
 NULL, NULL, 1, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://nrc.canada.ca/en/support-technology-innovation/nrc-irap',
 TRUE),

-- 10
('ccc-government-to-government',
 'Government-to-Government Export Facilitation',
 'CCC',
 'advisory',
 'CCC acts as Canada''s Prime Contractor for government-to-government deals, providing buyer-government assurance that your Canadian company will perform — opening doors in markets where G2G contracting is required.',
 ARRAY['defence','aerospace','infrastructure','clean-tech','ICT'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 1000000, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://www.ccc.ca/en/how-we-help',
 TRUE),

-- 11
('fitt-trade-educator',
 'FITT Trade Educator Grant',
 'FITT',
 'grant',
 'Subsidised access to FITTskills trade training and CITP|FIBP designation for SME employees to build in-house export competency.',
 ARRAY['manufacturing','technology','agriculture','services','retail'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.fitt.ca/training/fittskills/',
 TRUE),

-- 12
('edc-political-risk',
 'Political Risk Insurance',
 'EDC',
 'insurance',
 'Covers Canadian investors and exporters against losses caused by political violence, expropriation, or currency inconvertibility in emerging markets.',
 ARRAY['manufacturing','infrastructure','mining','energy','services'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, FALSE, ARRAY[]::TEXT[],
 'https://www.edc.ca/en/guide/political-risk-insurance.html',
 TRUE),

-- 13
('ceta-tariff-advantage',
 'CETA Tariff Advantage Advisory',
 'TCS',
 'advisory',
 'Trade Commissioner Service advisory program helping Canadian exporters certify origin and claim preferential tariff rates under CETA for goods exported to the 27 EU member states.',
 ARRAY['manufacturing','agriculture','agri-food','technology','services'],
 ARRAY['EU','Germany','France','Italy','Spain','Netherlands','Belgium','Poland','Sweden','Denmark','Finland','Ireland','Portugal','Austria','Czech Republic','Romania','Hungary','Bulgaria','Croatia','Slovakia','Slovenia','Lithuania','Latvia','Estonia','Luxembourg','Cyprus','Malta'],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, TRUE, ARRAY['EU','Germany','France','Italy','Spain','Netherlands','Belgium','Poland','Sweden','Denmark','Finland','Ireland','Portugal','Austria','Czech Republic','Romania','Hungary','Bulgaria','Croatia','Slovakia','Slovenia','Lithuania','Latvia','Estonia','Luxembourg','Cyprus','Malta'],
 'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/ceta-aecg/index.aspx',
 TRUE),

-- 14
('cusma-tariff-advantage',
 'CUSMA/USMCA Origin Certification Advisory',
 'TCS',
 'advisory',
 'Advisory support for certifying rules-of-origin compliance under CUSMA so Canadian exporters can claim duty-free access to the US and Mexico.',
 ARRAY['manufacturing','agriculture','automotive','services'],
 ARRAY['United States','Mexico'],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, TRUE, ARRAY['United States','Mexico'],
 'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cusma-aceum/index.aspx',
 TRUE),

-- 15
('cptpp-market-access',
 'CPTPP Market Access Support',
 'TCS',
 'advisory',
 'TCS advisors help Canadian companies leverage CPTPP preferential tariffs and services commitments in 10 Asia-Pacific markets including Japan, Australia, and Vietnam.',
 ARRAY['agriculture','agri-food','manufacturing','technology','financial-services'],
 ARRAY['Japan','Australia','New Zealand','Singapore','Vietnam','Malaysia','Mexico','Peru','Chile','Brunei'],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 FALSE, TRUE, ARRAY['Japan','Australia','New Zealand','Singapore','Vietnam','Malaysia','Mexico','Peru','Chile','Brunei'],
 'https://www.international.gc.ca/trade-commerce/trade-agreements-accords-commerciaux/agr-acc/cptpp-ptpgp/index.aspx',
 TRUE),

-- 16
('bdc-advisory-export-readiness',
 'BDC Export Readiness Advisory',
 'BDC',
 'advisory',
 'BDC consultants assess your company''s export readiness, identify gaps, and build a tailored export action plan — subsidised or free for qualifying SMEs.',
 ARRAY['manufacturing','technology','services','agri-food','clean-tech'],
 ARRAY[]::TEXT[],
 NULL, 50000000, 5, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.bdc.ca/en/consulting',
 TRUE),

-- 17
('ontario-export-market-access',
 'Ontario Export Market Access Program',
 'Ontario Ministry of Economic Development',
 'grant',
 'Reimburses Ontario-based SMEs for up to 50% of eligible export marketing costs, including trade shows, missions, and market research.',
 ARRAY['manufacturing','technology','clean-tech','services','agri-food'],
 ARRAY[]::TEXT[],
 500000, 100000000, 5, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.ontario.ca/page/export-market-access-program',
 TRUE),

-- 18
('bc-export-navigator',
 'BC Export Navigator Program',
 'BC Ministry of Jobs',
 'advisory',
 'Free export advisors based in BC help small businesses identify the right export programs, navigate government resources, and develop their first export plan.',
 ARRAY['manufacturing','technology','clean-tech','agri-food','services','creative-industries'],
 ARRAY[]::TEXT[],
 NULL, 5000000, NULL, 50,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www2.gov.bc.ca/gov/content/employment-business/business/bc-export-navigator',
 TRUE),

-- 19
('aafc-agriloan-plus',
 'AgriLoan Plus',
 'AAFC / FCC',
 'loan',
 'Farm Credit Canada loan with preferential interest rate for agricultural producers and agri-businesses expanding into export markets, including working capital and equipment.',
 ARRAY['agriculture','agri-food','food-processing'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, NULL,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://www.fcc-fac.ca/en/financing/agriloan-plus.html',
 TRUE),

-- 20
('ieso-cleantech-export',
 'Clean Growth Program — Export Stream',
 'NRCan',
 'grant',
 'Non-repayable contributions for Canadian clean-technology SMEs to demonstrate and deploy solutions in international markets, reducing technology risk for foreign buyers.',
 ARRAY['clean-tech','energy','environment','advanced-manufacturing'],
 ARRAY[]::TEXT[],
 NULL, NULL, NULL, 500,
 NULL, NULL,
 TRUE, FALSE, ARRAY[]::TEXT[],
 'https://natural-resources.canada.ca/science-and-data/funding-partnerships/funding-opportunities/clean-growth/19895',
 TRUE);
