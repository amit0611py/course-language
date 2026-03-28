'use strict';

const topicAdminRepo    = require('../repositories/topic.admin.repo');
const topicAdminService = require('../services/topic.admin.service');
const { isValidPath, getParentPath, getSlug, getDepth, getAncestorPathsOnly } = require('../../utils/pathUtils');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // GET /v1/admin/topics
  // Query: ?language=java&section=core-language&search=jvm&limit=50&offset=0
  fastify.get('/', auth, async (req) => {
    const { language, section, search, limit, offset } = req.query ?? {};
    const [topics, total] = await Promise.all([
      topicAdminRepo.list(fastify.db, {
        languageSlug: language, sectionSlug: section, search,
        limit: Number(limit ?? 50), offset: Number(offset ?? 0),
      }),
      topicAdminRepo.countList(fastify.db, {
        languageSlug: language, sectionSlug: section, search,
      }),
    ]);
    return {
      total,
      limit:  Number(limit ?? 50),
      offset: Number(offset ?? 0),
      topics: topics.map(formatTopic),
    };
  });

  // GET /v1/admin/topics/*path
  fastify.get('/*', auth, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid path: ${path}`);
    const topic = await topicAdminRepo.findByPath(fastify.db, path);
    if (!topic) throw new NotFoundError(`Topic not found: ${path}`);
    return { topic: formatTopicFull(topic) };
  });

  // POST /v1/admin/topics
  // Body: { meta: { path, title, section, difficulty, ... }, blocks: [...] }
  fastify.post('/', auth, async (req, reply) => {
    const { meta, blocks } = req.body ?? {};
    if (!meta?.path) throw new BadRequestError('meta.path is required');
    if (!isValidPath(meta.path)) throw new BadRequestError(`Invalid path: ${meta.path}`);
    if (!Array.isArray(blocks)) throw new BadRequestError('blocks must be an array');

    const topic = await topicAdminService.saveTopic(
      fastify.db, fastify.redis, { meta: normaliseMeta(meta), blocks }
    );
    return reply.status(201).send({ path: topic.path, id: topic.id });
  });

  // PUT /v1/admin/topics/*path  — full topic + blocks replacement
  fastify.put('/*', auth, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid path: ${path}`);

    const { meta, blocks } = req.body ?? {};
    if (!Array.isArray(blocks)) throw new BadRequestError('blocks must be an array');

    const mergedMeta = normaliseMeta({ ...(meta ?? {}), path });
    const topic = await topicAdminService.saveTopic(
      fastify.db, fastify.redis, { meta: mergedMeta, blocks }
    );
    return { path: topic.path, id: topic.id };
  });

  // PATCH /v1/admin/topics/*path  — metadata only (no blocks change)
  fastify.patch('/*', auth, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid path: ${path}`);

    const updated = await topicAdminRepo.updateMeta(fastify.db, path, req.body ?? {});
    if (!updated) throw new NotFoundError(`Topic not found: ${path}`);
    await topicAdminService.flushTopicCache(fastify.redis, path);
    return { topic: updated };
  });

  // DELETE /v1/admin/topics/*path  — unpublish (soft delete)
  fastify.delete('/*', auth, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid path: ${path}`);
    const topic = await topicAdminRepo.unpublish(fastify.db, path);
    if (!topic) throw new NotFoundError(`Topic not found: ${path}`);
    await topicAdminService.flushTopicCache(fastify.redis, path);
    return { unpublished: topic.path };
  });
};

// ── Normalise incoming meta to what topicRepo.upsert expects ─────────────────
const normaliseMeta = (meta) => ({
  path:          meta.path,
  parentPath:    getParentPath(meta.path),
  depth:         getDepth(meta.path),
  slug:          getSlug(meta.path),
  title:         meta.title          ?? getSlug(meta.path),
  section:       meta.sectionSlug    ?? meta.section ?? null,
  difficulty:    meta.difficulty     ?? 'beginner',
  estimatedMins: meta.estimatedMins  ?? 5,
  tags:          meta.tags           ?? [],
  isDeepDive:    meta.isDeepDive     ?? false,
  sortOrder:     meta.sortOrder      ?? 0,
  isPublished:   meta.isPublished    ?? true,
  meta:          meta.meta           ?? {},
});

const formatTopic = (r) => ({
  id: r.id, path: r.path, slug: r.slug, title: r.title,
  depth: r.depth, parentPath: r.parent_path,
  difficulty: r.difficulty, estimatedMins: r.estimated_mins,
  isDeepDive: r.is_deep_dive, isPublished: r.is_published,
  sortOrder: r.sort_order, tags: r.tags,
  languageSlug: r.language_slug, languageName: r.language_name,
  sectionSlug: r.section_slug,   sectionTitle: r.section_title,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

const formatTopicFull = (r) => ({
  ...formatTopic(r),
  ancestorPaths: r.ancestor_paths,
  meta:   r.meta,
  blocks: r.blocks ?? [],
});
