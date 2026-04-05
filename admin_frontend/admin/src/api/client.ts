import axios from "axios";

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "your-actual-secret-key";

export const api = axios.create({
  baseURL: "/v1/admin",
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Key": ADMIN_KEY,
  },
});

// Unwrap error messages from backend envelope
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Unknown error";
    return Promise.reject(new Error(msg));
  }
);

// ── Languages ─────────────────────────────────────────────────
export const getLanguages     = ()           => api.get("/languages").then(r => r.data.languages);
export const getLanguage      = (slug: string) => api.get(`/languages/${slug}`).then(r => r.data);
export const createLanguage   = (body: unknown) => api.post("/languages", body).then(r => r.data.language);
export const updateLanguage   = (slug: string, body: unknown) => api.put(`/languages/${slug}`, body).then(r => r.data.language);
export const deleteLanguage   = (slug: string) => api.delete(`/languages/${slug}`).then(r => r.data);
export const getSections      = (slug: string) => api.get(`/languages/${slug}/sections`).then(r => r.data.sections);
export const createSection    = (langSlug: string, body: unknown) => api.post(`/languages/${langSlug}/sections`, body).then(r => r.data.section);
export const updateSection    = (id: string, body: unknown) => api.put(`/languages/sections/${id}`, body).then(r => r.data.section);
export const deleteSection    = (id: string) => api.delete(`/languages/sections/${id}`).then(r => r.data);

// ── Topics ────────────────────────────────────────────────────
export const getTopics        = (params?: Record<string, unknown>) => api.get("/topics", { params }).then(r => r.data);
export const getTopic         = (path: string) => api.get(`/topics/${path}`).then(r => r.data.topic);
export const createTopic      = (body: unknown) => api.post("/topics", body).then(r => r.data);
export const updateTopic      = (path: string, body: unknown) => api.put(`/topics/${path}`, body).then(r => r.data);
export const patchTopicMeta   = (path: string, body: unknown) => api.patch(`/topics/${path}`, body).then(r => r.data);
export const unpublishTopic   = (path: string) => api.delete(`/topics/${path}`).then(r => r.data);

// ── Diagrams ──────────────────────────────────────────────────
export const getDiagrams      = (params?: Record<string, unknown>) => api.get("/diagrams", { params }).then(r => r.data.diagrams);
export const getDiagram       = (key: string) => api.get(`/diagrams/${key}`).then(r => r.data.diagram);
export const createDiagram    = (body: unknown) => api.post("/diagrams", body).then(r => r.data.diagram);
export const updateDiagram    = (key: string, body: unknown) => api.put(`/diagrams/${key}`, body).then(r => r.data.diagram);
export const deleteDiagram    = (key: string) => api.delete(`/diagrams/${key}`).then(r => r.data);

// ── Quizzes ───────────────────────────────────────────────────
export const getQuizzes       = (params?: Record<string, unknown>) => api.get("/quizzes", { params }).then(r => r.data);
export const getQuiz          = (key: string) => api.get(`/quizzes/${key}`).then(r => r.data.question);
export const createQuiz       = (body: unknown) => api.post("/quizzes", body).then(r => r.data.question);
export const updateQuiz       = (key: string, body: unknown) => api.put(`/quizzes/${key}`, body).then(r => r.data.question);
export const deleteQuiz       = (key: string) => api.delete(`/quizzes/${key}`).then(r => r.data);

// ── Cache ─────────────────────────────────────────────────────
export const flushCache       = (body: unknown) => api.post("/cache/flush", body).then(r => r.data);
export const getCacheKeys     = (pattern?: string) => api.get("/cache/keys", { params: { pattern } }).then(r => r.data);

// ── Stats ─────────────────────────────────────────────────────
export const getStats            = () => api.get("/stats").then(r => r.data.stats);
export const getTopicsByLangStat = () => api.get("/stats/topics-by-language").then(r => r.data.breakdown);
export const getBlocksByType     = () => api.get("/stats/blocks-by-type").then(r => r.data.breakdown);

// ── Bulk ──────────────────────────────────────────────────────
export const bulkTopic    = (body: unknown) => api.post("/bulk/topic",    body).then(r => r.data);
export const bulkLanguage = (body: unknown) => api.post("/bulk/language", body).then(r => r.data);

// ── Delete (with mode) ────────────────────────────────────────
export const deleteTopic        = (path: string, mode: string) => api.delete(`/delete/topic/${path}?mode=${mode}`).then(r => r.data);
export const deleteLanguageHard = (slug: string, mode: string) => api.delete(`/delete/language/${slug}?mode=${mode}`).then(r => r.data);

// ── Topics list for a language (for dropdowns) ────────────────
// Returns flat array of { path, title, depth } — used in BulkInsert and DeletePage
export const getTopicsByLang = (lang: string) =>
  api.get("/topics", { params: { language: lang, limit: 200, offset: 0 } })
     .then(r => (r.data.topics ?? []) as { path: string; title: string; depth: number }[]);
// ── Paid content system ───────────────────────────────────────

// Content tiers
export const bulkSetContentTier     = (body: unknown) => api.post("/paid/bulk-tier", body).then(r => r.data);
export const setContentTierByLang   = (body: unknown) => api.post("/paid/tier-by-language", body).then(r => r.data);
export const getPaidSections        = (langSlug: string) => api.get(`/paid/sections/${langSlug}`).then(r => r.data);
export const getPaidTopicsTree      = (langSlug: string, params?: Record<string, string>) =>
  api.get(`/paid/topics-tree/${langSlug}`, { params }).then(r => r.data);

// Plans
export const getPaidPlans           = () => api.get("/paid/plans").then(r => r.data.plans);
export const createPaidPlan         = (body: unknown) => api.post("/paid/plans", body).then(r => r.data.plan);
export const updatePaidPlan         = (id: string, body: unknown) => api.put(`/paid/plans/${id}`, body).then(r => r.data.plan);
export const deletePaidPlan         = (id: string) => api.delete(`/paid/plans/${id}`).then(r => r.data);
export const generatePlanTokens     = (planId: string, body: unknown) =>
  api.post(`/paid/plans/${planId}/generate-token`, body).then(r => r.data);

// Users
export const getPaidUsers           = (params?: Record<string, unknown>) =>
  api.get("/paid/users", { params }).then(r => r.data);
export const getPaidUser            = (id: string) => api.get(`/paid/users/${id}`).then(r => r.data);
export const patchPaidUser          = (id: string, body: unknown) => api.patch(`/paid/users/${id}`, body).then(r => r.data);
export const grantSubscription      = (userId: string, body: unknown) =>
  api.post(`/paid/users/${userId}/grant-subscription`, body).then(r => r.data);
export const revokeSubscription     = (userId: string, subId: string) =>
  api.delete(`/paid/users/${userId}/subscriptions/${subId}`).then(r => r.data);

// Interviews
export const getPaidInterviews      = (params?: Record<string, unknown>) =>
  api.get("/paid/interviews", { params }).then(r => r.data);
export const createPaidInterview    = (body: unknown) => api.post("/paid/interviews", body).then(r => r.data);
export const updatePaidInterview    = (id: string, body: unknown) => api.put(`/paid/interviews/${id}`, body).then(r => r.data);
export const deletePaidInterview    = (id: string) => api.delete(`/paid/interviews/${id}`).then(r => r.data);

// Coding
export const getPaidCoding          = (params?: Record<string, unknown>) =>
  api.get("/paid/coding", { params }).then(r => r.data);
export const createPaidCoding       = (body: unknown) => api.post("/paid/coding", body).then(r => r.data);
export const deletePaidCoding       = (slug: string) => api.delete(`/paid/coding/${slug}`).then(r => r.data);

// Videos
export const getPaidVideos          = () => api.get("/paid/videos").then(r => r.data);
export const createPaidVideo        = (body: unknown) => api.post("/paid/videos", body).then(r => r.data);
export const updatePaidVideo        = (id: string, body: unknown) => api.put(`/paid/videos/${id}`, body).then(r => r.data);
export const deletePaidVideo        = (id: string) => api.delete(`/paid/videos/${id}`).then(r => r.data);
