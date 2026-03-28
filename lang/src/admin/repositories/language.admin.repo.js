'use strict';

const findAll = async (db) => {
  const { rows } = await db.query(`
    SELECT id, slug, name, icon_url, description, meta, is_active, sort_order,
           created_at, updated_at
    FROM   languages
    ORDER  BY sort_order ASC, name ASC
  `);
  return rows;
};

const findBySlug = async (db, slug) => {
  const { rows } = await db.query(`
    SELECT id, slug, name, icon_url, description, meta, is_active, sort_order,
           created_at, updated_at
    FROM   languages WHERE slug = $1
  `, [slug]);
  return rows[0] ?? null;
};

const create = async (db, lang) => {
  const { rows } = await db.query(`
    INSERT INTO languages (slug, name, icon_url, description, meta, sort_order, is_active)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    RETURNING id, slug, name, icon_url, description, meta, is_active, sort_order
  `, [
    lang.slug, lang.name,
    lang.iconUrl     ?? null,
    lang.description ?? null,
    JSON.stringify(lang.meta ?? {}),
    lang.sortOrder   ?? 0,
    lang.isActive    ?? true,
  ]);
  return rows[0];
};

const update = async (db, slug, lang) => {
  const { rows } = await db.query(`
    UPDATE languages SET
      name        = COALESCE($2, name),
      icon_url    = COALESCE($3, icon_url),
      description = COALESCE($4, description),
      meta        = COALESCE($5::jsonb, meta),
      sort_order  = COALESCE($6, sort_order),
      is_active   = COALESCE($7, is_active),
      updated_at  = now()
    WHERE slug = $1
    RETURNING id, slug, name, icon_url, description, meta, is_active, sort_order
  `, [
    slug,
    lang.name        ?? null, lang.iconUrl     ?? null,
    lang.description ?? null,
    lang.meta        ? JSON.stringify(lang.meta) : null,
    lang.sortOrder   ?? null, lang.isActive    ?? null,
  ]);
  return rows[0] ?? null;
};

const remove = async (db, slug) => {
  const { rows } = await db.query(`
    UPDATE languages SET is_active = false, updated_at = now()
    WHERE slug = $1 RETURNING id, slug
  `, [slug]);
  return rows[0] ?? null;
};

module.exports = { findAll, findBySlug, create, update, remove };
