'use strict';

const findAll = async (db, { search, type } = {}) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (type)   { conditions.push(`type = $${p++}`);             params.push(type);          }
  if (search) { conditions.push(`diagram_key ILIKE $${p++}`);  params.push(`%${search}%`); }

  const { rows } = await db.query(`
    SELECT id, diagram_key, title, type, data, meta,
           created_at, updated_at
    FROM   diagrams
    WHERE  ${conditions.join(' AND ')}
    ORDER  BY diagram_key ASC
  `, params);
  return rows;
};

const findByKey = async (db, key) => {
  const { rows } = await db.query(`
    SELECT id, diagram_key, title, type, data, meta,
           created_at, updated_at
    FROM   diagrams WHERE diagram_key = $1
  `, [key]);
  return rows[0] ?? null;
};

const create = async (db, diagram) => {
  const { rows } = await db.query(`
    INSERT INTO diagrams (diagram_key, title, type, data, meta)
    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
    RETURNING id, diagram_key, title, type, data, created_at, updated_at
  `, [
    diagram.diagramKey,
    diagram.title  ?? null,
    diagram.type,
    JSON.stringify(diagram.data ?? {}),
    JSON.stringify(diagram.meta ?? {}),
  ]);
  return rows[0];
};

const update = async (db, key, diagram) => {
  const { rows } = await db.query(`
    UPDATE diagrams SET
      title      = COALESCE($2, title),
      type       = COALESCE($3, type),
      data       = COALESCE($4::jsonb, data),
      meta       = COALESCE($5::jsonb, meta),
      updated_at = now()
    WHERE diagram_key = $1
    RETURNING id, diagram_key, title, type, data, created_at, updated_at
  `, [
    key,
    diagram.title ?? null,
    diagram.type  ?? null,
    diagram.data  ? JSON.stringify(diagram.data) : null,
    diagram.meta  ? JSON.stringify(diagram.meta) : null,
  ]);
  return rows[0] ?? null;
};

const remove = async (db, key) => {
  const { rows } = await db.query(`
    DELETE FROM diagrams WHERE diagram_key = $1 RETURNING id, diagram_key
  `, [key]);
  return rows[0] ?? null;
};

module.exports = { findAll, findByKey, create, update, remove };