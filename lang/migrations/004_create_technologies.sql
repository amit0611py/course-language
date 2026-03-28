-- Migration 004: Technologies + Projects tables
-- Technologies: Docker, Jenkins, Kubernetes, PostgreSQL, GitHub Actions, etc.
-- Projects: Hands-on builds linked to a language/section with optional tech stack.

CREATE TABLE IF NOT EXISTS technologies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    icon_url    TEXT,
    category    TEXT,       -- 'container', 'ci-cd', 'database', 'cloud', 'monitoring'
    description TEXT,
    meta        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_technologies_slug     ON technologies(slug);
CREATE INDEX IF NOT EXISTS idx_technologies_category ON technologies(category);

COMMENT ON TABLE technologies IS
    'Technology registry. Referenced by projects via project_technologies join table.';
