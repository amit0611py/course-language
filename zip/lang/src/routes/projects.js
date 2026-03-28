'use strict';

const projectService = require('../services/project.service');

const slugParam = {
  params: {
    type: 'object',
    required: ['slug'],
    properties: {
      slug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    },
  },
};

const langParam = {
  params: {
    type: 'object',
    required: ['languageSlug'],
    properties: {
      languageSlug: { type: 'string', pattern: '^[a-z0-9-]+$' },
    },
  },
};

module.exports = async (fastify) => {

  // GET /v1/projects/by-language/:languageSlug
  // Lists all projects for a language (summary, no blocks).
  fastify.get('/by-language/:languageSlug', { schema: langParam }, async (req) => {
    const { languageSlug } = req.params;
    const projects = await projectService.getProjectsByLanguage(
      fastify.db, fastify.redis, languageSlug
    );
    return { projects };
  });

  // GET /v1/projects/:slug
  // Full project detail: blocks + technology list.
  fastify.get('/:slug', { schema: slugParam }, async (req) => {
    const { slug } = req.params;
    return projectService.getProject(fastify.db, fastify.redis, slug);
  });
};
