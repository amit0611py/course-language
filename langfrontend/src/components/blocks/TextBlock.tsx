import { C } from "../../theme";
import type { TextBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// TEXT BLOCK — renders plain text or simple markdown-like content
// ─────────────────────────────────────────────────────────────
interface TextBlockProps {
  data: TextBlockData;
  accentColor: string;
}

// Minimal inline-markdown renderer (bold, inline-code, line breaks)
function renderInline(text: string, accentColor: string): React.ReactNode[] {
  // Split on **bold** and `code` spans
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: C.text }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            color: accentColor,
            background: `rgba(255,255,255,.06)`,
            padding: "1px 5px", borderRadius: 4,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontSize: "0.9em",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function TextBlock({ data, accentColor }: TextBlockProps) {
  const paragraphs = (data.content || "").split(/\n{2,}/);

  return (
    <div style={{ marginBottom: 24 }}>
      {data.heading && (
        <h3
          style={{
            color: C.text, fontSize: 18, fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {data.heading}
        </h3>
      )}
      {paragraphs.map((para, i) => {
        // Bullet list
        if (para.trim().startsWith("- ")) {
          const items = para.split("\n").filter((l) => l.trim().startsWith("- "));
          return (
            <ul key={i} style={{ paddingLeft: 20, marginBottom: 12 }}>
              {items.map((item, j) => (
                <li
                  key={j}
                  style={{
                    color: C.muted, fontSize: 15, lineHeight: 1.8,
                    listStyleType: "disc",
                  }}
                >
                  {renderInline(item.replace(/^- /, ""), accentColor)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            style={{ color: C.muted, fontSize: 15, lineHeight: 1.8, marginBottom: 12 }}
          >
            {renderInline(para, accentColor)}
          </p>
        );
      })}
    </div>
  );
}
