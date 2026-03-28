'use strict';

const navService = require('../services/navigation.service');

// GET /v1/languages
// Returns all active languages for the homepage language selector.

const listLanguagesSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id:          { type: 'string' },
              slug:        { type: 'string' },
              name:        { type: 'string' },
              iconUrl:     { type: ['string', 'null'] },
              description: { type: ['string', 'null'] },
              meta:        { type: 'object' },
              sortOrder:   { type: 'integer' },
            },
          },
        },
      },
    },
  },
};

module.exports = async (fastify) => {
  fastify.get('/', { schema: listLanguagesSchema }, async (req, reply) => {
    const languages = await navService.getAllLanguages(fastify.db, fastify.redis);
    return { languages };
  });
};
