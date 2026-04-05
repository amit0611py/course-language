'use strict';

const fp = require('fastify-plugin');

const SESSION_DAYS = 7;

const userAuthPlugin = async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.decorate('verifyAuth', async (req, _reply) => {
    const token = req.headers['x-auth-token'] ?? '';
    if (!token) return;

    const { rows } = await fastify.db.query(`
      SELECT
        u.id, u.customer_id, u.email, u.mobile_number, u.full_name,
        u.email_verified, u.mobile_verified,
        u.is_premium, u.premium_scope, u.premium_language_slugs,
        u.is_active, s.id AS session_id
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token      = $1
        AND s.is_active  = true
        AND s.expires_at > now()
        AND u.is_active  = true
    `, [token]);

    if (!rows.length) return;

    const u = rows[0];
    req.user = {
      id:                   u.id,
      customerId:           u.customer_id,
      email:                u.email ?? null,
      mobile:               u.mobile_number ?? null,
      fullName:             u.full_name,
      emailVerified:        u.email_verified,
      mobileVerified:       u.mobile_verified,
      isPremium:            u.is_premium,
      premiumScope:         u.premium_scope,
      premiumLanguageSlugs: u.premium_language_slugs ?? [],
    };

    // Roll the session forward on every authenticated request (7-day sliding window)
    // Fire-and-forget — don't await so we don't add latency to every request
    const newExpiry = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
    fastify.db.query(
      `UPDATE user_sessions SET expires_at=$1, last_used_at=now() WHERE id=$2`,
      [newExpiry, u.session_id]
    ).catch(() => {}); // swallow errors silently
  });

  fastify.decorate('requireAuth', async (req, reply) => {
    await fastify.verifyAuth(req, reply);
    if (!req.user) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Valid authentication token required' },
      });
    }
  });
};

module.exports = fp(userAuthPlugin, { name: 'user-auth' });
