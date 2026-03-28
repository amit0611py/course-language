-- Migration 007: Extract topic blocks into a dedicated table
--
-- WHY:
--   Storing blocks as a JSONB array in topics works at small scale but creates
--   problems at 10,000+ topics / 200,000+ blocks:
--
--   1. VACUUM/autovacuum must rewrite the entire JSONB column on every topic UPDATE,
--      even if only one block changed — TOAST overhead grows with blob size.
--   2. PostgreSQL cannot partially update a JSONB array: the full array is
--      serialised, transmitted, and stored on every write.
--   3. GIN indexes on blocks JSONB slow down writes proportionally as topics grow.
--   4. A separate table lets us add per-block metadata (block_type index,
--      full-text search, version history) without touching topics at all.
--
-- STRATEGY:
--   Step 1: Create topic_blocks table.
--   Step 2: Migrate existing data from topics.blocks using jsonb_array_elements.
--   Step 3: Drop the blocks column from topics.
--   All three steps run inside a single transaction via the migration runner.

-- ── Step 1: Create topic_blocks ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS topic_blocks (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id    UUID    NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    block_order INT     NOT NULL,                 -- zero-based position in the array
    block       JSONB   NOT NULL,                 -- { "type": "text|code|...", "data": {...} }

    -- Prevents duplicate ordinal positions for the same topic
    CONSTRAINT uq_topic_block_order UNIQUE (topic_id, block_order)
);

-- ── Index ────────────────────────────────────────────────────────────────────
-- This is the single most important index: every content page load does
--   SELECT block FROM topic_blocks WHERE topic_id = $1 ORDER BY block_order
-- The composite index satisfies both the filter and the sort in one B-tree scan.
CREATE INDEX IF NOT EXISTS idx_topic_blocks_topic
    ON topic_blocks(topic_id, block_order);

-- Optional: GIN index on the block JSONB for future server-side block-type filtering
-- e.g. WHERE block @> '{"type":"quiz"}' to count quiz blocks across topics
CREATE INDEX IF NOT EXISTS idx_topic_blocks_gin
    ON topic_blocks USING GIN (block);

-- ── Step 2: Migrate existing blocks ──────────────────────────────────────────
-- jsonb_array_elements WITH ORDINALITY yields (value JSONB, ordinality BIGINT).
-- We use (ordinality - 1) so block_order is zero-based, matching JS array indices.
-- FILTER: skip topics that never had blocks (empty array []).

INSERT INTO topic_blocks (topic_id, block_order, block)
SELECT
    t.id,
    (ordinality - 1)::int,
    value
FROM   topics t,
       jsonb_array_elements(t.blocks) WITH ORDINALITY
WHERE  jsonb_array_length(t.blocks) > 0
ON CONFLICT DO NOTHING;   -- idempotent: safe to re-run if migration partially applied

-- ── Step 3: Drop blocks column from topics ───────────────────────────────────
-- Must come AFTER data migration is confirmed complete.
-- ON CONFLICT DO NOTHING above ensures this is safe even if re-run.
ALTER TABLE topics DROP COLUMN IF EXISTS blocks;

COMMENT ON TABLE topic_blocks IS
    'Per-row content blocks for topics. Replaces topics.blocks JSONB array for scalability.
     Each row is one block: { type, data }. block_order determines display sequence.';

COMMENT ON COLUMN topic_blocks.block_order IS
    'Zero-based position. Gaps are allowed; ORDER BY block_order is always applied on reads.';

COMMENT ON COLUMN topic_blocks.block IS
    'Block payload: { "type": "text|code|diagram|quiz|note|warning", "data": {...} }';
