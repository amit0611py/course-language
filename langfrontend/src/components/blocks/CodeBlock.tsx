import { C } from "../../theme";
import Playground from "../Playground";
import type { CodeBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// CODE BLOCK — wraps the Playground component
// data.snippet  → code shown in editor
// data.output   → shown when user clicks Run
// data.filename → displayed in title bar
// ─────────────────────────────────────────────────────────────
interface CodeBlockProps {
  data: CodeBlockData;
  accentColor: string;
}

export default function CodeBlock({ data }: CodeBlockProps) {
  if (!data.snippet) {
    return (
      <div
        style={{
          background: C.codeBg, borderRadius: 12,
          border: `1px solid ${C.border}`,
          padding: 20, marginBottom: 24,
          color: C.dim, fontSize: 13, fontFamily: "monospace",
        }}
      >
        {/* No snippet provided */}
        <em>No code snippet provided</em>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <Playground
        code={data.snippet}
        output={data.output}
        filename={data.filename}
        language={data.language}
      />
    </div>
  );
}
