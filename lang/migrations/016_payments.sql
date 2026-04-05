-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 016: Payments table + transaction ID
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── payments table ────────────────────────────────────────────────────────────
-- One row per payment attempt. Tracks gateway order/payment IDs separately
-- from the subscription so we have a full audit trail.
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Our unique transaction reference shown to user
    -- Format: {first3OfUserId}{3LettersOfName}{YYMMDDHHMMSS}{3digitSeq}
    -- e.g.  abc_joh_240501143012_001
    transaction_id      TEXT NOT NULL UNIQUE,

    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
    subscription_id     UUID REFERENCES user_subscriptions(id),

    -- What was selected
    plan_type           TEXT NOT NULL,
    language_slug       TEXT,                   -- NULL = all languages

    -- Amount
    amount              NUMERIC(10,2) NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'INR',  -- 'INR' or 'USD'

    -- Gateway
    provider            TEXT NOT NULL
                        CHECK (provider IN ('razorpay','paypal')),
    -- Razorpay: order_id before payment, payment_id after capture
    gateway_order_id    TEXT,
    gateway_payment_id  TEXT,
    gateway_signature   TEXT,

    -- Status lifecycle: pending → completed | failed | refunded
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','completed','failed','refunded','cancelled')),

    -- Raw webhook/callback payload for auditing
    gateway_payload     JSONB,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user        ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_txn         ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_ord ON payments(gateway_order_id) WHERE gateway_order_id IS NOT NULL;

-- ── sequence counter for transaction ID (3-digit suffix) ─────────────────────
CREATE SEQUENCE IF NOT EXISTS payment_seq START 1 INCREMENT 1 MAXVALUE 999 CYCLE;

COMMIT;
