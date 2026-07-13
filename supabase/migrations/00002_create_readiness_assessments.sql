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
