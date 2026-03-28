'use strict';

const cache   = require('../../services/cache.service');
const service = require('../services/topic.admin.service');
const { KEYS, PATTERNS } = require('../../utils/cacheKeys');
const { BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // POST /v1/admin/cache/flush
  // Body: { scope: "all" | "topics" | "nav" | "topic", path?: "java.jvm" }
  fastify.post('/flush', auth, async (req) => {
    const { scope = 'all', path, langSlug } = req.body ?? {};

    let deleted = {};

    switch (scope) {
      case 'all':
        deleted = await service.flushAllCache(fastify.redis);
        break;

      case 'topics':
        deleted.topics = await cache.delPattern(
          fastify.redis, PATTERNS.allTopics()
        );
        break;

      case 'nav':
        if (!langSlug) throw new BadRequestError('langSlug required for scope=nav');
        deleted.nav = await cache.del(fastify.redis, KEYS.nav(langSlug));
        break;

      case 'topic':
        if (!path) throw new BadRequestError('path required for scope=topic');
        deleted.topic = await cache.del(fastify.redis, KEYS.topic(path));
        // Also flush the nav tree so sidebar updates
        deleted.nav = await cache.del(
          fastify.redis, KEYS.nav(path.split('.')[0])
        );
        break;

      default:
        throw new BadRequestError(
          'scope must be one of: all | topics | nav | topic'
        );
    }

    return { flushed: true, scope, deleted };
  });

  // GET /v1/admin/cache/keys?pattern=ce:topic:v1:java*
  // Useful for debugging — lists matching Redis keys (use carefully in prod)
  fastify.get('/keys', auth, async (req) => {
    const pattern = req.query?.pattern ?? 'ce:*';
    const keys = [];
    let cursor = '0';
    do {
      const [next, batch] = await fastify.redis.scan(
        cursor, 'MATCH', pattern, 'COUNT', '100'
      );
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');

    keys.sort();
    return { count: keys.length, keys };
  });
};
