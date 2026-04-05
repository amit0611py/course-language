-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 012: Users, Subscriptions, and Granular Access Control
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Add content_tier to languages ─────────────────────────────────────────
-- A whole language can be free or premium.
-- Even if a language is "free", individual topics inside it can be premium.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'languages' AND column_name = 'content_tier'
  ) THEN
    ALTER TABLE languages
      ADD COLUMN content_tier TEXT NOT NULL DEFAULT 'free'
        CHECK (content_tier IN ('free', 'premium'));
  END IF;
END $$;

-- ── 2. Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT,
    avatar_url      TEXT,

    -- Account status
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    last_login_at   TIMESTAMPTZ,

    -- Denormalised convenience flags (updated by trigger on subscriptions)
    -- These make the access check fast (no JOIN needed per request)
    is_premium      BOOLEAN NOT NULL DEFAULT false,
    premium_scope   TEXT NOT NULL DEFAULT 'none'
      CHECK (premium_scope IN ('none', 'language', 'all')),
    -- If scope = 'language', which languages are unlocked (array of slugs)
    premium_language_slugs TEXT[] NOT NULL DEFAULT '{}',

    meta            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_premium  ON users(is_premium, premium_scope)
  WHERE is_active = true;

-- ── 3. Sessions (token store) ─────────────────────────────────────────────────
-- Simple server-side sessions. token is what the frontend sends.
-- Replace with JWT signing later — just change the auth plugin, nothing else.
CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           TEXT NOT NULL UNIQUE,   -- opaque random token for now
    refresh_token   TEXT UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      TEXT,
    user_agent      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON user_sessions(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON user_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at) WHERE is_active = true;

-- ── 4. Subscription plans ────────────────────────────────────────────────────
-- Plans define what the user gets. Prices are stored for record keeping.
-- plan_type: 'monthly_all' | 'yearly_all' | 'monthly_lang' | 'yearly_lang' | 'lifetime_all'
CREATE TABLE IF NOT EXISTS subscription_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    plan_type       TEXT NOT NULL
      CHECK (plan_type IN ('monthly_all','yearly_all','monthly_lang','yearly_lang','lifetime_all')),
    -- Which language this plan unlocks (NULL = all languages)
    language_id     UUID REFERENCES languages(id) ON DELETE SET NULL,
    language_slug   TEXT,                   -- denormalised for fast reads
    price_inr       NUMERIC(10,2),
    price_usd       NUMERIC(10,2),
    duration_days   INT,                    -- NULL = lifetime
    features        JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_type     ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_plans_language ON subscription_plans(language_id);
CREATE INDEX IF NOT EXISTS idx_plans_active   ON subscription_plans(is_active, sort_order);

-- ── 5. User subscriptions ─────────────────────────────────────────────────────
-- One row per purchase. A user can have multiple active subscriptions
-- (e.g. monthly_lang for java + yearly_lang for python).
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES subscription_plans(id),

    -- Snapshot of plan at time of purchase (plan may change later)
    plan_type       TEXT NOT NULL,
    language_slug   TEXT,                   -- NULL = all languages
    price_paid      NUMERIC(10,2),
    currency        TEXT NOT NULL DEFAULT 'INR',

    -- Validity
    starts_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    ends_at         TIMESTAMPTZ,            -- NULL = lifetime
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Payment tracking (filled by payment integration later)
    payment_provider TEXT,                  -- 'razorpay' | 'stripe' | 'manual'
    payment_id      TEXT,
    payment_status  TEXT NOT NULL DEFAULT 'completed'
      CHECK (payment_status IN ('pending','completed','failed','refunded')),

    -- Token used to activate (the simple token approach, for now)
    activation_token TEXT UNIQUE,

    meta            JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subs_user      ON user_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subs_plan      ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subs_token     ON user_subscriptions(activation_token);
CREATE INDEX IF NOT EXISTS idx_subs_expires   ON user_subscriptions(ends_at)
  WHERE is_active = true AND ends_at IS NOT NULL;

-- ── 6. Function: sync users.is_premium from subscriptions ────────────────────
-- Called after any subscription insert/update. Keeps the denormalised flags fresh.
CREATE OR REPLACE FUNCTION sync_user_premium_flags(p_user_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_all_active   INT;
  v_lang_slugs   TEXT[];
BEGIN
  -- Count active all-access subscriptions
  SELECT COUNT(*) INTO v_all_active
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND (ends_at IS NULL OR ends_at > now())
    AND plan_type IN ('monthly_all','yearly_all','lifetime_all');

  -- Collect active language-specific slugs
  SELECT ARRAY_AGG(DISTINCT language_slug) INTO v_lang_slugs
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND (ends_at IS NULL OR ends_at > now())
    AND plan_type IN ('monthly_lang','yearly_lang')
    AND language_slug IS NOT NULL;

  IF v_lang_slugs IS NULL THEN v_lang_slugs := '{}'; END IF;

  IF v_all_active > 0 THEN
    UPDATE users SET
      is_premium = true,
      premium_scope = 'all',
      premium_language_slugs = '{}',
      updated_at = now()
    WHERE id = p_user_id;
  ELSIF array_length(v_lang_slugs, 1) > 0 THEN
    UPDATE users SET
      is_premium = true,
      premium_scope = 'language',
      premium_language_slugs = v_lang_slugs,
      updated_at = now()
    WHERE id = p_user_id;
  ELSE
    UPDATE users SET
      is_premium = false,
      premium_scope = 'none',
      premium_language_slugs = '{}',
      updated_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ── 7. Trigger: auto-sync on subscription change ──────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_user_premium()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM sync_user_premium_flags(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_premium_on_sub ON user_subscriptions;
CREATE TRIGGER sync_premium_on_sub
  AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trg_sync_user_premium();

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 012 COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════
