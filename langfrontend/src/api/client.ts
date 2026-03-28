import axios from "axios";
import type {
  Language,
  NavigationResponse,
  Topic,
  Project,
} from "../types";

const BASE_URL = "/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── HTML-response guard ───────────────────────────────────────
// When the Vite proxy can't reach the backend it falls through and
// returns the SPA index.html.  Catch that early with a clear message.
apiClient.interceptors.response.use((res) => {
  const ct: string = res.headers["content-type"] ?? "";
  const isHtml =
    ct.includes("text/html") ||
    (typeof res.data === "string" && res.data.trimStart().startsWith("<"));
  if (isHtml) {
    throw new Error(
      `Backend not reachable — received HTML instead of JSON.\n` +
      `Start the API server:  cd ../lang && npm run dev   (port 3001)`
    );
  }
  return res;
});

// Dev: log raw response shape so you can inspect envelopes
if (import.meta.env.DEV) {
  apiClient.interceptors.response.use((res) => {
    console.debug(`[api] ${res.config.method?.toUpperCase()} ${res.config.url}`, res.data);
    return res;
  });
}

// ─────────────────────────────────────────────────────────────
// NORMALIZERS — unwrap real backend envelope shapes
// ─────────────────────────────────────────────────────────────

function toArray<T>(raw: unknown, ...extraKeys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    for (const key of ["data", "items", "results", ...extraKeys]) {
      const v = (raw as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  console.warn("[api] toArray: unexpected shape:", raw);
  return [];
}

/** Derive display-friendly shortcuts on a Language object */
function normalizeLanguage(raw: Record<string, unknown>): Language {
  const meta = (raw.meta ?? {}) as Language["meta"];
  return {
    ...(raw as unknown as Language),
    meta,
    color: (meta.color as string | undefined) ?? undefined,
    tagline: (meta.tagline as string | undefined) ?? (raw.description as string | undefined),
  };
}

// ── Languages ─────────────────────────────────────────────────
// Response: { languages: [ { id, slug, name, iconUrl, meta, ... } ] }
export const fetchLanguages = (): Promise<Language[]> =>
  apiClient.get("/languages").then((r) => {
    const arr = toArray<Record<string, unknown>>(r.data, "languages");
    return arr.map(normalizeLanguage);
  });

// ── Navigation ────────────────────────────────────────────────
// Response: { language: {...}, sections: [ { id, slug, title, topics: [...] } ] }
export const fetchNavigation = (slug: string): Promise<NavigationResponse> =>
  apiClient.get(`/navigation/${slug}`).then((r) => {
    const raw = r.data as Record<string, unknown>;
    const language = normalizeLanguage(
      (raw.language ?? { id: "", slug, name: slug, meta: {} }) as Record<string, unknown>
    );
    const sections = Array.isArray(raw.sections) ? raw.sections : [];
    return { language, sections } as NavigationResponse;
  });

// ── Topics ────────────────────────────────────────────────────
// Response: { topic: {...}, breadcrumb: [...], children: [...], blocks: [...] }
export const fetchTopic = (path: string): Promise<Topic> =>
  apiClient.get(`/topics/${path}`).then((r) => {
    const raw = r.data as Record<string, unknown>;

    // Unwrap envelope when present
    if (raw.topic && typeof raw.topic === "object") {
      const t = raw.topic as Record<string, unknown>;
      return {
        id: t.id as string,
        path: (t.path ?? path) as string,
        title: (t.title ?? "") as string,
        difficulty: t.difficulty as string | undefined,
        estimatedMins: t.estimatedMins as number | undefined,
        tags: (t.tags ?? []) as string[],
        isDeepDive: t.isDeepDive as boolean | undefined,
        section: t.sectionTitle as string | undefined,
        sectionSlug: t.sectionSlug as string | undefined,
        languageSlug: t.languageSlug as string | undefined,
        meta: t.meta,
        breadcrumb: Array.isArray(raw.breadcrumb) ? raw.breadcrumb : [],
        children: Array.isArray(raw.children) ? raw.children : [],
        blocks: Array.isArray(raw.blocks) ? raw.blocks : [],
      } as Topic;
    }

    // Already flat (future-proofing)
    return raw as unknown as Topic;
  });

export const fetchTopicChildren = (path: string): Promise<Topic[]> =>
  apiClient.get(`/topics/children/${path}`).then((r) => toArray<Topic>(r.data, "children"));

export const fetchTopicBreadcrumb = (path: string): Promise<string[]> =>
  apiClient.get(`/topics/breadcrumb/${path}`).then((r) => toArray<string>(r.data, "breadcrumb"));

// ── Projects ─────────────────────────────────────────────────
export const fetchProject = (slug: string): Promise<Project> =>
  apiClient.get(`/projects/${slug}`).then((r) => r.data as Project);

export const fetchProjectsByLanguage = (lang: string): Promise<Project[]> =>
  apiClient.get(`/projects/by-language/${lang}`).then((r) => toArray<Project>(r.data, "projects"));
