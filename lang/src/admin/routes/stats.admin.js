'use strict';

const service = require('../services/topic.admin.service');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // GET /v1/admin/stats
  // Dashboard totals: languages, sections, topics, blocks, quizzes, diagrams
  fastify.get('/', auth, async () => {
    const stats = await service.getStats(fastify.db);
    return { stats };
  });

  // GET /v1/admin/stats/topics-by-language
  // Breakdown of topic counts per language — useful for progress tracking
  fastify.get('/topics-by-language', auth, async () => {
    const { rows } = await fastify.db.query(`
      SELECT
        l.slug        AS language_slug,
        l.name        AS language_name,
        l.is_active,
        COUNT(t.id)::int                                    AS total_topics,
        COUNT(t.id) FILTER (WHERE t.is_published)::int      AS published,
        COUNT(t.id) FILTER (WHERE NOT t.is_published)::int  AS unpublished,
        COUNT(t.id) FILTER (WHERE t.is_deep_dive)::int      AS deep_dives,
        COUNT(DISTINCT t.section_id)::int                   AS sections_used
      FROM   languages l
      LEFT   JOIN topics t ON t.language_id = l.id
      GROUP  BY l.id, l.slug, l.name, l.is_active
      ORDER  BY l.sort_order ASC, l.name ASC
    `);
    return { breakdown: rows };
  });

  // GET /v1/admin/stats/blocks-by-type
  // How many of each block type exist — helps spot missing content
  fastify.get('/blocks-by-type', auth, async () => {
    const { rows } = await fastify.db.query(`
      SELECT
        (block->>'type')    AS block_type,
        COUNT(*)::int       AS count
      FROM   topic_blocks
      GROUP  BY block->>'type'
      ORDER  BY count DESC
    `);
    return { breakdown: rows };
  });
};
