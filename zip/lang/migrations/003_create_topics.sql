-- Migration 003: Topics table
-- Core of the content engine. Uses Materialized Path for hierarchy.
--
-- Path examples:
--   java                        (depth 0 — language root)
--   java.basics                 (depth 1)
--   java.jvm                    (depth 1)
--   java.jvm.memory             (depth 2 — deep dive)
--   java.jvm.memory.heap        (depth 3 — deep dive)
--
-- Why Materialized Path over Closure Table / Nested Sets:
--   - Reads dominate writes in this system (content changes rarely)
--   - Subtree query: WHERE path LIKE 'java.jvm%' uses a btree index
--   - Ancestor query: WHERE path = ANY($ancestorPaths) is single query
--   - No recursive CTE required for any common operation
--   - Path strings map directly to URL slugs and Redis cache keys

CREATE TABLE IF NOT EXISTS topics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id     UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES sections(id) ON DELETE SET NULL,

    -- ── Materialized Path ───────────────────────────────────────────
    path            TEXT NOT NULL UNIQUE,   -- 'java.jvm.memory.heap'
    parent_path     TEXT,                   -- 'java.jvm.memory'   (NULL for roots)
    depth           INT NOT NULL DEFAULT 0, -- dot-count + 1 for non-roots; 0 = root
    slug            TEXT NOT NULL,          -- last segment: 'heap'

    -- ── Display ─────────────────────────────────────────────────────
    title           TEXT NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,

    -- ── Content: array of typed blocks stored as JSONB ──────────────
    -- Schema per element: { "type": "text|code|diagram|quiz|note|warning", "data": {...} }
    blocks          JSONB NOT NULL DEFAULT '[]',

    -- ── Metadata ────────────────────────────────────────────────────
    estimated_mins  INT NOT NULL DEFAULT 5,
    difficulty      TEXT NOT NULL DEFAULT 'beginner'
                    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    tags            TEXT[] NOT NULL DEFAULT '{}',
    is_deep_dive    BOOLEAN NOT NULL DEFAULT false,
    is_published    BOOLEAN NOT NULL DEFAULT true,
    meta            JSONB NOT NULL DEFAULT '{}',

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ─────────────────────────────────────────────────────────────

-- Primary hierarchy lookups
CREATE INDEX IF NOT EXISTS idx_topics_path
    ON topics(path);

CREATE INDEX IF NOT EXISTS idx_topics_parent_path
    ON topics(parent_path)
    WHERE parent_path IS NOT NULL;

-- Subtree query: path LIKE 'java.jvm%'
-- btree supports prefix LIKE when using text_pattern_ops
CREATE INDEX IF NOT EXISTS idx_topics_path_pattern
    ON topics(path text_pattern_ops);

-- All topics for a language at a given depth (section list, top-level nav)
CREATE INDEX IF NOT EXISTS idx_topics_language_depth
    ON topics(language_id, depth, sort_order)
    WHERE is_published = true;

-- Section-based navigation
CREATE INDEX IF NOT EXISTS idx_topics_section_sort
    ON topics(section_id, sort_order)
    WHERE is_published = true;

-- Full-text search on JSONB blocks content (GIN)
CREATE INDEX IF NOT EXISTS idx_topics_blocks_gin
    ON topics USING GIN (blocks);

-- Tag search
CREATE INDEX IF NOT EXISTS idx_topics_tags_gin
    ON topics USING GIN (tags);

-- Partial index: published-only, used by all public reads
CREATE INDEX IF NOT EXISTS idx_topics_published_nav
    ON topics(language_id, section_id, sort_order)
    WHERE is_published = true;

COMMENT ON TABLE topics IS
    'All learning topics. Uses Materialized Path for hierarchy. Content stored as JSONB block array.';
COMMENT ON COLUMN topics.blocks IS
    'Array of typed content blocks: [{"type":"text","data":{"content":"..."}}, ...]';
COMMENT ON COLUMN topics.path IS
    'Full dot-separated materialized path. Also serves as stable public identifier.';
COMMENT ON COLUMN topics.is_deep_dive IS
    'True for depth>=2 topics that represent nested subtopics within a section topic.';
