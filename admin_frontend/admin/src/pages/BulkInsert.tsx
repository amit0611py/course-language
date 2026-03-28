import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as api from "../api/client";
import { A, DIFFICULTIES } from "../theme";
import { Button, Input, Select, Card, Toast, Spinner } from "../components/ui";

// ── Types ─────────────────────────────────────────────────────
type Mode = "topic" | "deepdive" | "language";

interface TopicSummary { path: string; title: string; depth: number; }
interface LangItem     { slug: string; name: string; }
interface SectionItem  { slug: string; title: string; }

// ── Helpers ───────────────────────────────────────────────────
const defaultTopicBody = (path = "", title = "", section = "") =>
  JSON.stringify({
    path,
    title,
    section,
    sectionTitle: section ? section.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "",
    difficulty:    "beginner",
    estimatedMins: 10,
    tags:          [],
    isDeepDive:    false,
    isPublished:   true,
    sortOrder:     1,
    blocks: [
      { type: "text",          data: { content: "" } },
      { type: "concept_cards", data: { items: [{ icon: "💡", title: "", desc: "" }] } },
      { type: "code",          data: { language: "java", filename: "", runnable: true, snippet: "", expectedOutput: "" } },
      { type: "diagram",       data: { diagramKey: "", title: "", diagramType: "mermaid", mermaid: "" } },
      { type: "note",          data: { content: "" } },
      { type: "warning",       data: { content: "" } },
      {
        type: "quiz",
        data: {
          questionId: "", questionText: "", questionType: "mcq",
          options: [
            { id: "a", text: "", correct: true  },
            { id: "b", text: "", correct: false },
            { id: "c", text: "", correct: false },
            { id: "d", text: "", correct: false },
          ],
          explanation: ""
        }
      }
    ]
  }, null, 2);

const defaultLangBody = (slug = "", name = "") =>
  JSON.stringify({
    language: {
      slug, name,
      description: "",
      iconUrl:     `/icons/${slug}.svg`,
      sortOrder:   1,
      meta:        { color: "#f59e0b", tagline: "" }
    },
    sections: [
      { slug: "core-language", title: "Core Language", sortOrder: 1 },
      { slug: "advanced",      title: "Advanced",      sortOrder: 2 }
    ],
    topics: [
      {
        path:  `${slug}.basics`,
        title: "Basics",
        section: "core-language",
        sectionTitle: "Core Language",
        difficulty: "beginner",
        estimatedMins: 10,
        tags: [slug],
        isPublished: true,
        sortOrder: 1,
        blocks: [
          { type: "text",          data: { content: "" } },
          { type: "concept_cards", data: { items: [{ icon: "💡", title: "", desc: "" }] } }
        ]
      }
    ]
  }, null, 2);

// ── JSON Editor with validate ─────────────────────────────────
function JsonEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [error, setError] = useState("");

  const validate = (v: string) => {
    try { JSON.parse(v); setError(""); }
    catch (e: unknown) { setError((e as Error).message); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: A.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Request Body (JSON)
        </span>
        {error
          ? <span style={{ fontSize: 11, color: A.red }}>⚠ {error}</span>
          : <span style={{ fontSize: 11, color: A.green }}>✓ Valid JSON</span>
        }
      </div>
      <textarea
        value={value}
        onChange={e => { onChange(e.target.value); validate(e.target.value); }}
        spellCheck={false}
        style={{
          background:  A.surface,
          border:      `1px solid ${error ? A.red : A.border}`,
          borderRadius: 10,
          padding:     "14px 16px",
          color:       A.text,
          fontSize:    12,
          fontFamily:  "'JetBrains Mono', monospace",
          lineHeight:  1.7,
          resize:      "vertical",
          minHeight:   460,
          outline:     "none",
          width:       "100%",
          transition:  "border-color .15s",
        }}
      />
    </div>
  );
}

// ── Response viewer ───────────────────────────────────────────
function ResponseBox({ data, error }: { data: unknown; error: string }) {
  if (!data && !error) return null;
  const isOk = !error && (data as { ok?: boolean })?.ok !== false;
  return (
    <div style={{
      background:   A.surface,
      border:       `1px solid ${isOk ? A.green : A.red}44`,
      borderLeft:   `3px solid ${isOk ? A.green : A.red}`,
      borderRadius: 10,
      padding:      "14px 16px",
      marginTop:    16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: isOk ? A.green : A.red,
        marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {error ? "Error" : "Response"}
      </div>
      <pre style={{ fontSize: 12, color: A.text, fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.6, overflow: "auto", margin: 0, whiteSpace: "pre-wrap" }}>
        {error || JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ── Cascading path builder for topic ─────────────────────────
function TopicPathBuilder({ langSlug, onPathChange, onSectionChange, isDeepDive = false }: {
  langSlug:        string;
  onPathChange:    (path: string) => void;
  onSectionChange: (section: string) => void;
  isDeepDive?:     boolean;
}) {
  const [parentPath, setParentPath] = useState("");
  const [childSlug,  setChildSlug]  = useState("");
  const [section,    setSection]    = useState("");

  // Load topics for selected language (for deep dive parent picker)
  const { data: topics = [], isLoading: topicsLoading } = useQuery<TopicSummary[]>({
    queryKey: ["admin", "topics-for-lang", langSlug],
    queryFn:  () => api.getTopicsByLang(langSlug) as Promise<TopicSummary[]>,
    enabled:  !!langSlug && isDeepDive,
  });

  // Load sections for selected language
  const { data: sections = [] } = useQuery<SectionItem[]>({
    queryKey: ["admin", "sections", langSlug],
    queryFn:  () => api.getSections(langSlug) as Promise<SectionItem[]>,
    enabled:  !!langSlug,
  });

  // Depth-1 topics only for parent picker
  const depth1Topics = (topics as TopicSummary[]).filter(t => t.depth === 1);

  useEffect(() => {
    let finalPath = "";
    if (isDeepDive) {
      finalPath = parentPath && childSlug ? `${parentPath}.${childSlug}` : "";
    } else {
      finalPath = langSlug && childSlug ? `${langSlug}.${childSlug}` : "";
    }
    onPathChange(finalPath);
  }, [langSlug, parentPath, childSlug, isDeepDive]);

  useEffect(() => { onSectionChange(section); }, [section]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {isDeepDive && (
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
            textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
            Parent Topic *
          </label>
          {topicsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
              <Spinner size={16} />
              <span style={{ fontSize: 12, color: A.muted }}>Loading topics…</span>
            </div>
          ) : (
            <select
              value={parentPath}
              onChange={e => setParentPath(e.target.value)}
              style={{
                background: A.surface, border: `1px solid ${A.border}`,
                borderRadius: 8, padding: "8px 12px", color: A.text,
                fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">Select parent topic…</option>
              {depth1Topics.map((t: TopicSummary) => (
                <option key={t.path} value={t.path}>{t.title} ({t.path})</option>
              ))}
            </select>
          )}
        </div>
      )}

      <Input
        label={isDeepDive ? "Deep Dive Slug * (e.g. treemap, sorting)" : "Topic Slug * (e.g. collections, generics)"}
        value={childSlug}
        onChange={e => setChildSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        placeholder={isDeepDive ? "e.g. treemap" : "e.g. collections"}
      />

      {/* Computed path preview */}
      <div style={{
        background: A.card, borderRadius: 8, padding: "8px 14px",
        border: `1px solid ${A.border}`, display: "flex", alignItems: "center", gap: 10
      }}>
        <span style={{ fontSize: 11, color: A.dim }}>Full path:</span>
        <code style={{ fontSize: 13, color: A.blue, fontWeight: 700 }}>
          {isDeepDive
            ? (parentPath && childSlug ? `${parentPath}.${childSlug}` : "…")
            : (langSlug   && childSlug ? `${langSlug}.${childSlug}`   : "…")
          }
        </code>
      </div>

      {/* Section dropdown */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
          textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
          Section (auto-created if new)
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            style={{
              background: A.surface, border: `1px solid ${A.border}`,
              borderRadius: 8, padding: "8px 12px", color: A.text,
              fontSize: 13, flex: 1, cursor: "pointer", outline: "none",
            }}
          >
            <option value="">Pick existing or type new below…</option>
            {(sections as SectionItem[]).map((s: SectionItem) => (
              <option key={s.slug} value={s.slug}>{s.title} ({s.slug})</option>
            ))}
          </select>
          <Input
            placeholder="or type new slug…"
            value={section}
            onChange={e => setSection(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            style={{ flex: 1 }}
          />
        </div>
        <div style={{ fontSize: 11, color: A.dim, marginTop: 4 }}>
          If the section doesn't exist it will be auto-created.
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function BulkInsert() {
  const [mode,     setMode]     = useState<Mode>("topic");
  const [langSlug, setLangSlug] = useState("");
  const [body,     setBody]     = useState("");
  const [response, setResponse] = useState<unknown>(null);
  const [errMsg,   setErrMsg]   = useState("");
  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Path/section state lifted from builder
  const [builtPath,    setBuiltPath]    = useState("");
  const [builtSection, setBuiltSection] = useState("");
  const [topicTitle,   setTopicTitle]   = useState("");
  const [topicDiff,    setTopicDiff]    = useState("beginner");
  const [topicMins,    setTopicMins]    = useState("10");

  // Languages list
  const { data: languages = [] } = useQuery<LangItem[]>({
    queryKey: ["admin", "languages"],
    queryFn:  () => api.getLanguages() as Promise<LangItem[]>,
  });

  // Mutations
  const bulkTopic = useMutation({
    mutationFn: (b: unknown) => api.bulkTopic(b),
    onSuccess: (data) => { setResponse(data); setErrMsg(""); setToast({ msg: "Topic created!", type: "success" }); },
    onError:   (e: Error) => { setErrMsg(e.message); setResponse(null); setToast({ msg: e.message, type: "error" }); },
  });
  const bulkLang = useMutation({
    mutationFn: (b: unknown) => api.bulkLanguage(b),
    onSuccess: (data) => { setResponse(data); setErrMsg(""); setToast({ msg: "Language created!", type: "success" }); },
    onError:   (e: Error) => { setErrMsg(e.message); setResponse(null); setToast({ msg: e.message, type: "error" }); },
  });

  // Auto-update JSON body when builder values change
  useEffect(() => {
    if (mode === "language") return;
    if (!builtPath) return;
    setBody(defaultTopicBody(builtPath, topicTitle, builtSection));
  }, [builtPath, builtSection, topicTitle]);

  // Switch mode → reset state + set template
  const switchMode = (m: Mode) => {
    setMode(m);
    setResponse(null);
    setErrMsg("");
    setBuiltPath("");
    setBuiltSection("");
    setTopicTitle("");
    if (m === "language") setBody(defaultLangBody());
    else setBody("");
  };

  const handleSend = () => {
    let parsed: unknown;
    try { parsed = JSON.parse(body); }
    catch { setErrMsg("Invalid JSON — fix the body before sending."); return; }

    setResponse(null);
    setErrMsg("");

    if (mode === "language") bulkLang.mutate(parsed);
    else bulkTopic.mutate(parsed);
  };

  const isBusy = bulkTopic.isPending || bulkLang.isPending;

  const modeLabel: Record<Mode, string> = {
    topic:    "Insert Topic",
    deepdive: "Insert Deep Dive",
    language: "Insert Language",
  };

  return (
    <div style={{ maxWidth: 980, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Bulk Insert</h1>
        <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
          One call does everything — section creation, cache flush included.
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["topic", "deepdive", "language"] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding:      "8px 20px",
              borderRadius: 9,
              border:       `1px solid ${mode === m ? A.blue : A.border}`,
              background:   mode === m ? `${A.blue}18` : A.card,
              color:        mode === m ? A.blue : A.muted,
              fontSize:     13,
              fontWeight:   mode === m ? 700 : 400,
              cursor:       "pointer",
              fontFamily:   "inherit",
              transition:   "all .15s",
            }}
          >
            {m === "topic"    && "📄 New Topic"}
            {m === "deepdive" && "🔍 New Deep Dive"}
            {m === "language" && "🌐 New Language"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left panel: smart form ── */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>
            {modeLabel[mode]} — Form
          </div>

          {/* Language selector (all modes) */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
              textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              {mode === "language" ? "Language Slug *" : "Language *"}
            </label>
            {mode === "language" ? (
              <Input
                placeholder="e.g. python, go, kotlin"
                value={langSlug}
                onChange={e => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setLangSlug(v);
                  setBody(defaultLangBody(v, v.charAt(0).toUpperCase() + v.slice(1)));
                }}
              />
            ) : (
              <select
                value={langSlug}
                onChange={e => setLangSlug(e.target.value)}
                style={{
                  background: A.surface, border: `1px solid ${A.border}`,
                  borderRadius: 8, padding: "8px 12px", color: langSlug ? A.text : A.dim,
                  fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
                }}
              >
                <option value="">Select language…</option>
                {(languages as LangItem[]).map((l: LangItem) => (
                  <option key={l.slug} value={l.slug}>{l.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Topic / Deep dive form */}
          {(mode === "topic" || mode === "deepdive") && langSlug && (
            <>
              <Input
                label="Title *"
                value={topicTitle}
                onChange={e => setTopicTitle(e.target.value)}
                placeholder="e.g. Collections Framework"
              />
              <div style={{ display: "flex", gap: 10 }}>
                <Select
                  label="Difficulty"
                  value={topicDiff}
                  onChange={e => setTopicDiff(e.target.value)}
                  options={DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))}
                />
                <Input
                  label="Est. Minutes"
                  type="number"
                  value={topicMins}
                  onChange={e => setTopicMins(e.target.value)}
                  style={{ width: 100 }}
                />
              </div>

              <TopicPathBuilder
                langSlug={langSlug}
                isDeepDive={mode === "deepdive"}
                onPathChange={setBuiltPath}
                onSectionChange={setBuiltSection}
              />
            </>
          )}

          {/* Language form hints */}
          {mode === "language" && langSlug && (
            <div style={{
              background: A.surface, borderRadius: 8, padding: "12px 14px",
              border: `1px solid ${A.border}`, fontSize: 12, color: A.muted, lineHeight: 1.7,
            }}>
              Template loaded. Edit the JSON on the right to fill in:
              <div style={{ marginTop: 6, color: A.text }}>
                • language.name, description, meta.color<br />
                • Add/remove sections[]<br />
                • Fill topics[].blocks with content
              </div>
            </div>
          )}

          {/* Send button */}
          <Button
            variant="primary"
            onClick={handleSend}
            loading={isBusy}
            disabled={!body.trim() || (!langSlug && mode !== "language")}
            style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          >
            🚀 Send Request
          </Button>

          {/* What this call does */}
          <div style={{
            background: A.surface, borderRadius: 8, padding: "10px 14px",
            border: `1px solid ${A.border}`, fontSize: 11, color: A.dim, lineHeight: 1.8,
          }}>
            <span style={{ color: A.text, fontWeight: 600 }}>This one call:</span><br />
            {mode === "language" ? (
              <>✅ Creates language<br />✅ Creates all sections<br />✅ Saves all topics + blocks<br />✅ Extracts quizzes + diagrams<br />✅ Flushes all cache</>
            ) : (
              <>✅ Auto-creates section if missing<br />✅ Saves topic + all blocks<br />✅ Extracts quizzes + diagrams<br />✅ Flushes topic + nav + cache</>
            )}
          </div>
        </Card>

        {/* ── Right panel: JSON editor + response ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {body ? (
            <JsonEditor value={body} onChange={setBody} />
          ) : (
            <div style={{
              background: A.surface, border: `1px dashed ${A.border}`,
              borderRadius: 10, padding: "60px 24px",
              textAlign: "center", color: A.dim, fontSize: 13,
            }}>
              {mode === "language"
                ? "Enter a language slug on the left to load the template"
                : "Select a language and fill the form on the left to generate the JSON body"}
            </div>
          )}
          <ResponseBox data={response} error={errMsg} />
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
