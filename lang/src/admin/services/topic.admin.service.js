'use strict';

const topicRepo   = require('../../repositories/topic.repo');
const quizRepo    = require('../../repositories/quiz.repo');
const diagramRepo = require('../../repositories/diagram.repo');
const cache       = require('../../services/cache.service');
const { KEYS, PATTERNS } = require('../../utils/cacheKeys');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const {
  getAncestorPathsOnly, getParentPath,
  getSlug, getDepth, isValidPath,
} = require('../../utils/pathUtils');

// ── Save topic (create or full update) ───────────────────────────────────────
// Accepts { meta, blocks[] } — same shape as the seeder's loadTopic.
// Runs inside the same upsert logic: quiz + diagram blocks extracted first,
// then topic row, then topic_blocks written atomically-ish.
// Redis cache flushed for the topic + its ancestor nav keys.

const saveTopic = async (db, redis, { meta, blocks }) => {
  if (!meta.path || !isValidPath(meta.path)) {
    throw new BadRequestError(`Invalid topic path: ${meta.path}`);
  }

  const workBlocks = blocks.map((b) => ({ ...b, data: { ...b.data } }));

  // ── Extract quiz questions ────────────────────────────────────────────────
  const inlineQuizzes = workBlocks.filter(
    (b) => b.type === 'quiz' && b.data?.questionId != null && b.data?.questionText != null
  );
  for (const block of inlineQuizzes) {
    await quizRepo.upsert(db, {
      questionKey:  block.data.questionId,
      questionText: block.data.questionText,
      questionType: block.data.questionType ?? 'mcq',
      options:      block.data.options      ?? [],
      explanation:  block.data.explanation  ?? null,
      difficulty:   meta.difficulty,
    });
    block.data = { questionId: block.data.questionId };
  }

  // ── Extract mermaid diagrams ──────────────────────────────────────────────
  const inlineMermaid = workBlocks.filter(
    (b) => b.type === 'diagram' && b.data?.diagramKey != null
        && b.data?.diagramType === 'mermaid' && b.data?.mermaid != null
  );
  for (const block of inlineMermaid) {
    await diagramRepo.upsert(db, {
      diagramKey: block.data.diagramKey,
      title:      block.data.title ?? null,
      type:       'mermaid',
      data:       { source: block.data.mermaid },
    });
    block.data = { diagramKey: block.data.diagramKey, title: block.data.title };
  }

  // ── Upsert topic row ──────────────────────────────────────────────────────
  const ancestorPaths = getAncestorPathsOnly(meta.path);
  const topic = await topicRepo.upsert(db, { ...meta, ancestorPaths });

  // ── Upsert blocks ─────────────────────────────────────────────────────────
  await topicRepo.upsertBlocks(db, topic.id, workBlocks);

  // ── Invalidate Redis cache ────────────────────────────────────────────────
  await flushTopicCache(redis, meta.path);

  return topic;
};

// ── Flush topic + all ancestor nav caches ───────────────────────────────────
const flushTopicCache = async (redis, path) => {
  const langSlug = path.split('.')[0];
  await Promise.all([
    cache.del(redis, KEYS.topic(path)),
    cache.del(redis, KEYS.nav(langSlug)),
    cache.del(redis, KEYS.language()),
  ]);
};

// ── Stats for dashboard ──────────────────────────────────────────────────────
const getStats = async (db) => {
  const { rows } = await db.query(`
    SELECT
      (SELECT COUNT(*)::int FROM languages)                        AS languages,
      (SELECT COUNT(*)::int FROM languages WHERE is_active = true) AS active_languages,
      (SELECT COUNT(*)::int FROM sections)                         AS sections,
      (SELECT COUNT(*)::int FROM topics)                           AS topics,
      (SELECT COUNT(*)::int FROM topics WHERE is_published = true) AS published_topics,
      (SELECT COUNT(*)::int FROM topic_blocks)                     AS total_blocks,
      (SELECT COUNT(*)::int FROM quiz_questions)                   AS quiz_questions,
      (SELECT COUNT(*)::int FROM diagrams)                         AS diagrams
  `);
  return rows[0];
};

// ── Flush all cache (nuclear option) ─────────────────────────────────────────
const flushAllCache = async (redis) => {
  const [topics, navs, langs] = await Promise.all([
    cache.delPattern(redis, PATTERNS.allTopics()),
    cache.delPattern(redis, 'ce:nav:v1:*'),
    cache.delPattern(redis, PATTERNS.allLanguages()),
  ]);
  return { topics, navs, langs };
};

module.exports = { saveTopic, flushTopicCache, getStats, flushAllCache };
