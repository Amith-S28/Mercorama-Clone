-- ─────────────────────────────────────────────────────────────────────────────
-- 005_freight_connect_additions.sql
-- Adds billing_period to subscriptions, profile_views for analytics,
-- is_admin flag on users, and invite_log for unclaimed outreach.
-- ─────────────────────────────────────────────────────────────────────────────

-- billing_period on forwarder_subscriptions (missing from 004)
ALTER TABLE forwarder_subscriptions
  ADD COLUMN IF NOT EXISTS billing_period text NOT NULL DEFAULT 'monthly'
    CHECK (billing_period IN ('monthly', 'annual'));

-- stripe_price_id was NOT NULL in 004 but may have been inserted without it from the webhook
-- Make it optional to avoid insert failures
ALTER TABLE forwarder_subscriptions
  ALTER COLUMN stripe_price_id DROP NOT NULL;

-- ─── forwarder_profile_views ─────────────────────────────────────────────────
-- Logged when an SME opens a forwarder card in the search UI (server-side).

CREATE TABLE IF NOT EXISTS forwarder_profile_views (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forwarder_id uuid NOT NULL REFERENCES freight_forwarders (id) ON DELETE CASCADE,
  viewed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fpv_forwarder ON forwarder_profile_views (forwarder_id);
CREATE INDEX idx_fpv_viewed_at ON forwarder_profile_views (forwarder_id, viewed_at);

-- ─── forwarder_invite_log ────────────────────────────────────────────────────
-- Tracks admin outreach to unclaimed forwarders.

CREATE TABLE IF NOT EXISTS forwarder_invite_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forwarder_id uuid NOT NULL REFERENCES freight_forwarders (id) ON DELETE CASCADE,
  sent_at      timestamptz NOT NULL DEFAULT now(),
  sent_by      text,  -- admin identifier
  email_to     text NOT NULL
);

CREATE INDEX idx_fil_forwarder ON forwarder_invite_log (forwarder_id);

-- ─── is_admin on users ───────────────────────────────────────────────────────
-- Allows Mercorama staff to access the admin panel.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
