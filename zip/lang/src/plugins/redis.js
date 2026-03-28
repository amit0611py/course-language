'use strict';

const fp     = require('fastify-plugin');
const Redis  = require('ioredis');
const config = require('../config');

// Registers a shared ioredis client on fastify.redis
// Cache service receives redis via fastify.redis.

const redisPlugin = async (fastify) => {
  const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect',   ()    => fastify.log.info('Redis connected'));
  redis.on('error',     (err) => fastify.log.error({ err }, 'Redis error'));
  redis.on('reconnecting', () => fastify.log.warn('Redis reconnecting...'));

  await redis.ping(); // verify on startup

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
    fastify.log.info('Redis connection closed');
  });
};

module.exports = fp(redisPlugin, {
  name: 'redis',
  fastify: '4.x',
});
