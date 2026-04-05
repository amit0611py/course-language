-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 014: Add verified_token columns to otp_verifications
-- Run this if migration 013 already ran before these columns were added.
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE otp_verifications
  ADD COLUMN IF NOT EXISTS verified_token               TEXT,
  ADD COLUMN IF NOT EXISTS verified_token_expires_at    TIMESTAMPTZ;

COMMIT;
