'use strict';

const topicRepo   = require('../repositories/topic.repo');
const quizRepo    = require('../repositories/quiz.repo');
const diagramRepo = require('../repositories/diagram.repo');
const cache       = require('./cache.service');
const { KEYS }    = require('../utils/cacheKeys');
const { NotFoundError } = require('../utils/errors');
const { canAccess, gateBlocks } = require('../utils/accessControl');
const config      = require('../config');

// ── Main entry ────────────────────────────────────────────────────────────────
// user = req.user (null for anonymous). Authenticated requests bypass cache
// because locked/unlocked content differs per user.

const getTopicContent = async (db, redis, path, user = null) => {
  if (user) return loadTopicContent(db, path, user);
  return cache.getOrSet(
    redis,
    KEYS.topic(path),
    config.cache.ttl.topic,
    () => loadTopicContent(db, path, null)
  );
};

const loadTopicContent = async (db, path, user) => {
  const topic = await topicRepo.findByPath(db, path);
  if (!topic) throw new NotFoundError(`Topic not found: ${path}`);

  const langSlug  = topic.language_slug;
  const tierTopic = topic.content_tier ?? 'free';
  const tierLang  = topic.language_tier ?? 'free';

  // Topic is locked when EITHER the language tier OR the topic tier is premium
  // and the user doesn't have the right subscription.
  const hasAccess = canAccess(user, tierLang, langSlug) &&
                    canAccess(user, tierTopic, langSlug);
  const isLocked  = !hasAccess;

  const breadcrumbPaths = [...(topic.ancestor_paths ?? []), path];

  const [rawBlocks, breadcrumb, children] = await Promise.all([
    enrichBlocks(db, topic.blocks),
    topicRepo.findBreadcrumb(db, breadcrumbPaths),
    topicRepo.findChildren(db, path),
  ]);

  const blocks = isLocked ? gateBlocks(rawBlocks, user, langSlug) : rawBlocks;

  return {
    topic: {
      id:            topic.id,
      path:          topic.path,
      title:         topic.title,
      difficulty:    topic.difficulty,
      estimatedMins: topic.estimated_mins,
      tags:          topic.tags,
      isDeepDive:    topic.is_deep_dive,
      languageSlug:  langSlug,
      sectionSlug:   topic.section_slug,
      sectionTitle:  topic.section_title,
      meta:          topic.meta,
      contentTier:   tierTopic,
      languageTier:  tierLang,
      isLocked,
      isPremium:     tierTopic === 'premium' || tierLang === 'premium',
    },
    breadcrumb: breadcrumb.map(formatCrumb),
    children:   children.map(c => formatChild(c, user, langSlug)),
    blocks,
  };
};

// ── Block enrichment ─────────────────────────────────────────────────────────
const enrichBlocks = async (db, blocks) => {
  const quizKeys = blocks
    .filter((b) => b.type === 'quiz' && b.data?.questionId)
    .map((b) => b.data.questionId);

  const diagramKeys = blocks
    .filter((b) => b.type === 'diagram' && b.data?.diagramKey)
    .map((b) => b.data.diagramKey);

  const [questions, diagrams] = await Promise.all([
    quizKeys.length    ? quizRepo.findByKeys(db, quizKeys)       : [],
    diagramKeys.length ? diagramRepo.findByKeys(db, diagramKeys) : [],
  ]);

  const qMap = new Map(questions.map((q) => [q.question_key, q]));
  const dMap = new Map(diagrams.map((d)  => [d.diagram_key,  d]));

  return blocks.map((block) => {
    if (block.type === 'quiz') {
      const q = qMap.get(block.data.questionId);
      if (!q) return block;
      const opts = (q.options ?? []);
      const isObjectFormat = opts.length > 0 && typeof opts[0] === 'object';
      let normalizedQuestion;
      if (isObjectFormat) {
        normalizedQuestion = {
          q:       q.question_text,
          opts:    opts.map((o) => o.text ?? String(o)),
          correct: opts.findIndex((o) => o.correct === true),
          exp:     q.explanation ?? '',
        };
        if (normalizedQuestion.correct < 0) normalizedQuestion.correct = 0;
      } else {
        normalizedQuestion = { q: q.question_text, opts, correct: 0, exp: q.explanation ?? '' };
      }
      return {
        ...block,
        data: {
          ...block.data,
          questions: [normalizedQuestion],
          _meta: {
            id:           q.id,
            questionKey:  q.question_key,
            questionType: q.question_type,
            difficulty:   q.difficulty,
          },
        },
      };
    }

    if (block.type === 'diagram') {
      const d = dMap.get(block.data.diagramKey);
      if (!d) return block;
      return {
        ...block,
        data: {
          title:       block.data.title ?? d.title ?? null,
          diagramKey:  d.diagram_key,
          diagramType: d.type,
          svg:         d.type === 'svg'     ? (d.data.svg ?? null)    : null,
          mermaid:     d.type === 'mermaid' ? (d.data.source ?? null) : null,
          url:         d.type === 'png'     ? (d.data.url ?? null)    : null,
        },
      };
    }

    return block;
  });
};

// ── Formatters ────────────────────────────────────────────────────────────────
const formatCrumb = (row) => ({
  path:  row.path,
  slug:  row.slug,
  title: row.title,
  depth: row.depth,
});

const formatChild = (row, user, langSlug) => {
  const tier   = row.content_tier ?? 'free';
  const locked = !canAccess(user, tier, langSlug);
  return {
    path:          row.path,
    slug:          row.slug,
    title:         row.title,
    depth:         row.depth,
    isDeepDive:    row.is_deep_dive,
    estimatedMins: row.estimated_mins,
    difficulty:    row.difficulty,
    sortOrder:     row.sort_order,
    contentTier:   tier,
    isPremium:     tier === 'premium',
    isLocked:      locked,
  };
};

module.exports = { getTopicContent };
