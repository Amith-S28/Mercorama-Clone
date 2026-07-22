-- submit_beta_application.sql
-- Atomic RPC: checks cohort_status, prevents duplicate emails, inserts
-- application — all inside a single transaction with a row lock on cohort_config.
--
-- Deploy via: supabase db push  OR paste into the Supabase SQL editor.

CREATE OR REPLACE FUNCTION submit_beta_application(
  p_full_name           TEXT,
  p_email               TEXT,
  p_company_name        TEXT,
  p_province            TEXT,
  p_website             TEXT,
  p_product_description TEXT,
  p_hs_code             TEXT,
  p_export_experience   TEXT,
  p_biggest_challenge   TEXT,
  p_selected_plan       TEXT,
  p_referral_source     TEXT,
  p_linkedin_url        TEXT,
  p_cohort_number       INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cohort_status TEXT;
  v_existing_id   UUID;
  v_new_id        UUID;
BEGIN
  -- Lock the cohort_config row so concurrent submissions can't both pass
  SELECT cohort_status
    INTO v_cohort_status
    FROM cohort_config
   WHERE cohort_number = p_cohort_number
     FOR UPDATE;

  IF v_cohort_status IS NULL OR v_cohort_status <> 'open' THEN
    RAISE EXCEPTION 'cohort_closed';
  END IF;

  -- Check for duplicate email
  SELECT id
    INTO v_existing_id
    FROM beta_applications
   WHERE email = lower(p_email);

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_email';
  END IF;

  -- Mark waitlist entry as converted (best-effort)
  UPDATE waitlist
     SET converted = true
   WHERE email = lower(p_email);

  -- Insert the application
  INSERT INTO beta_applications (
    full_name, email, company_name, province, website,
    product_description, hs_code, export_experience, biggest_challenge,
    selected_plan, original_plan_selected,
    referral_source, linkedin_url, cohort_number, status
  ) VALUES (
    p_full_name, lower(p_email), p_company_name, p_province, p_website,
    p_product_description, p_hs_code, p_export_experience, p_biggest_challenge,
    p_selected_plan, p_selected_plan,
    p_referral_source, p_linkedin_url, p_cohort_number, 'pending'
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Grant execute to the service role only (never to anon or authenticated)
REVOKE ALL ON FUNCTION submit_beta_application FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_beta_application TO service_role;
