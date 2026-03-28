-- Migration 005: Projects + project_technologies join table

CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id     UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES sections(id) ON DELETE SET NULL,
    slug            TEXT NOT NULL UNIQUE,
    title           TEXT NOT NULL,
    description     TEXT,
    difficulty      TEXT NOT NULL DEFAULT 'beginner'
                    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INT NOT NULL DEFAULT 1,
    -- Project instructions + steps as typed content blocks (same schema as topics.blocks)
    blocks          JSONB NOT NULL DEFAULT '[]',
    meta            JSONB NOT NULL DEFAULT '{}',
    is_published    BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_language ON projects(language_id, sort_order)
    WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_projects_section  ON projects(section_id)
    WHERE is_published = true;

-- ── Project ↔ Technology mapping ────────────────────────────────────────────
-- is_recommended = true  → shown as ON by default in the tech stack selector
-- is_recommended = false → shown as optional, OFF by default

CREATE TABLE IF NOT EXISTS project_technologies (
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    technology_id   UUID NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    is_recommended  BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    PRIMARY KEY (project_id, technology_id)
);

CREATE INDEX IF NOT EXISTS idx_project_tech_project ON project_technologies(project_id);

COMMENT ON TABLE projects IS
    'Hands-on projects. Each project has typed content blocks and an optional tech stack.';
COMMENT ON COLUMN project_technologies.is_recommended IS
    'true = default ON in tech selector; false = optional / default OFF.';
