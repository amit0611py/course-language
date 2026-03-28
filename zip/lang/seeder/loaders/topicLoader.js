'use strict';

const topicRepo            = require('../../src/repositories/topic.repo');
const quizRepo             = require('../../src/repositories/quiz.repo');
const diagramRepo          = require('../../src/repositories/diagram.repo');
const { getAncestorPathsOnly } = require('../../src/utils/pathUtils');

const loadTopic = async (db, { meta, blocks }) => {
  // ── Step 1: Extract inline quiz definitions ─────────────────────────────
  const inlineQuizzes = blocks.filter(
    (b) =>
      b.type === 'quiz' &&
      b.data?.questionId   != null &&
      b.data?.questionText != null
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

  // ── Step 2: Extract inline mermaid diagram definitions ──────────────────
  // Only mermaid diagrams have inline body content in the .md file.
  // SVG diagrams are populated separately by scripts/export-diagrams.js.
  // After upsert the block is reduced to { diagramKey, title }.
  const inlineMermaidDiagrams = blocks.filter(
    (b) =>
      b.type === 'diagram' &&
      b.data?.diagramKey   != null &&
      b.data?.diagramType === 'mermaid' &&
      b.data?.mermaid      != null
  );

  for (const block of inlineMermaidDiagrams) {
    await diagramRepo.upsert(db, {
      diagramKey: block.data.diagramKey,
      title:      block.data.title ?? null,
      type:       'mermaid',
      data:       { source: block.data.mermaid },
    });
    block.data = { diagramKey: block.data.diagramKey, title: block.data.title };
  }

  // ── Step 3: Compute ancestor_paths ─────────────────────────────────────
  const ancestorPaths = getAncestorPathsOnly(meta.path);

  // ── Step 4: Upsert topic row ────────────────────────────────────────────
  const topic = await topicRepo.upsert(db, { ...meta, ancestorPaths });

  // ── Step 5: Upsert blocks into topic_blocks ─────────────────────────────
  await topicRepo.upsertBlocks(db, topic.id, blocks);

  return topic;
};

module.exports = { loadTopic };