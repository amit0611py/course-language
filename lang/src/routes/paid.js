'use strict';

// ── /v1/paid/* ────────────────────────────────────────────────────────────────
// All routes here return content gated by content_tier.
// isPremium is read from the X-Premium-Token header (simple token for now).
// Swap this with JWT verification when auth is added.
//
// Free users:
//   - interview questions: question visible, answer = null, answer_snippet shown, is_locked=true
//   - coding challenges:   problem visible, solution/tests = null, is_locked=true
//   - videos:              thumbnail visible, cdn_url = null, is_locked=true
//   - project architecture: null (404)
//
// Premium users: full content returned.

const paidRepo = require('../repositories/paid.repo');

// ── Simple premium check ──────────────────────────────────────────────────────
// Replace this function when you add real JWT auth.
// For now: any non-empty X-Premium-Token header marks user as premium.
// The actual token validation should happen in a plugin.
function getIsPremium(req) {
  const token = req.headers['x-premium-token'] ?? '';
  // In production: verify token against DB/Redis session
  // For now: any truthy token = premium (replace before launch!)
  return token.length > 0;
}

module.exports = async (fastify) => {

  // ── GET /v1/paid/interviews/:languageSlug ────────────────────────────────
  fastify.get('/interviews/:languageSlug', {
    schema: {
      params: {
        type: 'object',
        required: ['languageSlug'],
        properties: { languageSlug: { type: 'string', pattern: '^[a-z0-9-]+$' } },
      },
    },
  }, async (req) => {
    const { languageSlug } = req.params;
    const isPremium = getIsPremium(req);
    const questions = await paidRepo.findInterviewsByLanguage(
      fastify.db, languageSlug, isPremium
    );
    return { isPremium, questions };
  });

  // ── GET /v1/paid/coding/:languageSlug ────────────────────────────────────
  fastify.get('/coding/:languageSlug', {
    schema: {
      params: {
        type: 'object',
        required: ['languageSlug'],
        properties: { languageSlug: { type: 'string', pattern: '^[a-z0-9-]+$' } },
      },
    },
  }, async (req) => {
    const { languageSlug } = req.params;
    const isPremium = getIsPremium(req);
    const challenges = await paidRepo.findCodingChallengesByLanguage(
      fastify.db, languageSlug, isPremium
    );
    return { isPremium, challenges };
  });

  // ── GET /v1/paid/videos/:contentType/:contentId ──────────────────────────
  // contentType: 'topic' | 'project'
  fastify.get('/videos/:contentType/:contentId', {
    schema: {
      params: {
        type: 'object',
        required: ['contentType', 'contentId'],
        properties: {
          contentType: { type: 'string', enum: ['topic', 'project'] },
          contentId:   { type: 'string', format: 'uuid' },
        },
      },
    },
  }, async (req) => {
    const { contentType, contentId } = req.params;
    const isPremium = getIsPremium(req);
    const videos = await paidRepo.findVideosByContent(
      fastify.db, contentId, contentType, isPremium
    );
    return { isPremium, videos };
  });

  // ── GET /v1/paid/project-architecture/:projectId ─────────────────────────
  fastify.get('/project-architecture/:projectId', {
    schema: {
      params: {
        type: 'object',
        required: ['projectId'],
        properties: { projectId: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (req, reply) => {
    const { projectId } = req.params;
    const isPremium = getIsPremium(req);

    if (!isPremium) {
      // Return lock signal, not 401, so frontend can show lock UI
      const hasArch = await paidRepo.hasProjectArchitecture(fastify.db, projectId);
      return { isPremium: false, is_locked: true, has_architecture: hasArch, architecture: null };
    }

    const architecture = await paidRepo.findProjectArchitecture(
      fastify.db, projectId, true
    );
    return { isPremium: true, is_locked: false, architecture };
  });

  // ── GET /v1/paid/plans ───────────────────────────────────────────────────────
  // Public endpoint — returns active plans so the learner app can show upgrade options.
  fastify.get('/plans', async () => {
    const { rows } = await fastify.db.query(`
      SELECT id, name, plan_type, language_slug, price_inr, price_usd,
             duration_days, features, sort_order
      FROM   subscription_plans
      WHERE  is_active = true
      ORDER  BY sort_order ASC, price_inr ASC
    `);
    return { plans: rows };
  });
};
