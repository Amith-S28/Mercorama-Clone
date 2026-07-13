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
