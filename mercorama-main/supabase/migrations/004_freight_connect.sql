-- ─────────────────────────────────────────────────────────────────────────────
-- 004_freight_connect.sql
-- Freight Connect — forwarder directory, quote requests, SLA enforcement
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE forwarder_state      AS ENUM ('unclaimed', 'claimed', 'verified', 'featured');
CREATE TYPE forwarder_sub_tier   AS ENUM ('none', 'verified', 'featured');
CREATE TYPE quote_request_state  AS ENUM ('pending', 'sent_to_forwarder', 'responded', 'expired', 'refunded');
CREATE TYPE quote_lead_tier      AS ENUM ('quote_only', 'anonymised_profile');

-- ─── freight_forwarders ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS freight_forwarders (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  company_name                 text NOT NULL,
  ciffa_membership_number      text,
  logo_url                     text,
  website_url                  text,
  description                  text,

  -- State
  state                        forwarder_state NOT NULL DEFAULT 'unclaimed',

  -- Service coverage (GIN-indexed for search)
  provinces                    text[]  NOT NULL DEFAULT '{}',
  lanes                        text[]  NOT NULL DEFAULT '{}',
  hs_chapters                  text[]  NOT NULL DEFAULT '{}',  -- 2-digit only
  shipping_modes               text[]  NOT NULL DEFAULT '{}',

  -- Contact (only populated once claimed — never exposed until identity_revealed)
  primary_contact_name         text,
  primary_contact_email        text,

  -- Stripe
  stripe_customer_id           text,
  stripe_payment_method_on_file boolean NOT NULL DEFAULT false,

  -- Subscription
  subscription_tier            forwarder_sub_tier NOT NULL DEFAULT 'none',
  subscription_start_date      timestamptz,
  subscription_end_date        timestamptz,

  -- Founding partner
  is_founding_partner          boolean NOT NULL DEFAULT false,
  founding_partner_lock_expiry timestamptz,

  -- SLA enforcement
  response_sla_hours           integer NOT NULL DEFAULT 48,
  consecutive_missed_responses integer NOT NULL DEFAULT 0,
  is_suspended                 boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  claimed_at    timestamptz,
  verified_at   timestamptz
);

CREATE INDEX idx_ff_state          ON freight_forwarders (state);
CREATE INDEX idx_ff_suspended      ON freight_forwarders (is_suspended);
CREATE INDEX idx_ff_sub_tier       ON freight_forwarders (subscription_tier);
CREATE INDEX idx_ff_provinces      ON freight_forwarders USING gin (provinces);
CREATE INDEX idx_ff_lanes          ON freight_forwarders USING gin (lanes);
CREATE INDEX idx_ff_hs_chapters    ON freight_forwarders USING gin (hs_chapters);
CREATE INDEX idx_ff_shipping_modes ON freight_forwarders USING gin (shipping_modes);

-- ─── forwarder_testimonials ───────────────────────────────────────────────────
-- Only verified / featured forwarders may have testimonials (max 3 each).

CREATE TABLE IF NOT EXISTS forwarder_testimonials (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forwarder_id   uuid NOT NULL REFERENCES freight_forwarders (id) ON DELETE CASCADE,
  author_name    text NOT NULL,
  author_company text NOT NULL,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ft_forwarder ON forwarder_testimonials (forwarder_id);

-- ─── quote_requests ───────────────────────────────────────────────────────────
-- Privacy: sme_user_id is NEVER returned to a forwarder until user_identity_revealed = true.

CREATE TABLE IF NOT EXISTS quote_requests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties
  sme_user_id             uuid NOT NULL,   -- FK to auth.users — never expose to forwarder
  forwarder_id            uuid NOT NULL REFERENCES freight_forwarders (id),

  -- State machine
  state                   quote_request_state NOT NULL DEFAULT 'pending',

  -- Anonymised payload (safe to share with forwarder)
  product_category        text NOT NULL,
  hs_chapter              char(2) NOT NULL,       -- 2-digit ONLY
  origin_province         text NOT NULL,
  target_market           text NOT NULL,
  estimated_volume        text NOT NULL CHECK (estimated_volume IN ('1', '2-5', '6-12', '12+')),
  shipping_mode           text NOT NULL CHECK (shipping_mode IN ('ocean', 'air', 'rail', 'trucking', 'multimodal')),
  additional_notes        text,

  -- Lead billing
  lead_tier               quote_lead_tier NOT NULL DEFAULT 'quote_only',
  lead_fee                numeric(8,2) NOT NULL DEFAULT 0.00,
  lead_charged            boolean NOT NULL DEFAULT false,
  lead_refunded           boolean NOT NULL DEFAULT false,
  stripe_charge_id        text,

  -- Response
  forwarder_response_text text,
  response_deadline       timestamptz NOT NULL,   -- created_at + 48h (set by trigger)
  responded_at            timestamptz,

  -- Identity reveal
  user_identity_revealed  boolean NOT NULL DEFAULT false,
  user_reveal_at          timestamptz,

  -- Bulk quote (Growth SME feature)
  is_bulk                 boolean NOT NULL DEFAULT false,
  bulk_group_id           uuid,

  -- Timestamps
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_sme_user    ON quote_requests (sme_user_id);
CREATE INDEX idx_qr_forwarder   ON quote_requests (forwarder_id);
CREATE INDEX idx_qr_state       ON quote_requests (state);
CREATE INDEX idx_qr_deadline    ON quote_requests (response_deadline) WHERE state = 'pending';
CREATE INDEX idx_qr_bulk_group  ON quote_requests (bulk_group_id) WHERE bulk_group_id IS NOT NULL;

-- ─── quote_responses ──────────────────────────────────────────────────────────
-- Structured forwarder response (richer than the freetext field on quote_requests).

CREATE TABLE IF NOT EXISTS quote_responses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_requests (id) ON DELETE CASCADE,
  forwarder_id    uuid NOT NULL REFERENCES freight_forwarders (id),
  rate_estimate   text,                -- e.g. "$2,400–$2,800 USD"
  transit_time    text,                -- e.g. "18–22 days"
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_qres_quote ON quote_responses (quote_request_id);

-- ─── forwarder_subscriptions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forwarder_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forwarder_id          uuid NOT NULL REFERENCES freight_forwarders (id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL,
  stripe_price_id       text NOT NULL,
  tier                  forwarder_sub_tier NOT NULL,
  status                text NOT NULL,   -- active, canceled, past_due
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  canceled_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fsub_forwarder ON forwarder_subscriptions (forwarder_id);

-- ─── forwarder_lead_charges ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forwarder_lead_charges (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forwarder_id      uuid NOT NULL REFERENCES freight_forwarders (id),
  quote_request_id  uuid NOT NULL REFERENCES quote_requests (id),
  stripe_charge_id  text NOT NULL,
  stripe_refund_id  text,
  amount            numeric(8,2) NOT NULL,
  currency          char(3) NOT NULL DEFAULT 'CAD',
  refunded          boolean NOT NULL DEFAULT false,
  refunded_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_flc_forwarder ON forwarder_lead_charges (forwarder_id);
CREATE INDEX idx_flc_quote     ON forwarder_lead_charges (quote_request_id);

-- ─── freight_connect_sla_log ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS freight_connect_sla_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at               timestamptz NOT NULL DEFAULT now(),
  quotes_checked       integer NOT NULL DEFAULT 0,
  quotes_expired       integer NOT NULL DEFAULT 0,
  refunds_issued       integer NOT NULL DEFAULT 0,
  suspensions_triggered integer NOT NULL DEFAULT 0,
  error_message        text
);

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Auto-update updated_at on freight_forwarders
CREATE OR REPLACE FUNCTION set_ff_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_ff_updated_at
  BEFORE UPDATE ON freight_forwarders
  FOR EACH ROW EXECUTE FUNCTION set_ff_updated_at();

-- Auto-set response_deadline = created_at + response_sla_hours on quote_requests
CREATE OR REPLACE FUNCTION set_quote_deadline()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sla int;
BEGIN
  SELECT response_sla_hours INTO sla
  FROM freight_forwarders WHERE id = NEW.forwarder_id;
  NEW.response_deadline := NEW.created_at + (COALESCE(sla, 48) || ' hours')::interval;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_quote_deadline
  BEFORE INSERT ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION set_quote_deadline();

-- Auto-update updated_at on quote_requests
CREATE OR REPLACE FUNCTION set_qr_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_qr_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW EXECUTE FUNCTION set_qr_updated_at();

-- ─── RPC: expire_overdue_quotes ───────────────────────────────────────────────
-- Called by the 15-minute cron. Returns affected rows for logging.

CREATE OR REPLACE FUNCTION expire_overdue_quotes()
RETURNS TABLE (
  expired_quote_id   uuid,
  forwarder_id_out   uuid,
  lead_was_charged   boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  UPDATE quote_requests
  SET
    state        = 'expired',
    lead_refunded = CASE WHEN lead_charged THEN true ELSE lead_refunded END,
    updated_at   = now()
  WHERE
    state            = 'pending'
    AND response_deadline < now()
  RETURNING
    id,
    forwarder_id,
    lead_charged;
END; $$;

-- ─── Seed data ────────────────────────────────────────────────────────────────

-- ── 3 Unclaimed ──────────────────────────────────────────────────────────────

INSERT INTO freight_forwarders (
  company_name, ciffa_membership_number, website_url, state,
  provinces, lanes, hs_chapters, shipping_modes
) VALUES
(
  'Pacific Rim Freight Services Ltd',
  'CIFFA-2017-0341',
  'https://www.pacificrimfreight.ca',
  'unclaimed',
  ARRAY['British Columbia'],
  ARRAY['Canada-Asia', 'Canada-LatAm'],
  ARRAY['03', '09', '16'],
  ARRAY['ocean', 'air']
),
(
  'Atlantic Trade Logistics Inc',
  'CIFFA-2015-0219',
  'https://www.atlantictradelogistics.ca',
  'unclaimed',
  ARRAY['Nova Scotia', 'New Brunswick', 'Prince Edward Island'],
  ARRAY['Canada-EU', 'Canada-UK'],
  ARRAY['44', '47', '48'],
  ARRAY['ocean']
),
(
  'Heartland Export Services Ltd',
  'CIFFA-2020-0582',
  'https://www.heartlandexport.ca',
  'unclaimed',
  ARRAY['Saskatchewan', 'Manitoba', 'Alberta'],
  ARRAY['Canada-US', 'Canada-Mexico'],
  ARRAY['10', '12', '23'],
  ARRAY['trucking', 'rail']
);

-- ── 6 Claimed ────────────────────────────────────────────────────────────────

INSERT INTO freight_forwarders (
  company_name, ciffa_membership_number, website_url, description,
  state, provinces, lanes, hs_chapters, shipping_modes,
  primary_contact_name, primary_contact_email,
  stripe_payment_method_on_file, claimed_at
) VALUES
(
  'Kinetic Global Freight Inc',
  'CIFFA-2016-0447',
  'https://www.kineticglobal.ca',
  'Full-service customs brokerage and freight forwarding for Canadian manufacturers exporting to Europe and Asia.',
  'claimed',
  ARRAY['Ontario'],
  ARRAY['Canada-EU', 'Canada-Asia'],
  ARRAY['84', '85', '90'],
  ARRAY['ocean', 'air'],
  'Marcus Chen',
  'marcus@kineticglobal.ca',
  true,
  now() - interval '8 months'
),
(
  'Maple Route Logistics SENC',
  'CIFFA-2018-0631',
  'https://www.mapleroutelogistics.ca',
  'Specialising in EU and UK market access for Quebec agri-food and consumer goods exporters.',
  'claimed',
  ARRAY['Quebec'],
  ARRAY['Canada-EU', 'Canada-UK'],
  ARRAY['33', '35', '39'],
  ARRAY['ocean', 'air'],
  'Sophie Beauregard',
  'sbeauregard@mapleroutelogistics.ca',
  true,
  now() - interval '5 months'
),
(
  'Foothills Freight Solutions Ltd',
  'CIFFA-2019-0508',
  'https://www.foothillsfreight.ca',
  'Cross-border trucking and rail specialists serving Alberta energy and agriculture sectors into the US and Mexico.',
  'claimed',
  ARRAY['Alberta', 'British Columbia'],
  ARRAY['Canada-US', 'Canada-Mexico'],
  ARRAY['27', '29', '44'],
  ARRAY['trucking', 'rail'],
  'Derek Holmstrom',
  'd.holmstrom@foothillsfreight.ca',
  true,
  now() - interval '3 months'
),
(
  'Pacific Coast Forwarding Ltd',
  'CIFFA-2014-0187',
  'https://www.pacificcoastfwd.ca',
  'Ocean freight specialists for BC seafood, agri-food, and natural resource exporters to Asia and Oceania.',
  'claimed',
  ARRAY['British Columbia', 'Alberta'],
  ARRAY['Canada-Asia', 'Canada-Oceania'],
  ARRAY['02', '03', '16'],
  ARRAY['ocean'],
  'Linda Nakamura',
  'lnakamura@pacificcoastfwd.ca',
  true,
  now() - interval '6 months'
),
(
  'Great Lakes Trade Logistics Inc',
  'CIFFA-2017-0392',
  'https://www.greatlakestrade.ca',
  'Toronto-based forwarder with strong EU and West Africa coverage for manufacturing and industrial goods.',
  'claimed',
  ARRAY['Ontario'],
  ARRAY['Canada-EU', 'Canada-Africa'],
  ARRAY['84', '85', '73'],
  ARRAY['ocean', 'air'],
  'Olusegun Adeyemi',
  'o.adeyemi@greatlakestrade.ca',
  true,
  now() - interval '10 months'
),
(
  'Maritime Cargo Express Ltd',
  'CIFFA-2021-0714',
  'https://www.maritimecargo.ca',
  'Halifax-based ocean freight forwarder serving Atlantic Canada wood products and seafood exporters.',
  'claimed',
  ARRAY['Nova Scotia', 'New Brunswick'],
  ARRAY['Canada-EU', 'Canada-Caribbean'],
  ARRAY['44', '48', '94'],
  ARRAY['ocean'],
  'Colette Arsenault',
  'c.arsenault@maritimecargo.ca',
  false,
  now() - interval '2 months'
);

-- ── 4 Verified ───────────────────────────────────────────────────────────────

WITH v1 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'Transpac Canada Inc',
    'CIFFA-2012-0088',
    'https://assets.mercorama.com/forwarders/transpac-logo.png',
    'https://www.transpac.ca',
    'Vancouver''s leading Asia-Pacific ocean and air freight forwarder. 12+ years serving Canadian exporters to Japan, South Korea, Vietnam, and Australia with door-to-door visibility and bilingual support.',
    'verified',
    ARRAY['British Columbia', 'Alberta'],
    ARRAY['Canada-Asia', 'Canada-Oceania', 'Canada-ASEAN'],
    ARRAY['02', '03', '84', '85', '90'],
    ARRAY['ocean', 'air', 'multimodal'],
    'James Yuen',
    'jyuen@transpac.ca',
    true, 'cus_Transpac001',
    'verified', now() - interval '18 months',
    now() - interval '22 months',
    now() - interval '18 months'
  ) RETURNING id
),
v2 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'EuroLink Freight Services Inc',
    'CIFFA-2011-0064',
    'https://assets.mercorama.com/forwarders/eurolink-logo.png',
    'https://www.eurolinkfreight.ca',
    'Montreal-based forwarder specialising in transatlantic lanes — EU, UK, and Scandinavia. Deep expertise in cosmetics, pharmaceuticals, and textiles. Member of the WCA global network.',
    'verified',
    ARRAY['Quebec', 'Ontario'],
    ARRAY['Canada-EU', 'Canada-UK', 'Canada-EFTA'],
    ARRAY['33', '35', '62', '84'],
    ARRAY['ocean', 'air'],
    'Amélie Fontaine',
    'afontaine@eurolinkfreight.ca',
    true, 'cus_EuroLink002',
    'verified', now() - interval '14 months',
    now() - interval '20 months',
    now() - interval '14 months'
  ) RETURNING id
),
v3 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'Blue Water Logistics Group Inc',
    'CIFFA-2013-0152',
    'https://assets.mercorama.com/forwarders/bluewater-logo.png',
    'https://www.bluewaterlogistics.ca',
    'Halifax specialists in forest products, seafood, and dimensional cargo shipping to Europe and the Mediterranean. Full customs brokerage and compliance advisory included.',
    'verified',
    ARRAY['Nova Scotia', 'New Brunswick', 'Prince Edward Island', 'Newfoundland and Labrador'],
    ARRAY['Canada-EU', 'Canada-Mediterranean', 'Canada-UK'],
    ARRAY['03', '44', '47', '48', '94'],
    ARRAY['ocean'],
    'Tristan MacKinnon',
    't.mackinnon@bluewaterlogistics.ca',
    true, 'cus_BlueWater003',
    'verified', now() - interval '11 months',
    now() - interval '15 months',
    now() - interval '11 months'
  ) RETURNING id
),
v4 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'Americas Trade Link Inc',
    'CIFFA-2015-0273',
    'https://assets.mercorama.com/forwarders/americas-logo.png',
    'https://www.americastradelink.ca',
    'Toronto-based multi-modal forwarder focused on Latin America and the Caribbean. Extensive experience with food & beverage, clean technology, and consumer goods exports under CUSMA and CPTPP.',
    'verified',
    ARRAY['Ontario', 'Quebec'],
    ARRAY['Canada-LatAm', 'Canada-Caribbean', 'Canada-US', 'Canada-Mexico'],
    ARRAY['09', '16', '21', '62', '84'],
    ARRAY['ocean', 'air', 'trucking'],
    'Isabella Moreno',
    'i.moreno@americastradelink.ca',
    true, 'cus_Americas004',
    'verified', now() - interval '9 months',
    now() - interval '13 months',
    now() - interval '9 months'
  ) RETURNING id
)
SELECT 1; -- CTE terminator

-- Testimonials for verified forwarders — must match inserted IDs
-- Inserted separately as a second pass using company name lookup

INSERT INTO forwarder_testimonials (forwarder_id, author_name, author_company, body)
SELECT ff.id,
       t.author_name,
       t.author_company,
       t.body
FROM (VALUES
  -- Transpac Canada
  ('Transpac Canada Inc', 'David Kim',      'Kim''s Seafood Export Co', 'Transpac handled our first Japan shipment flawlessly. Documentation was complete and the shipment arrived 2 days ahead of schedule.'),
  ('Transpac Canada Inc', 'Rachel Huang',   'Pacific NaturalHealth Inc', 'We''ve used Transpac for 3 years for our Korean and Vietnamese markets. Competitive rates, reliable ETAs, and responsive communication.'),
  ('Transpac Canada Inc', 'Evan Thorpe',    'Thorpe Precision Machining', 'Their Asia customs knowledge is unmatched. They prevented a costly misclassification issue on our first industrial equipment export.'),
  -- EuroLink Freight
  ('EuroLink Freight Services Inc', 'Marie-Claude Leblanc', 'Belle Monde Cosmétiques', 'EuroLink managed our EU launch shipment across 6 countries simultaneously. Zero delays, full track-and-trace visibility.'),
  ('EuroLink Freight Services Inc', 'Raj Anand',            'Synaptix Life Sciences', 'They navigated UK post-Brexit import requirements seamlessly for our pharmaceutical shipments. Highly recommended.'),
  ('EuroLink Freight Services Inc', 'Thomas Giroux',        'Giroux Design Studio',   'Excellent partner for our Scandinavian clients. They understand the EU REACH documentation requirements inside-out.'),
  -- Blue Water Logistics
  ('Blue Water Logistics Group Inc', 'Peter MacDonald',  'MacDonald Hardwood Exports',   'Blue Water has shipped our Nova Scotia hardwood to Germany for 4 years. Consistent, reliable, and always proactive on customs changes.'),
  ('Blue Water Logistics Group Inc', 'Fiona Campbell',   'PEI Premium Seafood Corp',     'They coordinated our first Mediterranean lane — Spain and Italy — and made the entire process seamless. Great communication throughout.'),
  ('Blue Water Logistics Group Inc', 'André Comeau',     'Comeau Furniture Manufacturing', 'Knowledgeable team, especially on forest product tariff classifications and EU timber regulation compliance.'),
  -- Americas Trade Link
  ('Americas Trade Link Inc', 'Carlos Espinoza',  'Espinoza Clean Energy Solutions', 'Americas Trade Link handled our Mexico clean tech export under CUSMA with zero duty exposure. Excellent FTA expertise.'),
  ('Americas Trade Link Inc', 'Priya Nair',       'Nair Food International',          'They managed our Caribbean distribution launch — 5 islands, 3 shipping modes — on time and under budget.'),
  ('Americas Trade Link Inc', 'Aaron Westfield',  'Westfield Consumer Brands',        'Best forwarder we''ve used for LatAm. Their tariff and customs team is genuinely exceptional for complex multi-stop shipments.')
) AS t(company_name, author_name, author_company, body)
JOIN freight_forwarders ff ON ff.company_name = t.company_name;

-- ── 2 Featured ───────────────────────────────────────────────────────────────

WITH f1 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'Summit Freight Solutions Inc',
    'CIFFA-2010-0031',
    'https://assets.mercorama.com/forwarders/summit-logo.png',
    'https://www.summitfreight.ca',
    'Canada''s most awarded multi-modal forwarder — serving all major trade lanes. Summit offers dedicated SME export teams, rate benchmarking, and a named account manager for every client. Ranked #1 on response time across the Mercorama platform.',
    'featured',
    ARRAY['Ontario', 'Quebec', 'British Columbia', 'Alberta'],
    ARRAY['Canada-EU', 'Canada-Asia', 'Canada-US', 'Canada-LatAm', 'Canada-Oceania', 'Canada-ASEAN', 'Canada-Middle East'],
    ARRAY['02', '84', '85', '87', '90', '30', '33'],
    ARRAY['ocean', 'air', 'trucking', 'multimodal'],
    'Natalie Drummond',
    'n.drummond@summitfreight.ca',
    true, 'cus_Summit005',
    'featured', now() - interval '24 months',
    now() - interval '30 months',
    now() - interval '24 months'
  ) RETURNING id
),
f2 AS (
  INSERT INTO freight_forwarders (
    company_name, ciffa_membership_number, logo_url, website_url, description,
    state, provinces, lanes, hs_chapters, shipping_modes,
    primary_contact_name, primary_contact_email,
    stripe_payment_method_on_file, stripe_customer_id,
    subscription_tier, subscription_start_date,
    claimed_at, verified_at
  ) VALUES (
    'Pacific Gateway Logistics Corp',
    'CIFFA-2009-0017',
    'https://assets.mercorama.com/forwarders/pacgateway-logo.png',
    'https://www.pacificgatewaylogistics.ca',
    'Vancouver''s premium gateway forwarder for high-value and time-sensitive exports to Asia-Pacific. Pacific Gateway provides white-glove ocean and air services, with DDP (Delivered Duty Paid) coverage to Japan, South Korea, Taiwan, Singapore, and Australia.',
    'featured',
    ARRAY['British Columbia', 'Alberta', 'Saskatchewan'],
    ARRAY['Canada-Asia', 'Canada-ASEAN', 'Canada-Oceania', 'Canada-China'],
    ARRAY['03', '09', '84', '85', '90', '62', '22'],
    ARRAY['ocean', 'air', 'multimodal'],
    'Grace Tanaka',
    'g.tanaka@pacificgatewaylogistics.ca',
    true, 'cus_PacGateway006',
    'featured', now() - interval '30 months',
    now() - interval '36 months',
    now() - interval '30 months'
  ) RETURNING id
)
SELECT 1;

-- Testimonials for featured forwarders

INSERT INTO forwarder_testimonials (forwarder_id, author_name, author_company, body)
SELECT ff.id,
       t.author_name,
       t.author_company,
       t.body
FROM (VALUES
  -- Summit Freight
  ('Summit Freight Solutions Inc', 'Michelle Park',     'Park Automotive Parts Inc',      'Summit is in a class of their own. Named account manager, instant rate quotes, and our shipments have never missed a window in 3 years.'),
  ('Summit Freight Solutions Inc', 'Omar El-Rashid',    'TerraVerde Clean Tech',          'We ship to 6 markets. Summit handles all of them under one relationship. Their multimodal expertise saved us 18% on annual logistics costs.'),
  ('Summit Freight Solutions Inc', 'Stephanie Lavoie',  'Lavoie Precision Instruments',   'Unmatched EU and Asia coverage. Their in-house customs team caught a potential EU dual-use issue before it became a problem.'),
  -- Pacific Gateway
  ('Pacific Gateway Logistics Corp', 'Kevin Lau',        'Lau''s Premium Seafood Exports',  'Pacific Gateway secured DDP terms for our Tokyo shipments — something three other forwarders said was impossible. Exceptional team.'),
  ('Pacific Gateway Logistics Corp', 'Sanna Mikkola',    'Nordic Cedar Products Canada',    'They managed our first Singapore shipment under the CPTPP and handled the certificate of origin process flawlessly. Highly recommended.'),
  ('Pacific Gateway Logistics Corp', 'Ben Tran',         'Tran Technology Solutions',       'Air freight for high-value electronics to South Korea. Tight timelines, zero customs delays. Pacific Gateway delivered on every commitment.')
) AS t(company_name, author_name, author_company, body)
JOIN freight_forwarders ff ON ff.company_name = t.company_name;
