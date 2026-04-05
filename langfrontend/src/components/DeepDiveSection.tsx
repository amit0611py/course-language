import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C, colorRgb } from "../theme";
import type { NavTopic } from "../types";

// ─────────────────────────────────────────────────────────────
// DEEP DIVE SECTION
// Collapsible panel listing all deep-dive child topics for the
// current topic. Matches the visual style of TopicPage /
// Sidebar / HomePage (dark glass cards, accent colours).
//
// Props:
//   topics      — NavTopic[] where isDeepDive === true
//   accentColor — hex colour inherited from the parent topic
//   lang        — language slug used to build navigation paths
// ─────────────────────────────────────────────────────────────

interface DeepDiveSectionProps {
  topics: NavTopic[];
  accentColor: string;
  lang: string;
}

export default function DeepDiveSection({
  topics,
  accentColor,
  lang,
}: DeepDiveSectionProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const rgb = colorRgb(accentColor);

  if (topics.length === 0) return null;

  return (
    <div
      className="fu"
      style={{ animationDelay: ".16s", marginTop: 32 }}
    >
      {/* ── Section header / toggle ─────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: open
            ? `rgba(${rgb},.08)`
            : `rgba(${rgb},.04)`,
          border: `1px solid rgba(${rgb},.2)`,
          borderRadius: open ? "14px 14px 0 0" : 14,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          transition: "all .18s",
          textAlign: "left",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `rgba(${rgb},.15)`,
            border: `1px solid rgba(${rgb},.25)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          🔬
        </div>

        {/* Label */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: C.text,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: -0.2,
            }}
          >
            Deep Dive
          </div>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>
            {topics.length} advanced topic{topics.length !== 1 ? "s" : ""} — go deeper
          </div>
        </div>

        {/* Count pill + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: `rgba(${rgb},.15)`,
              color: accentColor,
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 20,
              border: `1px solid rgba(${rgb},.25)`,
            }}
          >
            {topics.length}
          </span>
          <span
            style={{
              color: C.muted,
              fontSize: 16,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform .2s",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* ── Collapsible topic list ───────────────────────────── */}
      {open && (
        <div
          style={{
            border: `1px solid rgba(${rgb},.2)`,
            borderTop: "none",
            borderRadius: "0 0 14px 14px",
            overflow: "hidden",
          }}
        >
          {topics.map((topic, idx) => (
            <DeepDiveRow
              key={topic.path}
              topic={topic}
              accentColor={accentColor}
              rgb={rgb}
              isLast={idx === topics.length - 1}
              onClick={() => navigate(`/${lang}/t/${topic.path}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Individual deep-dive topic row ────────────────────────────

interface DeepDiveRowProps {
  topic: NavTopic;
  accentColor: string;
  rgb: string;
  isLast: boolean;
  onClick: () => void;
}

function DeepDiveRow({
  topic,
  accentColor,
  rgb,
  isLast,
  onClick,
}: DeepDiveRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "13px 18px",
        cursor: "pointer",
        background: hovered ? `rgba(${rgb},.06)` : "transparent",
        borderBottom: isLast ? "none" : `1px solid rgba(${rgb},.1)`,
        transition: "background .15s",
      }}
    >
      {/* Microscope dot accent */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: `rgba(${rgb},.4)`,
          border: `2px solid rgba(${rgb},.6)`,
          flexShrink: 0,
        }}
      />

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: hovered ? accentColor : C.text,
            fontWeight: 600,
            fontSize: 13,
            transition: "color .15s",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {topic.title}
        </div>

        {/* Optional meta row */}
        {(topic.estimatedMins || topic.isPremium) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 3,
            }}
          >
            {topic.estimatedMins && (
              <span style={{ color: C.dim, fontSize: 10 }}>
                ⏱ {topic.estimatedMins} min
              </span>
            )}
            {topic.isPremium && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#a78bfa",
                  background: "rgba(124,58,237,.12)",
                  border: "1px solid rgba(124,58,237,.25)",
                  padding: "1px 6px",
                  borderRadius: 8,
                }}
              >
                🔒 PRO
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <span
        style={{
          color: hovered ? accentColor : C.dim,
          fontSize: 13,
          fontWeight: 700,
          transition: "color .15s, transform .15s",
          transform: hovered ? "translateX(3px)" : "none",
          flexShrink: 0,
        }}
      >
        →
      </span>
    </div>
  );
}