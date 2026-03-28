'use strict';

const topicRepo  = require('../repositories/topic.repo');
const quizRepo   = require('../repositories/quiz.repo');
const diagramRepo = require('../repositories/diagram.repo');
const cache      = require('./cache.service');
const { KEYS }   = require('../utils/cacheKeys');
// getAncestorPaths removed: breadcrumb now uses the stored topic.ancestor_paths
// column (migration 008) so no JS string-splitting happens on cache miss.
const { NotFoundError } = require('../utils/errors');
const config            = require('../config');

// ── Main entry: full topic response (blocks + breadcrumb + children) ─────────

const getTopicContent = async (db, redis, path) => {
  return cache.getOrSet(
    redis,
    KEYS.topic(path),
    config.cache.ttl.topic,
    () => loadTopicContent(db, path)
  );
};

const loadTopicContent = async (db, path) => {
  const topic = await topicRepo.findByPath(db, path);
  if (!topic) throw new NotFoundError(`Topic not found: ${path}`);

  // Build breadcrumb path list from the stored ancestor_paths column (migration 008).
  // ancestor_paths holds ancestors-only (e.g. ['java','java.jvm','java.jvm.memory']).
  // We append the topic's own path so the breadcrumb includes self as the last crumb.
  // This replaces the old getAncestorPaths(path) JS computation on every cache miss.
  const breadcrumbPaths = [...(topic.ancestor_paths ?? []), path];

  // Resolve quiz blocks, breadcrumb, and children concurrently.
  const [enrichedBlocks, breadcrumb, children] = await Promise.all([
    enrichBlocks(db, topic.blocks),
    topicRepo.findBreadcrumb(db, breadcrumbPaths),
    topicRepo.findChildren(db, path),
  ]);

  return {
    topic: {
      id:            topic.id,
      path:          topic.path,
      title:         topic.title,
      difficulty:    topic.difficulty,
      estimatedMins: topic.estimated_mins,
      tags:          topic.tags,
      isDeepDive:    topic.is_deep_dive,
      languageSlug:  topic.language_slug,
      sectionSlug:   topic.section_slug,
      sectionTitle:  topic.section_title,
      meta:          topic.meta,
    },
    breadcrumb: breadcrumb.map(formatCrumb),
    children:   children.map(formatChild),
    blocks:     enrichedBlocks,
  };
};

// ── Block enrichment ─────────────────────────────────────────────────────────
// Runs a single batch query per block type (quiz, diagram) rather than
// one query per block. Both are fetched concurrently.

const enrichBlocks = async (db, blocks) => {
  // Collect keys for each enrichable block type
  const quizKeys = blocks
    .filter((b) => b.type === 'quiz' && b.data?.questionId)
    .map((b) => b.data.questionId);

  const diagramKeys = blocks
    .filter((b) => b.type === 'diagram' && b.data?.diagramKey)
    .map((b) => b.data.diagramKey);

  // Batch-fetch both concurrently
  const [questions, diagrams] = await Promise.all([
    quizKeys.length    ? quizRepo.findByKeys(db, quizKeys)       : [],
    diagramKeys.length ? diagramRepo.findByKeys(db, diagramKeys) : [],
  ]);

  const qMap = new Map(questions.map((q) => [q.question_key, q]));
  const dMap = new Map(diagrams.map((d)  => [d.diagram_key,  d]));

  return blocks.map((block) => {
    // ── Quiz enrichment ──────────────────────────────────────
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
        normalizedQuestion = {
          q:       q.question_text,
          opts:    opts,
          correct: 0,
          exp:     q.explanation ?? '',
        };
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

    // ── Diagram enrichment ───────────────────────────────────
    if (block.type === 'diagram') {
      const d = dMap.get(block.data.diagramKey);
      if (!d) return block;  // diagramKey not in DB yet → block passes through as-is

      // d.data holds the actual content: { svg: "..." } or { source: "..." }
      return {
        ...block,
        data: {
          title:        block.data.title ?? d.title ?? null,
          diagramKey:   d.diagram_key,
          diagramType:  d.type,           // 'svg' | 'mermaid' | 'png'
          svg:          d.type === 'svg'     ? (d.data.svg ?? null)    : null,
          mermaid:      d.type === 'mermaid' ? (d.data.source ?? null) : null,
          url:          d.type === 'png'     ? (d.data.url ?? null)    : null,
        },
      };
    }

    return block;
  });
};

// ── Formatters (keep DB column names out of API responses) ───────────────────

const formatCrumb = (row) => ({
  path:  row.path,
  slug:  row.slug,
  title: row.title,
  depth: row.depth,
});

const formatChild = (row) => ({
  path:          row.path,
  slug:          row.slug,
  title:         row.title,
  depth:         row.depth,
  isDeepDive:    row.is_deep_dive,
  estimatedMins: row.estimated_mins,
  difficulty:    row.difficulty,
  sortOrder:     row.sort_order,
});

module.exports = { getTopicContent };