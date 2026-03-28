'use strict';

const findByLanguage = async (db, languageSlug) => {
  const { rows } = await db.query(`
    SELECT s.id, s.slug, s.title, s.description, s.sort_order, s.is_active,
           s.meta, s.created_at, s.updated_at
    FROM   sections s
    JOIN   languages l ON l.id = s.language_id
    WHERE  l.slug = $1
    ORDER  BY s.sort_order ASC, s.title ASC
  `, [languageSlug]);
  return rows;
};

const create = async (db, languageSlug, section) => {
  const { rows } = await db.query(`
    INSERT INTO sections (language_id, slug, title, description, sort_order, meta)
    SELECT l.id, $2, $3, $4, $5, $6::jsonb
    FROM   languages l WHERE l.slug = $1
    RETURNING id, slug, title, description, sort_order, is_active, meta
  `, [
    languageSlug, section.slug, section.title,
    section.description ?? null,
    section.sortOrder   ?? 0,
    JSON.stringify(section.meta ?? {}),
  ]);
  return rows[0];
};

const update = async (db, id, section) => {
  const { rows } = await db.query(`
    UPDATE sections SET
      title       = COALESCE($2, title),
      description = COALESCE($3, description),
      sort_order  = COALESCE($4, sort_order),
      is_active   = COALESCE($5, is_active),
      meta        = COALESCE($6::jsonb, meta),
      updated_at  = now()
    WHERE id = $1
    RETURNING id, slug, title, description, sort_order, is_active, meta
  `, [
    id,
    section.title       ?? null, section.description ?? null,
    section.sortOrder   ?? null, section.isActive    ?? null,
    section.meta        ? JSON.stringify(section.meta) : null,
  ]);
  return rows[0] ?? null;
};

const remove = async (db, id) => {
  const { rows } = await db.query(`
    UPDATE sections SET is_active = false, updated_at = now()
    WHERE id = $1 RETURNING id, slug
  `, [id]);
  return rows[0] ?? null;
};

module.exports = { findByLanguage, create, update, remove };
