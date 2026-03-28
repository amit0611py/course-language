-- Migration 006: Quiz questions + Diagrams registry
-- These tables are referenced by content blocks via string keys,
-- keeping blocks lightweight and separately queryable.

-- ── Quiz Questions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_key    TEXT NOT NULL UNIQUE,   -- matches block data.questionId: 'q_heap_001'
    topic_id        UUID REFERENCES topics(id) ON DELETE SET NULL,
    question_text   TEXT NOT NULL,
    question_type   TEXT NOT NULL DEFAULT 'mcq'
                    CHECK (question_type IN ('mcq', 'true-false', 'fill-blank')),
    -- MCQ: [{ "id": "a", "text": "...", "correct": true }]
    -- true-false: [{ "id": "true", "text": "True", "correct": true }, ...]
    -- fill-blank: [{ "id": "ans", "text": "answer", "correct": true }]
    options         JSONB NOT NULL DEFAULT '[]',
    explanation     TEXT,
    difficulty      TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    meta            JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_key ON quiz_questions(question_key);
CREATE INDEX IF NOT EXISTS idx_quiz_topic        ON quiz_questions(topic_id);

-- ── Diagrams Registry ────────────────────────────────────────────────────────
-- Diagrams are referenced by diagram blocks via data.diagramId.
-- The actual diagram source (Mermaid string, SVG, URL) lives here.

CREATE TABLE IF NOT EXISTS diagrams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagram_key TEXT NOT NULL UNIQUE,   -- matches block data.diagramId: 'jvm_heap_regions'
    title       TEXT,
    type        TEXT NOT NULL
                CHECK (type IN ('mermaid', 'svg', 'png', 'excalidraw')),
    -- mermaid: { "source": "graph TD\n..." }
    -- svg/png:  { "url": "https://..." }
    data        JSONB NOT NULL DEFAULT '{}',
    meta        JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_diagrams_key ON diagrams(diagram_key);

COMMENT ON TABLE quiz_questions IS
    'Quiz questions referenced by quiz blocks. question_key matches block data.questionId.';
COMMENT ON TABLE diagrams IS
    'Diagram definitions referenced by diagram blocks. diagram_key matches block data.diagramId.';
