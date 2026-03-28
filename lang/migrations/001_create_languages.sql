-- Migration 001: Languages table
-- Adding a new programming language = one INSERT, zero code changes

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS languages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    icon_url    TEXT,
    description TEXT,
    meta        JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_languages_slug     ON languages(slug);
CREATE INDEX IF NOT EXISTS idx_languages_active   ON languages(is_active, sort_order)
    WHERE is_active = true;

COMMENT ON TABLE languages IS 'Top-level programming languages. Each language owns its own sections and topics.';
COMMENT ON COLUMN languages.meta IS 'Arbitrary metadata: { "color": "#007396", "tagline": "...", "difficulty": "beginner" }';
