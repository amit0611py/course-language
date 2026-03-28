import { C, colorRgb } from "../../theme";
import type { NoteBlockData, WarningBlockData } from "../../types";

// ─────────────────────────────────────────────────────────────
// NOTE BLOCK — two smart rendering modes:
//
//  1. CONCEPT GRID  (auto-detected)
//     Trigger: content starts with **Heading** then has
//              "- **Term** — description" bullet lines
//     Output:  🎯 heading + 2-column card grid
//
//  2. REGULAR NOTE  (everything else)
//     Output:  left-bordered blue callout
//     Supports ``` code fences inside content → rendered as <pre>
//
// WARNING BLOCK — amber callout (same code-fence support)
// ─────────────────────────────────────────────────────────────

const INFO_COLOR = "#60a5fa"; // blue-400
const WARN_COLOR = "#fbbf24"; // amber-400

// Fallback icons (used when keyword lookup finds nothing)
const FALLBACK_ICONS = [
  "🖥️", "📦", "▶️", "⚙️", "♻️", "🔒",
  "⚡", "🎯", "📝", "🔄", "🌐", "🔧",
];

// ─────────────────────────────────────────────────────────────
// Smart icon lookup — maps concept term keywords → emoji
// Checks the concept NAME first, then falls back to FALLBACK_ICONS
// ─────────────────────────────────────────────────────────────
function conceptIcon(name: string, fallbackIdx: number): string {
  const n = name.toLowerCase();

  // ── Java / JVM ecosystem ────────────────────────────────────
  if (/\bjvm\b|virtual machine/.test(n))                    return "🖥️";
  if (/\bjdk\b|development kit|toolbox/.test(n))            return "🧰";
  if (/\bjre\b|runtime environment/.test(n))                return "▶️";
  if (/bytecode|\.class|compile/.test(n))                   return "⚙️";
  if (/garbage|memory manage|gc\b/.test(n))                 return "♻️";
  if (/strong.typ|type.safe|strict.typ/.test(n))            return "🔒";

  // ── OOP concepts ────────────────────────────────────────────
  if (/inherit|extend|super/.test(n))                       return "🧬";
  if (/polymorphism|overrid|overload/.test(n))              return "🎭";
  if (/encapsulat/.test(n))                                 return "🔐";
  if (/abstract|interface/.test(n))                         return "🔌";
  if (/\bclass\b|blueprint/.test(n))                        return "📐";
  if (/\bobject\b|instance/.test(n))                        return "🔵";
  if (/constructor|init/.test(n))                           return "🏗️";

  // ── Memory & execution ──────────────────────────────────────
  if (/\bheap\b|\bstack\b|memory layout/.test(n))           return "🧠";
  if (/thread|concurrent|parallel|async/.test(n))           return "🧵";
  if (/\block\b|\bsync|monitor|mutex/.test(n))              return "🔒";
  if (/exception|error|try.catch|throw/.test(n))            return "⚠️";

  // ── Language features ────────────────────────────────────────
  if (/lambda|functional|arrow func/.test(n))               return "⚡";
  if (/stream\b|pipeline/.test(n))                          return "🌊";
  if (/generic|type.param|wildcard/.test(n))                return "🔮";
  if (/annotation|@[a-z]/.test(n))                          return "🏷️";
  if (/static\b|singleton/.test(n))                         return "🔩";
  if (/access|visib|public|private|protected/.test(n))      return "🔑";
  if (/\bfinal\b|immutab/.test(n))                          return "🛡️";
  if (/variabl|field|propert/.test(n))                      return "📌";
  if (/method|function|procedure/.test(n))                  return "🔧";
  if (/loop|iter|for.each|while|repeat/.test(n))            return "🔄";
  if (/condition|if.else|switch|branching/.test(n))         return "🔀";

  // ── Data structures ──────────────────────────────────────────
  if (/array|list|vector/.test(n))                          return "📊";
  if (/\bmap\b|\bhashmap\b|\bdictionary\b/.test(n))         return "🗂️";
  if (/\bset\b|\btree.?set\b/.test(n))                      return "🌳";
  if (/queue|deque|stack.data/.test(n))                     return "📥";
  if (/collection|iterable/.test(n))                        return "📚";
  if (/string|text|char/.test(n))                           return "📝";
  if (/integer|number|numeric|double|float/.test(n))        return "🔢";
  if (/boolean|flag/.test(n))                               return "🏁";

  // ── Algorithms ───────────────────────────────────────────────
  if (/sort|order/.test(n))                                 return "🔀";
  if (/search|binary.search|find/.test(n))                  return "🔍";
  if (/recurs/.test(n))                                     return "🌀";
  if (/complex|big.o|performance|optim/.test(n))            return "📈";

  // ── APIs & runtime ───────────────────────────────────────────
  if (/\bapi\b|rest|http|endpoint/.test(n))                 return "🌐";
  if (/database|sql|jdbc|jpa|repository/.test(n))           return "🗄️";
  if (/security|auth|jwt|oauth|encrypt/.test(n))            return "🔐";
  if (/file|io\b|input|output|reader|writer/.test(n))       return "📁";
  if (/network|socket|tcp|udp/.test(n))                     return "📡";
  if (/log|debug|trace|monitor/.test(n))                    return "🧪";
  if (/test|junit|mock|assert/.test(n))                     return "✅";

  // ── Build & deployment ───────────────────────────────────────
  if (/gradle|maven|build.tool/.test(n))                    return "🔨";
  if (/deploy|release|publish/.test(n))                     return "🚀";
  if (/docker|container/.test(n))                           return "🐳";
  if (/spring|boot|framework/.test(n))                      return "🍃";
  if (/package|module|import|namespace/.test(n))            return "📦";

  // ── Generic concept fallback ─────────────────────────────────
  if (/platform|portable|cross.platform/.test(n))           return "🌍";
  if (/pattern|design.pattern/.test(n))                     return "🎨";
  if (/principle|concept|theory/.test(n))                   return "💡";

  return FALLBACK_ICONS[fallbackIdx % FALLBACK_ICONS.length];
}

// ─────────────────────────────────────────────────────────────
// Concept-list detector
// ─────────────────────────────────────────────────────────────
interface ConceptItem { name: string; desc: string }
interface ConceptList { heading: string; items: ConceptItem[] }

function detectConceptList(raw: string): ConceptList | null {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 3) return null;

  // First non-empty line must be exactly **Heading** (no other text)
  const hm = lines[0].match(/^\*\*([^*]+)\*\*$/);
  if (!hm) return null;

  const items: ConceptItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Accept em-dash (—), en-dash (–) or ascii hyphen-space as separator
    const m = lines[i].match(/^-\s*\*\*([^*]+)\*\*\s*[—–-]\s*(.+)$/);
    if (m) items.push({ name: m[1].trim(), desc: m[2].trim() });
  }

  return items.length >= 2 ? { heading: hm[1], items } : null;
}

// ─────────────────────────────────────────────────────────────
// Inline markdown renderer  (**bold**, `code`)
// ─────────────────────────────────────────────────────────────
function renderInline(text: string, accentColor: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return <strong key={i} style={{ color: C.text }}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code
          key={i}
          style={{
            color: accentColor, background: "rgba(255,255,255,.06)",
            padding: "1px 5px", borderRadius: 4,
            fontFamily: "'Fira Code', monospace", fontSize: "0.9em",
          }}
        >
          {p.slice(1, -1)}
        </code>
      );
    return <span key={i}>{p}</span>;
  });
}

// ─────────────────────────────────────────────────────────────
// Note body renderer  (splits on ``` fences)
// ─────────────────────────────────────────────────────────────
function NoteBody({ content, accentColor }: { content: string; accentColor: string }) {
  const FENCE_RE = /```(?:[^\n]*)?\n([\s\S]*?)```/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  FENCE_RE.lastIndex = 0;
  while ((m = FENCE_RE.exec(content)) !== null) {
    // Text before this fence
    const before = content.slice(last, m.index).trim();
    if (before) {
      before.split(/\n{2,}/).forEach((para) => {
        const p = para.trim();
        if (p)
          nodes.push(
            <p key={key++} style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
              {renderInline(p, accentColor)}
            </p>
          );
      });
    }
    // Code fence → <pre>
    nodes.push(
      <pre
        key={key++}
        style={{
          background: "#1e1e2e", borderRadius: 8, padding: "12px 16px",
          fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          fontSize: 12, color: "#f8f8f2",
          whiteSpace: "pre-wrap", lineHeight: 1.8,
          margin: "6px 0 4px", overflowX: "auto",
        }}
      >
        {m[1].trim()}
      </pre>
    );
    last = m.index + m[0].length;
  }

  // Remaining text after the last fence
  const tail = content.slice(last).trim();
  if (tail) {
    tail.split(/\n{2,}/).forEach((para) => {
      const p = para.trim();
      if (p)
        nodes.push(
          <p key={key++} style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: "0 0 6px" }}>
            {renderInline(p, accentColor)}
          </p>
        );
    });
  }

  return <>{nodes}</>;
}

// ─────────────────────────────────────────────────────────────
// Concept card grid
// ─────────────────────────────────────────────────────────────
function ConceptGrid({ heading, items, accentColor }: ConceptList & { accentColor: string }) {
  const rgb = colorRgb(accentColor);
  return (
    <div style={{ marginBottom: 28 }}>
      {/* Heading row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: `rgba(${rgb},.14)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15,
          }}
        >
          🎯
        </div>
        <h3 style={{ color: C.text, fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: -0.2 }}>
          {heading}
        </h3>
      </div>

      {/* 2-column card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="card-hover"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 7,
              transition: "border-color .2s, background .2s",
            }}
          >
            {/* Icon + term name (keyword-matched per concept) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
                {conceptIcon(item.name, i)}
              </span>
              <span style={{ color: accentColor, fontWeight: 700, fontSize: 14 }}>
                {item.name}
              </span>
            </div>
            {/* Description */}
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Public exports
// ─────────────────────────────────────────────────────────────

interface NoteBlockProps   { data: NoteBlockData;    accentColor: string }
interface WarningBlockProps { data: WarningBlockData; accentColor: string }

export function NoteBlock({ data, accentColor }: NoteBlockProps) {
  // Auto-detect concept list → card grid
  const concepts = detectConceptList(data.content ?? "");
  if (concepts) {
    return <ConceptGrid {...concepts} accentColor={accentColor} />;
  }

  // Regular note — left-bordered callout with code-fence support
  const rgb = colorRgb(INFO_COLOR);
  return (
    <div
      style={{
        background: `rgba(${rgb},.07)`,
        border: `1px solid rgba(${rgb},.25)`,
        borderLeft: `4px solid ${INFO_COLOR}`,
        borderRadius: 10, padding: "14px 18px",
        marginBottom: 20,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>💡</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.title && (
          <div style={{ color: INFO_COLOR, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            {data.title}
          </div>
        )}
        <NoteBody content={data.content ?? ""} accentColor={accentColor} />
      </div>
    </div>
  );
}

export function WarningBlock({ data }: WarningBlockProps) {
  const rgb = colorRgb(WARN_COLOR);
  return (
    <div
      style={{
        background: `rgba(${rgb},.07)`,
        border: `1px solid rgba(${rgb},.3)`,
        borderLeft: `4px solid ${WARN_COLOR}`,
        borderRadius: 10, padding: "14px 18px",
        marginBottom: 20,
        display: "flex", gap: 12, alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {data.title && (
          <div style={{ color: WARN_COLOR, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
            {data.title}
          </div>
        )}
        <NoteBody content={data.content ?? ""} accentColor={WARN_COLOR} />
      </div>
    </div>
  );
}
