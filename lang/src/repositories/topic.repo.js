'use strict';

// ── Single topic ──────────────────────────────────────────────────────────────
//
// CHANGE (migration 007 + 008):
//   • blocks column removed from topics — now read from topic_blocks via subquery.
//   • ancestor_paths TEXT[] column added — returned alongside the topic row.
//
// WHY a correlated subquery for blocks instead of a LEFT JOIN + GROUP BY:
//   • Avoids a GROUP BY over the languages/sections join columns.
//   • PostgreSQL's planner executes the inner SELECT once per outer row and can
//     use idx_topic_blocks_topic (topic_id, block_order) for a fast index scan.
//   • json_agg preserves ORDER BY block_order inside the subquery — guaranteed.
//   • COALESCE(..., '[]'::json) ensures callers always get an array, never NULL.

const findByPath = async (db, path) => {
  const { rows } = await db.query(`
    SELECT
      t.id,
      t.path,
      t.parent_path,
      t.depth,
      t.slug,
      t.title,
      t.estimated_mins,
      t.difficulty,
      t.tags,
      t.is_deep_dive,
      t.ancestor_paths,
      t.meta,
      l.slug  AS language_slug,
      s.slug  AS section_slug,
      s.title AS section_title,
      -- Blocks come from topic_blocks, ordered and aggregated into a JSON array.
      -- The subquery executes once per topic row and is index-covered.
      (
        SELECT COALESCE(
                 json_agg(tb.block ORDER BY tb.block_order),
                 '[]'::json
               )
        FROM   topic_blocks tb
        WHERE  tb.topic_id = t.id
      ) AS blocks
    FROM   topics t
    JOIN   languages l ON l.id = t.language_id
    LEFT   JOIN sections s ON s.id = t.section_id
    WHERE  t.path = $1
      AND  t.is_published = true
  `, [path]);
  return rows[0] ?? null;
};

// ── Hierarchy queries ─────────────────────────────────────────────────────────

// Direct children only — parent_path = $1
// Used by: topic content response (children list) + /topics/children/* route
const findChildren = async (db, parentPath) => {
  const { rows } = await db.query(`
    SELECT
      id, path, parent_path, depth, slug, title,
      estimated_mins, difficulty, is_deep_dive, sort_order, tags
    FROM   topics
    WHERE  parent_path  = $1
      AND  is_published = true
    ORDER  BY sort_order ASC, title ASC
  `, [parentPath]);
  return rows;
};

// Full subtree — all descendants at any depth using materialized path LIKE
// Used by: /topics/subtree/* route and future section pre-fetching
const findSubtree = async (db, path) => {
  const { rows } = await db.query(`
    SELECT
      id, path, parent_path, depth, slug, title,
      estimated_mins, difficulty, is_deep_dive, sort_order, tags
    FROM   topics
    WHERE  (path = $1 OR path LIKE $2)
      AND  is_published = true
    ORDER  BY depth ASC, sort_order ASC
  `, [path, `${path}.%`]);
  return rows;
};

// Breadcrumb — all ancestors + self, ordered root → leaf.
//
// CHANGE (migration 008):
//   Callers now pass topic.ancestor_paths (stored array) concatenated with the
//   topic's own path, instead of computing the array from the path string in JS.
//   This eliminates the JS string-split on every cache miss and makes the intent
//   explicit: "give me rows for these exact paths".
//
//   Caller builds: [...topic.ancestor_paths, topic.path]
//   Example:       ['java', 'java.jvm', 'java.jvm.memory', 'java.jvm.memory.heap']
//
// The ANY($1::text[]) is satisfied by idx_topics_path (btree), which is efficient
// for arrays of length ≤ ~20 (typical max topic depth is 4–5).
const findBreadcrumb = async (db, pathsArray) => {
  const { rows } = await db.query(`
    SELECT path, slug, title, depth
    FROM   topics
    WHERE  path = ANY($1::text[])
      AND  is_published = true
    ORDER  BY depth ASC
  `, [pathsArray]);
  return rows;
};

// ── Navigation tree (used by sidebar) ────────────────────────────────────────
// Returns flat rows; assembled into section→topic tree in navigation.service.js.
// No blocks selected here — sidebar only needs metadata.
const findNavigationRows = async (db, languageSlug) => {
  const { rows } = await db.query(`
    SELECT
      s.id           AS section_id,
      s.slug         AS section_slug,
      s.title        AS section_title,
      s.sort_order   AS section_order,
      t.id           AS topic_id,
      t.path,
      t.slug,
      t.title        AS topic_title,
      t.depth,
      t.parent_path,
      t.sort_order   AS topic_order,
      t.is_deep_dive,
      t.estimated_mins
    FROM   sections s
    JOIN   languages l
           ON  l.id   = s.language_id
           AND l.slug = $1
           AND l.is_active = true
    LEFT   JOIN topics t
           ON  t.section_id   = s.id
           AND t.is_published = true
    WHERE  s.is_active = true
    ORDER  BY s.sort_order ASC, t.depth ASC, t.sort_order ASC
  `, [languageSlug]);
  return rows;
};

// ── Seeder upsert ─────────────────────────────────────────────────────────────
//
// CHANGE (migration 007 + 008):
//   • blocks removed from INSERT — blocks live in topic_blocks now (see upsertBlocks).
//   • ancestor_paths TEXT[] added — pre-computed by seeder via getAncestorPathsOnly().
//
// Parameter map (15 params total, same count as before):
//   $1  path            TEXT     'java.jvm.memory.heap'
//   $2  parentPath      TEXT     'java.jvm.memory'   (NULL for root)
//   $3  depth           INT      3
//   $4  slug            TEXT     'heap'
//   $5  title           TEXT     'Heap Memory in the JVM'
//   $6  ancestor_paths  TEXT[]   '{java,java.jvm,java.jvm.memory}'
//   $7  estimatedMins   INT      12
//   $8  difficulty      TEXT     'intermediate'
//   $9  tags            TEXT[]   '{jvm,memory,gc}'
//   $10 isDeepDive      BOOL     true
//   $11 sortOrder       INT      1
//   $12 isPublished     BOOL     true
//   $13 meta            JSONB    '{}'
//   $14 section slug    TEXT     'jvm-internals'      (used only in JOIN, not stored directly)
//   $15 language slug   TEXT     'java'               (used only in JOIN)

const upsert = async (db, topic) => {
  const { rows } = await db.query(`
    INSERT INTO topics (
      language_id, section_id, path, parent_path, depth, slug, title,
      ancestor_paths, estimated_mins, difficulty, tags, is_deep_dive,
      sort_order, is_published, meta
    )
    SELECT
      l.id,
      s.id,
      $1,  $2,  $3, $4, $5,
      $6::text[],
      $7, $8, $9::text[], $10,
      $11, $12,
      $13::jsonb
    FROM   languages l
    LEFT   JOIN sections s
               ON  s.language_id = l.id
               AND s.slug        = $14
    WHERE  l.slug = $15
    ON CONFLICT (path) DO UPDATE SET
      section_id     = EXCLUDED.section_id,
      title          = EXCLUDED.title,
      ancestor_paths = EXCLUDED.ancestor_paths,
      estimated_mins = EXCLUDED.estimated_mins,
      difficulty     = EXCLUDED.difficulty,
      tags           = EXCLUDED.tags,
      is_deep_dive   = EXCLUDED.is_deep_dive,
      sort_order     = EXCLUDED.sort_order,
      is_published   = EXCLUDED.is_published,
      meta           = EXCLUDED.meta,
      updated_at     = now()
    RETURNING id, path
  `, [
    topic.path,                        // $1
    topic.parentPath   ?? null,        // $2
    topic.depth,                       // $3
    topic.slug,                        // $4
    topic.title,                       // $5
    topic.ancestorPaths ?? [],         // $6  ← replaces blocks
    topic.estimatedMins ?? 5,          // $7
    topic.difficulty    ?? 'beginner', // $8
    topic.tags          ?? [],         // $9
    topic.isDeepDive    ?? false,      // $10
    topic.sortOrder     ?? 0,          // $11
    topic.isPublished   ?? true,       // $12
    JSON.stringify(topic.meta ?? {}),  // $13
    topic.section       ?? null,       // $14  section slug → JOIN
    topic.path.split('.')[0],          // $15  language slug → JOIN
  ]);
  return rows[0]; // { id, path }
};

// ── Block upsert (new — migration 007) ───────────────────────────────────────
//
// Replaces the old approach of embedding blocks in topics.blocks JSONB.
//
// Strategy:
//   1. DELETE all existing blocks for this topic (clean slate).
//   2. INSERT the full new block list in a single query using jsonb_array_elements.
//
// WHY DELETE + INSERT over an UPDATE-by-order approach:
//   • Block arrays are typically short (5–30 items) — the DELETE is instant.
//   • Authors often reorder, insert, or delete blocks mid-array. Tracking diffs
//     is fragile. Full replacement is simpler, correct, and fast enough.
//   • jsonb_array_elements WITH ORDINALITY avoids N individual INSERT round-trips.
//     The entire block list is written in one query → one network round-trip.
//
// The idx_topic_blocks_topic index makes the DELETE and subsequent SELECT fast.

const upsertBlocks = async (db, topicId, blocks) => {
  // Clean slate — removes all existing blocks for this topic
  await db.query(
    'DELETE FROM topic_blocks WHERE topic_id = $1',
    [topicId]
  );

  if (!blocks.length) return;

  // jsonb_array_elements unpacks the JSON array into individual rows.
  // WITH ORDINALITY adds a 1-based position counter (ordinality).
  // We subtract 1 to keep block_order zero-based (matches JS array indexing).
  await db.query(`
    INSERT INTO topic_blocks (topic_id, block_order, block)
    SELECT
      $1,
      (ordinality - 1)::int,
      value
    FROM   jsonb_array_elements($2::jsonb) WITH ORDINALITY
  `, [topicId, JSON.stringify(blocks)]);
};

module.exports = {
  findByPath,
  findChildren,
  findSubtree,
  findBreadcrumb,
  findNavigationRows,
  upsert,
  upsertBlocks,   // ← new export (migration 007)
};
