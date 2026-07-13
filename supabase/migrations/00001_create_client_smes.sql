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
