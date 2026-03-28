'use strict';

// ── List (paginated, filterable) ──────────────────────────────────────────────
const list = async (db, { languageSlug, sectionSlug, search, limit, offset }) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (languageSlug) { conditions.push(`l.slug = $${p++}`); params.push(languageSlug); }
  if (sectionSlug)  { conditions.push(`s.slug = $${p++}`); params.push(sectionSlug);  }
  if (search)       {
    conditions.push(`(t.title ILIKE $${p} OR t.path ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  params.push(limit ?? 50);   // $p
  params.push(offset ?? 0);   // $p+1

  const { rows } = await db.query(`
    SELECT t.id, t.path, t.slug, t.title, t.depth, t.parent_path,
           t.difficulty, t.estimated_mins, t.is_deep_dive, t.is_published,
           t.sort_order, t.tags, t.created_at, t.updated_at,
           l.slug AS language_slug, l.name AS language_name,
           s.slug AS section_slug,  s.title AS section_title
    FROM   topics t
    JOIN   languages l ON l.id = t.language_id
    LEFT   JOIN sections s ON s.id = t.section_id
    WHERE  ${conditions.join(' AND ')}
    ORDER  BY l.slug ASC, t.depth ASC, t.sort_order ASC, t.path ASC
    LIMIT  $${p} OFFSET $${p + 1}
  `, params);
  return rows;
};

const countList = async (db, { languageSlug, sectionSlug, search }) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (languageSlug) { conditions.push(`l.slug = $${p++}`); params.push(languageSlug); }
  if (sectionSlug)  { conditions.push(`s.slug = $${p++}`); params.push(sectionSlug);  }
  if (search)       {
    conditions.push(`(t.title ILIKE $${p} OR t.path ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  const { rows } = await db.query(`
    SELECT COUNT(*)::int AS total
    FROM   topics t
    JOIN   languages l ON l.id = t.language_id
    LEFT   JOIN sections s ON s.id = t.section_id
    WHERE  ${conditions.join(' AND ')}
  `, params);
  return rows[0].total;
};

// ── Single topic with full block list ────────────────────────────────────────
const findByPath = async (db, path) => {
  const { rows } = await db.query(`
    SELECT
      t.id, t.path, t.parent_path, t.depth, t.slug, t.title,
      t.estimated_mins, t.difficulty, t.tags, t.is_deep_dive,
      t.is_published, t.sort_order, t.ancestor_paths, t.meta,
      l.slug  AS language_slug, l.name AS language_name,
      s.slug  AS section_slug,  s.title AS section_title,
      t.created_at, t.updated_at,
      (
        SELECT COALESCE(json_agg(tb.block ORDER BY tb.block_order), '[]'::json)
        FROM   topic_blocks tb WHERE tb.topic_id = t.id
      ) AS blocks
    FROM   topics t
    JOIN   languages l ON l.id = t.language_id
    LEFT   JOIN sections s ON s.id = t.section_id
    WHERE  t.path = $1
  `, [path]);
  return rows[0] ?? null;
};

// ── Update topic metadata only (not blocks) ──────────────────────────────────
const updateMeta = async (db, path, meta) => {
  const { rows } = await db.query(`
    UPDATE topics SET
      title          = COALESCE($2, title),
      section_id     = COALESCE(
                         (SELECT id FROM sections WHERE slug = $3
                          AND language_id = (SELECT language_id FROM topics WHERE path = $1)),
                         section_id),
      difficulty     = COALESCE($4, difficulty),
      estimated_mins = COALESCE($5, estimated_mins),
      tags           = COALESCE($6::text[], tags),
      is_deep_dive   = COALESCE($7, is_deep_dive),
      is_published   = COALESCE($8, is_published),
      sort_order     = COALESCE($9, sort_order),
      meta           = COALESCE($10::jsonb, meta),
      updated_at     = now()
    WHERE path = $1
    RETURNING id, path, title, difficulty, estimated_mins, is_published
  `, [
    path,
    meta.title        ?? null, meta.sectionSlug    ?? null,
    meta.difficulty   ?? null, meta.estimatedMins  ?? null,
    meta.tags         ? `{${meta.tags.map(t => `"${t}"`).join(',')}}` : null,
    meta.isDeepDive   ?? null, meta.isPublished     ?? null,
    meta.sortOrder    ?? null,
    meta.meta         ? JSON.stringify(meta.meta) : null,
  ]);
  return rows[0] ?? null;
};

// ── Delete (soft) ─────────────────────────────────────────────────────────────
const unpublish = async (db, path) => {
  const { rows } = await db.query(`
    UPDATE topics SET is_published = false, updated_at = now()
    WHERE path = $1 RETURNING id, path
  `, [path]);
  return rows[0] ?? null;
};

const hardDelete = async (db, path) => {
  const { rows } = await db.query(`
    DELETE FROM topics WHERE path = $1 RETURNING id, path
  `, [path]);
  return rows[0] ?? null;
};

module.exports = { list, countList, findByPath, updateMeta, unpublish, hardDelete };
