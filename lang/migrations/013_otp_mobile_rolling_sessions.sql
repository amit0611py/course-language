-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 013: OTP, Mobile Number, Rolling Sessions, Customer ID
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add mobile_number and customer_id to users ─────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mobile_number') THEN
    ALTER TABLE users ADD COLUMN mobile_number TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='customer_id') THEN
    -- Format: INF-XXXXXXXX (8 hex chars, uppercase)
    ALTER TABLE users ADD COLUMN customer_id TEXT UNIQUE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mobile_verified') THEN
    ALTER TABLE users ADD COLUMN mobile_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Remove the NOT NULL constraint on email and password_hash
-- (user may sign up with mobile only)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- email uniqueness: allow NULL but enforce unique when present
-- Drop old unique constraint and replace with partial unique index
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='users' AND constraint_name='users_email_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_email_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON users(email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile_unique
  ON users(mobile_number) WHERE mobile_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

-- ── 2. OTP table ──────────────────────────────────────────────────────────────
-- Stores pending OTPs for signup verification.
-- contact = email address or mobile number (whichever was provided)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact         TEXT NOT NULL,
    contact_type    TEXT NOT NULL
                    CHECK (contact_type IN ('email', 'mobile')),
    otp_hash        TEXT NOT NULL,
    purpose         TEXT NOT NULL DEFAULT 'signup'
                    CHECK (purpose IN ('signup', 'login', 'reset')),
    expires_at      TIMESTAMPTZ NOT NULL,
    verified_at     TIMESTAMPTZ,
    attempts        INT NOT NULL DEFAULT 0,
    -- Short-lived token issued after OTP is verified, used to complete signup
    verified_token              TEXT,
    verified_token_expires_at   TIMESTAMPTZ,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add verified_token columns if table already exists (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='otp_verifications' AND column_name='verified_token') THEN
    ALTER TABLE otp_verifications ADD COLUMN verified_token TEXT;
    ALTER TABLE otp_verifications ADD COLUMN verified_token_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- ── 3. OTP rate limiting table ────────────────────────────────────────────────
-- Tracks send count per contact per 24h window (max 3 sends)
CREATE TABLE IF NOT EXISTS otp_send_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address  TEXT
);

CREATE INDEX IF NOT EXISTS idx_otp_log_contact_time ON otp_send_log(contact, sent_at);

-- ── 4. Extend user_sessions for rolling 7-day refresh ─────────────────────────
-- The 'token' field is what the client stores in localStorage.
-- On each authenticated request we slide expires_at forward by 7 days.
-- (Sliding window = stay logged in as long as user is active)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='user_sessions' AND column_name='last_used_at') THEN
    ALTER TABLE user_sessions ADD COLUMN last_used_at TIMESTAMPTZ;
  END IF;
END $$;

-- ── 5. Function: generate unique customer_id ─────────────────────────────────
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_id TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_id := 'INF-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM users WHERE customer_id = v_id) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_id;
END;
$$;

-- ── 6. Backfill customer_id for existing users ────────────────────────────────
UPDATE users SET customer_id = generate_customer_id() WHERE customer_id IS NULL;

-- Make customer_id NOT NULL after backfill
ALTER TABLE users ALTER COLUMN customer_id SET NOT NULL;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 013 COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════
