// ── Languages ─────────────────────────────────────────────────
export interface Language {
  id: string;
  slug: string;
  name: string;
  iconUrl?: string;
  description?: string;
  meta: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  meta: Record<string, unknown>;
}

// ── Topics ────────────────────────────────────────────────────
export interface TopicSummary {
  id: string;
  path: string;
  slug: string;
  title: string;
  depth: number;
  parentPath?: string;
  difficulty: string;
  estimatedMins: number;
  isDeepDive: boolean;
  isPublished: boolean;
  sortOrder: number;
  tags: string[];
  languageSlug: string;
  languageName: string;
  sectionSlug?: string;
  sectionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicFull extends TopicSummary {
  ancestorPaths: string[];
  meta: Record<string, unknown>;
  blocks: Block[];
}

export interface TopicMeta {
  path: string;
  title: string;
  sectionSlug?: string;
  difficulty?: string;
  estimatedMins?: number;
  tags?: string[];
  isDeepDive?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  meta?: Record<string, unknown>;
}

// ── Blocks ────────────────────────────────────────────────────
export type BlockType =
  | "text" | "concept_cards" | "code" | "diagram"
  | "quiz" | "note" | "warning" | "image" | "video";

export interface Block {
  type: BlockType;
  data: Record<string, unknown>;
}

export interface ConceptItem {
  icon?: string;
  title?: string;
  desc?: string;
}

// ── Diagrams ──────────────────────────────────────────────────
export interface Diagram {
  id: string;
  diagramKey: string;
  title?: string;
  type: "svg" | "mermaid" | "png";
  data: Record<string, unknown>;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ── Quiz Questions ────────────────────────────────────────────
export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  questionKey: string;
  questionText: string;
  questionType: string;
  options: QuizOption[];
  explanation?: string;
  difficulty?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Stats ─────────────────────────────────────────────────────
export interface Stats {
  languages: number;
  active_languages: number;
  sections: number;
  topics: number;
  published_topics: number;
  total_blocks: number;
  quiz_questions: number;
  diagrams: number;
}

export interface TopicsByLanguage {
  language_slug: string;
  language_name: string;
  is_active: boolean;
  total_topics: number;
  published: number;
  unpublished: number;
  deep_dives: number;
  sections_used: number;
}

export interface BlocksByType {
  block_type: string;
  count: number;
}

// ── API responses ─────────────────────────────────────────────
export interface PaginatedTopics {
  total: number;
  limit: number;
  offset: number;
  topics: TopicSummary[];
}

export interface PaginatedQuizzes {
  total: number;
  limit: number;
  offset: number;
  questions: QuizQuestion[];
}
