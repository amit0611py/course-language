import { Fragment, useState } from "react";
import { createPortal } from "react-dom";
import TextBlock from "./TextBlock";
import CodeBlock from "./CodeBlock";
import DiagramBlock from "./DiagramBlock";
import QuizBlock from "./QuizBlock";
import QuizGroup from "./QuizGroup";
import { NoteBlock, WarningBlock } from "./NoteBlock";
import ImageBlock from "./ImageBlock";
import VideoBlock from "./VideoBlock";
import AnimationBlock from "./AnimationBlock";
import ConceptCardsBlock from "./ConceptCardsBlock";
import PremiumModal from "../PremiumModal";
import { C, colorRgb } from "../../theme";
import type {
  Block,
  TextBlockData,
  CodeBlockData,
  DiagramBlockData,
  QuizBlockData,
  NoteBlockData,
  WarningBlockData,
  ImageBlockData,
  VideoBlockData,
  AnimationBlockData,
  ConceptCardsBlockData,
} from "../../types";

// ─────────────────────────────────────────────────────────────
// PRE-PROCESSING
// ─────────────────────────────────────────────────────────────
type RenderEntry =
  | { kind: "single";     block: Block   }
  | { kind: "quiz-group"; blocks: Block[] };

function preprocessBlocks(raw: Block[]): RenderEntry[] {
  const skipIdx   = new Set<number>();
  const outputMap = new Map<number, string>();

  for (let i = 0; i < raw.length - 1; i++) {
    const curr = raw[i];
    const next = raw[i + 1];
    if (curr.type !== "code") continue;
    if (!(curr.data as unknown as CodeBlockData).runnable) continue;
    if (next.type !== "note") continue;
    const noteContent: string = (next.data as unknown as NoteBlockData).content ?? "";
    if (!noteContent.includes("Expected Output")) continue;
    const fenceMatch = noteContent.match(/```(?:[^\n]*)?\n?([\s\S]*?)```/);
    if (!fenceMatch) continue;
    outputMap.set(i, fenceMatch[1].trim());
    skipIdx.add(i + 1);
  }

  const entries: RenderEntry[] = [];
  let i = 0;
  while (i < raw.length) {
    if (skipIdx.has(i)) { i++; continue; }
    const block = raw[i];
    if (block.type === "code" && outputMap.has(i)) {
      entries.push({ kind: "single", block: { ...block, data: { ...block.data, output: outputMap.get(i) } } });
      i++;
      continue;
    }
    if (block.type === "quiz") {
      const quizBlocks: Block[] = [];
      while (i < raw.length && raw[i].type === "quiz" && !skipIdx.has(i)) {
        quizBlocks.push(raw[i]);
        i++;
      }
      entries.push({ kind: "quiz-group", blocks: quizBlocks });
      continue;
    }
    entries.push({ kind: "single", block });
    i++;
  }
  return entries;
}

// ─────────────────────────────────────────────────────────────
// PREMIUM GATE BLOCK
// Portal renders the modal at document.body — fully escaping the
// overflowY:auto scroll container so it covers the entire screen.
// ─────────────────────────────────────────────────────────────
function PremiumGateBlock({ lockedCount }: { lockedCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      marginTop: 24, padding: "28px 24px",
      background: "linear-gradient(to bottom, rgba(6,6,15,0) 0%, rgba(6,6,15,.95) 30%, rgba(6,6,15,1) 100%)",
      borderRadius: 14, textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16,
        background: "linear-gradient(135deg,rgba(124,58,237,.25),rgba(79,70,229,.25))",
        border: "1px solid rgba(124,58,237,.4)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
      }}>🔒</div>

      <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 16 }}>Premium Content</div>
      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, maxWidth: 320 }}>
        {lockedCount > 0
          ? `${lockedCount} more section${lockedCount > 1 ? "s" : ""} available with Premium.`
          : "Full content available with Premium access."}
      </div>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 28px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 6px 20px rgba(124,58,237,.4)", marginTop: 4,
        }}
      >
        Unlock Premium →
      </button>

      {open && createPortal(
        <PremiumModal forceOpen onClose={() => setOpen(false)} />,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION HEADINGS
// ─────────────────────────────────────────────────────────────
const SECTION_META: Partial<Record<string, { icon: string; title: string }>> = {
  code:         { icon: "💻", title: "Code Playground"  },
  diagram:      { icon: "🗺", title: "Visual Diagram"   },
  "quiz-group": { icon: "🧠", title: "Knowledge Check"  },
};

function SectionHeading({ icon, title, accentColor }: { icon: string; title: string; accentColor: string }) {
  const rgb = colorRgb(accentColor);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 36, marginBottom: 18 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `rgba(${rgb},.14)`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
      }}>
        {icon}
      </div>
      <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>
        {title}
      </h2>
      <div style={{
        flex: 1, height: 1,
        background: `linear-gradient(to right, rgba(${rgb},.3), transparent)`,
        marginLeft: 4,
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SINGLE BLOCK DISPATCHER
// ─────────────────────────────────────────────────────────────
interface SingleBlockProps { block: Block; accentColor: string }

function SingleBlock({ block, accentColor }: SingleBlockProps) {
  const d = block.data as Record<string, unknown>;
  switch (block.type) {
    case "text":          return <TextBlock data={d as unknown as TextBlockData} accentColor={accentColor} />;
    case "code":          return <CodeBlock data={d as unknown as CodeBlockData} accentColor={accentColor} />;
    case "diagram":       return <DiagramBlock data={d as unknown as DiagramBlockData} accentColor={accentColor} />;
    case "quiz":          return <QuizBlock data={d as unknown as QuizBlockData} accentColor={accentColor} />;
    case "note":          return <NoteBlock data={d as unknown as NoteBlockData} accentColor={accentColor} />;
    case "warning":       return <WarningBlock data={d as unknown as WarningBlockData} accentColor={accentColor} />;
    case "image":         return <ImageBlock data={d as unknown as ImageBlockData} accentColor={accentColor} />;
    case "video":         return <VideoBlock data={d as unknown as VideoBlockData} accentColor={accentColor} />;
    case "animation":     return <AnimationBlock data={d as unknown as AnimationBlockData} accentColor={accentColor} />;
    case "concept_cards": return <ConceptCardsBlock data={d as unknown as ConceptCardsBlockData} accentColor={accentColor} />;
    case "premium_gate":  return <PremiumGateBlock lockedCount={(d.lockedCount as number) ?? 0} />;
    default:
      return (
        <div style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: "12px 16px",
          marginBottom: 16, color: C.dim, fontSize: 12,
        }}>
          ⚠ Unsupported block type:{" "}
          <code style={{ color: accentColor }}>{String(block.type)}</code>
        </div>
      );
  }
}

// ─────────────────────────────────────────────────────────────
// BLOCK RENDERER — main export
// ─────────────────────────────────────────────────────────────
interface BlockRendererProps { blocks: Block[]; accentColor: string }

export default function BlockRenderer({ blocks, accentColor }: BlockRendererProps) {
  if (!blocks?.length) {
    return (
      <div style={{ color: C.dim, fontSize: 14, padding: "24px 0" }}>
        No content blocks available for this topic.
      </div>
    );
  }

  const entries      = preprocessBlocks(blocks);
  const shownHeadings = new Set<string>();

  return (
    <>
      {entries.map((entry, i) => {
        const headingKey = entry.kind === "quiz-group" ? "quiz-group" : entry.block.type;
        const meta       = SECTION_META[headingKey];
        const showHeading = meta && !shownHeadings.has(headingKey);
        if (showHeading) shownHeadings.add(headingKey);

        return (
          <Fragment key={i}>
            {showHeading && (
              <SectionHeading icon={meta!.icon} title={meta!.title} accentColor={accentColor} />
            )}
            {entry.kind === "quiz-group" ? (
              <QuizGroup blocks={entry.blocks} accentColor={accentColor} />
            ) : (
              <SingleBlock block={entry.block} accentColor={accentColor} />
            )}
          </Fragment>
        );
      })}
    </>
  );
}
