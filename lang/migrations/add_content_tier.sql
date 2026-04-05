-- ══════════════════════════════════════════════════════════════════════════════
-- MANUAL FIX: Add content_tier columns to topics and projects
-- Run this directly in psql / pgAdmin / TablePlus against your DB.
-- Safe to run multiple times — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS content_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (content_tier IN ('free', 'premium'));

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS content_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (content_tier IN ('free', 'premium'));

CREATE INDEX IF NOT EXISTS idx_topics_tier ON topics(content_tier, is_published)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_tier ON projects(content_tier, is_published)
  WHERE is_published = true;

COMMIT;
