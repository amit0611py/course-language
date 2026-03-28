'use strict';

const navService  = require('../services/navigation.service');
const { isValidPath } = require('../utils/pathUtils');
const { BadRequestError } = require('../utils/errors');

// GET /v1/navigation/:languageSlug
// Returns the full sidebar tree: sections → topics (nested).
// This is the heaviest query; TTL=1hr cache absorbs virtually all load.

const navSchema = {
  params: {
    type: 'object',
    required: ['languageSlug'],
    properties: {
      languageSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    },
  },
};

module.exports = async (fastify) => {
  fastify.get('/:languageSlug', { schema: navSchema }, async (req) => {
    const { languageSlug } = req.params;
    return navService.getNavigationTree(fastify.db, fastify.redis, languageSlug);
  });
};
