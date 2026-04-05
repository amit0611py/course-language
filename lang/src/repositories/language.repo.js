'use strict';

const findAll = async (db) => {
  const { rows } = await db.query(`
    SELECT id, slug, name, icon_url, description, meta, sort_order,
           COALESCE(content_tier, 'free') AS content_tier
    FROM   languages
    WHERE  is_active = true
    ORDER  BY sort_order ASC, name ASC
  `);
  return rows;
};

const findBySlug = async (db, slug) => {
  const { rows } = await db.query(`
    SELECT id, slug, name, icon_url, description, meta, sort_order,
           COALESCE(content_tier, 'free') AS content_tier
    FROM   languages
    WHERE  slug = $1
      AND  is_active = true
  `, [slug]);
  return rows[0] ?? null;
};

const upsert = async (db, lang) => {
  const { rows } = await db.query(`
    INSERT INTO languages (slug, name, icon_url, description, meta, sort_order, content_tier)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
    ON CONFLICT (slug) DO UPDATE SET
      name         = EXCLUDED.name,
      icon_url     = EXCLUDED.icon_url,
      description  = EXCLUDED.description,
      meta         = EXCLUDED.meta,
      sort_order   = EXCLUDED.sort_order,
      content_tier = EXCLUDED.content_tier,
      updated_at   = now()
    RETURNING id, slug
  `, [
    lang.slug,
    lang.name,
    lang.icon_url    ?? null,
    lang.description ?? null,
    JSON.stringify(lang.meta ?? {}),
    lang.sort_order  ?? 0,
    lang.content_tier ?? 'free',
  ]);
  return rows[0];
};

module.exports = { findAll, findBySlug, upsert };
