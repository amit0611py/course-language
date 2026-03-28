'use strict';

const fastify = require('fastify');
const config  = require('./config');

const buildApp = (opts = {}) => {
  const app = fastify({
    logger: {
      level: opts.logLevel ?? config.server.logLevel,
      transport:
        config.server.nodeEnv === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    // Return validation errors as clean JSON (not raw Fastify internals)
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        allErrors: false,
      },
    },
  });

  // ── Plugins ────────────────────────────────────────────────────────
  app.register(require('./plugins/postgres'));
  app.register(require('./plugins/redis'));
  app.register(require('./plugins/cors'));
  app.register(require('./plugins/rateLimit'));
  app.register(require('./plugins/static'));   // serves /public/* (icons, etc.)
  app.register(require('./plugins/adminAuth')); // decorates verifyAdminKey

  // ── Routes ─────────────────────────────────────────────────────────
  app.register(require('./routes'), { prefix: '/v1' });
  app.register(require('./admin/routes/index.admin'), { prefix: '/v1/admin' });

  // ── Health check (no prefix — infra/load-balancer pings this) ──────
  app.get('/health', { logLevel: 'warn' }, async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // ── Global error handler ────────────────────────────────────────────
  app.setErrorHandler((err, req, reply) => {
    const status = err.statusCode ?? 500;

    if (status >= 500) {
      req.log.error({ err }, 'Unhandled server error');
    }

    reply.status(status).send({
      error: {
        code:    err.code ?? 'INTERNAL_ERROR',
        message: status < 500 ? err.message : 'Internal server error',
      },
    });
  });

  // ── 404 handler ─────────────────────────────────────────────────────
  app.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      error: {
        code:    'NOT_FOUND',
        message: `Route ${req.method} ${req.url} not found`,
      },
    });
  });

  return app;
};

module.exports = buildApp;
