import { useState } from "react";
import { useQuizzes, useCreateQuiz, useUpdateQuiz, useDeleteQuiz } from "../hooks";
import { A, DIFFICULTIES } from "../theme";
import { Badge, Button, Input, Textarea, Select, Modal, Empty, Spinner, Toast } from "../components/ui";
import type { QuizQuestion, QuizOption } from "../types";

const IDS = ["a", "b", "c", "d"];

function QuizForm({ initial, onSubmit, onCancel, loading }: {
  initial?: QuizQuestion;
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [key,        setKey]        = useState(initial?.questionKey  ?? "");
  const [text,       setText]       = useState(initial?.questionText ?? "");
  const [type,       setType]       = useState(initial?.questionType ?? "mcq");
  const [difficulty, setDifficulty] = useState(initial?.difficulty   ?? "beginner");
  const [explanation,setExplanation]= useState(initial?.explanation  ?? "");
  const [options,    setOptions]    = useState<QuizOption[]>(
    initial?.options?.length
      ? initial.options
      : IDS.map((id, i) => ({ id, text: "", correct: i === 0 }))
  );

  const updateOption = (i: number, field: keyof QuizOption, val: string | boolean) => {
    setOptions(prev => prev.map((o, idx) => {
      if (field === "correct") return { ...o, correct: idx === i };
      return idx === i ? { ...o, [field]: val } : o;
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Question Key *" value={key} onChange={e => setKey(e.target.value)}
          placeholder="q_java_jvm_001" disabled={!!initial?.questionKey} style={{ flex: 2 }} />
        <Select label="Type" value={type} onChange={e => setType(e.target.value)}
          options={[{ value: "mcq", label: "MCQ" }, { value: "true-false", label: "True/False" }]} />
        <Select label="Difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}
          options={DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))} />
      </div>

      <Textarea label="Question Text *" value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 72 }} />

      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          Options — select the correct answer
        </div>
        {options.map((opt, i) => (
          <div key={opt.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input type="radio" name="correct" checked={opt.correct}
              onChange={() => updateOption(i, "correct", true)}
              style={{ flexShrink: 0, cursor: "pointer" }} />
            <span style={{ fontSize: 12, color: A.dim, width: 16, flexShrink: 0 }}>
              {String.fromCharCode(65 + i)}
            </span>
            <Input value={opt.text} onChange={e => updateOption(i, "text", e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + i)}`}
              style={{ flex: 1, borderColor: opt.correct ? A.green : A.border }} />
            {opt.correct && <span style={{ color: A.green, fontSize: 14, flexShrink: 0 }}>✓</span>}
          </div>
        ))}
      </div>

      <Textarea label="Explanation" value={explanation} onChange={e => setExplanation(e.target.value)}
        style={{ minHeight: 72 }} placeholder="Explain why the correct answer is correct…" />

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading}
          onClick={() => onSubmit({ questionKey: key, questionText: text, questionType: type, options, explanation, difficulty })}>
          {initial ? "Save Changes" : "Create Question"}
        </Button>
      </div>
    </div>
  );
}

export default function Quizzes() {
  const [search,     setSearch]     = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [offset,     setOffset]     = useState(0);
  const [modal,      setModal]      = useState<"new" | QuizQuestion | null>(null);
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const limit = 30;
  const { data, isLoading } = useQuizzes({ search, difficulty, limit, offset });
  const questions: QuizQuestion[] = data?.questions ?? [];
  const total: number             = data?.total      ?? 0;

  const createQuiz  = useCreateQuiz();
  const deleteQuiz  = useDeleteQuiz();
  const editKey     = typeof modal === "object" && modal !== null ? (modal as QuizQuestion).questionKey : null;
  const updateQuiz  = useUpdateQuiz(editKey ?? "");

  const diffColor = { beginner: A.green, intermediate: A.yellow, advanced: A.red };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Quiz Questions</h1>
          <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>{total} questions</p>
        </div>
        <Button variant="primary" onClick={() => setModal("new")}>+ New Question</Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Input placeholder="Search key or text…" value={search}
          onChange={e => { setSearch(e.target.value); setOffset(0); }} style={{ flex: 1 }} />
        <Select value={difficulty} onChange={e => { setDifficulty(e.target.value); setOffset(0); }}
          options={[{ value: "", label: "All difficulties" },
            ...DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))]} />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={28} /></div>
      ) : questions.length === 0 ? (
        <Empty icon="🧠" title="No questions yet" desc="Create quiz questions to add them to topics."
          action={<Button variant="primary" onClick={() => setModal("new")}>Create Question</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {questions.map(q => (
            <div key={q.questionKey} style={{
              background: A.card, border: `1px solid ${A.border}`,
              borderRadius: 10, padding: "14px 18px",
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                  <code style={{ fontSize: 11, color: A.blue }}>{q.questionKey}</code>
                  <Badge color={diffColor[q.difficulty as keyof typeof diffColor] ?? A.muted}>
                    {q.difficulty ?? "—"}
                  </Badge>
                  <Badge color={A.dim}>{q.questionType}</Badge>
                </div>
                <div style={{ fontSize: 13, color: A.text, marginBottom: 6 }}>{q.questionText}</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {q.options.map(o => (
                    <span key={o.id} style={{
                      fontSize: 11, color: o.correct ? A.green : A.muted,
                      fontWeight: o.correct ? 700 : 400,
                    }}>
                      {o.correct ? "✓ " : ""}{o.text}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Button size="sm" onClick={() => setModal(q)}>Edit</Button>
                <Button size="sm" variant="danger"
                  onClick={async () => {
                    if (!confirm(`Delete "${q.questionKey}"?`)) return;
                    try { await deleteQuiz.mutateAsync(q.questionKey); setToast({ msg: "Deleted", type: "success" }); }
                    catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
                  }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Button size="sm" disabled={offset === 0} onClick={() => setOffset(o => o - limit)}>← Prev</Button>
          <span style={{ fontSize: 12, color: A.muted, alignSelf: "center" }}>
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <Button size="sm" disabled={offset + limit >= total} onClick={() => setOffset(o => o + limit)}>Next →</Button>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal === "new" ? "New Question" : `Edit: ${(modal as QuizQuestion).questionKey}`}
          onClose={() => setModal(null)} width={680}>
          <QuizForm
            initial={modal === "new" ? undefined : modal as QuizQuestion}
            loading={modal === "new" ? createQuiz.isPending : updateQuiz.isPending}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              try {
                modal === "new" ? await createQuiz.mutateAsync(data) : await updateQuiz.mutateAsync(data);
                setToast({ msg: modal === "new" ? "Question created!" : "Question updated!", type: "success" });
                setModal(null);
              } catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
            }} />
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
