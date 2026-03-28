// Admin theme — dark editorial style, distinct from the learner app
export const A = {
  // Backgrounds
  bg:      "#080b12",
  surface: "#0d1117",
  card:    "#111827",
  hover:   "#1a2235",
  active:  "#1e2d45",

  // Borders
  border:  "#1f2937",
  borderHover: "#374151",

  // Text
  text:    "#f0f6fc",
  muted:   "#8b949e",
  dim:     "#484f58",

  // Accents
  blue:    "#58a6ff",
  green:   "#3fb950",
  yellow:  "#d29922",
  red:     "#f85149",
  purple:  "#bc8cff",
  orange:  "#ffa657",
  cyan:    "#39d353",

  // Semantic
  success: "#3fb950",
  error:   "#f85149",
  warn:    "#d29922",
  info:    "#58a6ff",

  // Sidebar
  sidebar: "#0d1117",
  sidebarBorder: "#21262d",
} as const;

// Block type → accent color mapping
export const BLOCK_COLORS: Record<string, string> = {
  text:          "#8b949e",
  concept_cards: "#58a6ff",
  code:          "#3fb950",
  diagram:       "#bc8cff",
  quiz:          "#ffa657",
  note:          "#39d353",
  warning:       "#f85149",
  image:         "#d29922",
  video:         "#e879f9",
};

// Block type → emoji icon
export const BLOCK_ICONS: Record<string, string> = {
  text:          "📝",
  concept_cards: "💡",
  code:          "💻",
  diagram:       "🗺️",
  quiz:          "🧠",
  note:          "📌",
  warning:       "⚠️",
  image:         "🖼️",
  video:         "🎬",
};

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export const BLOCK_TYPES = Object.keys(BLOCK_ICONS);
