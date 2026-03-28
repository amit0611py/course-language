'use strict';

const quizRepo = require('../repositories/quiz.repo');

// ── GET /v1/quiz/questions/:questionKey ───────────────────────
// Returns a single quiz question by its key, normalised into the
// shape that the frontend Quiz component expects:
//   { q, opts: string[], correct: number, exp: string }
//
// DB options column schema (migration 006):
//   [{ "id": "a", "text": "...", "correct": true }, ...]
//
// We map → opts: [text, ...], correct: index of first correct entry.

const quizSchema = {
  params: {
    type: 'object',
    required: ['questionKey'],
    properties: {
      questionKey: { type: 'string', pattern: '^[a-z0-9_-]+$' },
    },
  },
};

module.exports = async (fastify) => {
  fastify.get('/questions/:questionKey', { schema: quizSchema }, async (req) => {
    const { questionKey } = req.params;
    const rows = await quizRepo.findByKeys(fastify.db, [questionKey]);
    if (!rows.length) {
      const reply = req.server ? req : fastify;
      throw Object.assign(new Error(`Quiz question not found: ${questionKey}`), { statusCode: 404 });
    }
    const q = rows[0];
    return { question: normalizeQuestion(q) };
  });
};

// ── Normalizer ────────────────────────────────────────────────
// Converts DB options [{id, text, correct}] → Quiz component format.
function normalizeQuestion(row) {
  const opts = (row.options ?? []);

  // Support both DB formats:
  //   A) [{ id, text, correct }]   — migration 006 schema
  //   B) ["option text", ...]      — legacy inline array
  const isObjectFormat = opts.length > 0 && typeof opts[0] === 'object';

  if (isObjectFormat) {
    const texts   = opts.map((o) => o.text ?? String(o));
    const correct = opts.findIndex((o) => o.correct === true);
    return {
      q:       row.question_text,
      opts:    texts,
      correct: correct >= 0 ? correct : 0,
      exp:     row.explanation ?? '',
    };
  }

  // Legacy: options is already a string array; assume last field is explanation idx
  return {
    q:       row.question_text,
    opts:    opts,
    correct: 0,
    exp:     row.explanation ?? '',
  };
}
