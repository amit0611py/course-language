import { useState } from "react";
import { createPortal } from "react-dom";
import { C } from "../theme";
import PremiumModal from "./PremiumModal";

interface LockOverlayProps {
  locked: boolean;
  label?: string;
  description?: string;
  children: React.ReactNode;
  showBlurredPreview?: boolean;
  compact?: boolean;
}

export default function LockOverlay({
  locked,
  label = "Premium Content",
  description,
  children,
  showBlurredPreview = true,
  compact = false,
}: LockOverlayProps) {
  const [open, setOpen] = useState(false);

  if (!locked) return <>{children}</>;

  const modal = open
    ? createPortal(<PremiumModal forceOpen onClose={() => setOpen(false)} />, document.body)
    : null;

  if (compact) {
    return (
      <div style={{ display: "contents" }}>
        <span
          title="Premium content — upgrade to unlock"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            background: "rgba(124,58,237,.15)",
            border: "1px solid rgba(124,58,237,.3)",
            borderRadius: 6, padding: "1px 5px",
            color: "#a78bfa", fontSize: 10, fontWeight: 700,
            cursor: "pointer", flexShrink: 0, lineHeight: 1.4,
          }}
        >
          🔒 PRO
        </span>
        {modal}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {showBlurredPreview && (
        <div style={{
          filter: "blur(6px)", pointerEvents: "none",
          userSelect: "none", opacity: 0.35,
          maxHeight: 260, overflow: "hidden",
        }}>
          {children}
        </div>
      )}

      <div style={{
        position: showBlurredPreview ? "absolute" : "relative",
        inset: showBlurredPreview ? 0 : undefined,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: showBlurredPreview
          ? "linear-gradient(to bottom, rgba(6,6,15,0) 0%, rgba(6,6,15,.92) 40%, rgba(6,6,15,1) 100%)"
          : "rgba(13,13,32,.6)",
        borderRadius: 14,
        padding: showBlurredPreview ? "24px 20px 20px" : "32px 20px",
        flexDirection: "column", textAlign: "center", gap: 12,
        border: showBlurredPreview ? "none" : "1px solid rgba(124,58,237,.25)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: "linear-gradient(135deg,rgba(124,58,237,.25),rgba(79,70,229,.25))",
          border: "1px solid rgba(124,58,237,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
        }}>🔒</div>

        <div>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 15, letterSpacing: -0.3, marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, maxWidth: 300, margin: "0 auto" }}>
            {description ?? "Upgrade to Premium to unlock this content and get full access to all advanced material."}
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "10px 28px",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            border: "none", borderRadius: 10,
            color: "#fff", fontWeight: 700, fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(124,58,237,.4)",
            marginTop: 4,
          }}
        >
          Unlock Premium →
        </button>
      </div>

      {modal}
    </div>
  );
}

// ── Lock badge (sidebar) ──────────────────────────────────────
export function LockBadge({ onClick }: { onClick?: () => void }) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      style={{
        display: "inline-flex", alignItems: "center",
        fontSize: 10, color: "#a78bfa",
        flexShrink: 0, cursor: onClick ? "pointer" : "default",
        lineHeight: 1,
      }}
      title="Premium content"
    >
      🔒
    </span>
  );
}
