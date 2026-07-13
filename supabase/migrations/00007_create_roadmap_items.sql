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
