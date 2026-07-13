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
