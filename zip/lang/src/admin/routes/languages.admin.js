'use strict';

const repo    = require('../repositories/language.admin.repo');
const sRepo   = require('../repositories/section.admin.repo');
const cache   = require('../../services/cache.service');
const { PATTERNS } = require('../../utils/cacheKeys');
const { NotFoundError, BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // GET /v1/admin/languages
  fastify.get('/', auth, async () => {
    const langs = await repo.findAll(fastify.db);
    return { languages: langs.map(formatLang) };
  });

  // GET /v1/admin/languages/:slug
  fastify.get('/:slug', auth, async (req) => {
    const lang = await repo.findBySlug(fastify.db, req.params.slug);
    if (!lang) throw new NotFoundError(`Language not found: ${req.params.slug}`);
    const sections = await sRepo.findByLanguage(fastify.db, req.params.slug);
    return { language: formatLang(lang), sections };
  });

  // POST /v1/admin/languages
  fastify.post('/', auth, async (req, reply) => {
    const { slug, name, iconUrl, description, meta, sortOrder } = req.body ?? {};
    if (!slug || !name) throw new BadRequestError('slug and name are required');
    const lang = await repo.create(fastify.db, { slug, name, iconUrl, description, meta, sortOrder });
    await cache.delPattern(fastify.redis, PATTERNS.allLanguages());
    return reply.status(201).send({ language: formatLang(lang) });
  });

  // PUT /v1/admin/languages/:slug
  fastify.put('/:slug', auth, async (req) => {
    const lang = await repo.update(fastify.db, req.params.slug, req.body ?? {});
    if (!lang) throw new NotFoundError(`Language not found: ${req.params.slug}`);
    await cache.delPattern(fastify.redis, PATTERNS.allLanguages());
    return { language: formatLang(lang) };
  });

  // DELETE /v1/admin/languages/:slug  (soft delete)
  fastify.delete('/:slug', auth, async (req) => {
    const lang = await repo.remove(fastify.db, req.params.slug);
    if (!lang) throw new NotFoundError(`Language not found: ${req.params.slug}`);
    await cache.delPattern(fastify.redis, PATTERNS.allLanguages());
    return { deleted: lang.slug };
  });

  // ── Sections sub-routes ───────────────────────────────────────────────────

  // GET /v1/admin/languages/:slug/sections
  fastify.get('/:slug/sections', auth, async (req) => {
    const sections = await sRepo.findByLanguage(fastify.db, req.params.slug);
    return { sections };
  });

  // POST /v1/admin/languages/:slug/sections
  fastify.post('/:slug/sections', auth, async (req, reply) => {
    const { slug: sSlug, title, description, sortOrder, meta } = req.body ?? {};
    if (!sSlug || !title) throw new BadRequestError('slug and title are required');
    const section = await sRepo.create(
      fastify.db, req.params.slug,
      { slug: sSlug, title, description, sortOrder, meta }
    );
    return reply.status(201).send({ section });
  });

  // PUT /v1/admin/sections/:id
  fastify.put('/sections/:id', auth, async (req) => {
    const section = await sRepo.update(fastify.db, req.params.id, req.body ?? {});
    if (!section) throw new NotFoundError(`Section not found: ${req.params.id}`);
    return { section };
  });

  // DELETE /v1/admin/sections/:id
  fastify.delete('/sections/:id', auth, async (req) => {
    const section = await sRepo.remove(fastify.db, req.params.id);
    if (!section) throw new NotFoundError(`Section not found: ${req.params.id}`);
    return { deleted: section.slug };
  });
};

const formatLang = (r) => ({
  id: r.id, slug: r.slug, name: r.name,
  iconUrl: r.icon_url, description: r.description,
  meta: r.meta, isActive: r.is_active, sortOrder: r.sort_order,
  createdAt: r.created_at, updatedAt: r.updated_at,
});
