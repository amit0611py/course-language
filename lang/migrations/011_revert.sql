-- ══════════════════════════════════════════════════════════════════════════════
-- REVERT: Migration 011 — Remove auth and paid content system
-- Run this to fully undo 011_add_auth_and_paid_content_FIXED.sql
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Drop tables (in reverse dependency order) ──────────────────────────────

DROP TABLE IF EXISTS popup_impressions CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS project_architecture CASCADE;
DROP TABLE IF EXISTS coding_challenges CASCADE;
DROP TABLE IF EXISTS interview_questions CASCADE;
DROP TABLE IF EXISTS video_content CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ── 2. Drop indexes added to existing tables ───────────────────────────────────

DROP INDEX IF EXISTS idx_topics_tier;
DROP INDEX IF EXISTS idx_projects_tier;

-- ── 3. Remove columns added to existing tables ────────────────────────────────

-- Remove content_tier from topics (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'topics' AND column_name = 'content_tier'
    ) THEN
        ALTER TABLE topics DROP COLUMN content_tier;
    END IF;
END $$;

-- Remove content_tier from projects (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'content_tier'
    ) THEN
        ALTER TABLE projects DROP COLUMN content_tier;
    END IF;
END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- REVERT COMPLETE
-- Schema is back to migration 010 state.
-- ══════════════════════════════════════════════════════════════════════════════
