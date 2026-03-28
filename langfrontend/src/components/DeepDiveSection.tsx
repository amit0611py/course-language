import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { C, colorRgb } from "../theme";
import type { NavTopic } from "../types";

// ─────────────────────────────────────────────────────────────
// DEEP DIVE SECTION
// Renders a collapsible panel containing deep-dive child topics.
// Only shown when topic.children includes topics with isDeepDive=true.
//
// UX flow:
//   Collapsed → Banner with count + "Explore ↓" button
//   Expanded  → Grid of topic cards, each clickable to navigate
// ─────────────────────────────────────────────────────────────

interface DeepDiveSectionProps {
  topics: NavTopic[];
  accentColor: string;
  lang: string;
}

// ── Individual deep-dive topic card ───────────────────────────
interface TopicCardProps {
  topic: NavTopic;
  accentColor: string;
  rgb: string;
  onClick: () => void;
}

function DeepDiveCard({ topic, accentColor, rgb, onClick }: TopicCardProps) {
  const childCount = topic.children?.length ?? 0;

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        flex: "1 1 220px",
        minWidth: 0,
        background: `rgba(${rgb},.06)`,
        border: `1px solid rgba(${rgb},.2)`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all .18s",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Top row: DEEP DIVE badge + time */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 9, fontWeight: 800, letterSpacing: 0.6,
            color: accentColor,
            background: `rgba(${rgb},.2)`,
            padding: "2px 7px", borderRadius: 5,
          }}
        >
          DEEP DIVE
        </span>
        {topic.estimatedMins && (
          <span style={{ color: C.dim, fontSize: 10 }}>
            ⏱ {topic.estimatedMins} min
          </span>
        )}
      </div>

      {/* Topic title */}
      <div
        style={{
          color: C.text, fontWeight: 700, fontSize: 14,
          lineHeight: 1.45, flex: 1,
        }}
      >
        {topic.title}
      </div>

      {/* Sub-topic count */}
      {childCount > 0 && (
        <div style={{ color: C.dim, fontSize: 11 }}>
          + {childCount} sub-topic{childCount > 1 ? "s" : ""}
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          color: accentColor, fontSize: 12, fontWeight: 700,
          marginTop: 4,
          display: "flex", alignItems: "center", gap: 4,
        }}
      >
        Explore →
      </div>
    </div>
  );
}

// ── Deep Dive Section wrapper ─────────────────────────────────
export default function DeepDiveSection({ topics, accentColor, lang }: DeepDiveSectionProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const rgb = colorRgb(accentColor);

  if (!topics.length) return null;

  return (
    <div
      className="fu"
      style={{
        marginTop: 32,
        marginBottom: 8,
        border: `1px solid rgba(${rgb},.25)`,
        borderRadius: 16,
        overflow: "hidden",
        animationDelay: ".18s",
      }}
    >
      {/* ── Toggle header ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          background: open
            ? `rgba(${rgb},.08)`
            : `rgba(${rgb},.04)`,
          borderBottom: open ? `1px solid rgba(${rgb},.2)` : "none",
          cursor: "pointer",
          transition: "background .2s",
          textAlign: "left",
        }}
      >
        {/* Left: icon + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `rgba(${rgb},.15)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}
          >
            🔬
          </div>
          <div>
            <div
              style={{
                color: accentColor, fontWeight: 800, fontSize: 14,
                letterSpacing: 0.1,
              }}
            >
              Deep Dive
            </div>
            <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
              {topics.length} advanced topic{topics.length > 1 ? "s" : ""}
              {" · "}Explore when you're ready
            </div>
          </div>
        </div>

        {/* Right: expand/collapse pill */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 5,
            color: accentColor,
            background: `rgba(${rgb},.12)`,
            borderRadius: 8, padding: "5px 12px",
            fontSize: 11, fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {open ? (
            <><ChevronUp size={13} /> Collapse</>
          ) : (
            <><ChevronDown size={13} /> Explore</>
          )}
        </div>
      </button>

      {/* ── Expanded: topic cards ── */}
      {open && (
        <div
          style={{
            padding: "20px",
            display: "flex", gap: 14, flexWrap: "wrap",
            background: `rgba(${rgb},.025)`,
          }}
        >
          {topics.map((t) => (
            <DeepDiveCard
              key={t.path}
              topic={t}
              accentColor={accentColor}
              rgb={rgb}
              onClick={() => navigate(`/${lang}/t/${t.path}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
