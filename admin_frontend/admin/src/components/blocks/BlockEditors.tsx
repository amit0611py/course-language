import { useState } from "react";
import { A, BLOCK_COLORS, BLOCK_ICONS, BLOCK_TYPES } from "../../theme";
import { Button, Input, Textarea, Select } from "../ui";
import type { Block, ConceptItem, QuizOption } from "../../types";

// ── Block type picker ─────────────────────────────────────────
export function BlockTypePicker({ onSelect, onClose }: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      background: A.card, border: `1px solid ${A.border}`,
      borderRadius: 12, padding: 16,
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
    }}>
      {BLOCK_TYPES.map(type => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
          style={{
            background: `${BLOCK_COLORS[type]}11`,
            border: `1px solid ${BLOCK_COLORS[type]}33`,
            borderRadius: 8, padding: "10px 8px",
            color: BLOCK_COLORS[type], fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}
        >
          <span style={{ fontSize: 18 }}>{BLOCK_ICONS[type]}</span>
          {type}
        </button>
      ))}
    </div>
  );
}

// ── Default data for new blocks ────────────────────────────────
export function defaultBlock(type: string): Block {
  const defaults: Record<string, Record<string, unknown>> = {
    text:          { content: "" },
    concept_cards: { items: [{ icon: "💡", title: "", desc: "" }] },
    code:          { snippet: "", language: "java", filename: "", runnable: false },
    diagram:       { diagramKey: "", title: "" },
    quiz:          { questionId: "", questionText: "", questionType: "mcq",
                     options: [
                       { id: "a", text: "", correct: true },
                       { id: "b", text: "", correct: false },
                       { id: "c", text: "", correct: false },
                       { id: "d", text: "", correct: false },
                     ], explanation: "" },
    note:          { content: "" },
    warning:       { content: "" },
    image:         { url: "", alt: "", caption: "" },
    video:         { url: "", title: "" },
  };
  return { type: type as Block["type"], data: defaults[type] ?? {} };
}

// ── Text block editor ──────────────────────────────────────────
function TextEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <Textarea
      label="Content (Markdown supported)"
      value={(data.content as string) ?? ""}
      onChange={e => onChange({ ...data, content: e.target.value })}
      style={{ minHeight: 120 }}
    />
  );
}

// ── Note / Warning block editor ────────────────────────────────
function NoteEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <Textarea
      label="Content"
      value={(data.content as string) ?? ""}
      onChange={e => onChange({ ...data, content: e.target.value })}
      style={{ minHeight: 80 }}
    />
  );
}

// ── Concept cards editor ───────────────────────────────────────
function ConceptCardsEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const items = (data.items as ConceptItem[]) ?? [];

  const update = (i: number, field: keyof ConceptItem, val: string) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: val } : item);
    onChange({ ...data, items: next });
  };
  const add    = () => onChange({ ...data, items: [...items, { icon: "💡", title: "", desc: "" }] });
  const remove = (i: number) => onChange({ ...data, items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <div key={i} style={{
          background: A.surface, border: `1px solid ${A.border}`,
          borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input placeholder="Icon emoji" value={item.icon ?? ""} onChange={e => update(i, "icon", e.target.value)}
              style={{ width: 70 }} />
            <Input placeholder="Title" value={item.title ?? ""} onChange={e => update(i, "title", e.target.value)}
              style={{ flex: 1 }} />
            <button onClick={() => remove(i)} style={{
              background: `${A.red}22`, border: `1px solid ${A.red}44`,
              color: A.red, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12,
            }}>✕</button>
          </div>
          <Textarea placeholder="Description" value={item.desc ?? ""}
            onChange={e => update(i, "desc", e.target.value)} style={{ minHeight: 56 }} />
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={add} style={{ alignSelf: "flex-start" }}>
        + Add Card
      </Button>
    </div>
  );
}

// ── Code block editor ──────────────────────────────────────────
function CodeEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Input label="Filename" value={(data.filename as string) ?? ""}
          onChange={e => onChange({ ...data, filename: e.target.value })} style={{ flex: 1 }} />
        <Select label="Language"
          value={(data.language as string) ?? "java"}
          onChange={e => onChange({ ...data, language: e.target.value })}
          options={[
            { value: "java",       label: "Java"       },
            { value: "python",     label: "Python"     },
            { value: "javascript", label: "JavaScript" },
            { value: "typescript", label: "TypeScript" },
            { value: "bash",       label: "Bash"       },
            { value: "sql",        label: "SQL"        },
          ]}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Runnable
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", cursor: "pointer" }}>
            <input type="checkbox" checked={!!(data.runnable)}
              onChange={e => onChange({ ...data, runnable: e.target.checked })} />
            <span style={{ fontSize: 13, color: A.text }}>Yes</span>
          </label>
        </div>
      </div>
      <Textarea label="Code snippet" mono value={(data.snippet as string) ?? ""}
        onChange={e => onChange({ ...data, snippet: e.target.value })} style={{ minHeight: 160 }} />
      <Textarea label="Expected output (optional)" mono
        value={(data.expectedOutput as string) ?? ""}
        onChange={e => onChange({ ...data, expectedOutput: e.target.value })} style={{ minHeight: 60 }} />
    </div>
  );
}

// ── Diagram block editor ───────────────────────────────────────
function DiagramEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const isMermaid = (data.diagramType as string) === "mermaid";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Input label="Diagram Key (e.g. java_jvm)" value={(data.diagramKey as string) ?? ""}
          onChange={e => onChange({ ...data, diagramKey: e.target.value })} style={{ flex: 1 }} />
        <Input label="Title" value={(data.title as string) ?? ""}
          onChange={e => onChange({ ...data, title: e.target.value })} style={{ flex: 1 }} />
        <Select label="Type"
          value={(data.diagramType as string) ?? "svg"}
          onChange={e => onChange({ ...data, diagramType: e.target.value })}
          options={[
            { value: "svg",     label: "SVG (from DB)"   },
            { value: "mermaid", label: "Mermaid (inline)" },
            { value: "png",     label: "Image URL"        },
          ]}
        />
      </div>
      {isMermaid && (
        <Textarea label="Mermaid source" mono
          value={(data.mermaid as string) ?? ""}
          onChange={e => onChange({ ...data, mermaid: e.target.value })}
          style={{ minHeight: 120 }} />
      )}
      {(data.diagramType as string) === "png" && (
        <Input label="Image URL" value={(data.url as string) ?? ""}
          onChange={e => onChange({ ...data, url: e.target.value })} />
      )}
      {(data.diagramType as string) === "svg" && (
        <div style={{ fontSize: 11, color: A.dim, padding: "6px 10px", background: A.surface, borderRadius: 6 }}>
          SVG content is stored in the diagrams table. Run <code style={{ color: A.blue }}>npm run export:diagrams</code> to populate from React components.
        </div>
      )}
    </div>
  );
}

// ── Quiz block editor ──────────────────────────────────────────
function QuizBlockEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const options = (data.options as QuizOption[]) ?? [];
  const updateOption = (i: number, field: keyof QuizOption, val: string | boolean) => {
    const next = options.map((o, idx) => {
      if (field === "correct") return { ...o, correct: idx === i };
      return idx === i ? { ...o, [field]: val } : o;
    });
    onChange({ ...data, options: next });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input label="Question ID (e.g. q_java_jvm_001)" value={(data.questionId as string) ?? ""}
        onChange={e => onChange({ ...data, questionId: e.target.value })} />
      <Textarea label="Question text" value={(data.questionText as string) ?? ""}
        onChange={e => onChange({ ...data, questionText: e.target.value })} style={{ minHeight: 60 }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
        Options (select correct answer)
      </div>
      {options.map((opt, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="radio" name="correct" checked={opt.correct}
            onChange={() => updateOption(i, "correct", true)}
            style={{ flexShrink: 0, cursor: "pointer" }} />
          <Input placeholder={`Option ${String.fromCharCode(65 + i)}`}
            value={opt.text ?? ""}
            onChange={e => updateOption(i, "text", e.target.value)}
            style={{ flex: 1, borderColor: opt.correct ? A.green : A.border }} />
        </div>
      ))}
      <Textarea label="Explanation" value={(data.explanation as string) ?? ""}
        onChange={e => onChange({ ...data, explanation: e.target.value })} style={{ minHeight: 56 }} />
    </div>
  );
}

// ── Image block editor ─────────────────────────────────────────
function ImageEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input label="Image URL" value={(data.url as string) ?? ""}
        onChange={e => onChange({ ...data, url: e.target.value })} />
      <div style={{ display: "flex", gap: 10 }}>
        <Input label="Alt text" value={(data.alt as string) ?? ""}
          onChange={e => onChange({ ...data, alt: e.target.value })} style={{ flex: 1 }} />
        <Input label="Caption" value={(data.caption as string) ?? ""}
          onChange={e => onChange({ ...data, caption: e.target.value })} style={{ flex: 1 }} />
      </div>
    </div>
  );
}

// ── Video block editor ─────────────────────────────────────────
function VideoEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Input label="Video URL" value={(data.url as string) ?? ""}
        onChange={e => onChange({ ...data, url: e.target.value })} />
      <Input label="Title" value={(data.title as string) ?? ""}
        onChange={e => onChange({ ...data, title: e.target.value })} />
    </div>
  );
}

// ── Master dispatcher ──────────────────────────────────────────
export function BlockDataEditor({ block, onChange }: {
  block: Block;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const props = { data: block.data, onChange };
  switch (block.type) {
    case "text":          return <TextEditor {...props} />;
    case "note":
    case "warning":       return <NoteEditor {...props} />;
    case "concept_cards": return <ConceptCardsEditor {...props} />;
    case "code":          return <CodeEditor {...props} />;
    case "diagram":       return <DiagramEditor {...props} />;
    case "quiz":          return <QuizBlockEditor {...props} />;
    case "image":         return <ImageEditor {...props} />;
    case "video":         return <VideoEditor {...props} />;
    default:              return <Textarea label="Data (JSON)" value={JSON.stringify(block.data, null, 2)}
                            onChange={e => { try { onChange(JSON.parse(e.target.value)); } catch {} }}
                            style={{ minHeight: 100 }} mono />;
  }
}
