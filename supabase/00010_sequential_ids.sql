-- 1. Create a sequence for SMEs
CREATE SEQUENCE IF NOT EXISTS sme_id_seq START 1;

-- 2. Create a sequence for Assessments
CREATE SEQUENCE IF NOT EXISTS asm_id_seq START 1;

-- 2.5 Drop RLS policies that depend on the column types
DROP POLICY IF EXISTS assessments_select ON client_readiness_assessments;
DROP POLICY IF EXISTS assessments_insert ON client_readiness_assessments;
DROP POLICY IF EXISTS assessments_update ON client_readiness_assessments;

-- 3. Modify client_smes table
-- Drop foreign keys depending on client_smes.id
ALTER TABLE client_readiness_assessments DROP CONSTRAINT client_readiness_assessments_sme_id_fkey;

-- Change the ID column type to TEXT
ALTER TABLE client_smes ALTER COLUMN id TYPE TEXT;
-- Set a default function or just let the application layer provide the ID
ALTER TABLE client_smes ALTER COLUMN id DROP DEFAULT;

-- 4. Modify client_readiness_assessments table
-- Drop foreign keys depending on client_readiness_assessments.id
ALTER TABLE advisor_notes DROP CONSTRAINT advisor_notes_assessment_id_fkey;
ALTER TABLE roadmap_items DROP CONSTRAINT roadmap_items_assessment_id_fkey;

ALTER TABLE client_readiness_assessments ALTER COLUMN id TYPE TEXT;
ALTER TABLE client_readiness_assessments ALTER COLUMN sme_id TYPE TEXT;
ALTER TABLE client_readiness_assessments ALTER COLUMN id DROP DEFAULT;

-- 5. Restore constraints for client_readiness_assessments
ALTER TABLE client_readiness_assessments 
  ADD CONSTRAINT client_readiness_assessments_sme_id_fkey 
  FOREIGN KEY (sme_id) REFERENCES client_smes(id) ON DELETE CASCADE;

-- 6. Modify advisor_notes
ALTER TABLE advisor_notes ALTER COLUMN assessment_id TYPE TEXT;

ALTER TABLE advisor_notes 
  ADD CONSTRAINT advisor_notes_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES client_readiness_assessments(id) ON DELETE CASCADE;

-- 7. Modify roadmap_items
ALTER TABLE roadmap_items ALTER COLUMN assessment_id TYPE TEXT;

ALTER TABLE roadmap_items 
  ADD CONSTRAINT roadmap_items_assessment_id_fkey 
  FOREIGN KEY (assessment_id) REFERENCES client_readiness_assessments(id) ON DELETE CASCADE;

-- 8. Recreate RLS policies
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

