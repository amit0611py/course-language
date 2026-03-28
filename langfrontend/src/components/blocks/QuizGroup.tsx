import Quiz from "../Quiz";
import { C, colorRgb } from "../../theme";
import type { Block, QuizQuestion } from "../../types";

// ─────────────────────────────────────────────────────────────
// QUIZ GROUP
// Renders a batch of consecutive quiz blocks as ONE unified
// "Knowledge Check" component.
//
// Handles all three possible block data shapes from the API:
//
//   Shape A — NEW (content.service enrichment after our fix):
//     { questionId, questions: [{ q, opts, correct, exp }], _meta }
//
//   Shape B — OLD (content.service before our fix, still in DB
//             for topics not yet re-seeded):
//     { questionId, question: { questionText, options: [{id,text,correct}], explanation } }
//
//   Shape C — bare questionId only (not yet enriched / seeded):
//     { questionId: "q_xxx" }
//
// Priority: Shape A → Shape B → Shape C (placeholder)
// ─────────────────────────────────────────────────────────────

interface QuizGroupProps {
  blocks: Block[];
  accentColor: string;
}

// Map backend question data → frontend QuizQuestion type
// Handles both the new { questions: [...] } and old { question: {...} } shapes
function normalizeQuestion(data: Record<string, unknown>): QuizQuestion | null {

  // ── Shape A: NEW — { questions: [{ q, opts, correct, exp }] } ──
  // Produced by the fixed content.service.js enrichBlocks()
  const questionsArr = data.questions as QuizQuestion[] | undefined;
  if (Array.isArray(questionsArr) && questionsArr.length > 0) {
    const first = questionsArr[0];
    if (first?.q && Array.isArray(first.opts)) {
      return {
        q:       first.q,
        opts:    first.opts,
        correct: typeof first.correct === "number" ? first.correct : 0,
        exp:     first.exp ?? "",
      };
    }
  }

  // ── Shape B: OLD — { question: { questionText, options, explanation } } ──
  // Still in DB for topics not yet re-seeded after content.service fix
  const q = data.question as Record<string, unknown> | undefined;
  if (q) {
    const text = (q.questionText ?? q.question_text) as string | undefined;
    if (text) {
      const rawOpts = (q.options ?? []) as unknown[];
      const exp     = (q.explanation ?? "") as string;

      // options as objects [{ id, text, correct }]
      if (rawOpts.length > 0 && typeof rawOpts[0] === "object") {
        const opts    = rawOpts.map((o) => (o as { text: string }).text ?? "");
        const correct = rawOpts.findIndex((o) => (o as { correct?: boolean }).correct === true);
        return { q: text, opts, correct: Math.max(correct, 0), exp };
      }

      // options as plain string array
      if (rawOpts.length > 0 && typeof rawOpts[0] === "string") {
        const opts    = rawOpts as string[];
        const correct = (q.correctIndex ?? q.correct_index ?? 0) as number;
        return { q: text, opts, correct, exp };
      }
    }
  }

  // ── Shape C: bare ref only — no question data available yet ──
  return null;
}

export default function QuizGroup({ blocks, accentColor }: QuizGroupProps) {
  const questions: QuizQuestion[] = [];

  for (const block of blocks) {
    const q = normalizeQuestion(block.data as Record<string, unknown>);
    if (q) questions.push(q);
  }

  // ── All questions available → full interactive quiz ────────
  if (questions.length > 0) {
    return (
      <div style={{ marginBottom: 24 }}>
        <Quiz questions={questions} accentColor={accentColor} />
      </div>
    );
  }

  // ── No questions available yet → friendly placeholder ─────
  const rgb = colorRgb(accentColor);
  return (
    <div
      style={{
        background: `rgba(${rgb},.04)`,
        border: `1px solid rgba(${rgb},.18)`,
        borderRadius: 14,
        padding: "24px 28px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `rgba(${rgb},.14)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}
      >
        🧠
      </div>

      {/* Text */}
      <div>
        <div style={{ color: accentColor, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          Knowledge Check
        </div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
          {blocks.length} question{blocks.length > 1 ? "s" : ""} will appear here
          once the quiz questions are seeded into the database.
        </div>
        <div
          style={{
            marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap",
          }}
        >
          {blocks.map((b, i) => (
            <span
              key={i}
              style={{
                fontSize: 10, color: accentColor,
                background: `rgba(${rgb},.12)`,
                padding: "2px 8px", borderRadius: 10, fontFamily: "monospace",
              }}
            >
              {(b.data as { questionId?: string }).questionId ?? `q${i + 1}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}