'use strict';

const navService = require('../services/navigation.service');

module.exports = async (fastify) => {
  fastify.get('/:languageSlug', {
    preHandler: [fastify.verifyAuth],   // non-throwing — user may be null
    schema: {
      params: {
        type: 'object',
        required: ['languageSlug'],
        properties: {
          languageSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
        },
      },
    },
  }, async (req) => {
    const { languageSlug } = req.params;
    return navService.getNavigationTree(fastify.db, fastify.redis, languageSlug, req.user);
  });
};
