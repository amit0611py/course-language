// ─────────────────────────────────────────────────────────────
// TYPES — ground-truthed against real backend API responses
// ─────────────────────────────────────────────────────────────

// ── Language (from /v1/languages) ────────────────────────────
export interface LanguageMeta {
  color?: string;        // e.g. "#007396"
  tagline?: string;      // e.g. "Write once, run anywhere"
  version?: string;      // e.g. "21 LTS"
  difficulty?: string;
  phase?: string;        // e.g. "Phase 19 · 19 of 38 topics built"
  quizCount?: number;    // total quiz questions for stats badge
  labCount?: number;     // total code labs for stats badge
  stats?: Array<{ val: string; label: string }>;  // override stats badges
  [key: string]: unknown;
}

export interface Language {
  id: string;            // UUID
  slug: string;          // e.g. "java"
  name: string;          // e.g. "Java"
  iconUrl?: string;      // e.g. "/icons/java.svg"
  description?: string;
  meta: LanguageMeta;
  sortOrder?: number;
  // Derived / display helpers (computed from meta or overrides):
  color?: string;        // shortcut for meta.color
  tagline?: string;      // shortcut for meta.tagline
}

// ── Navigation (from /v1/navigation/:slug) ───────────────────

/** Recursive topic node — topics can have nested children */
export interface NavTopic {
  id: string;
  path: string;          // dot-separated, e.g. "java.jvm.memory.heap"
  slug: string;
  title: string;
  depth: number;         // 1 = section-level, 2 = sub-topic, 3 = deep-dive
  parentPath?: string;
  isDeepDive?: boolean;
  estimatedMins?: number;
  sortOrder?: number;
  completed?: boolean;   // true = done, false = locked, undefined = neutral
  children: NavTopic[];  // recursive — empty array when leaf
}

export interface NavSection {
  id: string;
  slug: string;          // e.g. "core-language"
  title: string;         // e.g. "Core Language"
  description?: string;  // optional tagline shown on section card
  sortOrder?: number;
  topics: NavTopic[];
  color?: string;        // not from API — assigned by frontend per section index
}

export interface NavigationResponse {
  language: Language;    // enriched with meta.color, meta.tagline etc.
  sections: NavSection[];
}

// ── Topic (from /v1/topics/:path) ────────────────────────────

export interface BreadcrumbItem {
  path: string;
  slug: string;
  title: string;
  depth: number;
}

export interface Topic {
  id?: string;
  path: string;
  title: string;
  icon?: string;
  tagline?: string;
  description?: string;
  color?: string;
  section?: string;          // sectionTitle from API
  sectionSlug?: string;
  languageSlug?: string;
  difficulty?: string;
  estimatedMins?: number;
  tags?: string[];
  isDeepDive?: boolean;
  breadcrumb: BreadcrumbItem[];
  children: NavTopic[];
  blocks: Block[];
  next?: {
    path: string;
    label: string;
    desc?: string;
  };
}

// ── Block data shapes ─────────────────────────────────────────

export interface TextBlockData {
  content: string;
  heading?: string;
}

export interface CodeBlockData {
  snippet: string;
  filename?: string;
  language?: string;
  output?: string;
  runnable?: boolean;
}

export interface DiagramBlockData {
  diagramKey?: string;   // DB key e.g. "java_jvm"
  diagramType?: string;  // "svg" | "mermaid" | "png"
  title?: string;
  // Enriched content — one of these is set after content.service enrichment:
  svg?: string;          // static HTML string from export-diagrams.js
  mermaid?: string;      // mermaid source string
  url?: string;          // image URL
  alt?: string;
}

export interface QuizQuestion {
  q: string;
  opts: string[];
  correct: number;
  exp: string;
}

export interface QuizBlockData {
  // Full inline questions array (when embedded in topic)
  questions?: QuizQuestion[];
  // Reference to an external question (current API shape: { questionId: "q_java_intro_001" })
  questionId?: string;
}

export interface NoteBlockData {
  content: string;
  title?: string;
}

export interface WarningBlockData {
  content: string;
  title?: string;
}

export interface ImageBlockData {
  url: string;
  alt?: string;
  caption?: string;
}

export interface VideoBlockData {
  url: string;
  title?: string;
  poster?: string;
}

export interface AnimationBlockData {
  src: string;
  width?: number;
  height?: number;
  loop?: boolean;
}

export interface ConceptItem {
  icon?: string;
  title?: string;
  desc?: string;
}

export interface ConceptCardsBlockData {
  items: ConceptItem[];
}

export type BlockType =
  | "text"
  | "code"
  | "diagram"
  | "quiz"
  | "note"
  | "warning"
  | "image"
  | "video"
  | "animation"
  | "concept_cards";

export interface Block {
  type: BlockType;
  data: Record<string, unknown>;
}

// ── Project ───────────────────────────────────────────────────
export interface Project {
  slug: string;
  title: string;
  description?: string;
  language: string;
  difficulty?: string;
  tags?: string[];
}