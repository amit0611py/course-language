-- Migration 009: Navigation composite index + trigram tag search index
--
-- ════════════════════════════════════════════════════════════════════════════
-- IMPORTANT — DUPLICATE INDEX RESOLUTION (idx_topics_language_section_sort)
-- ════════════════════════════════════════════════════════════════════════════
-- Migration 003 already contains an index with an identical definition:
--
--   idx_topics_published_nav
--     ON topics(language_id, section_id, sort_order)
--     WHERE is_published = true
--
-- PostgreSQL does NOT deduplicate indexes by definition — only by name.
-- If we created idx_topics_language_section_sort with the same definition,
-- we would have two indexes maintaining exactly the same B-tree:
--
--   ✗  double the write overhead on every INSERT / UPDATE / DELETE on topics
--   ✗  double the disk space for identical data
--   ✗  query planner picks one arbitrarily — the other is dead weight
--
-- Resolution: rename via DROP old + CREATE new within this transaction.
-- Net change: one index, better name, zero extra cost.
--
-- ════════════════════════════════════════════════════════════════════════════
-- PRODUCTION NOTE — CREATE INDEX and table size
-- ════════════════════════════════════════════════════════════════════════════
-- Standard CREATE INDEX acquires a ShareLock, blocking writes for its duration.
-- On a table with millions of rows already in production, prefer:
--
--   CREATE INDEX CONCURRENTLY idx_topics_language_section_sort ON topics(...);
--
-- CONCURRENTLY cannot run inside a transaction block, so it must be executed
-- manually as a standalone statement, not via this migration runner.
--
-- For development and staging (< 100k rows), the standard form below is fine.
-- ════════════════════════════════════════════════════════════════════════════

-- ── INDEX 1: Navigation composite (rename of idx_topics_published_nav) ───────
--
-- Query this index serves (navigation.service.js → findNavigationRows):
--
--   SELECT ... FROM sections s
--   LEFT JOIN topics t
--     ON  t.section_id   = s.id          ← section_id filter
--     AND t.is_published = true           ← partial index condition
--   ORDER BY t.sort_order ASC            ← sort_order covered by index
--
-- Why (language_id, section_id, sort_order) and not just (section_id, sort_order)?
--
--   The planner joins sections → topics per language. Including language_id as
--   the leading column creates a narrower scan: for a language with 500 topics
--   spread across 8 sections, the planner can skip to exactly the right language
--   bucket before filtering by section_id.
--
--   Covering sort_order in the index eliminates a sort step on the result rows.
--
-- Drop the old identically-defined index first (idempotent: IF EXISTS is safe
-- on re-run after a partial failure).
DROP INDEX IF EXISTS idx_topics_published_nav;

-- Create with the canonical name, same definition.
-- IF NOT EXISTS: safe to re-run if this migration was partially applied before.
CREATE INDEX IF NOT EXISTS idx_topics_language_section_sort
    ON topics(language_id, section_id, sort_order)
    WHERE is_published = true;

-- ── INDEX 2: Trigram index on serialised tags (genuinely new) ────────────────
--
-- The existing idx_topics_tags_gin (migration 003) covers:
--   WHERE tags @> ARRAY['jvm']           ← exact array containment
--   WHERE tags && ARRAY['jvm','gc']      ← array overlap
--
-- It does NOT cover fuzzy or substring matches within tag values:
--   WHERE array_to_string(tags,' ') ILIKE '%mem%'    ← would be a seq scan
--   WHERE array_to_string(tags,' ') %  'memor'       ← similarity: seq scan
--
-- This functional trigram index resolves that gap.
--
-- How it works:
--   array_to_string(tags, ' ') serialises the text array to a space-joined string.
--   Example: '{jvm,memory,gc,performance}' → 'jvm memory gc performance'
--   gin_trgm_ops then builds trigrams over that string:
--   'jvm' → { 'jvm' }
--   'memory' → { '  m', ' me', 'mem', 'emo', 'mor', 'ory', 'ry ' }
--   etc.
--
-- Queries this index serves:
--
--   -- Fuzzy tag search (typo-tolerant, e.g. "memmory" finds "memory")
--   SELECT path, title, tags
--   FROM   topics
--   WHERE  array_to_string(tags, ' ') % $1          -- similarity operator
--   ORDER  BY similarity(array_to_string(tags, ' '), $1) DESC
--   LIMIT  20;
--
--   -- Substring tag filter (e.g. user types "mem" in a tag filter UI)
--   SELECT path, title, tags
--   FROM   topics
--   WHERE  array_to_string(tags, ' ') ILIKE $1      -- '%mem%' → index scan
--   AND    is_published = true;
--
-- Coexistence with idx_topics_tags_gin:
--   Both indexes remain. They serve different operators and never conflict.
--   The planner will choose the GIN containment index for @> / && queries
--   and this trigram index for % / ILIKE / LIKE queries automatically.
--
-- pg_trgm was already enabled in migration 008; the IF NOT EXISTS guard below
-- makes this migration independently safe to run in isolation.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── IMMUTABLE wrapper for array_to_string ─────────────────────────────────
--
-- WHY THIS IS NEEDED:
--   PostgreSQL requires that all functions used in index expressions are
--   declared IMMUTABLE (same input → always same output, no side-effects).
--   The built-in array_to_string() is only STABLE (safe within a single
--   statement), so PostgreSQL rejects it directly in a CREATE INDEX expression.
--
-- WHY THIS IS SAFE:
--   array_to_string IS effectively immutable — for the same array and separator,
--   it always returns the same string. Declaring the wrapper IMMUTABLE is correct.
--   This is the standard PostgreSQL pattern for this situation.
--
-- The OR REPLACE makes this migration safely re-runnable.
CREATE OR REPLACE FUNCTION immutable_tags_to_string(tags TEXT[])
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE STRICT PARALLEL SAFE
AS $$ SELECT array_to_string(tags, ' ') $$;

-- Now the index can use the IMMUTABLE wrapper instead of the STABLE built-in.
CREATE INDEX IF NOT EXISTS idx_topics_tags_trgm
    ON topics USING GIN (immutable_tags_to_string(tags) gin_trgm_ops);

-- ── Summary of all topic indexes after this migration ────────────────────────
--
-- Name                          Type   Columns / Expression                   Purpose
-- ───────────────────────────── ────── ────────────────────────────────────── ────────────────────────────────
-- idx_topics_path               btree  path                                   Exact path lookup (GET /topics/:path)
-- idx_topics_path_pattern       btree  path text_pattern_ops                  LIKE prefix (subtree: path LIKE 'java.%')
-- idx_topics_parent_path        btree  parent_path (partial: NOT NULL)        Direct children query
-- idx_topics_language_depth     btree  language_id, depth, sort_order         Top-level nav (partial: published)
-- idx_topics_section_sort       btree  section_id, sort_order                 Section topic list (partial: published)
-- idx_topics_language_section_sort btree language_id, section_id, sort_order  Navigation tree join (partial: published) ← renamed from idx_topics_published_nav
-- idx_topics_blocks_gin         GIN    blocks                                 JSONB block-type filter (future)
-- idx_topics_tags_gin           GIN    tags                                   Exact tag containment (@> / &&)
-- idx_topics_tags_trgm          GIN    immutable_tags_to_string(tags)         Fuzzy / substring tag search (%)           ← NEW (via IMMUTABLE wrapper fn)
-- idx_topics_title_trgm         GIN    title gin_trgm_ops                     Fuzzy title search (similarity / ILIKE)
-- idx_topics_ancestor_paths     GIN    ancestor_paths                         Ancestor containment (ANY / &&)
