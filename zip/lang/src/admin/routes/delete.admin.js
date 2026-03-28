'use strict';

// ── Delete APIs ───────────────────────────────────────────────────────────────
//
// Two modes for everything: soft (safe, reversible) and hard (permanent).
//
// DELETE /v1/admin/delete/topic/:path?mode=soft     → sets is_published=false
// DELETE /v1/admin/delete/topic/:path?mode=hard     → removes topic + all its blocks
// DELETE /v1/admin/delete/topic/:path?mode=cascade  → removes topic + ALL children + blocks
//
// DELETE /v1/admin/delete/language/:slug?mode=soft  → sets is_active=false
// DELETE /v1/admin/delete/language/:slug?mode=hard  → removes language + sections + ALL topics + blocks

const cache  = require('../../services/cache.service');
const { KEYS, PATTERNS } = require('../../utils/cacheKeys');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { isValidPath } = require('../../utils/pathUtils');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // ────────────────────────────────────────────────────────────────────────────
  // TOPIC DELETE
  // DELETE /v1/admin/delete/topic/*path?mode=soft|hard|cascade
  //
  // soft    → sets is_published=false. Topic hidden from learners. Reversible.
  // hard    → permanently deletes the topic row + its topic_blocks rows.
  //           Children (deep dives) are NOT deleted — they become orphans.
  // cascade → permanently deletes the topic + ALL children at any depth
  //           (entire subtree). Use when deleting a parent and all its deep dives.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.delete('/topic/*', auth, async (req, reply) => {
    const path = req.params['*'];
    const mode = req.query?.mode ?? 'soft';

    if (!path || !isValidPath(path)) {
      throw new BadRequestError(`Invalid topic path: ${path}`);
    }
    if (!['soft', 'hard', 'cascade'].includes(mode)) {
      throw new BadRequestError('mode must be: soft | hard | cascade');
    }

    const langSlug = path.split('.')[0];

    // ── Soft delete ──────────────────────────────────────────────────────────
    if (mode === 'soft') {
      const { rows } = await fastify.db.query(`
        UPDATE topics SET is_published = false, updated_at = now()
        WHERE path = $1
        RETURNING id, path, title
      `, [path]);

      if (!rows[0]) throw new NotFoundError(`Topic not found: ${path}`);
      await flushTopicCache(fastify.redis, langSlug, path);

      return reply.send({
        ok:   true,
        mode: 'soft',
        unpublished: rows[0].path,
        title:       rows[0].title,
        note: 'Topic is hidden from learners. Restore with PATCH { isPublished: true }.',
      });
    }

    // ── Hard delete — single topic only ──────────────────────────────────────
    if (mode === 'hard') {
      // Check it exists first
      const { rows: check } = await fastify.db.query(
        'SELECT id, path, title FROM topics WHERE path = $1', [path]
      );
      if (!check[0]) throw new NotFoundError(`Topic not found: ${path}`);

      // topic_blocks are deleted via ON DELETE CASCADE on topic_id FK
      const { rows } = await fastify.db.query(`
        DELETE FROM topics WHERE path = $1 RETURNING id, path, title
      `, [path]);

      await flushTopicCache(fastify.redis, langSlug, path);

      return reply.send({
        ok:      true,
        mode:    'hard',
        deleted: rows[0].path,
        title:   rows[0].title,
        note:    'Topic and its blocks permanently deleted. Children are NOT deleted.',
      });
    }

    // ── Cascade delete — topic + entire subtree ───────────────────────────────
    if (mode === 'cascade') {
      // Find all topics in this subtree (path itself + all descendants)
      const { rows: subtree } = await fastify.db.query(`
        SELECT id, path, title FROM topics
        WHERE path = $1 OR path LIKE $2
        ORDER BY depth DESC
      `, [path, `${path}.%`]);

      if (!subtree.length) throw new NotFoundError(`Topic not found: ${path}`);

      const paths  = subtree.map(r => r.path);
      const titles = subtree.map(r => r.title);

      // Delete all — topic_blocks cascade automatically
      await fastify.db.query(`
        DELETE FROM topics WHERE path = ANY($1::text[])
      `, [paths]);

      // Flush cache for each deleted topic + nav once
      await Promise.all([
        ...paths.map(p => cache.del(fastify.redis, KEYS.topic(p))),
        cache.del(fastify.redis, KEYS.nav(langSlug)),
        cache.del(fastify.redis, KEYS.language()),
      ]);

      return reply.send({
        ok:      true,
        mode:    'cascade',
        deleted: paths,
        titles,
        count:   paths.length,
        note:    `${paths.length} topic(s) and all their blocks permanently deleted.`,
      });
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // LANGUAGE DELETE
  // DELETE /v1/admin/delete/language/:slug?mode=soft|hard
  //
  // soft → sets is_active=false. Language hidden from all APIs. Reversible.
  // hard → permanently deletes the language + all its sections + ALL topics
  //        + ALL topic blocks. This is a full wipe. Irreversible.
  // ────────────────────────────────────────────────────────────────────────────
  fastify.delete('/language/:slug', auth, async (req, reply) => {
    const { slug } = req.params;
    const mode     = req.query?.mode ?? 'soft';

    if (!slug) throw new BadRequestError('language slug is required');
    if (!['soft', 'hard'].includes(mode)) {
      throw new BadRequestError('mode must be: soft | hard');
    }

    // Confirm language exists
    const { rows: langCheck } = await fastify.db.query(
      'SELECT id, slug, name FROM languages WHERE slug = $1', [slug]
    );
    if (!langCheck[0]) throw new NotFoundError(`Language not found: ${slug}`);
    const langId   = langCheck[0].id;
    const langName = langCheck[0].name;

    // ── Soft delete ──────────────────────────────────────────────────────────
    if (mode === 'soft') {
      await fastify.db.query(`
        UPDATE languages SET is_active = false, updated_at = now()
        WHERE id = $1
      `, [langId]);

      await flushLangCache(fastify.redis, slug);

      return reply.send({
        ok:          true,
        mode:        'soft',
        deactivated: slug,
        name:        langName,
        note:        'Language hidden from all public APIs. Restore with PUT /admin/languages/:slug { isActive: true }.',
      });
    }

    // ── Hard delete — full wipe ───────────────────────────────────────────────
    if (mode === 'hard') {
      // Count what will be deleted so we can report it
      const { rows: counts } = await fastify.db.query(`
        SELECT
          (SELECT COUNT(*)::int FROM sections  WHERE language_id = $1) AS sections,
          (SELECT COUNT(*)::int FROM topics    WHERE language_id = $1) AS topics,
          (SELECT COUNT(*)::int FROM topic_blocks tb
             JOIN topics t ON t.id = tb.topic_id
             WHERE t.language_id = $1)                                  AS blocks
      `, [langId]);

      const summary = counts[0];

      // Delete language — cascades to sections → topics → topic_blocks
      // (all FK constraints have ON DELETE CASCADE)
      await fastify.db.query('DELETE FROM languages WHERE id = $1', [langId]);

      // Flush all cache for this language
      await flushLangCache(fastify.redis, slug);

      return reply.send({
        ok:      true,
        mode:    'hard',
        deleted: slug,
        name:    langName,
        summary: {
          sectionsDeleted:    summary.sections,
          topicsDeleted:      summary.topics,
          blocksDeleted:      summary.blocks,
        },
        note: 'Language, all sections, all topics, and all blocks permanently deleted. This cannot be undone.',
      });
    }
  });
};

// ── Cache helpers ─────────────────────────────────────────────────────────────

async function flushTopicCache(redis, langSlug, topicPath) {
  await Promise.all([
    cache.del(redis, KEYS.topic(topicPath)),
    cache.del(redis, KEYS.nav(langSlug)),
    cache.del(redis, KEYS.language()),
  ]);
}

async function flushLangCache(redis, langSlug) {
  await Promise.all([
    cache.delPattern(redis, PATTERNS.allTopics()),
    cache.del(redis, KEYS.nav(langSlug)),
    cache.del(redis, KEYS.language()),
  ]);
}