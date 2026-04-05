'use strict';

// ── /v1/admin/paid/* ──────────────────────────────────────────────────────────
// Content tier management + user/subscription CRUD + interview/coding/video CRUD

const cache         = require('../../services/cache.service');
const { KEYS, PATTERNS } = require('../../utils/cacheKeys');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // ── Flush nav + topic cache for a language after tier changes ─────────────
  async function flushLangCache(langSlug) {
    await Promise.all([
      cache.delPattern(fastify.redis, PATTERNS.allTopics()),
      cache.del(fastify.redis, KEYS.nav(langSlug)),
      cache.del(fastify.redis, KEYS.language()),
    ]);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CONTENT TIER MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  // POST /v1/admin/paid/bulk-tier
  // { paths: string[], tier: 'free'|'premium' }
  fastify.post('/bulk-tier', auth, async (req) => {
    const { paths, tier } = req.body;
    const { rowCount } = await fastify.db.query(
      `UPDATE topics SET content_tier = $1, updated_at = now() WHERE path = ANY($2::text[])`,
      [tier, paths]
    );
    // Flush cache for all affected language slugs
    const langSlugs = [...new Set((paths ?? []).map(p => p.split('.')[0]))];
    await Promise.all(langSlugs.map(slug => flushLangCache(slug)));
    return { updated: rowCount, tier };
  });

  // POST /v1/admin/paid/tier-by-language
  // { languageSlug, tier, sectionSlug?, topicPath?, setLanguage? }
  fastify.post('/tier-by-language', auth, async (req) => {
    const { languageSlug, tier, sectionSlug, topicPath, setLanguage } = req.body;
    let result;

    if (topicPath) {
      result = await fastify.db.query(
        `UPDATE topics SET content_tier=$1, updated_at=now()
         WHERE (path = $2 OR path LIKE $3)`,
        [tier, topicPath, `${topicPath}.%`]
      );
    } else if (sectionSlug) {
      result = await fastify.db.query(
        `UPDATE topics t SET content_tier=$1, updated_at=now()
         FROM languages l, sections s
         WHERE t.language_id=l.id AND t.section_id=s.id AND l.slug=$2 AND s.slug=$3`,
        [tier, languageSlug, sectionSlug]
      );
    } else if (languageSlug) {
      if (setLanguage) {
        result = await fastify.db.query(
          `UPDATE languages SET content_tier=$1, updated_at=now() WHERE slug=$2`,
          [tier, languageSlug]
        );
      } else {
        result = await fastify.db.query(
          `UPDATE topics t SET content_tier=$1, updated_at=now()
           FROM languages l WHERE t.language_id=l.id AND l.slug=$2`,
          [tier, languageSlug]
        );
      }
    }

    // Always flush cache for the affected language
    if (languageSlug) await flushLangCache(languageSlug);

    return { updated: result?.rowCount ?? 0, tier };
  });

  // ── Cascading dropdown data ───────────────────────────────────────────────

  // GET /v1/admin/paid/sections/:languageSlug
  fastify.get('/sections/:languageSlug', auth, async (req) => {
    const { rows } = await fastify.db.query(`
      SELECT s.id, s.slug, s.title, s.sort_order
      FROM sections s JOIN languages l ON l.id=s.language_id
      WHERE l.slug=$1 AND s.is_active=true
      ORDER BY s.sort_order ASC
    `, [req.params.languageSlug]);
    return { sections: rows };
  });

  // GET /v1/admin/paid/topics-tree/:languageSlug?sectionSlug=&parentPath=
  // Supports unlimited depth: pass parentPath to get children of any node
  fastify.get('/topics-tree/:languageSlug', auth, async (req) => {
    const { sectionSlug, parentPath } = req.query;
    const conditions = ['l.slug = $1', 't.is_published = true'];
    const params = [req.params.languageSlug];
    let p = 2;

    if (sectionSlug) {
      conditions.push(`s.slug = $${p++}`); params.push(sectionSlug);
    }
    if (parentPath) {
      conditions.push(`t.parent_path = $${p++}`); params.push(parentPath);
    } else if (!sectionSlug) {
      conditions.push(`t.depth = 1`);
    }

    const { rows } = await fastify.db.query(`
      SELECT t.id, t.path, t.slug, t.title, t.depth, t.parent_path,
             t.content_tier, t.sort_order, t.is_deep_dive,
             s.slug AS section_slug
      FROM topics t
      JOIN languages l ON l.id=t.language_id
      LEFT JOIN sections s ON s.id=t.section_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.sort_order ASC, t.title ASC
    `, params);
    return { topics: rows };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION PLANS CRUD
  // ══════════════════════════════════════════════════════════════════════════

  // GET /v1/admin/paid/plans
  fastify.get('/plans', auth, async () => {
    const { rows } = await fastify.db.query(`
      SELECT sp.*, l.name AS language_name
      FROM subscription_plans sp
      LEFT JOIN languages l ON l.id = sp.language_id
      ORDER BY sp.sort_order ASC, sp.created_at DESC
    `);
    return { plans: rows };
  });

  // POST /v1/admin/paid/plans
  fastify.post('/plans', auth, async (req, reply) => {
    const b = req.body;
    let langId = null; let langSlug = null;
    if (b.languageSlug) {
      const { rows: [l] } = await fastify.db.query('SELECT id, slug FROM languages WHERE slug=$1', [b.languageSlug]);
      langId = l?.id ?? null; langSlug = l?.slug ?? null;
    }
    const { rows: [plan] } = await fastify.db.query(`
      INSERT INTO subscription_plans
        (name, plan_type, language_id, language_slug, price_inr, price_usd, duration_days, features, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
      RETURNING *
    `, [b.name, b.plan_type, langId, langSlug, b.price_inr??null, b.price_usd??null,
        b.duration_days??null, JSON.stringify(b.features??{}), b.sort_order??0]);
    return reply.status(201).send({ plan });
  });

  // PUT /v1/admin/paid/plans/:id
  fastify.put('/plans/:id', auth, async (req) => {
    const { id } = req.params; const b = req.body;
    const { rows: [plan] } = await fastify.db.query(`
      UPDATE subscription_plans SET
        name=$2, plan_type=$3, price_inr=$4, price_usd=$5,
        duration_days=$6, features=$7::jsonb, is_active=$8, sort_order=$9, updated_at=now()
      WHERE id=$1 RETURNING *
    `, [id, b.name, b.plan_type, b.price_inr, b.price_usd,
        b.duration_days, JSON.stringify(b.features??{}), b.is_active??true, b.sort_order??0]);
    return { plan };
  });

  // DELETE /v1/admin/paid/plans/:id (soft)
  fastify.delete('/plans/:id', auth, async (req) => {
    await fastify.db.query('UPDATE subscription_plans SET is_active=false WHERE id=$1', [req.params.id]);
    return { deleted: true };
  });

  // POST /v1/admin/paid/plans/:planId/generate-token
  // Creates unattached subscription rows with activation_token.
  // Admin shares token with user; user calls /v1/auth/activate-token.
  fastify.post('/plans/:planId/generate-token', auth, async (req, reply) => {
    const { planId } = req.params;
    const { quantity = 1 } = req.body ?? {};
    const { rows: [plan] } = await fastify.db.query('SELECT * FROM subscription_plans WHERE id=$1', [planId]);
    if (!plan) return reply.status(404).send({ error: { message: 'Plan not found' } });

    const tokens = [];

    for (let i = 0; i < Math.min(quantity, 50); i++) {
      const token  = require('crypto').randomBytes(16).toString('hex');
      const endsAt = plan.duration_days
        ? new Date(Date.now() + plan.duration_days * 86400 * 1000)
        : null;
      // user_id is NULL — will be set when the user claims the token
      await fastify.db.query(`
        INSERT INTO user_subscriptions
          (user_id, plan_id, plan_type, language_slug, price_paid, currency,
           ends_at, is_active, payment_status, activation_token)
        VALUES (NULL,$1,$2,$3,$4,$5,$6,false,'completed',$7)
      `, [planId, plan.plan_type, plan.language_slug,
          plan.price_inr ?? 0, 'INR', endsAt, token]);
      tokens.push(token);
    }
    return { tokens, plan: { name: plan.name, type: plan.plan_type } };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // USER MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════

  // GET /v1/admin/paid/users?search=&isPremium=&limit=&offset=
  fastify.get('/users', auth, async (req) => {
    const { search, isPremium, limit = 50, offset = 0 } = req.query;
    const conditions = ['1=1']; const params = []; let p = 1;
    if (search) { conditions.push(`(u.email ILIKE $${p} OR u.full_name ILIKE $${p} OR u.mobile_number ILIKE $${p} OR u.customer_id ILIKE $${p})`); params.push(`%${search}%`); p++; }
    if (isPremium !== undefined) { conditions.push(`u.is_premium = $${p++}`); params.push(isPremium === 'true'); }
    params.push(Number(limit)); params.push(Number(offset));
    const { rows } = await fastify.db.query(`
      SELECT u.id, u.customer_id, u.email, u.mobile_number, u.full_name,
             u.email_verified, u.mobile_verified,
             u.is_premium, u.premium_scope,
             u.premium_language_slugs, u.is_active, u.created_at, u.last_login_at,
             (SELECT COUNT(*)::int FROM user_subscriptions WHERE user_id=u.id AND is_active=true) AS active_subs
      FROM users u
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_at DESC
      LIMIT $${p} OFFSET $${p+1}
    `, params);
    const { rows: [ct] } = await fastify.db.query(
      `SELECT COUNT(*)::int AS total FROM users u WHERE ${conditions.join(' AND ')}`,
      params.slice(0, -2)
    );
    return { users: rows, total: ct.total };
  });

  // GET /v1/admin/paid/users/:id
  fastify.get('/users/:id', auth, async (req) => {
    const { rows: [user] } = await fastify.db.query(`
      SELECT u.id, u.customer_id, u.email, u.mobile_number, u.full_name,
             u.email_verified, u.mobile_verified,
             u.is_premium, u.premium_scope,
             u.premium_language_slugs, u.is_active, u.created_at, u.last_login_at, u.meta
      FROM users u WHERE u.id=$1
    `, [req.params.id]);
    if (!user) return reply.status(404).send({ error: { message: 'User not found' } });
    const { rows: subs } = await fastify.db.query(`
      SELECT us.*, sp.name AS plan_name
      FROM user_subscriptions us
      JOIN subscription_plans sp ON sp.id=us.plan_id
      WHERE us.user_id=$1 ORDER BY us.created_at DESC
    `, [req.params.id]);
    return { user, subscriptions: subs };
  });

  // PATCH /v1/admin/paid/users/:id
  fastify.patch('/users/:id', auth, async (req) => {
    const { id } = req.params;
    const { isActive, isPremium } = req.body;
    const sets = ['updated_at=now()']; const params = [id]; let p = 2;
    if (isActive !== undefined) { sets.push(`is_active=$${p++}`); params.push(isActive); }
    if (isPremium !== undefined) { sets.push(`is_premium=$${p++}`); params.push(isPremium); }
    const { rows: [user] } = await fastify.db.query(
      `UPDATE users SET ${sets.join(',')} WHERE id=$1 RETURNING id, email, is_premium, is_active`,
      params
    );
    return { user };
  });

  // POST /v1/admin/paid/users/:id/grant-subscription
  fastify.post('/users/:id/grant-subscription', auth, async (req, reply) => {
    const { id: userId } = req.params;
    const { planId } = req.body;
    const { rows: [plan] } = await fastify.db.query('SELECT * FROM subscription_plans WHERE id=$1', [planId]);
    if (!plan) return reply.status(404).send({ error: { message: 'Plan not found' } });
    const endsAt = plan.duration_days
      ? new Date(Date.now() + plan.duration_days * 86400 * 1000) : null;
    const { rows: [sub] } = await fastify.db.query(`
      INSERT INTO user_subscriptions
        (user_id, plan_id, plan_type, language_slug, price_paid, currency,
         ends_at, is_active, payment_status)
      VALUES ($1,$2,$3,$4,0,'INR',$5,true,'completed') RETURNING *
    `, [userId, planId, plan.plan_type, plan.language_slug ?? null, endsAt]);
    const { rows: [user] } = await fastify.db.query(
      'SELECT id, email, is_premium, premium_scope, premium_language_slugs FROM users WHERE id=$1',
      [userId]
    );
    return { subscription: sub, user };
  });

  // DELETE /v1/admin/paid/users/:id/subscriptions/:subId
  fastify.delete('/users/:id/subscriptions/:subId', auth, async (req) => {
    await fastify.db.query(
      'UPDATE user_subscriptions SET is_active=false, updated_at=now() WHERE id=$1 AND user_id=$2',
      [req.params.subId, req.params.id]
    );
    return { revoked: true };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // INTERVIEW QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════

  fastify.get('/interviews', auth, async (req) => {
    const { languageSlug, search } = req.query;
    const conds = ['iq.is_published=true']; const params = []; let p = 1;
    if (languageSlug) { conds.push(`l.slug=$${p++}`); params.push(languageSlug); }
    if (search) { conds.push(`iq.question ILIKE $${p++}`); params.push(`%${search}%`); }
    const { rows } = await fastify.db.query(
      `SELECT iq.*, l.slug AS language_slug FROM interview_questions iq
       JOIN languages l ON l.id=iq.language_id WHERE ${conds.join(' AND ')}
       ORDER BY iq.sort_order ASC`, params
    );
    return { questions: rows, total: rows.length };
  });

  fastify.post('/interviews', auth, async (req, reply) => {
    const b = req.body;
    const { rows: [l] } = await fastify.db.query('SELECT id FROM languages WHERE slug=$1', [b.languageSlug]);
    if (!l) return reply.status(404).send({ error: { message: 'Language not found' } });
    const { rows: [q] } = await fastify.db.query(`
      INSERT INTO interview_questions
        (language_id, question, answer, answer_snippet, difficulty, category, tags, content_tier, estimated_mins, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8,$9,$10) RETURNING *
    `, [l.id, b.question, b.answer, b.answer_snippet??null,
        b.difficulty??'intermediate', b.category??'technical',
        b.tags??[], b.content_tier??'premium', b.estimated_mins??5, b.sort_order??0]);
    return reply.status(201).send({ question: q });
  });

  fastify.put('/interviews/:id', auth, async (req) => {
    const b = req.body;
    const { rows: [q] } = await fastify.db.query(`
      UPDATE interview_questions SET question=COALESCE($2,question), answer=COALESCE($3,answer),
        answer_snippet=$4, difficulty=COALESCE($5,difficulty), category=COALESCE($6,category),
        tags=COALESCE($7::text[],tags), content_tier=COALESCE($8,content_tier), updated_at=now()
      WHERE id=$1 RETURNING *
    `, [req.params.id, b.question, b.answer, b.answer_snippet??null, b.difficulty, b.category, b.tags, b.content_tier]);
    return { question: q };
  });

  fastify.delete('/interviews/:id', auth, async (req) => {
    await fastify.db.query('DELETE FROM interview_questions WHERE id=$1', [req.params.id]);
    return { deleted: true };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CODING CHALLENGES
  // ══════════════════════════════════════════════════════════════════════════

  fastify.get('/coding', auth, async (req) => {
    const { languageSlug, search } = req.query;
    const conds = ['cc.is_published=true']; const params = []; let p = 1;
    if (languageSlug) { conds.push(`l.slug=$${p++}`); params.push(languageSlug); }
    if (search) { conds.push(`cc.title ILIKE $${p++}`); params.push(`%${search}%`); }
    const { rows } = await fastify.db.query(
      `SELECT cc.*, l.slug AS language_slug FROM coding_challenges cc
       JOIN languages l ON l.id=cc.language_id WHERE ${conds.join(' AND ')}
       ORDER BY cc.sort_order ASC`, params
    );
    return { challenges: rows, total: rows.length };
  });

  fastify.post('/coding', auth, async (req, reply) => {
    const b = req.body;
    const { rows: [l] } = await fastify.db.query('SELECT id FROM languages WHERE slug=$1', [b.languageSlug]);
    if (!l) return reply.status(404).send({ error: { message: 'Language not found' } });
    const { rows: [c] } = await fastify.db.query(`
      INSERT INTO coding_challenges
        (language_id, title, slug, description, difficulty, problem_statement,
         starter_code, solution, test_cases, hints, tags, content_tier, estimated_mins, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::text[],$12,$13,$14)
      RETURNING *
    `, [l.id, b.title, b.slug, b.description??'', b.difficulty??'medium',
        JSON.stringify(b.problem_statement??{}), JSON.stringify(b.starter_code??{}),
        JSON.stringify(b.solution??{}), JSON.stringify(b.test_cases??[]),
        JSON.stringify(b.hints??[]), b.tags??[], b.content_tier??'premium',
        b.estimated_mins??30, b.sort_order??0]);
    return reply.status(201).send({ challenge: c });
  });

  fastify.delete('/coding/:slug', auth, async (req) => {
    await fastify.db.query('DELETE FROM coding_challenges WHERE slug=$1', [req.params.slug]);
    return { deleted: true };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // VIDEOS
  // ══════════════════════════════════════════════════════════════════════════

  fastify.get('/videos', auth, async () => {
    const { rows } = await fastify.db.query(
      `SELECT * FROM video_content WHERE is_published=true ORDER BY created_at DESC`
    );
    return { videos: rows, total: rows.length };
  });

  fastify.post('/videos', auth, async (req, reply) => {
    const b = req.body;
    const { rows: [v] } = await fastify.db.query(`
      INSERT INTO video_content
        (content_id, content_type, title, cdn_url, thumbnail_url, duration_seconds, content_tier, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [b.content_id, b.content_type, b.title, b.cdn_url,
        b.thumbnail_url??null, b.duration_seconds??null,
        b.content_tier??'premium', b.sort_order??0]);
    return reply.status(201).send({ video: v });
  });

  fastify.put('/videos/:id', auth, async (req) => {
    const b = req.body;
    const { rows: [v] } = await fastify.db.query(`
      UPDATE video_content SET title=COALESCE($2,title), cdn_url=COALESCE($3,cdn_url),
        thumbnail_url=$4, duration_seconds=$5, content_tier=COALESCE($6,content_tier), updated_at=now()
      WHERE id=$1 RETURNING *
    `, [req.params.id, b.title, b.cdn_url, b.thumbnail_url??null, b.duration_seconds??null, b.content_tier]);
    return { video: v };
  });

  fastify.delete('/videos/:id', auth, async (req) => {
    await fastify.db.query('DELETE FROM video_content WHERE id=$1', [req.params.id]);
    return { deleted: true };
  });
};
