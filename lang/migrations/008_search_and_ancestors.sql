-- Migration 008: Full-text trigram search + ancestor_paths column
--
-- IMPROVEMENT A — pg_trgm trigram index on topics.title
--   Enables fast fuzzy / prefix / substring search without a dedicated search engine.
--   Trigram similarity is ideal for "did-you-mean" style search on topic titles.
--   Example future query:
--     SELECT title, similarity(title, $1) AS score
--     FROM   topics
--     WHERE  title % $1          -- GIN trigram index hit
--     ORDER  BY score DESC
--     LIMIT  20;
--
-- IMPROVEMENT B — ancestor_paths TEXT[] column
--   Stores the pre-computed array of all ancestor paths for each topic.
--   Example for path 'java.jvm.memory.heap':
--     ancestor_paths = ['java', 'java.jvm', 'java.jvm.memory']
--                       (ancestors only — self is NOT included)
--
--   Benefits over the previous approach (computing ancestors at query time):
--   1. Breadcrumb query becomes a single indexed ANY() scan with no string splitting.
--   2. "Which topics are under java.jvm?" can be answered with:
--        WHERE 'java.jvm' = ANY(ancestor_paths)
--      using the GIN index — complementary to the materialized path LIKE approach.
--   3. Hierarchy traversal in JS (navigation.service) no longer re-computes
--      ancestry from the path string on cache miss.
--   4. Future AI/recommendation systems can read the full ancestry as a feature vector.

-- ── pg_trgm extension ────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── ancestor_paths column ────────────────────────────────────────────────────

ALTER TABLE topics
    ADD COLUMN IF NOT EXISTS ancestor_paths TEXT[] NOT NULL DEFAULT '{}';

-- ── Back-fill ancestor_paths for all existing rows ───────────────────────────
-- For a path of depth d, we need paths at depths 1..d-1.
-- generate_series(1, depth) gives us exactly d indices (1-based).
-- array_to_string( (string_to_array(path,'.'))[1:n], '.' ) reconstructs the
-- prefix path of length n — PostgreSQL array slicing is 1-based and inclusive.
--
-- Example: path = 'java.jvm.memory.heap', depth = 3
--   n=1 → string_to_array(...)[1:1] = {'java'}       → 'java'
--   n=2 → string_to_array(...)[1:2] = {'java','jvm'} → 'java.jvm'
--   n=3 → string_to_array(...)[1:3] = {...}           → 'java.jvm.memory'
-- → ancestor_paths = ARRAY['java','java.jvm','java.jvm.memory']
--
-- Depth 0 topics (language roots, e.g. path='java') have no ancestors → '{}'.

UPDATE topics
SET ancestor_paths = CASE
    WHEN depth = 0 THEN '{}'::text[]
    ELSE (
        SELECT array_agg(
                   array_to_string(
                       (string_to_array(path, '.'))[1:n],
                       '.'
                   )
                   ORDER BY n
               )
        FROM   generate_series(1, depth) AS n
    )
END;

-- ── Indexes ──────────────────────────────────────────────────────────────────

-- Trigram GIN: powers fuzzy title search (similarity, ILIKE, %)
CREATE INDEX IF NOT EXISTS idx_topics_title_trgm
    ON topics USING GIN (title gin_trgm_ops);

-- GIN on ancestor_paths: powers containment queries
--   WHERE 'java.jvm' = ANY(ancestor_paths)
-- and future array overlap queries (&&) for multi-path filtering.
CREATE INDEX IF NOT EXISTS idx_topics_ancestor_paths
    ON topics USING GIN (ancestor_paths);

COMMENT ON COLUMN topics.ancestor_paths IS
    'Pre-computed ancestor path array (excluding self).
     ''java.jvm.memory.heap'' → {''{java}'',''java.jvm'',''java.jvm.memory''}.
     Updated by seeder on upsert. Enables O(1) breadcrumb lookup and subtree containment queries.';
