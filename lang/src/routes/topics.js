'use strict';

const contentService  = require('../services/content.service');
const topicRepo       = require('../repositories/topic.repo');
const { isValidPath, getAncestorPaths } = require('../utils/pathUtils');
const { BadRequestError } = require('../utils/errors');

const pathParam = {
  params: {
    type: 'object',
    required: ['*'],
    properties: {
      '*': {
        type: 'string',
        pattern: '^[a-z0-9-]+(\\.[a-z0-9-]+)*$',
      },
    },
  },
};

module.exports = async (fastify) => {

  // Specific routes MUST be registered BEFORE the wildcard /*
  fastify.get('/children/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const children = await topicRepo.findChildren(fastify.db, path);
    return { path, children };
  });

  fastify.get('/subtree/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const subtree = await topicRepo.findSubtree(fastify.db, path);
    return { path, subtree };
  });

  fastify.get('/breadcrumb/*', { schema: pathParam }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    const ancestorPaths = getAncestorPaths(path);
    const breadcrumb    = await topicRepo.findBreadcrumb(fastify.db, ancestorPaths);
    return { path, breadcrumb };
  });

  // ── GET /v1/topics/*path ─────────────────────────────────────────────────
  // verifyAuth is non-throwing — anonymous users get req.user = null
  fastify.get('/*', {
    schema: pathParam,
    preHandler: [fastify.verifyAuth],
  }, async (req) => {
    const path = req.params['*'];
    if (!isValidPath(path)) throw new BadRequestError(`Invalid topic path: ${path}`);
    return contentService.getTopicContent(fastify.db, fastify.redis, path, req.user);
  });
};
