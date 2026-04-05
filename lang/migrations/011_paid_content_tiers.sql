-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 011: Paid Content Tiers (no auth tables — handled by app logic)
-- Adds content_tier columns, video_content, interview_questions,
-- coding_challenges, and project_architecture tables.
-- ══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. content_tier on topics ──────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'topics' AND column_name = 'content_tier'
    ) THEN
        ALTER TABLE topics
            ADD COLUMN content_tier TEXT NOT NULL DEFAULT 'free'
                CHECK (content_tier IN ('free', 'premium'));
    END IF;
END $$;

-- ── 2. content_tier on projects ───────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'content_tier'
    ) THEN
        ALTER TABLE projects
            ADD COLUMN content_tier TEXT NOT NULL DEFAULT 'free'
                CHECK (content_tier IN ('free', 'premium'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topics_tier ON topics(content_tier, is_published)
    WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_tier ON projects(content_tier, is_published)
    WHERE is_published = true;

-- ── 3. video_content ──────────────────────────────────────────────────────────
-- Stores CDN URLs provided by the second application.
-- content_id + content_type = polymorphic FK to topics or projects.
CREATE TABLE IF NOT EXISTS video_content (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id      UUID NOT NULL,
    content_type    TEXT NOT NULL CHECK (content_type IN ('topic', 'project')),

    title           TEXT NOT NULL,
    description     TEXT,
    cdn_url         TEXT NOT NULL,         -- full URL from second application
    thumbnail_url   TEXT,
    duration_seconds INT,

    content_tier    TEXT NOT NULL DEFAULT 'premium'
        CHECK (content_tier IN ('free', 'premium')),

    video_quality   TEXT,
    meta            JSONB NOT NULL DEFAULT '{}',
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_video_per_content UNIQUE (content_id, content_type, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_video_content ON video_content(content_id, content_type)
    WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_video_tier ON video_content(content_tier)
    WHERE is_published = true;

-- ── 4. interview_questions ────────────────────────────────────────────────────
-- Advanced Q&A. free tier rows get a snippet; full answer requires premium.
CREATE TABLE IF NOT EXISTS interview_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id     UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES sections(id) ON DELETE SET NULL,
    topic_id        UUID REFERENCES topics(id) ON DELETE SET NULL,

    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,          -- full answer (premium)
    answer_snippet  TEXT,                   -- short preview shown to free users
    code_examples   JSONB DEFAULT '[]',
    difficulty      TEXT NOT NULL DEFAULT 'intermediate'
                    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),

    category        TEXT NOT NULL DEFAULT 'technical',
    tags            TEXT[] NOT NULL DEFAULT '{}',

    content_tier    TEXT NOT NULL DEFAULT 'premium'
        CHECK (content_tier IN ('free', 'premium')),

    estimated_mins  INT NOT NULL DEFAULT 5,
    follow_up_questions JSONB DEFAULT '[]',
    meta            JSONB NOT NULL DEFAULT '{}',
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_language ON interview_questions(language_id, content_tier)
    WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_interview_section ON interview_questions(section_id)
    WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_interview_difficulty ON interview_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_interview_tags ON interview_questions USING GIN (tags);

-- ── 5. coding_challenges ─────────────────────────────────────────────────────
-- Advanced coding problems. free tier gets problem only; solution+tests = premium.
CREATE TABLE IF NOT EXISTS coding_challenges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id     UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES sections(id) ON DELETE SET NULL,

    title           TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    difficulty      TEXT NOT NULL DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),

    problem_statement JSONB NOT NULL,
    starter_code    JSONB NOT NULL DEFAULT '{}',
    solution        JSONB NOT NULL DEFAULT '{}',     -- premium
    test_cases      JSONB NOT NULL DEFAULT '[]',     -- premium

    hints           JSONB DEFAULT '[]',
    approach        TEXT,
    time_complexity TEXT,
    space_complexity TEXT,

    content_tier    TEXT NOT NULL DEFAULT 'premium'
        CHECK (content_tier IN ('free', 'premium')),

    estimated_mins  INT NOT NULL DEFAULT 30,
    tags            TEXT[] NOT NULL DEFAULT '{}',
    meta            JSONB NOT NULL DEFAULT '{}',
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coding_language ON coding_challenges(language_id, content_tier)
    WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_coding_difficulty ON coding_challenges(difficulty);
CREATE INDEX IF NOT EXISTS idx_coding_tags ON coding_challenges USING GIN (tags);

-- ── 6. project_architecture ───────────────────────────────────────────────────
-- Full project with architecture doc, tech stack, and complete source — premium.
CREATE TABLE IF NOT EXISTS project_architecture (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    overview        TEXT NOT NULL,
    system_design   JSONB NOT NULL,
    tech_stack      JSONB NOT NULL,

    full_source_code  JSONB NOT NULL,
    folder_structure  JSONB NOT NULL,
    setup_instructions TEXT NOT NULL,

    architecture_diagrams JSONB DEFAULT '[]',
    database_schema JSONB,
    api_documentation JSONB,
    deployment_guide TEXT,

    code_comments   BOOLEAN NOT NULL DEFAULT true,
    testing_included BOOLEAN NOT NULL DEFAULT true,
    ci_cd_setup     JSONB,

    content_tier    TEXT NOT NULL DEFAULT 'premium'
        CHECK (content_tier IN ('free', 'premium')),

    meta            JSONB NOT NULL DEFAULT '{}',
    is_published    BOOLEAN NOT NULL DEFAULT true,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_architecture_per_project UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_project_architecture ON project_architecture(project_id)
    WHERE is_published = true;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION 011 COMPLETE
-- ══════════════════════════════════════════════════════════════════════════════
