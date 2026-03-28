'use strict';

// ── Bulk APIs — ONE call does EVERYTHING ──────────────────────────────────────
//
// POST /v1/admin/bulk/topic
//   What it does automatically in one call:
//   1. Creates the section if it doesn't exist (reads language from path)
//   2. Saves the topic + all blocks
//   3. Extracts quiz questions → quiz_questions table
//   4. Extracts mermaid diagrams → diagrams table
//   5. Flushes topic cache + nav cache + language cache
//   You never need to call /languages/:slug/sections or /cache/flush separately.
//
// POST /v1/admin/bulk/language
//   What it does automatically in one call:
//   1. Creates or updates the language
//   2. Creates all sections
//   3. Saves all topics (sorted by depth so parents exist before children)
//   4. Extracts all quizzes and diagrams
//   5. Flushes entire cache for the language
//   You never need any other API call.

const topicAdminService = require('../services/topic.admin.service');
const langRepo          = require('../../repositories/language.repo');
const sectionRepo       = require('../../repositories/section.repo');
const cache             = require('../../services/cache.service');
const { KEYS, PATTERNS } = require('../../utils/cacheKeys');
const {
  isValidPath, getParentPath, getSlug, getDepth,
} = require('../../utils/pathUtils');
const { BadRequestError } = require('../../utils/errors');

module.exports = async (fastify) => {
  const auth = { preHandler: [fastify.verifyAdminKey] };

  // ── POST /v1/admin/bulk/topic ─────────────────────────────────────────────
  //
  // Single call to insert/update a topic with any section and all blocks.
  // If the section slug in "section" field doesn't exist it is auto-created.
  // Cache is flushed at the end — no manual flush needed.
  //
  // Body:
  // {
  //   "path":          "java.dsa.arrays",       <- required. first segment = language slug
  //   "title":         "Arrays in DSA",         <- required
  //   "section":       "dsa",                   <- optional. auto-created if missing
  //   "sectionTitle":  "Data Structures & Algorithms", <- used only when auto-creating
  //   "sectionOrder":  4,                       <- sort_order for new section (default 99)
  //   "difficulty":    "beginner",
  //   "estimatedMins": 15,
  //   "tags":          ["java","dsa"],
  //   "isDeepDive":    false,
  //   "isPublished":   true,
  //   "sortOrder":     1,
  //   "blocks":        [...]
  // }

  fastify.post('/topic', auth, async (req, reply) => {
    const body = req.body ?? {};
    const { path, blocks, section, sectionTitle, sectionOrder, ...metaFields } = body;

    if (!path)                  throw new BadRequestError('path is required');
    if (!isValidPath(path))     throw new BadRequestError(`Invalid path: ${path}`);
    if (!Array.isArray(blocks)) throw new BadRequestError('blocks must be an array');

    const langSlug = path.split('.')[0];
    const created  = { section: null };

    // ── Step 1: auto-create section if provided but missing ───────────────
    if (section) {
      await ensureSection(fastify.db, langSlug, {
        slug:        section,
        title:       sectionTitle ?? titleCase(section),
        sortOrder:   sectionOrder ?? 99,
      });
      created.section = section;
    }

    // ── Step 2: save topic + blocks (extracts quizzes + diagrams inside) ──
    const meta   = buildMeta(path, { ...metaFields, section });
    const result = await topicAdminService.saveTopic(
      fastify.db, fastify.redis, { meta, blocks }
    );

    // ── Step 3: flush topic + nav + language cache ────────────────────────
    await flushAll(fastify.redis, langSlug, path);

    return reply.status(201).send({
      ok:             true,
      path:           result.path,
      id:             result.id,
      blocks:         blocks.length,
      sectionCreated: created.section,
      cacheFlushes:   [`topic:${path}`, `nav:${langSlug}`, `lang:all`],
    });
  });

  // ── POST /v1/admin/bulk/language ──────────────────────────────────────────
  //
  // Single call to insert/update an entire language — sections + all topics.
  // Sections are auto-created. Cache is fully flushed at the end.
  // Send as many topics as you want — they are all processed in one request.
  //
  // Body:
  // {
  //   "language": {
  //     "slug":        "java",
  //     "name":        "Java",
  //     "description": "...",
  //     "iconUrl":     "/icons/java.svg",
  //     "sortOrder":   1,
  //     "meta":        { "color": "#f59e0b", "tagline": "Write once, run anywhere" }
  //   },
  //   "sections": [                        <- optional, auto-created from topic section fields too
  //     { "slug": "dsa", "title": "Data Structures & Algorithms", "sortOrder": 4 }
  //   ],
  //   "topics": [
  //     {
  //       "path":    "java.dsa.arrays",
  //       "title":   "Arrays in DSA",
  //       "section": "dsa",              <- section auto-created if not in sections[] above
  //       "blocks":  [...]
  //     }
  //   ]
  // }

  fastify.post('/language', auth, async (req, reply) => {
    const { language, sections = [], topics = [] } = req.body ?? {};

    if (!language?.slug) throw new BadRequestError('language.slug is required');
    if (!language?.name) throw new BadRequestError('language.name is required');

    const results = {
      language:        null,
      sectionsCreated: [],
      topics:          [],
      errors:          [],
    };

    // ── Step 1: upsert language ───────────────────────────────────────────
    const lang = await langRepo.upsert(fastify.db, {
      slug:        language.slug,
      name:        language.name,
      icon_url:    language.iconUrl     ?? null,
      description: language.description ?? null,
      meta:        language.meta        ?? {},
      sort_order:  language.sortOrder   ?? 0,
    });
    results.language = { slug: lang.slug, id: lang.id };

    // ── Step 2: upsert explicitly listed sections ─────────────────────────
    for (const sec of sections) {
      if (!sec.slug || !sec.title) {
        results.errors.push(`Section skipped — missing slug or title: ${JSON.stringify(sec)}`);
        continue;
      }
      await sectionRepo.upsert(fastify.db, lang.id, {
        slug:        sec.slug,
        title:       sec.title,
        description: sec.description ?? null,
        sort_order:  sec.sortOrder   ?? 0,
        meta:        sec.meta        ?? {},
      });
      if (!results.sectionsCreated.includes(sec.slug)) {
        results.sectionsCreated.push(sec.slug);
      }
    }

    // ── Step 3: collect all unique sections referenced by topics and
    //           auto-create any that weren't in the sections[] array ────────
    for (const t of topics) {
      if (!t.section) continue;
      if (results.sectionsCreated.includes(t.section)) continue;
      await ensureSection(fastify.db, language.slug, {
        slug:      t.section,
        title:     t.sectionTitle ?? titleCase(t.section),
        sortOrder: t.sectionOrder ?? 99,
      });
      results.sectionsCreated.push(t.section);
    }

    // ── Step 4: upsert all topics sorted by depth (parents before children) 
    const sorted = [...topics].sort((a, b) =>
      (a.path ?? '').split('.').length - (b.path ?? '').split('.').length
    );

    for (const t of sorted) {
      const { path, blocks = [], section, sectionTitle, sectionOrder, ...metaFields } = t;
      if (!path || !isValidPath(path)) {
        results.errors.push(`Topic skipped — invalid path: ${path}`);
        continue;
      }
      try {
        const meta   = buildMeta(path, { ...metaFields, section });
        const result = await topicAdminService.saveTopic(
          fastify.db, fastify.redis, { meta, blocks }
        );
        results.topics.push(result.path);
      } catch (err) {
        results.errors.push(`Topic ${path}: ${err.message}`);
      }
    }

    // ── Step 5: flush entire language cache ───────────────────────────────
    await Promise.all([
      cache.delPattern(fastify.redis, PATTERNS.allTopics()),
      cache.del(fastify.redis, KEYS.nav(language.slug)),
      cache.del(fastify.redis, KEYS.language()),
    ]);

    const status = results.errors.length ? 207 : 201;
    return reply.status(status).send({
      ok: results.errors.length === 0,
      ...results,
      cacheFlushes: ['all-topics', `nav:${language.slug}`, 'lang:all'],
    });
  });
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// Ensure a section exists — upsert by slug under the given language.
// Looks up language id first, then upserts section. Safe to call multiple times.
async function ensureSection(db, langSlug, { slug, title, sortOrder = 99 }) {
  // Resolve language id from slug
  const { rows } = await db.query(
    'SELECT id FROM languages WHERE slug = $1 AND is_active = true',
    [langSlug]
  );
  if (!rows[0]) return; // language doesn't exist yet — skip silently

  await db.query(`
    INSERT INTO sections (language_id, slug, title, sort_order, meta)
    VALUES ($1, $2, $3, $4, '{}')
    ON CONFLICT (language_id, slug) DO UPDATE SET
      title      = EXCLUDED.title,
      sort_order = EXCLUDED.sort_order,
      updated_at = now()
  `, [rows[0].id, slug, title, sortOrder]);
}

// Flush topic + nav + language cache in parallel
async function flushAll(redis, langSlug, topicPath) {
  await Promise.all([
    cache.del(redis, KEYS.topic(topicPath)),
    cache.del(redis, KEYS.nav(langSlug)),
    cache.del(redis, KEYS.language()),
  ]);
}

// Build normalised meta object expected by topicAdminService.saveTopic
function buildMeta(path, fields) {
  return {
    path,
    parentPath:    getParentPath(path),
    depth:         getDepth(path),
    slug:          getSlug(path),
    title:         fields.title         ?? getSlug(path),
    section:       fields.section       ?? fields.sectionSlug ?? null,
    difficulty:    fields.difficulty    ?? 'beginner',
    estimatedMins: fields.estimatedMins ?? 5,
    tags:          fields.tags          ?? [],
    isDeepDive:    fields.isDeepDive    ?? getDepth(path) >= 2,
    sortOrder:     fields.sortOrder     ?? 0,
    isPublished:   fields.isPublished   ?? true,
    meta:          fields.meta          ?? {},
  };
}

// "core-language" → "Core Language"
function titleCase(slug) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}