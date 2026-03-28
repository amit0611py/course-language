-- Migration 002: Sections table
-- Sections group topics within a language. Each language has its own set.
-- e.g. Java → "Core Language", "JVM Internals", "Spring Framework"

CREATE TABLE IF NOT EXISTS sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    slug        TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    meta        JSONB NOT NULL DEFAULT '{}',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_section_language_slug UNIQUE (language_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_sections_language ON sections(language_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_sections_active   ON sections(language_id, is_active)
    WHERE is_active = true;

COMMENT ON TABLE sections IS 'Per-language groupings of related topics. Drives sidebar section headers.';
