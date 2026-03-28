import { useNavigate } from "react-router-dom";
import { C, colorRgb, DEFAULT_COLOR } from "../theme";
import { useNavigation } from "../hooks/useNavigation";
import type { Language, NavTopic } from "../types";

// ─────────────────────────────────────────────────────────────
// HOME PAGE — fully dynamic from /v1/languages + /v1/navigation
// Visual design mirrors code-mastery exactly
// ─────────────────────────────────────────────────────────────

const SECTION_PALETTE = [
  "#f59e0b", "#fb923c", "#e879f9", "#a78bfa", "#4ade80", "#22d3ee", "#f87171",
];
function getSectionColor(idx: number) {
  return SECTION_PALETTE[idx % SECTION_PALETTE.length];
}

// Section icons — same emojis as code-mastery
const SECTION_ICONS: Record<string, string> = {
  "core-language": "☕", "core": "☕", "java": "☕",
  "oop":           "🏗", "object": "🏗",
  "advanced":      "⚡", "adv": "⚡", "streams": "⚡", "threads": "⚡",
  "dsa":           "🧮", "data-structures": "🧮", "algorithms": "🧮",
  "spring":        "🍃", "spring-boot": "🍃", "framework": "🍃",
  "devops":        "🚀", "deploy": "🚀", "docker": "🚀",
};
function sectionIcon(slug: string): string {
  const s = slug.toLowerCase().replace(/[\s_]/g, "-");
  // exact match first
  if (SECTION_ICONS[s]) return SECTION_ICONS[s];
  // keyword match
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (s.includes(key)) return icon;
  }
  return "📚";
}

function countAll(topics: NavTopic[]): number {
  return topics.reduce((n, t) => n + 1 + countAll(t.children ?? []), 0);
}
function countDone(topics: NavTopic[]): number {
  return topics.reduce((n, t) => n + (t.completed ? 1 : 0) + countDone(t.children ?? []), 0);
}

function ProgressSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-pulse" style={{ height: 52, borderRadius: 12 }} />
      ))}
    </div>
  );
}

interface HomePageProps { language: Language }

export default function HomePage({ language }: HomePageProps) {
  const navigate = useNavigate();

  const { data: navData, isLoading: navLoading } = useNavigation(language.slug);

  const lang     = navData?.language ?? language;
  const sections = navData?.sections ?? [];

  const accentColor = lang.meta?.color ?? lang.color ?? DEFAULT_COLOR;
  const rgb = colorRgb(accentColor);

  // First topic for CTA
  const firstTopic  = sections.flatMap((s) => s.topics)[0];
  const startPath   = firstTopic?.path ?? "";

  // Compute stats — try meta first, then compute from nav
  const totalTopics = sections.reduce((n, s) => n + countAll(s.topics), 0);

  // Use backend-provided stats if in meta, else compute sensible defaults
  const metaStats  = lang.meta?.stats as Array<{ val: string; label: string }> | undefined;
  const statsCards = metaStats ?? [
    { val: String(totalTopics || "—"),  label: "Topics"   },
    { val: String(sections.length || "—"), label: "Sections" },
    ...(lang.meta?.quizCount  ? [{ val: String(lang.meta.quizCount),  label: "Quiz Questions" }] : []),
    ...(lang.meta?.labCount   ? [{ val: String(lang.meta.labCount),   label: "Code Labs"      }] : []),
  ];

  const goTopic = (path: string) => path && navigate(`/${language.slug}/t/${path}`);

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100 }}>

      {/* ══════════════════════════════════════
          HERO
          ══════════════════════════════════════ */}
      <div className="fu" style={{ marginBottom: 48, textAlign: "center" }}>

        {/* Language icon / emoji */}
        <div
          className="float"
          style={{ fontSize: 72, marginBottom: 16, lineHeight: 1, display: "flex", justifyContent: "center" }}
        >
          {lang.iconUrl ? (
            <img
              src={lang.iconUrl} alt={lang.name}
              style={{ width: 72, height: 72, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span>{lang.name[0]}</span>
          )}
        </div>

        {/* Title — gradient same as code-mastery */}
        <h1
          style={{
            fontSize: 48, fontWeight: 900, letterSpacing: -1, marginBottom: 12,
            background: `linear-gradient(135deg,${accentColor},#fb923c,#e879f9)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}
        >
          {lang.name} Mastery
        </h1>

        {/* Tagline — with inline Hello World if no tagline */}
        <p style={{ color: C.muted, fontSize: 17, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>
          {lang.tagline ?? lang.meta?.tagline ?? lang.description ?? (
            <>
              From your first{" "}
              <code style={{ color: accentColor, background: `rgba(${rgb},.1)`, padding: "2px 6px", borderRadius: 4 }}>
                Hello World
              </code>
              {" "}to production-ready skills.
            </>
          )}
        </p>

        {/* Stats badges */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
          {statsCards.map((s) => (
            <div
              key={s.label}
              style={{
                background: C.card, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "16px 24px", textAlign: "center",
                minWidth: 80,
              }}
            >
              <div style={{ color: accentColor, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{s.val}</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Start Learning CTA */}
        <button
          onClick={() => goTopic(startPath)}
          disabled={!startPath}
          className="glow"
          style={{
            background: startPath ? `linear-gradient(135deg,${accentColor},#ea580c)` : C.border,
            color: startPath ? "#000" : C.dim,
            padding: "13px 40px", borderRadius: 12,
            fontSize: 15, fontWeight: 800, letterSpacing: 0.4,
            transition: "all .2s", border: "none",
          }}
        >
          {startPath ? `Start Learning ${lang.name === "Java" ? "☕" : ""}` : "Loading…"}
        </button>
      </div>

      {/* ══════════════════════════════════════
          COURSE ROADMAP
          ══════════════════════════════════════ */}
      {sections.length > 0 && (
        <div className="fu" style={{ animationDelay: ".1s", marginBottom: 40 }}>
          <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Course Roadmap
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {sections.map((sec, i) => {
              const sc      = getSectionColor(i);
              const secRgb  = colorRgb(sc);
              const total   = countAll(sec.topics);
              const icon    = sectionIcon(sec.slug);
              const firstT  = sec.topics[0];
              const preview = sec.topics.slice(0, 3).map((t) => t.title).join(" · ")
                + (sec.topics.length > 3 ? " ···" : "");
              // Description from meta, or use topic preview
              const desc = (sec as { description?: string }).description ?? preview;

              return (
                <div
                  key={sec.slug}
                  className="card-hover"
                  style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: 22,
                    cursor: firstT ? "pointer" : "default",
                    transition: "all .25s",
                  }}
                  onClick={() => firstT && goTopic(firstT.path)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    {/* Section icon box — like code-mastery */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, fontSize: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `rgba(${secRgb},.15)`, color: sc,
                      fontWeight: 900,
                    }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{sec.title}</div>
                      <div style={{ color: sc, fontSize: 11, fontWeight: 600 }}>
                        {total} topic{total !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          YOUR PROGRESS
          ══════════════════════════════════════ */}
      <div className="fu" style={{ animationDelay: ".2s" }}>
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
          Your Progress
        </h2>

        {navLoading && <ProgressSkeleton />}

        {sections.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sections.map((sec, i) => {
              const sc     = getSectionColor(i);
              const secRgb = colorRgb(sc);
              const total  = countAll(sec.topics);
              const done   = countDone(sec.topics);
              const pct    = total > 0 ? Math.round((done / total) * 100) : 0;
              const hasDone = sec.topics.some(t => t.completed !== undefined);

              return (
                <div
                  key={sec.slug}
                  style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 12, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  {/* Section icon */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `rgba(${secRgb},.12)`, flexShrink: 0,
                  }}>
                    {sectionIcon(sec.slug)}
                  </div>

                  {/* Bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                      <span style={{ color: C.text, fontSize: 13, fontWeight: 600 }}>{sec.title}</span>
                      <span style={{ color: sc, fontSize: 12, fontWeight: 700 }}>
                        {hasDone ? `${done}/${total}` : total}
                      </span>
                    </div>
                    <div style={{ background: C.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: hasDone ? `${pct}%` : "0%",
                          background: `linear-gradient(90deg,${sc},${sc}aa)`,
                          borderRadius: 4, transition: "width .6s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Percentage badge */}
                  <span style={{
                    color: hasDone ? sc : C.dim,
                    fontSize: 11, fontWeight: 700,
                    background: `rgba(${secRgb},.1)`,
                    padding: "3px 8px", borderRadius: 10,
                    minWidth: 38, textAlign: "center", flexShrink: 0,
                  }}>
                    {hasDone ? `${pct}%` : `${total}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
