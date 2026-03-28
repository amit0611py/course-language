import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/client";

// ── Languages ─────────────────────────────────────────────────
export const useLanguages = () =>
  useQuery({ queryKey: ["admin", "languages"], queryFn: api.getLanguages });

export const useLanguage = (slug: string) =>
  useQuery({ queryKey: ["admin", "language", slug], queryFn: () => api.getLanguage(slug), enabled: !!slug });

export const useCreateLanguage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createLanguage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "languages"] }),
  });
};

export const useUpdateLanguage = (slug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.updateLanguage(slug, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "languages"] }); qc.invalidateQueries({ queryKey: ["admin", "language", slug] }); },
  });
};

export const useDeleteLanguage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLanguage,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "languages"] }),
  });
};

export const useSections = (langSlug: string) =>
  useQuery({ queryKey: ["admin", "sections", langSlug], queryFn: () => api.getSections(langSlug), enabled: !!langSlug });

export const useCreateSection = (langSlug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.createSection(langSlug, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections", langSlug] }),
  });
};

export const useUpdateSection = (langSlug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.updateSection(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections", langSlug] }),
  });
};

export const useDeleteSection = (langSlug: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "sections", langSlug] }),
  });
};

// ── Topics ────────────────────────────────────────────────────
export const useTopics = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ["admin", "topics", params], queryFn: () => api.getTopics(params) });

export const useTopic = (path: string) =>
  useQuery({ queryKey: ["admin", "topic", path], queryFn: () => api.getTopic(path), enabled: !!path });

export const useSaveTopic = (path?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => path ? api.updateTopic(path, body) : api.createTopic(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "topics"] });
      if (path) qc.invalidateQueries({ queryKey: ["admin", "topic", path] });
    },
  });
};

export const usePatchTopic = (path: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.patchTopicMeta(path, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "topics"] });
      qc.invalidateQueries({ queryKey: ["admin", "topic", path] });
    },
  });
};

export const useUnpublishTopic = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.unpublishTopic,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "topics"] }),
  });
};

// ── Diagrams ──────────────────────────────────────────────────
export const useDiagrams = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ["admin", "diagrams", params], queryFn: () => api.getDiagrams(params) });

export const useDiagram = (key: string) =>
  useQuery({ queryKey: ["admin", "diagram", key], queryFn: () => api.getDiagram(key), enabled: !!key });

export const useCreateDiagram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createDiagram,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "diagrams"] }),
  });
};

export const useUpdateDiagram = (key: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.updateDiagram(key, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "diagrams"] }); qc.invalidateQueries({ queryKey: ["admin", "diagram", key] }); },
  });
};

export const useDeleteDiagram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteDiagram,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "diagrams"] }),
  });
};

// ── Quizzes ───────────────────────────────────────────────────
export const useQuizzes = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ["admin", "quizzes", params], queryFn: () => api.getQuizzes(params) });

export const useQuiz = (key: string) =>
  useQuery({ queryKey: ["admin", "quiz", key], queryFn: () => api.getQuiz(key), enabled: !!key });

export const useCreateQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createQuiz,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quizzes"] }),
  });
};

export const useUpdateQuiz = (key: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api.updateQuiz(key, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "quizzes"] }); qc.invalidateQueries({ queryKey: ["admin", "quiz", key] }); },
  });
};

export const useDeleteQuiz = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteQuiz,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "quizzes"] }),
  });
};

// ── Stats ─────────────────────────────────────────────────────
export const useStats = () =>
  useQuery({ queryKey: ["admin", "stats"], queryFn: api.getStats });

export const useTopicsByLang = () =>
  useQuery({ queryKey: ["admin", "stats", "by-lang"], queryFn: api.getTopicsByLangStat });

export const useBlocksByType = () =>
  useQuery({ queryKey: ["admin", "stats", "blocks"], queryFn: api.getBlocksByType });

// ── Cache ─────────────────────────────────────────────────────
export const useFlushCache = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.flushCache,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
};