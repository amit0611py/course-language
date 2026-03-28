'use strict';

const contentService  = require('../services/content.service');
const topicRepo       = require('../repositories/topic.repo');
const { isValidPath, getAncestorPaths } = require('../utils/pathUtils');
const { BadRequestError } = require('../utils/errors');

// All topic routes share this param validation schema
const pathParam = {
  params: {
    type: 'object',
    required: ['*'],
    properties: {
      '*': {
        type: 'string',
        // Allows dot-separated path: 'java', 'java.jvm', 'java.jvm.memory.heap'
        pattern: '^[a-z0-9-]+(\\.[a-z0-9-]+)*$',
      },
    },
  },
};

module.exports = async (fastify) => {

  // ── IMPORTANT: Specific prefix routes MUST be registered before the wildcard
  // `/*` route. Fastify matches routes in registration order for wildcards.
  // If `/*` is first, requests to /children/*, /subtree/*, /breadcrumb/*
  // will all be swallowed by the catch-all and treated as topic paths.

  // ── GET /v1/topics/children/*path ─────────────────────────────────────────
  // Direct children only — used by sidebar lazy-loading (Phase 2).
  fastify.get('/children/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const children = await topicRepo.findChildren(fastify.db, path);
    return { path, children };
  });

  // ── GET /v1/topics/subtree/*path ──────────────────────────────────────────
  // All descendants at any depth — used to pre-fetch a section subtree.
  fastify.get('/subtree/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const subtree = await topicRepo.findSubtree(fastify.db, path);
    return { path, subtree };
  });

  // ── GET /v1/topics/breadcrumb/*path ───────────────────────────────────────
  // Ancestor chain root → leaf. Used when navigating directly via URL.
  fastify.get('/breadcrumb/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const ancestorPaths = getAncestorPaths(path);
    const breadcrumb    = await topicRepo.findBreadcrumb(fastify.db, ancestorPaths);
    return { path, breadcrumb };
  });

  // ── GET /v1/topics/*path ───────────────────────────────────────────────────
  // Full topic content: blocks + breadcrumb + direct children.
  // Registered LAST so it does not shadow the specific prefix routes above.
  fastify.get('/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    return contentService.getTopicContent(fastify.db, fastify.redis, path);
  });
};
