'use strict';

// ── Single topic ───────────────────────────────────────────────────────────────
// Pulls language's content_tier alongside the topic row so content.service.js
// can enforce language-level locking without a second query.

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
      t.content_tier,
      l.slug  AS language_slug,
      COALESCE(l.content_tier, 'free') AS language_tier,
      s.slug  AS section_slug,
      s.title AS section_title,
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

const findChildren = async (db, parentPath) => {
  const { rows } = await db.query(`
    SELECT
      id, path, parent_path, depth, slug, title,
      estimated_mins, difficulty, is_deep_dive, sort_order, tags, content_tier
    FROM   topics
    WHERE  parent_path  = $1
      AND  is_published = true
    ORDER  BY sort_order ASC, title ASC
  `, [parentPath]);
  return rows;
};

const findSubtree = async (db, path) => {
  const { rows } = await db.query(`
    SELECT
      id, path, parent_path, depth, slug, title,
      estimated_mins, difficulty, is_deep_dive, sort_order, tags, content_tier
    FROM   topics
    WHERE  (path = $1 OR path LIKE $2)
      AND  is_published = true
    ORDER  BY depth ASC, sort_order ASC
  `, [path, `${path}.%`]);
  return rows;
};

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
      t.estimated_mins,
      t.content_tier
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
    topic.path,
    topic.parentPath   ?? null,
    topic.depth,
    topic.slug,
    topic.title,
    topic.ancestorPaths ?? [],
    topic.estimatedMins ?? 5,
    topic.difficulty    ?? 'beginner',
    topic.tags          ?? [],
    topic.isDeepDive    ?? false,
    topic.sortOrder     ?? 0,
    topic.isPublished   ?? true,
    JSON.stringify(topic.meta ?? {}),
    topic.section       ?? null,
    topic.path.split('.')[0],
  ]);
  return rows[0];
};

// ── Block upsert ──────────────────────────────────────────────────────────────
const upsertBlocks = async (db, topicId, blocks) => {
  await db.query('DELETE FROM topic_blocks WHERE topic_id = $1', [topicId]);
  if (!blocks.length) return;
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
  upsertBlocks,
};
