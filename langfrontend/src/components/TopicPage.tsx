import { useParams, useNavigate } from "react-router-dom";
import { C, colorRgb, DEFAULT_COLOR } from "../theme";
import { useTopic } from "../hooks/useTopic";
import { useNavigation } from "../hooks/useNavigation";
import BlockRenderer from "./blocks/BlockRenderer";
import DeepDiveSection from "./DeepDiveSection";
import type { Language, NavTopic } from "../types";

// ─────────────────────────────────────────────────────────────
// TOPIC PAGE — dynamic, API-driven
// Layout order:
//   Hero → (blocks with auto section headings) → Deep Dive → Next Up
//
// Children from the topic response are split into:
//   normalChildren   — shown as "Related Topics" cards (if any)
//   deepDiveChildren — shown inside the collapsible DeepDiveSection
// ─────────────────────────────────────────────────────────────

// Section color palette — mirrors Sidebar.tsx & HomePage.tsx
const SECTION_PALETTE = [
  "#f59e0b", "#fb923c", "#e879f9", "#a78bfa", "#4ade80", "#22d3ee", "#f87171",
];

// ── Skeleton ──────────────────────────────────────────────────
function TopicSkeleton() {
  return (
    <div style={{ padding: "36px 48px", maxWidth: 860 }}>
      <div className="skeleton-pulse" style={{ height: 20, width: 100, marginBottom: 16 }} />
      <div className="skeleton-pulse" style={{ height: 40, width: "60%", marginBottom: 10 }} />
      <div className="skeleton-pulse" style={{ height: 14, width: "80%", marginBottom: 6 }} />
      <div className="skeleton-pulse" style={{ height: 14, width: "65%", marginBottom: 32 }} />
      {[200, 100, 280, 60, 180].map((h, i) => (
        <div key={i} className="skeleton-pulse" style={{ height: h, marginBottom: 20, borderRadius: 12 }} />
      ))}
    </div>
  );
}

// ── Difficulty badge ──────────────────────────────────────────
function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, { color: string; label: string }> = {
    beginner:     { color: "#4ade80", label: "Beginner" },
    intermediate: { color: "#fbbf24", label: "Intermediate" },
    advanced:     { color: "#f87171", label: "Advanced" },
  };
  const d = map[level.toLowerCase()] ?? { color: C.muted, label: level };
  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700,
        color: d.color,
        background: `${d.color}22`,
        padding: "2px 8px", borderRadius: 10,
        border: `1px solid ${d.color}44`,
      }}
    >
      {d.label}
    </span>
  );
}

// ── Normal-children topic cards (siblings / sub-topics) ───────
interface RelatedCardProps {
  topic: NavTopic;
  accentColor: string;
  rgb: string;
  onClick: () => void;
}

function RelatedCard({ topic, accentColor, rgb, onClick }: RelatedCardProps) {
  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        flex: "1 1 200px", minWidth: 0,
        background: `rgba(${rgb},.05)`,
        border: `1px solid rgba(${rgb},.15)`,
        borderRadius: 12, padding: "14px 16px",
        cursor: "pointer", transition: "all .18s",
        display: "flex", flexDirection: "column", gap: 5,
      }}
    >
      <div style={{ color: C.text, fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
        {topic.title}
      </div>
      {topic.estimatedMins && (
        <div style={{ color: C.dim, fontSize: 10 }}>⏱ {topic.estimatedMins} min</div>
      )}
      <div style={{ color: accentColor, fontSize: 11, fontWeight: 700, marginTop: 4 }}>
        Start →
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
interface TopicPageProps {
  language: Language;
}

export default function TopicPage({ language }: TopicPageProps) {
  const navigate = useNavigate();
  const { lang = "java", "*": topicPath = "" } = useParams<{ lang: string; "*": string }>();

  const { data: topic, isLoading, isError, error } = useTopic(topicPath);
  const { data: navData } = useNavigation(lang);

  // ── Loading ────────────────────────────────────────────────
  if (isLoading) return <TopicSkeleton />;

  // ── Error ─────────────────────────────────────────────────
  if (isError) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ color: C.text, marginBottom: 8 }}>Failed to load topic</h2>
        <p style={{
          color: C.muted, fontSize: 13, marginBottom: 20,
          maxWidth: 400, margin: "0 auto 20px",
        }}>
          {msg}
        </p>
        <button
          onClick={() => navigate(`/${lang}`)}
          style={{
            background: C.card, border: `1px solid ${C.border}`,
            color: C.muted, padding: "9px 20px", borderRadius: 9, fontSize: 13,
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  if (!topic) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ color: C.text, marginBottom: 8 }}>Coming Soon</h2>
        <p style={{ color: C.muted }}>This topic is being built. Check back soon!</p>
        <button
          onClick={() => navigate(`/${lang}`)}
          style={{
            marginTop: 20, background: C.card, border: `1px solid ${C.border}`,
            color: C.muted, padding: "9px 20px", borderRadius: 9, fontSize: 13,
          }}
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Resolve accent color ───────────────────────────────────
  const sections = navData?.sections ?? [];
  const sectionIdx = sections.findIndex((s) => s.slug === topic.sectionSlug);
  const sectionColor = sectionIdx >= 0
    ? SECTION_PALETTE[sectionIdx % SECTION_PALETTE.length]
    : undefined;
  const accentColor = topic.color
    ?? sectionColor
    ?? (navData?.language.meta?.color as string | undefined)
    ?? language.meta?.color
    ?? language.color
    ?? DEFAULT_COLOR;
  const rgb = colorRgb(accentColor);

  // ── Split children into normal vs deep-dive ────────────────
  const allChildren: NavTopic[] = topic.children ?? [];
  const normalChildren   = allChildren.filter((c) => !c.isDeepDive);
  const deepDiveChildren = allChildren.filter((c) =>  c.isDeepDive);

  // ── Next topic in section (depth-first sibling) ────────────
  const secTopics = sections.find((s) => s.slug === topic.sectionSlug)?.topics ?? [];
  const flatTopics = flattenTopics(secTopics);
  const thisIdx = flatTopics.findIndex((t) => t.path === topic.path);
  const nextTopic = thisIdx >= 0 ? flatTopics[thisIdx + 1] : undefined;

  // ── Breadcrumb display ─────────────────────────────────────
  const breadcrumbLabel = (topic.breadcrumb ?? [])
    .map((b) => b.title)
    .join(" › ");

  return (
    <div style={{ padding: "36px 48px", maxWidth: 860 }}>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════ */}
      <div className="fu" style={{ marginBottom: 32 }}>

        {/* Meta row: section badge + difficulty + time + tags */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginBottom: 14, flexWrap: "wrap",
        }}>
          {topic.section && (
            <span style={{
              background: `rgba(${rgb},.12)`,
              color: accentColor, fontSize: 11, padding: "3px 10px",
              borderRadius: 20, fontWeight: 700,
            }}>
              {topic.section}
            </span>
          )}
          {topic.isDeepDive && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 0.4,
              color: accentColor, background: `rgba(${rgb},.16)`,
              padding: "3px 10px", borderRadius: 20,
            }}>
              🔬 Deep Dive
            </span>
          )}
          {topic.difficulty && <DifficultyBadge level={topic.difficulty} />}
          {topic.estimatedMins && (
            <span style={{ color: C.dim, fontSize: 11 }}>
              ⏱ {topic.estimatedMins} min
            </span>
          )}
          {(topic.tags ?? []).slice(0, 4).map((tag) => (
            <span key={tag} style={{
              fontSize: 10, color: C.dim,
              background: "rgba(255,255,255,.04)",
              padding: "2px 8px", borderRadius: 10,
              border: `1px solid ${C.border}`,
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Icon + title row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 8 }}>
          {topic.icon && (
            <span style={{ fontSize: 38, lineHeight: 1, flexShrink: 0, marginTop: 4 }}>
              {topic.icon}
            </span>
          )}
          <div>
            <h1 style={{
              color: C.text, fontSize: 30, fontWeight: 800,
              letterSpacing: -0.5, margin: "0 0 4px",
            }}>
              {topic.title}
            </h1>
            {topic.tagline && (
              <p style={{ color: accentColor, fontSize: 14, fontWeight: 600, margin: 0 }}>
                {topic.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Breadcrumb trail */}
        {breadcrumbLabel && breadcrumbLabel !== topic.title && (
          <p style={{ color: C.dim, fontSize: 11, marginTop: 6, marginBottom: 4 }}>
            {breadcrumbLabel}
          </p>
        )}

        {/* Description */}
        {topic.description && (
          <p style={{
            color: C.muted, fontSize: 15, lineHeight: 1.8,
            maxWidth: 720, marginTop: 10, marginBottom: 0,
          }}>
            {topic.description}
          </p>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          CONTENT BLOCKS
          (BlockRenderer injects Code Playground / Visual Diagram
           / Test Your Knowledge headings automatically)
          ════════════════════════════════════════════════════ */}
      <div className="fu" style={{ animationDelay: ".08s" }}>
        <BlockRenderer blocks={topic.blocks} accentColor={accentColor} />
      </div>

      {/* ══════════════════════════════════════════════════════
          NORMAL CHILDREN (sub-topics, not deep dive)
          Shown as a small "Continue Learning" grid when present
          ════════════════════════════════════════════════════ */}
      {normalChildren.length > 0 && (
        <div className="fu" style={{ animationDelay: ".12s", marginTop: 32 }}>
          {/* Section heading */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `rgba(${rgb},.12)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>
              📚
            </div>
            <h2 style={{
              color: C.text, fontSize: 16, fontWeight: 700,
              letterSpacing: -0.2, margin: 0,
            }}>
              Continue Learning
            </h2>
            <div style={{
              flex: 1, height: 1,
              background: `linear-gradient(to right, rgba(${rgb},.25), transparent)`,
              marginLeft: 4,
            }} />
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {normalChildren.map((child) => (
              <RelatedCard
                key={child.path}
                topic={child}
                accentColor={accentColor}
                rgb={rgb}
                onClick={() => navigate(`/${lang}/t/${child.path}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DEEP DIVE SECTION
          Collapsible — only shown when deepDiveChildren exist
          ════════════════════════════════════════════════════ */}
      {deepDiveChildren.length > 0 && (
        <DeepDiveSection
          topics={deepDiveChildren}
          accentColor={accentColor}
          lang={lang}
        />
      )}

      {/* ══════════════════════════════════════════════════════
          NEXT UP
          Auto-computed from nav — depth-first next sibling
          ════════════════════════════════════════════════════ */}
      {nextTopic && (
        <div
          className="fu"
          style={{
            animationDelay: ".24s",
            marginTop: 32,
            padding: "18px 22px",
            background: `rgba(${rgb},.06)`,
            border: `1px solid rgba(${rgb},.2)`,
            borderRadius: 14,
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap", gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 26 }}>👉</span>
            <div>
              <div style={{ color: C.dim, fontSize: 10, marginBottom: 2, fontWeight: 600 }}>
                UP NEXT
              </div>
              <div style={{ color: accentColor, fontWeight: 700, fontSize: 14 }}>
                {nextTopic.title}
              </div>
              {nextTopic.estimatedMins && (
                <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
                  ⏱ ~{nextTopic.estimatedMins} min
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/${lang}/t/${nextTopic.path}`)}
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              color: "#000", padding: "9px 22px", borderRadius: 9,
              fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
              transition: "opacity .2s",
            }}
          >
            Start →
          </button>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Flatten a recursive NavTopic tree depth-first
// ─────────────────────────────────────────────────────────────
function flattenTopics(
  topics: { path: string; title: string; estimatedMins?: number; children?: typeof topics }[]
): { path: string; title: string; estimatedMins?: number }[] {
  const out: { path: string; title: string; estimatedMins?: number }[] = [];
  for (const t of topics) {
    out.push(t);
    if (t.children?.length) out.push(...flattenTopics(t.children));
  }
  return out;
}
