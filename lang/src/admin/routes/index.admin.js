'use strict';

// Central admin route loader
// All routes are mounted under /v1/admin (registered in src/routes/index.js)
// Every sub-module applies fastify.verifyAdminKey as a preHandler individually
// so the auth check is explicit and can't be accidentally skipped.

module.exports = async (fastify) => {
  fastify.register(require('./languages.admin'), { prefix: '/languages' });
  fastify.register(require('./topics.admin'),    { prefix: '/topics'    });
  fastify.register(require('./diagrams.admin'),  { prefix: '/diagrams'  });
  fastify.register(require('./quizzes.admin'),   { prefix: '/quizzes'   });
  fastify.register(require('./cache.admin'),     { prefix: '/cache'     });
  fastify.register(require('./stats.admin'),     { prefix: '/stats'     });
  fastify.register(require('./bulk.admin'),      { prefix: '/bulk'      });
  fastify.register(require('./delete.admin'),    { prefix: '/delete'    });
};