import { useState } from "react";
import { C } from "../theme";
import SyntaxBlock from "./SyntaxBlock";

// ─────────────────────────────────────────────────────────────
// PLAYGROUND — code editor UI with simulated run
// Preserves exact design from original code-mastery
// ─────────────────────────────────────────────────────────────
interface PlaygroundProps {
  code: string;
  output?: string;
  filename?: string;
  language?: string;
}

export default function Playground({ code, output, filename, language }: PlaygroundProps) {
  const [tab,    setTab]    = useState<"code" | "output">("code");
  const [running, setRun]   = useState(false);
  const [hasRun,  setHasRun]= useState(false);

  const defaultFilename = filename ?? (
    (language === "python" || language === "py") ? "main.py" :
    (language === "typescript" || language === "ts") ? "main.ts" :
    "Main.java"
  );

  const run = () => {
    setTab("output"); setRun(true); setHasRun(false);
    setTimeout(() => { setRun(false); setHasRun(true); }, 1400);
  };

  return (
    <div
      style={{
        background: C.codeBg, borderRadius: 14, overflow: "hidden",
        border: `1px solid ${C.border}`, margin: "8px 0 0",
        boxShadow: "0 10px 40px rgba(0,0,0,.5)",
      }}
    >
      {/* ── Title bar ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "rgba(255,255,255,.03)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* Mac dots */}
        <div style={{ display: "flex", gap: 7 }}>
          {(["#ff5f56", "#ffbd2e", "#27c93f"] as const).map((c) => (
            <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", background: c }} />
          ))}
        </div>

        <span style={{ color: C.muted, fontSize: 12, fontFamily: "monospace" }}>
          {defaultFilename}
        </span>

        {/* Tab switcher + Run button */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              display: "flex", background: "rgba(0,0,0,.3)",
              borderRadius: 7, overflow: "hidden",
            }}
          >
            {(["code", "output"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "4px 13px", fontSize: 11,
                  background: tab === t ? "rgba(255,255,255,.1)" : "transparent",
                  color:      tab === t ? C.text : C.dim,
                  transition: "all .2s",
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={run}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: running ? C.dim : "#4ade80",
              color: "#000", padding: "5px 16px", borderRadius: 7,
              fontSize: 12, fontWeight: 700, transition: "all .2s",
            }}
          >
            {running
              ? <span className="spin" style={{ fontSize: 14 }}>↺</span>
              : <span style={{ fontSize: 12 }}>▶</span>
            }
            {running ? "Running…" : "Run"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: 16, minHeight: 140, overflowX: "auto" }}>
        {tab === "code" && <SyntaxBlock code={code} language={language} />}

        {tab === "output" && (
          <div className="fi">
            {running && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  color: C.muted, fontSize: 13, padding: 8,
                }}
              >
                <span className="spin" style={{ fontSize: 18 }}>↺</span>
                Compiling &amp; executing…
              </div>
            )}
            {hasRun && !running && output && (
              <div>
                <div
                  style={{
                    color: "#4ade80", fontSize: 10, fontFamily: "monospace",
                    marginBottom: 10, letterSpacing: 1,
                  }}
                >
                  ● CONSOLE OUTPUT
                </div>
                <pre
                  style={{
                    color: "#f8f8f2", fontFamily: "monospace",
                    fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.8,
                  }}
                >
                  {output}
                </pre>
              </div>
            )}
            {hasRun && !running && !output && (
              <div style={{ color: C.dim, fontSize: 13, padding: 8 }}>
                Program exited with code{" "}
                <span style={{ color: "#4ade80" }}>0</span>
              </div>
            )}
            {!running && !hasRun && (
              <div style={{ color: C.dim, fontSize: 13, padding: 8 }}>
                Click{" "}
                <strong style={{ color: "#4ade80" }}>▶ Run</strong>{" "}
                to execute
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
