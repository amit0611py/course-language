'use strict';

const fp        = require('fastify-plugin');
const rateLimit = require('@fastify/rate-limit');
const config    = require('../config');

const rateLimitPlugin = async (fastify) => {
  await fastify.register(rateLimit, {
    global:      true,
    max:         config.rateLimit.max,
    timeWindow:  config.rateLimit.timeWindow,
    // Use Redis for shared rate limit state across multiple Fastify nodes
    redis:       fastify.redis,
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      error: {
        code:       'RATE_LIMITED',
        message:    `Too many requests. Retry after ${context.after}.`,
        retryAfter: context.after,
      },
    }),
  });
};

// Must run after redis plugin is registered
module.exports = fp(rateLimitPlugin, {
  name: 'rate-limit',
  fastify: '4.x',
  dependencies: ['redis'],
});
