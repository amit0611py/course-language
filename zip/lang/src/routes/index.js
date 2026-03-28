'use strict';

// Central route loader. Registers each route module under /v1.
// To add a new route group: create a file and add one line here.

module.exports = async (fastify, opts) => {
  fastify.register(require('./languages'),  { prefix: '/languages'  });
  fastify.register(require('./navigation'), { prefix: '/navigation' });
  fastify.register(require('./topics'),     { prefix: '/topics'     });
  fastify.register(require('./projects'),   { prefix: '/projects'   });
  fastify.register(require('./quiz'),       { prefix: '/quiz'       });
};
