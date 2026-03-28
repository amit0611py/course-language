'use strict';

const repo = require('../repositories/quiz.admin.repo');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // GET /v1/admin/quizzes?search=jvm&difficulty=beginner&limit=50&offset=0
  fastify.get('/', auth, async (req) => {
    const { search, difficulty, limit, offset } = req.query ?? {};
    const [questions, total] = await Promise.all([
      repo.findAll(fastify.db, {
        search, difficulty,
        limit: Number(limit ?? 50), offset: Number(offset ?? 0),
      }),
      repo.count(fastify.db, { search, difficulty }),
    ]);
    return {
      total, limit: Number(limit ?? 50), offset: Number(offset ?? 0),
      questions: questions.map(formatQuestion),
    };
  });

  // GET /v1/admin/quizzes/:key
  fastify.get('/:key', auth, async (req) => {
    const q = await repo.findByKey(fastify.db, req.params.key);
    if (!q) throw new NotFoundError(`Quiz question not found: ${req.params.key}`);
    return { question: formatQuestion(q) };
  });

  // POST /v1/admin/quizzes
  // Body: { questionKey, questionText, questionType, options, explanation, difficulty }
  fastify.post('/', auth, async (req, reply) => {
    const { questionKey, questionText, options } = req.body ?? {};
    if (!questionKey)  throw new BadRequestError('questionKey is required');
    if (!questionText) throw new BadRequestError('questionText is required');
    if (!Array.isArray(options) || options.length < 2) {
      throw new BadRequestError('options must be an array with at least 2 items');
    }
    const q = await repo.create(fastify.db, req.body);
    return reply.status(201).send({ question: formatQuestion(q) });
  });

  // PUT /v1/admin/quizzes/:key
  fastify.put('/:key', auth, async (req) => {
    const q = await repo.update(fastify.db, req.params.key, req.body ?? {});
    if (!q) throw new NotFoundError(`Quiz question not found: ${req.params.key}`);
    return { question: formatQuestion(q) };
  });

  // DELETE /v1/admin/quizzes/:key
  fastify.delete('/:key', auth, async (req) => {
    const q = await repo.remove(fastify.db, req.params.key);
    if (!q) throw new NotFoundError(`Quiz question not found: ${req.params.key}`);
    return { deleted: q.question_key };
  });
};

const formatQuestion = (r) => ({
  id: r.id, questionKey: r.question_key,
  questionText: r.question_text, questionType: r.question_type,
  options: r.options, explanation: r.explanation,
  difficulty: r.difficulty,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
