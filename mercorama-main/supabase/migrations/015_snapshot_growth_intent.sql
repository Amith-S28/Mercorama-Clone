-- supabase/migrations/015_snapshot_growth_intent.sql
-- Add growth_intent column to user_snapshots table.

ALTER TABLE user_snapshots
ADD COLUMN IF NOT EXISTS growth_intent text CHECK (growth_intent IN ('canada', 'global'));
