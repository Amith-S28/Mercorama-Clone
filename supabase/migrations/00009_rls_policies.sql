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
