'use strict';

const findByLanguage = async (db, languageId) => {
  const { rows } = await db.query(`
    SELECT id, slug, title, description, sort_order, meta
    FROM   sections
    WHERE  language_id = $1
      AND  is_active   = true
    ORDER  BY sort_order ASC, title ASC
  `, [languageId]);
  return rows;
};

const findBySlug = async (db, languageId, slug) => {
  const { rows } = await db.query(`
    SELECT id, slug, title, description, sort_order, meta
    FROM   sections
    WHERE  language_id = $1
      AND  slug        = $2
      AND  is_active   = true
  `, [languageId, slug]);
  return rows[0] ?? null;
};

const upsert = async (db, languageId, section) => {
  const { rows } = await db.query(`
    INSERT INTO sections (language_id, slug, title, description, sort_order, meta)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    ON CONFLICT (language_id, slug) DO UPDATE SET
      title       = EXCLUDED.title,
      description = EXCLUDED.description,
      sort_order  = EXCLUDED.sort_order,
      meta        = EXCLUDED.meta,
      updated_at  = now()
    RETURNING id, slug
  `, [
    languageId,
    section.slug,
    section.title,
    section.description ?? null,
    section.sort_order  ?? 0,
    JSON.stringify(section.meta ?? {}),
  ]);
  return rows[0];
};

module.exports = { findByLanguage, findBySlug, upsert };
