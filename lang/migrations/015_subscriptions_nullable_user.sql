-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 015: Make user_subscriptions.user_id nullable for unclaimed tokens
-- Activation tokens are created without a user — user_id is set when claimed.
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Drop the NOT NULL constraint so unclaimed tokens can have user_id = NULL
ALTER TABLE user_subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- The FK still stays — when user_id IS set, it must point to a real user
-- The ON DELETE CASCADE is preserved automatically

COMMIT;
