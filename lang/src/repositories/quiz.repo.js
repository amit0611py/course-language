'use strict';

// Fetch multiple quiz questions by their string keys in a single query.
// Called by content service to enrich quiz blocks before returning to client.

const findByKeys = async (db, questionKeys) => {
  if (!questionKeys.length) return [];
  const { rows } = await db.query(`
    SELECT
      id,
      question_key,
      question_text,
      question_type,
      options,
      explanation,
      difficulty
    FROM   quiz_questions
    WHERE  question_key = ANY($1::text[])
  `, [questionKeys]);
  return rows;
};

const upsert = async (db, question) => {
  const { rows } = await db.query(`
    INSERT INTO quiz_questions
      (question_key, question_text, question_type, options, explanation, difficulty)
    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
    ON CONFLICT (question_key) DO UPDATE SET
      question_text = EXCLUDED.question_text,
      question_type = EXCLUDED.question_type,
      options       = EXCLUDED.options,
      explanation   = EXCLUDED.explanation,
      difficulty    = EXCLUDED.difficulty
    RETURNING id, question_key
  `, [
    question.questionKey,
    question.questionText,
    question.questionType ?? 'mcq',
    JSON.stringify(question.options ?? []),
    question.explanation ?? null,
    question.difficulty  ?? null,
  ]);
  return rows[0];
};

module.exports = { findByKeys, upsert };
