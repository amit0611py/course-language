'use strict';

const findAll = async (db, { search, difficulty, limit, offset } = {}) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (difficulty) { conditions.push(`difficulty = $${p++}`); params.push(difficulty); }
  if (search) {
    conditions.push(`(question_key ILIKE $${p} OR question_text ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  params.push(limit  ?? 50);
  params.push(offset ?? 0);

  const { rows } = await db.query(`
    SELECT id, question_key, question_text, question_type,
           options, explanation, difficulty,
           created_at, updated_at
    FROM   quiz_questions
    WHERE  ${conditions.join(' AND ')}
    ORDER  BY question_key ASC
    LIMIT  $${p} OFFSET $${p + 1}
  `, params);
  return rows;
};

const count = async (db, { search, difficulty } = {}) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (difficulty) { conditions.push(`difficulty = $${p++}`); params.push(difficulty); }
  if (search) {
    conditions.push(`(question_key ILIKE $${p} OR question_text ILIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  const { rows } = await db.query(`
    SELECT COUNT(*)::int AS total FROM quiz_questions
    WHERE ${conditions.join(' AND ')}
  `, params);
  return rows[0].total;
};

const findByKey = async (db, key) => {
  const { rows } = await db.query(`
    SELECT id, question_key, question_text, question_type,
           options, explanation, difficulty,
           created_at, updated_at
    FROM   quiz_questions WHERE question_key = $1
  `, [key]);
  return rows[0] ?? null;
};

const create = async (db, q) => {
  const { rows } = await db.query(`
    INSERT INTO quiz_questions
      (question_key, question_text, question_type, options, explanation, difficulty)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
    RETURNING id, question_key, question_text, question_type,
              options, explanation, difficulty, created_at, updated_at
  `, [
    q.questionKey,
    q.questionText,
    q.questionType ?? 'mcq',
    JSON.stringify(q.options ?? []),
    q.explanation  ?? null,
    q.difficulty   ?? null,
  ]);
  return rows[0];
};

const update = async (db, key, q) => {
  const { rows } = await db.query(`
    UPDATE quiz_questions SET
      question_text = COALESCE($2, question_text),
      question_type = COALESCE($3, question_type),
      options       = COALESCE($4::jsonb, options),
      explanation   = COALESCE($5, explanation),
      difficulty    = COALESCE($6, difficulty),
      updated_at    = now()
    WHERE question_key = $1
    RETURNING id, question_key, question_text, question_type,
              options, explanation, difficulty, created_at, updated_at
  `, [
    key,
    q.questionText ?? null,
    q.questionType ?? null,
    q.options      ? JSON.stringify(q.options) : null,
    q.explanation  ?? null,
    q.difficulty   ?? null,
  ]);
  return rows[0] ?? null;
};

const remove = async (db, key) => {
  const { rows } = await db.query(`
    DELETE FROM quiz_questions WHERE question_key = $1
    RETURNING id, question_key
  `, [key]);
  return rows[0] ?? null;
};

module.exports = { findAll, count, findByKey, create, update, remove };