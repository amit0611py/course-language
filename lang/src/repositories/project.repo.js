'use strict';

const findByLanguage = async (db, languageId) => {
  const { rows } = await db.query(`
    SELECT
      p.id, p.slug, p.title, p.description, p.difficulty,
      p.estimated_hours, p.sort_order, p.content_tier,
      -- Flag: does a premium architecture doc exist for this project?
      EXISTS (
        SELECT 1 FROM project_architecture pa
        WHERE pa.project_id = p.id AND pa.is_published = true
      ) AS has_architecture
    FROM   projects p
    WHERE  p.language_id  = $1
      AND  p.is_published = true
    ORDER  BY p.sort_order ASC, p.title ASC
  `, [languageId]);
  return rows;
};

// Returns project + its full technology list in one query.
// No N+1: technologies fetched via LEFT JOIN.
const findBySlugWithTech = async (db, slug) => {
  // Project row
  const { rows: pRows } = await db.query(`
    SELECT
      p.id, p.slug, p.title, p.description, p.difficulty,
      p.estimated_hours, p.blocks, p.meta, p.content_tier,
      l.slug AS language_slug,
      EXISTS (
        SELECT 1 FROM project_architecture pa
        WHERE pa.project_id = p.id AND pa.is_published = true
      ) AS has_architecture
    FROM   projects p
    JOIN   languages l ON l.id = p.language_id
    WHERE  p.slug         = $1
      AND  p.is_published = true
  `, [slug]);

  if (!pRows.length) return null;
  const project = pRows[0];

  // Technology rows
  const { rows: techRows } = await db.query(`
    SELECT
      t.slug, t.name, t.icon_url, t.category,
      pt.is_recommended,
      pt.sort_order
    FROM   project_technologies pt
    JOIN   technologies t ON t.id = pt.technology_id
    WHERE  pt.project_id = $1
    ORDER  BY pt.sort_order ASC, t.name ASC
  `, [project.id]);

  return { ...project, technologies: techRows };
};

const upsert = async (db, project, languageId, sectionId) => {
  const { rows } = await db.query(`
    INSERT INTO projects
      (language_id, section_id, slug, title, description,
       difficulty, estimated_hours, blocks, meta, sort_order)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10)
    ON CONFLICT (slug) DO UPDATE SET
      section_id     = EXCLUDED.section_id,
      title          = EXCLUDED.title,
      description    = EXCLUDED.description,
      difficulty     = EXCLUDED.difficulty,
      estimated_hours = EXCLUDED.estimated_hours,
      blocks         = EXCLUDED.blocks,
      meta           = EXCLUDED.meta,
      sort_order     = EXCLUDED.sort_order,
      updated_at     = now()
    RETURNING id, slug
  `, [
    languageId,
    sectionId ?? null,
    project.slug,
    project.title,
    project.description ?? null,
    project.difficulty  ?? 'beginner',
    project.estimatedHours ?? 1,
    JSON.stringify(project.blocks ?? []),
    JSON.stringify(project.meta   ?? {}),
    project.sortOrder ?? 0,
  ]);
  return rows[0];
};

module.exports = { findByLanguage, findBySlugWithTech, upsert };
