import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { A, BLOCK_COLORS, BLOCK_ICONS } from "../../theme";
import { Button } from "../ui";
import { BlockDataEditor, BlockTypePicker, defaultBlock } from "../blocks/BlockEditors";
import type { Block } from "../../types";

// ── Single sortable block row ─────────────────────────────────
function SortableBlock({
  id, block, index, expanded, onToggle, onChange, onDelete,
}: {
  id: string; block: Block; index: number;
  expanded: boolean; onToggle: () => void;
  onChange: (data: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const color = BLOCK_COLORS[block.type] ?? A.muted;
  const icon  = BLOCK_ICONS[block.type]  ?? "📦";

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        background: A.card, border: `1px solid ${expanded ? color + "44" : A.border}`,
        borderRadius: 10, marginBottom: 8,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Block header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", cursor: "pointer",
      }}>
        {/* Drag handle */}
        <span
          {...attributes} {...listeners}
          style={{ color: A.dim, fontSize: 14, cursor: "grab", flexShrink: 0, userSelect: "none" }}
        >
          ⋮⋮
        </span>

        {/* Index + type */}
        <span style={{ fontSize: 10, color: A.dim, minWidth: 20 }}>#{index + 1}</span>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
        <span
          style={{
            fontSize: 11, fontWeight: 700, color, letterSpacing: 0.5,
            textTransform: "uppercase", flex: 1,
          }}
          onClick={onToggle}
        >
          {block.type}
        </span>

        {/* Preview snippet */}
        {!expanded && (
          <span style={{ fontSize: 11, color: A.dim, flex: 2, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            onClick={onToggle}
          >
            {getPreview(block)}
          </span>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexShrink: 0 }}>
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {expanded ? "▲" : "▼"}
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>✕</Button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${A.border}` }}>
          <div style={{ paddingTop: 12 }}>
            <BlockDataEditor block={block} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Block list editor ─────────────────────────────────────────
export default function BlockListEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  const ids = blocks.map((_, i) => String(i));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to   = Number(over.id);
    onChange(arrayMove(blocks, from, to));
    // Remap expanded indices
    setExpanded(prev => {
      const next = new Set<number>();
      prev.forEach(idx => {
        if (idx === from) next.add(to);
        else if (idx === to) next.add(from);
        else next.add(idx);
      });
      return next;
    });
  };

  const updateBlock = (i: number, data: Record<string, unknown>) => {
    onChange(blocks.map((b, idx) => idx === i ? { ...b, data } : b));
  };

  const deleteBlock = (i: number) => {
    onChange(blocks.filter((_, idx) => idx !== i));
    setExpanded(prev => {
      const next = new Set<number>();
      prev.forEach(idx => { if (idx !== i) next.add(idx > i ? idx - 1 : idx); });
      return next;
    });
  };

  const addBlock = (type: string) => {
    const newBlock = defaultBlock(type);
    const newIdx = blocks.length;
    onChange([...blocks, newBlock]);
    setExpanded(prev => new Set([...prev, newIdx]));
  };

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: A.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {blocks.length} block{blocks.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <Button size="sm" variant="ghost"
            onClick={() => setExpanded(blocks.length ? new Set(blocks.map((_, i) => i)) : new Set())}>
            Expand All
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(new Set())}>
            Collapse All
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {blocks.map((block, i) => (
            <SortableBlock
              key={i}
              id={String(i)}
              block={block}
              index={i}
              expanded={expanded.has(i)}
              onToggle={() => toggle(i)}
              onChange={(data) => updateBlock(i, data)}
              onDelete={() => deleteBlock(i)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div style={{
          textAlign: "center", padding: "32px 24px",
          background: A.surface, border: `1px dashed ${A.border}`,
          borderRadius: 10, color: A.dim, fontSize: 13, marginBottom: 8,
        }}>
          No blocks yet. Add your first block below.
        </div>
      )}

      {/* Add block */}
      <div style={{ marginTop: 8 }}>
        {showPicker ? (
          <BlockTypePicker
            onSelect={addBlock}
            onClose={() => setShowPicker(false)}
          />
        ) : (
          <Button
            variant="secondary"
            onClick={() => setShowPicker(true)}
            style={{ width: "100%", justifyContent: "center" }}
          >
            + Add Block
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Preview text for collapsed block ─────────────────────────
function getPreview(block: Block): string {
  const d = block.data;
  switch (block.type) {
    case "text":
    case "note":
    case "warning":    return String(d.content ?? "").slice(0, 60);
    case "concept_cards": return `${((d.items as unknown[]) ?? []).length} cards`;
    case "code":       return String(d.filename ?? d.language ?? "");
    case "diagram":    return String(d.diagramKey ?? d.title ?? "");
    case "quiz":       return String(d.questionText ?? d.questionId ?? "").slice(0, 60);
    case "image":      return String(d.url ?? "").slice(0, 60);
    default:           return "";
  }
}
