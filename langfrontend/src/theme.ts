// ─────────────────────────────────────────────────────────────
// GLOBAL THEME — matches the original code-mastery design exactly
// ─────────────────────────────────────────────────────────────

export const C = {
  bg:      "#06060f",
  sidebar: "#04040c",
  card:    "#0d0d20",
  hover:   "#12122a",
  border:  "#1c1c3a",
  // Section accent colours
  java:    "#f59e0b",
  oop:     "#fb923c",
  adv:     "#e879f9",
  dsa:     "#a78bfa",
  spring:  "#4ade80",
  devops:  "#22d3ee",
  // Text
  text:    "#e2e8f0",
  muted:   "#94a3b8",
  dim:     "#4b5563",
  codeBg:  "#1e1e2e",
  // Semantic
  success: "#4ade80",
  error:   "#f87171",
  warn:    "#fbbf24",
} as const;

/** Convert a hex colour like "#f59e0b" → "245,158,11" for rgba() */
export function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "245,158,11";
  return `${r},${g},${b}`;
}

/** Fallback colour map for known accent hex values */
const KNOWN_RGB: Record<string, string> = {
  "#f59e0b": "245,158,11",
  "#fb923c": "251,146,60",
  "#e879f9": "232,121,249",
  "#a78bfa": "167,139,250",
  "#4ade80": "74,222,128",
  "#22d3ee": "34,211,238",
  "#f87171": "248,113,113",
};

export function colorRgb(hex: string): string {
  return KNOWN_RGB[hex?.toLowerCase()] ?? hexToRgb(hex ?? C.java);
}

/** Default accent colour when the API doesn't provide one */
export const DEFAULT_COLOR = C.java;
