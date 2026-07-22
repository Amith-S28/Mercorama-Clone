-- ─────────────────────────────────────────────────────────────────────────────
-- 008_beta_applications_additions.sql
-- Adds new status values + fields to beta_applications for admin cohort flow.
-- Run AFTER 007_founding_member_fields.sql.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS original_plan_selected  TEXT,
  ADD COLUMN IF NOT EXISTS admin_assigned_plan      TEXT,
  ADD COLUMN IF NOT EXISTS admin_note               TEXT,
  ADD COLUMN IF NOT EXISTS demo_booked_at           TIMESTAMP,
  ADD COLUMN IF NOT EXISTS demo_held_at             TIMESTAMP,
  ADD COLUMN IF NOT EXISTS offer_sent_at            TIMESTAMP;

-- Backfill original_plan_selected from selected_plan for existing rows
UPDATE beta_applications
SET original_plan_selected = selected_plan
WHERE original_plan_selected IS NULL AND selected_plan IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_applications_admin_plan
  ON beta_applications(admin_assigned_plan);

-- ─── STATUS REFERENCE ────────────────────────────────────────────────────────
-- Full valid status set (enforced in application logic, not as DB enum):
--   'pending'          submitted, not yet reviewed
--   'demo_scheduled'   demo invite sent
--   'demo_complete'    demo held, offer not yet sent
--   'accepted'         offer sent, awaiting payment
--   'rejected'         not accepted
--   'waitlisted'       moved to Cohort 2 waitlist
-- ─────────────────────────────────────────────────────────────────────────────
