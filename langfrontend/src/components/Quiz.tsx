import { useState } from "react";
import { C } from "../theme";
import type { QuizQuestion } from "../types";

// ─────────────────────────────────────────────────────────────
// QUIZ COMPONENT — interactive knowledge check
// Preserves exact visual design from original code-mastery
// Now accepts accentColor from topic/block for dynamic styling
// ─────────────────────────────────────────────────────────────
interface QuizProps {
  questions: QuizQuestion[];
  accentColor?: string;
}

export default function Quiz({ questions, accentColor = C.java }: QuizProps) {
  const [sel,  setSel]  = useState<Record<number, number>>({});
  const [done, setDone] = useState(false);

  const score = done
    ? questions.filter((_, i) => sel[i] === questions[i].correct).length
    : 0;

  const reset = () => { setSel({}); setDone(false); };

  return (
    <div
      style={{
        marginTop: 28, borderRadius: 14,
        border: `1px solid ${C.border}`, overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "14px 20px", background: "rgba(255,255,255,.03)",
          borderBottom: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <h3 style={{ color: C.text, fontSize: 15, fontWeight: 700 }}>🧠 Knowledge Check</h3>
        {done && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                color:
                  score === questions.length ? C.success
                  : score >= questions.length / 2 ? C.warn
                  : C.error,
                fontSize: 15, fontWeight: 700,
              }}
            >
              {score === questions.length ? "🏆" : "📊"} {score}/{questions.length}
            </span>
            <button
              onClick={reset}
              style={{
                padding: "4px 12px", background: C.border, color: C.muted,
                borderRadius: 6, fontSize: 11,
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Questions ── */}
      <div style={{ padding: "16px 20px" }}>
        {questions.map((q, qi) => (
          <div key={qi} style={{ marginBottom: 18 }}>
            <div style={{ color: C.text, fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
              <span style={{ color: C.muted, fontWeight: 400 }}>Q{qi + 1}. </span>
              {q.q}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {q.opts.map((opt, oi) => {
                const chosen  = sel[qi] === oi;
                const correct = q.correct === oi;
                let bg:     string = "transparent";
                let border: string = C.border;
                let color:  string = C.muted;

                if (chosen && !done)           { bg = `rgba(245,158,11,.12)`; border = accentColor; color = C.text; }
                if (done && correct)           { bg = "rgba(74,222,128,.12)";  border = C.success;  color = C.success; }
                if (done && chosen && !correct){ bg = "rgba(248,113,113,.12)"; border = C.error;    color = C.error;   }

                return (
                  <button
                    key={oi}
                    disabled={done}
                    className="quiz-opt"
                    onClick={() => setSel((s) => ({ ...s, [qi]: oi }))}
                    style={{
                      background: bg, border: `1px solid ${border}`,
                      borderRadius: 9, padding: "9px 14px", color,
                      fontSize: 13, textAlign: "left",
                      cursor: done ? "default" : "pointer",
                      transition: "all .2s", lineHeight: 1.5,
                    }}
                  >
                    {done && correct && "✓ "}
                    {done && chosen && !correct && "✗ "}
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {done && (
              <div
                style={{
                  marginTop: 8, padding: "9px 14px",
                  background: "rgba(255,255,255,.02)",
                  borderRadius: 8, color: C.muted, fontSize: 12, lineHeight: 1.6,
                }}
              >
                💡 {q.exp}
              </div>
            )}
          </div>
        ))}

        {!done && (
          <button
            onClick={() => setDone(true)}
            disabled={Object.keys(sel).length < questions.length}
            style={{
              padding: "10px 26px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              transition: "all .2s",
              background:
                Object.keys(sel).length < questions.length ? C.border : accentColor,
              color:
                Object.keys(sel).length < questions.length ? C.dim : "#000",
            }}
          >
            {Object.keys(sel).length < questions.length
              ? `Answer all (${Object.keys(sel).length}/${questions.length})`
              : "Submit Answers"}
          </button>
        )}
      </div>
    </div>
  );
}
