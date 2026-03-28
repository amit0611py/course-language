import { C } from "../../theme";
import type { AnimationBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// ANIMATION BLOCK — Lottie animation placeholder
// Future: integrate @lottiefiles/react-lottie-player
// For now renders a placeholder with the animation source info
// ─────────────────────────────────────────────────────────────
interface AnimationBlockProps {
  data: AnimationBlockData;
  accentColor: string;
}

export default function AnimationBlock({ data, accentColor }: AnimationBlockProps) {
  return (
    <div
      style={{
        marginBottom: 24,
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: "hidden",
        padding: "48px 24px",
        textAlign: "center",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}
    >
      <span style={{ fontSize: 40 }} className="float">🎬</span>
      <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>
        Lottie Animation
      </div>
      <div style={{ color: C.dim, fontSize: 12 }}>
        {data.src ? (
          <span>
            Source:{" "}
            <code
              style={{
                color: accentColor, background: `rgba(255,255,255,.05)`,
                padding: "1px 5px", borderRadius: 4, fontSize: 11,
              }}
            >
              {data.src}
            </code>
          </span>
        ) : (
          "Animation source not specified"
        )}
      </div>
      <div
        style={{
          marginTop: 8, color: accentColor, fontSize: 11, fontWeight: 600,
          background: `rgba(255,255,255,.05)`, padding: "4px 12px", borderRadius: 20,
        }}
      >
        Install @lottiefiles/react-lottie-player to enable
      </div>
    </div>
  );
}
