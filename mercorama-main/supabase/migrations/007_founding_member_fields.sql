-- ─────────────────────────────────────────────────────────────────────────────
-- 007_founding_member_fields.sql
-- Adds founding member columns to public.users for Stripe/activation flow.
-- Run AFTER 006_cohort_beta.sql.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS founding_member      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_locked_until   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS founding_price       DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS public_price         DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS stripe_customer_id   VARCHAR,
  ADD COLUMN IF NOT EXISTS subscription_id      VARCHAR,
  ADD COLUMN IF NOT EXISTS subscription_status  VARCHAR DEFAULT 'inactive';
