'use strict';

// ── Fetch multiple diagrams by string keys — single batch query ───────────────
// Called by content.service.js enrichBlocks() to inject svg/mermaid content
// into diagram blocks before serving to the frontend.

const findByKeys = async (db, diagramKeys) => {
  if (!diagramKeys.length) return [];
  const { rows } = await db.query(`
    SELECT
      id,
      diagram_key,
      title,
      type,
      data
    FROM   diagrams
    WHERE  diagram_key = ANY($1::text[])
  `, [diagramKeys]);
  return rows;
};

// ── Upsert a single diagram row ───────────────────────────────────────────────
// data JSONB shape by type:
//   svg:     { "svg": "<svg>...</svg>" }
//   mermaid: { "source": "graph TD..." }
//   png:     { "url": "https://..." }

const upsert = async (db, diagram) => {
  const { rows } = await db.query(`
    INSERT INTO diagrams (diagram_key, title, type, data)
    VALUES ($1, $2, $3, $4::jsonb)
    ON CONFLICT (diagram_key) DO UPDATE SET
      title = EXCLUDED.title,
      type  = EXCLUDED.type,
      data  = EXCLUDED.data
    RETURNING id, diagram_key
  `, [
    diagram.diagramKey,
    diagram.title ?? null,
    diagram.type  ?? 'svg',
    JSON.stringify(diagram.data ?? {}),
  ]);
  return rows[0];
};

module.exports = { findByKeys, upsert };