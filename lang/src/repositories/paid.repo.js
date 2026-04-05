'use strict';

// ── interview_questions ───────────────────────────────────────────────────────

const findInterviewsByLanguage = async (db, languageSlug, isPremiumUser = false) => {
  const { rows } = await db.query(`
    SELECT
      iq.id,
      iq.question,
      CASE
        WHEN iq.content_tier = 'free' THEN iq.answer
        WHEN $2 = true              THEN iq.answer
        ELSE NULL
      END AS answer,
      CASE
        WHEN iq.content_tier = 'premium' AND $2 = false
          THEN COALESCE(iq.answer_snippet, LEFT(iq.answer, 200))
        ELSE NULL
      END AS answer_snippet,
      iq.difficulty,
      iq.category,
      iq.tags,
      iq.content_tier,
      iq.estimated_mins,
      iq.sort_order,
      CASE WHEN iq.content_tier = 'premium' AND $2 = false THEN true ELSE false END AS is_locked,
      CASE WHEN iq.content_tier = 'premium' AND $2 = false
        THEN iq.code_examples
        ELSE iq.code_examples
      END AS code_examples
    FROM   interview_questions iq
    JOIN   languages l ON l.id = iq.language_id AND l.slug = $1
    WHERE  iq.is_published = true
    ORDER  BY iq.sort_order ASC, iq.difficulty ASC
  `, [languageSlug, isPremiumUser]);
  return rows;
};

// ── coding_challenges ─────────────────────────────────────────────────────────

const findCodingChallengesByLanguage = async (db, languageSlug, isPremiumUser = false) => {
  const { rows } = await db.query(`
    SELECT
      cc.id,
      cc.slug,
      cc.title,
      cc.description,
      cc.difficulty,
      cc.problem_statement,
      cc.starter_code,
      CASE WHEN cc.content_tier = 'free' OR $2 = true THEN cc.solution  ELSE NULL END AS solution,
      CASE WHEN cc.content_tier = 'free' OR $2 = true THEN cc.test_cases ELSE NULL END AS test_cases,
      cc.hints,
      cc.time_complexity,
      cc.space_complexity,
      cc.content_tier,
      cc.estimated_mins,
      cc.tags,
      cc.sort_order,
      CASE WHEN cc.content_tier = 'premium' AND $2 = false THEN true ELSE false END AS is_locked
    FROM   coding_challenges cc
    JOIN   languages l ON l.id = cc.language_id AND l.slug = $1
    WHERE  cc.is_published = true
    ORDER  BY cc.sort_order ASC, cc.difficulty ASC
  `, [languageSlug, isPremiumUser]);
  return rows;
};

// ── video_content ─────────────────────────────────────────────────────────────

const findVideosByContent = async (db, contentId, contentType, isPremiumUser = false) => {
  const { rows } = await db.query(`
    SELECT
      vc.id,
      vc.title,
      vc.description,
      vc.thumbnail_url,
      vc.duration_seconds,
      vc.content_tier,
      vc.sort_order,
      CASE
        WHEN vc.content_tier = 'free' OR $3 = true THEN vc.cdn_url
        ELSE NULL
      END AS cdn_url,
      CASE WHEN vc.content_tier = 'premium' AND $3 = false THEN true ELSE false END AS is_locked
    FROM   video_content vc
    WHERE  vc.content_id   = $1
      AND  vc.content_type = $2
      AND  vc.is_published = true
    ORDER  BY vc.sort_order ASC
  `, [contentId, contentType, isPremiumUser]);
  return rows;
};

// ── project_architecture ──────────────────────────────────────────────────────

const findProjectArchitecture = async (db, projectId, isPremiumUser = false) => {
  if (!isPremiumUser) return null; // full object only for premium
  const { rows } = await db.query(`
    SELECT *
    FROM   project_architecture
    WHERE  project_id  = $1
      AND  is_published = true
    LIMIT  1
  `, [projectId]);
  return rows[0] ?? null;
};

// Check if a project has architecture (for lock icon — no premium check)
const hasProjectArchitecture = async (db, projectId) => {
  const { rows } = await db.query(`
    SELECT 1 FROM project_architecture
    WHERE project_id = $1 AND is_published = true
    LIMIT 1
  `, [projectId]);
  return rows.length > 0;
};

module.exports = {
  findInterviewsByLanguage,
  findCodingChallengesByLanguage,
  findVideosByContent,
  findProjectArchitecture,
  hasProjectArchitecture,
};
