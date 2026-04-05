// ── Language ──────────────────────────────────────────────────
export interface LanguageMeta {
  color?: string;
  tagline?: string;
  version?: string;
  difficulty?: string;
  phase?: string;
  quizCount?: number;
  labCount?: number;
  stats?: Array<{ val: string; label: string }>;
  [key: string]: unknown;
}

export interface Language {
  id: string;
  slug: string;
  name: string;
  iconUrl?: string;
  description?: string;
  meta: LanguageMeta;
  sortOrder?: number;
  contentTier?: "free" | "premium";
  isLocked?: boolean;
  color?: string;
  tagline?: string;
}

// ── Navigation ────────────────────────────────────────────────
export interface NavTopic {
  id: string;
  path: string;
  slug: string;
  title: string;
  depth: number;
  parentPath?: string;
  isDeepDive?: boolean;
  estimatedMins?: number;
  sortOrder?: number;
  completed?: boolean;
  contentTier?: "free" | "premium";
  isPremium?: boolean;
  isLocked?: boolean;
  children: NavTopic[];
}

export interface NavSection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  sortOrder?: number;
  topics: NavTopic[];
  color?: string;
}

export interface NavigationResponse {
  language: Language;
  sections: NavSection[];
}

// ── Topic ─────────────────────────────────────────────────────
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
  section?: string;
  sectionSlug?: string;
  languageSlug?: string;
  difficulty?: string;
  estimatedMins?: number;
  tags?: string[];
  isDeepDive?: boolean;
  contentTier?: "free" | "premium";
  languageTier?: "free" | "premium";
  isPremium?: boolean;
  isLocked?: boolean;
  breadcrumb: BreadcrumbItem[];
  children: NavTopic[];
  blocks: Block[];
  next?: { path: string; label: string; desc?: string };
}

// ── Block data shapes ─────────────────────────────────────────
export interface TextBlockData         { content: string; heading?: string; }
export interface CodeBlockData         { snippet: string; filename?: string; language?: string; output?: string; runnable?: boolean; }
export interface DiagramBlockData      { diagramKey?: string; diagramType?: string; title?: string; svg?: string; mermaid?: string; url?: string; alt?: string; }
export interface QuizQuestion          { q: string; opts: string[]; correct: number; exp: string; }
export interface QuizBlockData         { questions?: QuizQuestion[]; questionId?: string; }
export interface NoteBlockData         { content: string; title?: string; }
export interface WarningBlockData      { content: string; title?: string; }
export interface ImageBlockData        { url: string; alt?: string; caption?: string; }
export interface VideoBlockData        { url: string; title?: string; poster?: string; }
export interface AnimationBlockData    { src: string; width?: number; height?: number; loop?: boolean; }
export interface ConceptItem           { icon?: string; title?: string; desc?: string; }
export interface ConceptCardsBlockData { items: ConceptItem[]; }

export type BlockType =
  | "text" | "code" | "diagram" | "quiz" | "note" | "warning"
  | "image" | "video" | "animation" | "concept_cards"
  | "premium_gate";

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
  contentTier?: "free" | "premium";
  isPremium?: boolean;
  hasArchitecture?: boolean;
}

// ── Paid content ──────────────────────────────────────────────
export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string | null;
  answer_snippet: string | null;
  difficulty: string;
  category: string;
  tags: string[];
  content_tier: "free" | "premium";
  estimated_mins: number;
  is_locked: boolean;
  code_examples?: unknown[];
}

export interface CodingChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  problem_statement: unknown;
  starter_code: unknown;
  solution: unknown | null;
  test_cases: unknown | null;
  hints?: unknown[];
  time_complexity?: string;
  space_complexity?: string;
  content_tier: "free" | "premium";
  estimated_mins: number;
  tags: string[];
  is_locked: boolean;
}

export interface VideoContent {
  id: string;
  title: string;
  description?: string;
  cdn_url: string | null;
  thumbnail_url?: string;
  duration_seconds?: number;
  content_tier: "free" | "premium";
  is_locked: boolean;
}

export interface UserSession {
  isPremium: boolean;
  token?: string;
}
