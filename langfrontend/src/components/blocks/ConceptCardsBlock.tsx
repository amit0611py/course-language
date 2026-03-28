import { useState } from "react";
import type React from "react";
import { C, colorRgb } from "../../theme";

// ─────────────────────────────────────────────────────────────
// CONCEPT CARDS BLOCK
//
// Renders a grid of visual concept cards — each card shows an
// icon, a short title, and a one-to-two sentence description.
//
// Backend shape (from markdownParser mergeConceptCards):
//   {
//     type: "concept_cards",
//     data: {
//       items: [
//         { icon: "☕", title: "JVM", desc: "Java Virtual Machine — ..." },
//         ...
//       ]
//     }
//   }
//
// Features:
//   • Responsive grid: 3-up on wide, 2-up on medium, 1-up on narrow
//   • Hover: card lifts slightly and border brightens
//   • Click to expand: desc truncates to 2 lines and expands on click
//   • accentColor used for icon badge background + border glow
// ─────────────────────────────────────────────────────────────

interface ConceptItem {
  icon?: string;
  title?: string;
  desc?: string;
}

interface ConceptCardsBlockProps {
  data: { items: ConceptItem[] };
  accentColor: string;
}

// ── Single card ───────────────────────────────────────────────
function ConceptCard({
  item,
  accentColor,
  rgb,
}: {
  item: ConceptItem;
  accentColor: string;
  rgb: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasLongDesc = (item.desc?.length ?? 0) > 120;

  return (
    <div
      onClick={() => hasLongDesc && setExpanded((e) => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `rgba(${rgb},.07)`
          : `rgba(${rgb},.04)`,
        border: `1px solid rgba(${rgb},${hovered ? ".35" : ".18"})`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: hasLongDesc ? "pointer" : "default",
        transition: "all .18s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered
          ? `0 4px 20px rgba(${rgb},.12)`
          : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Icon badge + title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {item.icon && (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `rgba(${rgb},.16)`,
              border: `1px solid rgba(${rgb},.3)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {item.icon}
          </div>
        )}
        <div
          style={{
            color: accentColor,
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1.3,
            letterSpacing: -0.1,
          }}
        >
          {item.title}
        </div>
      </div>

      {/* Description */}
      {item.desc && (
        <div
          style={{
            color: C.muted,
            fontSize: 12,
            lineHeight: 1.65,
            overflow: "hidden",
            display: "-webkit-box" as React.CSSProperties["display"],
            WebkitBoxOrient: "vertical" as const,
            WebkitLineClamp: (expanded || !hasLongDesc) ? "unset" : 2,
          } as React.CSSProperties}
        >
          {item.desc}
        </div>
      )}

      {/* "Show more" hint */}
      {hasLongDesc && (
        <div
          style={{
            color: accentColor,
            fontSize: 10,
            fontWeight: 600,
            opacity: 0.7,
            letterSpacing: 0.3,
          }}
        >
          {expanded ? "▲ less" : "▼ more"}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function ConceptCardsBlock({
  data,
  accentColor,
}: ConceptCardsBlockProps) {
  const items: ConceptItem[] = data?.items ?? [];
  if (!items.length) return null;

  const rgb = colorRgb(accentColor);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Section label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: `linear-gradient(to bottom, ${accentColor}, transparent)`,
          }}
        />
        <span
          style={{
            color: C.dim,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Key Concepts
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to right, rgba(${rgb},.2), transparent)`,
          }}
        />
      </div>

      {/* Responsive card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((item, i) => (
          <ConceptCard
            key={i}
            item={item}
            accentColor={accentColor}
            rgb={rgb}
          />
        ))}
      </div>
    </div>
  );
}
