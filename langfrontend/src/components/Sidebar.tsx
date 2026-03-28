import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, ChevronRight, ChevronDown, Coffee, Layers, Zap, GitBranch, Package, Terminal, Globe } from "lucide-react";
import { C, colorRgb, DEFAULT_COLOR } from "../theme";
import { useNavigation } from "../hooks/useNavigation";
import type { Language, NavTopic, NavSection } from "../types";

// ─────────────────────────────────────────────────────────────
// SECTION COLOR PALETTE — stable by index
// ─────────────────────────────────────────────────────────────
const SECTION_PALETTE = [
  "#f59e0b",  // 0 core-language   → orange
  "#fb923c",  // 1 oop             → amber
  "#e879f9",  // 2 advanced        → purple
  "#a78bfa",  // 3 dsa             → indigo
  "#4ade80",  // 4 spring/projects → green
  "#22d3ee",  // 5 devops/extra    → cyan
  "#f87171",  // 6 extra           → red
];
function getSectionColor(idx: number): string {
  return SECTION_PALETTE[idx % SECTION_PALETTE.length];
}

// ─────────────────────────────────────────────────────────────
// Section icon — maps section slug keywords → Lucide icon
// ─────────────────────────────────────────────────────────────
function SectionIcon({ slug, color, size = 13 }: { slug: string; color: string; size?: number }) {
  const s = slug.toLowerCase();
  if (/oop|object/.test(s))             return <Layers    size={size} color={color} />;
  if (/adv|advanced|stream|thread/.test(s)) return <Zap   size={size} color={color} />;
  if (/dsa|algo|data/.test(s))          return <GitBranch size={size} color={color} />;
  if (/spring|boot|framework/.test(s))  return <Package   size={size} color={color} />;
  if (/devops|docker|deploy/.test(s))   return <Terminal  size={size} color={color} />;
  if (/web|network|http/.test(s))       return <Globe     size={size} color={color} />;
  return <Coffee size={size} color={color} />;   // default: language icon
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
      {[140, 100, 120, 90, 110, 95, 130].map((w, i) => (
        <div key={i} className="skeleton-pulse" style={{ height: 13, width: w }} />
      ))}
    </div>
  );
}

function countAll(topics: NavTopic[]): number {
  return topics.reduce((n, t) => n + 1 + countAll(t.children ?? []), 0);
}

function countDone(topics: NavTopic[]): number {
  return topics.reduce((n, t) => n + (t.completed ? 1 : 0) + countDone(t.children ?? []), 0);
}

// ─────────────────────────────────────────────────────────────
// Recursive topic tree
// ─────────────────────────────────────────────────────────────
interface TopicTreeProps {
  topics:     NavTopic[];
  activePath: string;
  sc:         string;
  secRgb:     string;
  onNavigate: (path: string) => void;
  indentPx?:  number;
}

function TopicTree({ topics, activePath, sc, secRgb, onNavigate, indentPx = 40 }: TopicTreeProps) {
  return (
    <>
      {topics.map((t) => {
        const isActive = activePath === t.path;
        const isDone   = !!t.completed;

        return (
          <div key={t.path}>
            <div
              className="nav-row"
              onClick={() => onNavigate(t.path)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: `7px 14px 7px ${indentPx}px`,
                cursor: "pointer",
                background: isActive ? `rgba(${secRgb},.1)` : "transparent",
                borderLeft: isActive ? `3px solid ${sc}` : "3px solid transparent",
                transition: "all .15s",
                opacity: (!isDone && t.completed !== undefined) ? 0.45 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, flex: 1 }}>
                {/* Deep Dive badge */}
                {t.isDeepDive && (
                  <span style={{
                    fontSize: 8, color: sc,
                    background: `rgba(${secRgb},.18)`,
                    padding: "1px 4px", borderRadius: 4,
                    fontWeight: 800, letterSpacing: 0.3, flexShrink: 0,
                  }}>
                    DEEP
                  </span>
                )}

                {/* Topic title */}
                <span style={{
                  color: isActive ? sc : isDone ? C.text : C.muted,
                  fontSize: 12, lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {t.title}
                </span>
              </div>

              {/* Right side: time / done tick / lock / active arrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {t.estimatedMins && !isActive && (
                  <span style={{ fontSize: 9, color: C.dim }}>{t.estimatedMins}m</span>
                )}
                {isDone && !isActive && (
                  <span style={{ fontSize: 10, color: "#4ade80" }}>✓</span>
                )}
                {t.completed === false && (
                  <span style={{ fontSize: 9, color: C.dim }}>🔒</span>
                )}
                {isActive && <ChevronRight size={10} color={sc} />}
              </div>
            </div>

            {/* Recurse into children */}
            {t.children && t.children.length > 0 && (
              <TopicTree
                topics={t.children}
                activePath={activePath}
                sc={sc}
                secRgb={secRgb}
                onNavigate={onNavigate}
                indentPx={indentPx + 14}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────────────────────
interface SidebarProps {
  open:        boolean;
  language:    Language;
  activePath:  string;
}

export default function Sidebar({ open, language, activePath }: SidebarProps) {
  const navigate = useNavigate();
  const slug = language.slug;

  const { data: navData, isLoading, isError } = useNavigation(slug);
  const sections: NavSection[] = navData?.sections ?? [];

  // Expand the first section by default; toggle on click
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (s: string) =>
    setExpanded((e) => e.includes(s) ? e.filter((x) => x !== s) : [...e, s]);

  const effective = expanded.length === 0 && sections.length > 0
    ? [sections[0].slug]
    : expanded;

  const accentColor = language.color ?? language.meta?.color ?? DEFAULT_COLOR;
  const rgb = colorRgb(accentColor);

  // Phase/progress string from meta (set by backend)
  const phase: string =
    (navData?.language?.meta?.phase as string) ??
    (language.meta?.phase as string) ??
    "";

  // Total topics across all sections
  const grandTotal = sections.reduce((n, s) => n + countAll(s.topics), 0);
  const grandDone  = sections.reduce((n, s) => n + countDone(s.topics), 0);

  const goHome  = () => navigate(`/${slug}`);
  const goTopic = (path: string) => navigate(`/${slug}/t/${path}`);

  return (
    <div
      style={{
        width:    open ? 260 : 0,
        minWidth: open ? 260 : 0,
        background: C.sidebar,
        borderRight: `1px solid ${C.border}`,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width .25s ease, min-width .25s ease",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {open && (
        <>
          {/* ── Logo ── */}
          <div
            style={{
              padding: "20px 18px 16px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              className="glow"
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {language.iconUrl ? (
                <img
                  src={language.iconUrl}
                  alt={language.name}
                  style={{ width: 22, height: 22, objectFit: "contain" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
                  {language.name[0]}
                </span>
              )}
            </div>
            <div>
              <div style={{ color: C.text, fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>
                {language.name} Mastery
              </div>
              <div style={{ color: C.dim, fontSize: 10 }}>
                {language.tagline ?? language.meta?.tagline ?? "Interactive Learning"}
              </div>
            </div>
          </div>

          {/* ── Scrollable nav area ── */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>

            {/* Home row */}
            <div
              className="nav-row"
              onClick={goHome}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 18px", cursor: "pointer",
                background: activePath === "" ? `rgba(${rgb},.1)` : "transparent",
                borderLeft: activePath === "" ? `3px solid ${accentColor}` : "3px solid transparent",
                transition: "all .2s",
              }}
            >
              <Home size={15} color={activePath === "" ? accentColor : C.muted} />
              <span style={{ color: activePath === "" ? accentColor : C.muted, fontSize: 13 }}>
                Home
              </span>
            </div>

            {/* Navigation loading/error */}
            {isLoading && <SidebarSkeleton />}
            {isError && (
              <div style={{ padding: "12px 18px", color: C.error, fontSize: 11, lineHeight: 1.6 }}>
                ⚠ Navigation failed to load
              </div>
            )}

            {/* Section list */}
            {sections.map((sec, idx) => {
              const sc     = getSectionColor(idx);
              const secRgb = colorRgb(sc);
              const isOpen = effective.includes(sec.slug);
              const total  = countAll(sec.topics);
              const done   = countDone(sec.topics);
              const hasDoneData = sec.topics.some(t => t.completed !== undefined);

              return (
                <div key={sec.slug}>
                  {/* Section header */}
                  <div
                    className="nav-row"
                    onClick={() => toggle(sec.slug)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 18px", cursor: "pointer", transition: "all .2s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <SectionIcon slug={sec.slug} color={sc} size={13} />
                      <span style={{ color: C.muted, fontSize: 12, fontWeight: 600 }}>
                        {sec.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {total > 0 && (
                        <span style={{
                          background: `rgba(${secRgb},.15)`,
                          color: sc, fontSize: 9, padding: "1px 6px",
                          borderRadius: 10, fontWeight: 700,
                        }}>
                          {/* Show done/total when completion data exists, else just total */}
                          {hasDoneData ? `${done}/${total}` : total}
                        </span>
                      )}
                      {isOpen
                        ? <ChevronDown  size={12} color={C.dim} />
                        : <ChevronRight size={12} color={C.dim} />
                      }
                    </div>
                  </div>

                  {/* Topic rows */}
                  {isOpen && sec.topics.length > 0 && (
                    <TopicTree
                      topics={sec.topics}
                      activePath={activePath}
                      sc={sc}
                      secRgb={secRgb}
                      onNavigate={goTopic}
                      indentPx={40}
                    />
                  )}

                  {isOpen && sec.topics.length === 0 && (
                    <div style={{ padding: "6px 18px 6px 40px", color: C.dim, fontSize: 11 }}>
                      No topics yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: "14px 18px",
            borderTop: `1px solid ${C.border}`,
            flexShrink: 0,
          }}>
            {phase ? (
              <div style={{ color: C.dim, fontSize: 10, lineHeight: 1.6 }}>
                📦 {phase}
              </div>
            ) : grandTotal > 0 ? (
              <div style={{ color: C.dim, fontSize: 10, lineHeight: 1.6 }}>
                📦 {grandDone > 0
                    ? `${grandDone} of ${grandTotal} topics completed`
                    : `${grandTotal} topics · More unlocking soon…`
                  }
              </div>
            ) : (
              <div style={{ color: C.dim, fontSize: 10, lineHeight: 1.6 }}>
                📦 {language.name} · More topics coming soon…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
