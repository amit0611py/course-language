'use strict';

const fp     = require('fastify-plugin');
const config = require('../config');

// ── Admin authentication plugin ───────────────────────────────────────────────
// Adds a preHandler on every route inside the /v1/admin/* scope.
// Strategy: static API key in X-Admin-Key header (or Bearer token).
//
// Can be upgraded to JWT by swapping the check here — no route changes needed.
//
// Set ADMIN_API_KEY in .env. If not set, falls back to a dev-only default
// and logs a warning on startup.

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key-change-me';

const adminAuthPlugin = async (fastify) => {
  if (!process.env.ADMIN_API_KEY) {
    fastify.log.warn(
      'ADMIN_API_KEY not set — using insecure dev default. Set it in .env before deploying.'
    );
  }

  // Decorate with a reusable preHandler function
  fastify.decorate('verifyAdminKey', async (req, reply) => {
    const header = req.headers['x-admin-key'] ?? '';
    const bearer = (req.headers['authorization'] ?? '').replace(/^Bearer\s+/i, '');
    const provided = header || bearer;

    if (!provided || provided !== ADMIN_KEY) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing admin key' },
      });
    }
  });
};

module.exports = fp(adminAuthPlugin, { name: 'admin-auth' });
