import { useQuery } from "@tanstack/react-query";
import Quiz from "../Quiz";
import { apiClient } from "../../api/client";
import { C } from "../../theme";
import type { QuizBlockData, QuizQuestion } from "../../types";

// ─────────────────────────────────────────────────────────────
// QUIZ BLOCK
//
// The API returns quiz blocks in two possible shapes:
//
//   Shape A — full inline questions (future / custom topics):
//     { "type": "quiz", "data": { "questions": [ { q, opts, correct, exp } ] } }
//
//   Shape B — questionId reference (current API):
//     { "type": "quiz", "data": { "questionId": "q_java_intro_001" } }
//
// For Shape B this component attempts to load the question from
// GET /v1/quiz/questions/:questionId  (graceful fallback if unavailable).
// Multiple quiz blocks on the same topic are rendered independently.
// ─────────────────────────────────────────────────────────────

interface QuizBlockProps {
  data: QuizBlockData;
  accentColor: string;
}

// ── Fetch a single question by its ID ─────────────────────────
function useQuizQuestion(questionId: string | undefined) {
  return useQuery<QuizQuestion>({
    queryKey: ["quiz-question", questionId],
    queryFn: async () => {
      const res = await apiClient.get(`/quiz/questions/${questionId}`);
      const raw = res.data;
      // Handle possible envelope { question: {...} }
      return (raw.question ?? raw) as QuizQuestion;
    },
    enabled: !!questionId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// ── Single question rendered via Quiz ─────────────────────────
function QuizByRef({ questionId, accentColor }: { questionId: string; accentColor: string }) {
  const { data: question, isLoading, isError } = useQuizQuestion(questionId);

  if (isLoading) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div className="skeleton-pulse" style={{ height: 80, borderRadius: 10 }} />
      </div>
    );
  }

  if (isError || !question) {
    return (
      <div
        style={{
          marginBottom: 16, padding: "12px 16px",
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
          color: C.dim, fontSize: 12,
        }}
      >
        <span>🧠</span>
        <span>
          Quiz question{" "}
          <code style={{ color: accentColor, fontSize: 11 }}>{questionId}</code>
          {" "}— questions endpoint not yet available
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <Quiz questions={[question]} accentColor={accentColor} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function QuizBlock({ data, accentColor }: QuizBlockProps) {
  // Shape A — full questions array
  if (data.questions?.length) {
    return (
      <div style={{ marginBottom: 24 }}>
        <Quiz questions={data.questions} accentColor={accentColor} />
      </div>
    );
  }

  // Shape B — questionId reference
  if (data.questionId) {
    return <QuizByRef questionId={data.questionId} accentColor={accentColor} />;
  }

  return null;
}
