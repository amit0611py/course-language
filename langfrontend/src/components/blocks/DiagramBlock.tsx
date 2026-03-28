import { C } from "../../theme";
import type { DiagramBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// DIAGRAM BLOCK
//
// All diagram content now lives in the backend diagrams table.
// The API serves enriched blocks with one of these shapes:
//
//   SVG (exported React component → static HTML):
//     { diagramKey, title, diagramType: "svg", svg: "<div>...</div>" }
//
//   Mermaid (source stored in DB, rendered client-side):
//     { diagramKey, title, diagramType: "mermaid", mermaid: "graph TD..." }
//
//   Image URL:
//     { diagramKey, title, diagramType: "png", url: "https://..." }
//
//   Not yet in DB (diagramKey present but no content):
//     { diagramKey, title }  → shows a subtle placeholder
//
// No frontend registry. No hardcoded components. Zero frontend
// changes needed to add or update diagrams for any language.
// ─────────────────────────────────────────────────────────────

interface DiagramBlockProps {
  data: DiagramBlockData;
  accentColor: string;
}

export default function DiagramBlock({ data, accentColor }: DiagramBlockProps) {

  // ── SVG — static HTML rendered from React component ───────
  if (data.svg) {
    return (
      <div style={{ marginBottom: 24 }}>
        {data.title && (
          <div style={{
            color: C.dim, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8,
          }}>
            {data.title}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: data.svg }} />
      </div>
    );
  }

  // ── Mermaid — render source via mermaid library ────────────
  // The mermaid library is loaded lazily to avoid bundle bloat.
  if (data.mermaid) {
    return <MermaidDiagram source={data.mermaid} title={data.title} />;
  }

  // ── Image URL ──────────────────────────────────────────────
  if (data.url) {
    return (
      <div style={{ marginBottom: 24 }}>
        {data.title && (
          <h3 style={{ color: C.text, fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            🗺 {data.title}
          </h3>
        )}
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 14, overflow: "hidden",
        }}>
          <img
            src={data.url}
            alt={data.alt ?? data.title ?? "Diagram"}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      </div>
    );
  }

  // ── Placeholder — diagram key exists but not yet in DB ─────
  return (
    <div style={{
      marginBottom: 16, padding: "14px 18px",
      background: "rgba(255,255,255,.02)",
      border: `1px dashed ${C.border}`,
      borderRadius: 12,
      display: "flex", alignItems: "center", gap: 10,
      color: C.dim, fontSize: 12,
    }}>
      <span style={{ fontSize: 18, opacity: 0.5 }}>🗺</span>
      <span>
        {data.title ?? "Diagram"}{" "}
        {data.diagramKey && (
          <code style={{ color: accentColor, fontSize: 10 }}>
            ({data.diagramKey})
          </code>
        )}{" "}
        — run <code style={{ color: accentColor }}>npm run export:diagrams</code> to populate
      </span>
    </div>
  );
}

// ── Mermaid renderer — lazy-loads the mermaid library ─────────
import { useEffect, useRef, useState } from "react";

function MermaidDiagram({ source, title }: { source: string; title?: string | null }) {
  const ref      = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current || !source) return;
    let cancelled = false;

    import("mermaid").then((m) => {
      if (cancelled) return;
      const mermaid = m.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          background: "#0d0d20",
          primaryColor: "#f59e0b",
          primaryTextColor: "#e2e8f0",
          lineColor: "#4b5563",
          edgeLabelBackground: "#0d0d20",
          fontSize: "13px",
        },
      });

      const id = `mermaid-${Math.random().toString(36).slice(2)}`;
      mermaid.render(id, source).then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
      }).catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    }).catch(() => {
      if (!cancelled) setError("mermaid library not installed — run: npm install mermaid");
    });

    return () => { cancelled = true; };
  }, [source]);

  if (error) {
    return (
      <div style={{
        marginBottom: 16, padding: "12px 16px",
        background: "rgba(248,113,113,.06)",
        border: "1px solid rgba(248,113,113,.2)",
        borderRadius: 10, color: C.dim, fontSize: 12,
      }}>
        ⚠ Mermaid render error: {error}
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {title && (
        <div style={{
          color: C.dim, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8,
        }}>
          {title}
        </div>
      )}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, padding: 24, overflow: "auto",
      }}>
        <div ref={ref} style={{ minHeight: 60 }} />
      </div>
    </div>
  );
}