import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { C, DEFAULT_COLOR } from "./theme";
import { useLanguages } from "./hooks/useLanguages";
import GlobalStyles from "./components/GlobalStyles";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import TopicPage from "./components/TopicPage";
import type { Language } from "./types";

// ─────────────────────────────────────────────────────────────
// LANGUAGE SELECTOR DROPDOWN
// ─────────────────────────────────────────────────────────────
interface LangSelectorProps {
  languages: Language[];
  currentSlug: string;
}

function LanguageSelector({ languages, currentSlug }: LangSelectorProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const current = languages.find((l) => l.slug === currentSlug);
  const accentColor = current?.meta?.color ?? current?.color ?? DEFAULT_COLOR;

  // Render language icon: image if iconUrl exists, otherwise first letter
  const renderIcon = (l: Language, size: number) => {
    const color = l.meta?.color ?? l.color ?? DEFAULT_COLOR;
    if (l.iconUrl) {
      return (
        <img
          src={l.iconUrl}
          alt={l.name}
          style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      );
    }
    return (
      <span
        style={{
          width: size, height: size, borderRadius: 6, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: `${color}22`, color, fontWeight: 900,
          fontSize: Math.round(size * 0.55),
        }}
      >
        {l.name[0]}
      </span>
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 9, padding: "5px 12px", cursor: "pointer",
          color: accentColor, fontSize: 12, fontWeight: 700,
          transition: "all .2s",
        }}
      >
        {renderIcon(current ?? languages[0], 16)}
        <span>{current?.name ?? "Language"}</span>
        <span style={{ color: C.dim, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 8, zIndex: 100,
            boxShadow: "0 16px 48px rgba(0,0,0,.6)",
            minWidth: 200,
          }}
        >
          {languages.map((l) => {
            const lColor = l.meta?.color ?? l.color ?? DEFAULT_COLOR;
            const isActive = l.slug === currentSlug;
            return (
              <div
                key={l.slug}
                className="nav-row"
                onClick={() => { navigate(`/${l.slug}`); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,.05)" : "transparent",
                  transition: "background .15s",
                }}
              >
                {renderIcon(l, 22)}
                <div>
                  <div
                    style={{
                      color: isActive ? lColor : C.text,
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {l.name}
                  </div>
                  <div style={{ color: C.dim, fontSize: 10 }}>
                    {l.tagline ?? l.meta?.tagline}
                  </div>
                </div>
                {isActive && (
                  <span style={{ marginLeft: "auto", color: lColor, fontSize: 11 }}>
                    ✓
                  </span>
                )}
              </div>
            );
          })}
          <div
            style={{
              borderTop: `1px solid ${C.border}`, marginTop: 8,
              padding: "8px 12px",
            }}
          >
            <div style={{ color: C.dim, fontSize: 10 }}>
              More languages coming soon…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANGUAGE SHELL — wraps sidebar + content for a given :lang
// ─────────────────────────────────────────────────────────────
interface LanguageShellProps {
  languages: Language[];
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

function LanguageShell({ languages, sidebarOpen, setSidebarOpen }: LanguageShellProps) {
  const { lang = "java", "*": topicPath = "" } = useParams<{ lang: string; "*": string }>();
  const navigate = useNavigate();

  // Safety guard — languages must be an array before calling .find()
  const safeLanguages = Array.isArray(languages) ? languages : [];
  // Match by slug (URL param) — fall back to first language
  const language = safeLanguages.find((l) => l.slug === lang) ?? safeLanguages[0];
  if (!language) return null;

  const accentColor = language.meta?.color ?? language.color ?? DEFAULT_COLOR;

  // Breadcrumb text in top bar (no emoji icon — use name only)
  const breadcrumbText = topicPath
    ? `${language.name} › ${topicPath}`
    : language.name;

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        height: "100%", overflow: "hidden",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: 52, display: "flex", alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px", borderBottom: `1px solid ${C.border}`,
          background: "rgba(4,4,12,.8)", backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "transparent", color: C.muted,
              padding: 4, borderRadius: 6, lineHeight: 1,
            }}
          >
            <Menu size={18} />
          </button>
          <div
            style={{ color: C.dim, fontSize: 12, cursor: "pointer" }}
            onClick={() => navigate(`/${lang}`)}
          >
            {breadcrumbText}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search placeholder */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "5px 12px",
            }}
          >
            <Search size={12} color={C.dim} />
            <span style={{ color: C.dim, fontSize: 12 }}>Search topics…</span>
          </div>

          <LanguageSelector languages={safeLanguages} currentSlug={lang} />
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <Sidebar
          open={sidebarOpen}
          language={language}
          activePath={topicPath}
        />

        {/* Content pane — key re-mounts on route change for fade-in */}
        <div
          key={`${lang}-${topicPath}`}
          className="fi"
          style={{ flex: 1, overflowY: "auto" }}
        >
          <Routes>
            <Route
              index
              element={<HomePage language={language} />}
            />
            <Route
              path="t/*"
              element={<TopicPage language={language} />}
            />
            {/* Redirect unknown paths to home */}
            <Route path="*" element={<Navigate to={`/${lang}`} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP LOADING / ERROR STATES
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex", height: "100vh", alignItems: "center", justifyContent: "center",
        background: C.bg, flexDirection: "column", gap: 16,
      }}
    >
      <span className="spin" style={{ fontSize: 40 }}>☕</span>
      <span style={{ color: C.muted, fontSize: 14 }}>Loading languages…</span>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex", height: "100vh", alignItems: "center", justifyContent: "center",
        background: C.bg, flexDirection: "column", gap: 12, padding: "0 24px",
        textAlign: "center",
      }}
    >
      <span style={{ fontSize: 40 }}>⚠️</span>
      <span style={{ color: C.error, fontSize: 15, fontWeight: 700 }}>
        Cannot connect to backend
      </span>
      <span style={{ color: C.muted, fontSize: 13, maxWidth: 480, lineHeight: 1.7 }}>
        {message}
      </span>
      <div
        style={{
          marginTop: 8, background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 20px",
          fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.text,
          textAlign: "left",
        }}
      >
        <div style={{ color: C.dim, marginBottom: 6, fontSize: 11 }}># Start the Fastify backend</div>
        <div><span style={{ color: C.success }}>cd</span> ../lang &amp;&amp; <span style={{ color: C.success }}>npm run dev</span></div>
        <div style={{ color: C.dim, marginTop: 4, fontSize: 11 }}>→ runs on http://localhost:3001</div>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8, background: C.card, border: `1px solid ${C.border}`,
          color: C.muted, padding: "8px 20px", borderRadius: 9, fontSize: 13,
        }}
      >
        ↻ Retry
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP — sets up layout wrapper + global state
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: rawLanguages, isLoading, isError, error } = useLanguages();

  // Hard guard: the normalizer in client.ts should already return an array,
  // but protect against any edge case where the shape is still wrong.
  const languages: Language[] = Array.isArray(rawLanguages) ? rawLanguages : [];

  if (isLoading) return <><GlobalStyles /><LoadingScreen /></>;
  if (isError || languages.length === 0) {
    const msg = error instanceof Error ? error.message : "Failed to load languages";
    return <><GlobalStyles /><ErrorScreen message={msg} /></>;
  }

  const defaultLang = languages[0].slug;

  return (
    <div
      style={{
        // Full-screen dark background
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      }}
    >
      <GlobalStyles />

      {/* Centred layout container — max-width 1400px */}
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          // Subtle side borders on very large monitors
          borderLeft: `1px solid ${C.border}`,
          borderRight: `1px solid ${C.border}`,
        }}
      >
        <Routes>
          {/* Redirect root → first language */}
          <Route path="/" element={<Navigate to={`/${defaultLang}`} replace />} />

          {/* Language shell handles all /:lang/* routes */}
          <Route
            path="/:lang/*"
            element={
              <LanguageShell
                languages={languages}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
              />
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={`/${defaultLang}`} replace />} />
        </Routes>
      </div>
    </div>
  );
}
