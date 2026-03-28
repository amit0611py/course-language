import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import * as api from "../api/client";
import { A } from "../theme";
import { Button, Card, Toast, Spinner } from "../components/ui";

type EntityType = "topic" | "language";
type DeleteMode = "soft" | "hard" | "cascade";

interface LangItem     { slug: string; name: string; }
interface TopicSummary { path: string; title: string; depth: number; }

// ── Mode info cards ───────────────────────────────────────────
const TOPIC_MODES = [
  {
    mode:  "soft" as DeleteMode,
    icon:  "👁️",
    label: "Soft Delete",
    color: A.yellow,
    desc:  "Hides topic from learners. Sets is_published=false. Fully reversible with PATCH.",
    safe:  true,
  },
  {
    mode:  "hard" as DeleteMode,
    icon:  "🗑️",
    label: "Hard Delete",
    color: A.orange,
    desc:  "Permanently deletes this topic and its blocks. Children (deep dives) are kept as orphans.",
    safe:  false,
  },
  {
    mode:  "cascade" as DeleteMode,
    icon:  "💥",
    label: "Cascade Delete",
    color: A.red,
    desc:  "Permanently deletes this topic AND every child at any depth. Cannot be undone.",
    safe:  false,
  },
];

const LANG_MODES = [
  {
    mode:  "soft" as DeleteMode,
    icon:  "👁️",
    label: "Soft Delete",
    color: A.yellow,
    desc:  "Hides language from all public APIs. Sets is_active=false. Fully reversible.",
    safe:  true,
  },
  {
    mode:  "hard" as DeleteMode,
    icon:  "💥",
    label: "Hard Delete — FULL WIPE",
    color: A.red,
    desc:  "Permanently deletes the language, ALL sections, ALL topics, and ALL blocks. Cannot be undone.",
    safe:  false,
  },
];

// ── Confirm dialog ────────────────────────────────────────────
function ConfirmDialog({ target, mode, onConfirm, onCancel, loading }: {
  target:    string;
  mode:      DeleteMode;
  onConfirm: () => void;
  onCancel:  () => void;
  loading:   boolean;
}) {
  const [typed, setTyped] = useState("");
  const isHard   = mode !== "soft";
  const confirmed = !isHard || typed === target;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: A.card, border: `1px solid ${isHard ? A.red : A.yellow}44`,
        borderRadius: 16, width: "100%", maxWidth: 440,
        padding: "28px 28px 24px",
        boxShadow: "0 24px 80px rgba(0,0,0,.7)",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {mode === "soft" ? "👁️" : "⚠️"}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: A.text, marginBottom: 8 }}>
          {mode === "soft" ? "Hide this item?" : "This cannot be undone"}
        </div>
        <div style={{ fontSize: 13, color: A.muted, marginBottom: 16, lineHeight: 1.7 }}>
          {mode === "soft"
            ? <>You are about to <strong style={{ color: A.yellow }}>soft delete</strong> <code style={{ color: A.blue }}>{target}</code>. It will be hidden from learners but can be restored.</>
            : mode === "cascade"
            ? <>You are about to <strong style={{ color: A.red }}>permanently delete</strong> <code style={{ color: A.blue }}>{target}</code> and <strong style={{ color: A.red }}>all its children</strong>. Every deep dive, block, and quiz under this path will be gone forever.</>
            : <>You are about to <strong style={{ color: A.red }}>permanently delete</strong> <code style={{ color: A.blue }}>{target}</code> and all its blocks.</>
          }
        </div>

        {isHard && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: A.muted, marginBottom: 6 }}>
              Type <code style={{ color: A.red }}>{target}</code> to confirm:
            </div>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={target}
              style={{
                background: A.surface, border: `1px solid ${typed === target ? A.red : A.border}`,
                borderRadius: 8, padding: "8px 12px", color: A.text,
                fontSize: 13, width: "100%", outline: "none", fontFamily: "monospace",
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            variant={mode === "soft" ? "secondary" : "danger"}
            onClick={onConfirm}
            loading={loading}
            disabled={!confirmed}
          >
            {mode === "soft" ? "Yes, Hide It" : "Delete Permanently"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Response viewer ───────────────────────────────────────────
function ResponseBox({ data, error }: { data: unknown; error: string }) {
  if (!data && !error) return null;
  const isOk = !error;
  return (
    <div style={{
      background:   A.surface,
      border:       `1px solid ${isOk ? A.green : A.red}44`,
      borderLeft:   `3px solid ${isOk ? A.green : A.red}`,
      borderRadius: 10, padding: "14px 16px", marginTop: 16,
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

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
export default function DeletePage() {
  const [entity,   setEntity]   = useState<EntityType>("topic");
  const [langSlug, setLangSlug] = useState("");
  const [topicPath,setTopicPath]= useState("");
  const [mode,     setMode]     = useState<DeleteMode>("soft");
  const [confirm,  setConfirm]  = useState(false);
  const [response, setResponse] = useState<unknown>(null);
  const [errMsg,   setErrMsg]   = useState("");
  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Data
  const { data: languages = [] } = useQuery<LangItem[]>({
    queryKey: ["admin", "languages"],
    queryFn:  () => api.getLanguages() as Promise<LangItem[]>,
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery<TopicSummary[]>({
    queryKey: ["admin", "topics-for-lang", langSlug],
    queryFn:  () => api.getTopicsByLang(langSlug) as Promise<TopicSummary[]>,
    enabled:  !!langSlug && entity === "topic",
  });

  // Group topics by depth for cascading dropdowns
  const depth1 = (topics as TopicSummary[]).filter(t => t.depth === 1);
  const [d1,   setD1]   = useState("");
  const depth2 = (topics as TopicSummary[]).filter(t => t.depth === 2 && t.path.startsWith(d1 + "."));
  const [d2,   setD2]   = useState("");
  const depth3 = (topics as TopicSummary[]).filter(t => t.depth === 3 && t.path.startsWith((d2 || d1) + "."));
  const [d3,   setD3]   = useState("");

  // Resolve final selected path
  const finalPath = d3 || d2 || d1;
  const target    = entity === "topic" ? finalPath : langSlug;

  // Mutations
  const deleteTopic = useMutation({
    mutationFn: ({ path, mode }: { path: string; mode: string }) =>
      api.deleteTopic(path, mode),
    onSuccess: (data) => { setResponse(data); setErrMsg(""); setToast({ msg: "Done!", type: "success" }); setConfirm(false); },
    onError:   (e: Error) => { setErrMsg(e.message); setToast({ msg: e.message, type: "error" }); setConfirm(false); },
  });

  const deleteLang = useMutation({
    mutationFn: ({ slug, mode }: { slug: string; mode: string }) =>
      api.deleteLanguageHard(slug, mode),
    onSuccess: (data) => { setResponse(data); setErrMsg(""); setToast({ msg: "Done!", type: "success" }); setConfirm(false); },
    onError:   (e: Error) => { setErrMsg(e.message); setToast({ msg: e.message, type: "error" }); setConfirm(false); },
  });

  const isBusy = deleteTopic.isPending || deleteLang.isPending;

  const handleDelete = () => {
    if (entity === "topic") deleteTopic.mutate({ path: finalPath, mode });
    else                    deleteLang.mutate({ slug: langSlug, mode });
  };

  const resetDropdowns = () => { setD1(""); setD2(""); setD3(""); setTopicPath(""); setResponse(null); setErrMsg(""); };

  const modes = entity === "topic" ? TOPIC_MODES : LANG_MODES;

  return (
    <div style={{ maxWidth: 860, display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Delete</h1>
        <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
          Soft delete hides content. Hard delete is permanent. Cache flushed automatically.
        </p>
      </div>

      {/* Entity tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["topic", "language"] as EntityType[]).map(e => (
          <button key={e} onClick={() => { setEntity(e); setLangSlug(""); resetDropdowns(); setMode("soft"); }}
            style={{
              padding: "8px 20px", borderRadius: 9, fontFamily: "inherit",
              border:     `1px solid ${entity === e ? A.red : A.border}`,
              background: entity === e ? `${A.red}18` : A.card,
              color:      entity === e ? A.red : A.muted,
              fontSize: 13, fontWeight: entity === e ? 700 : 400,
              cursor: "pointer", transition: "all .15s",
            }}>
            {e === "topic" ? "📄 Delete Topic" : "🌐 Delete Language"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left: cascading selector ── */}
        <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.text }}>
            Select {entity === "topic" ? "Topic" : "Language"}
          </div>

          {/* Language dropdown — always shown */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
              textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
              Language *
            </label>
            <select
              value={langSlug}
              onChange={e => { setLangSlug(e.target.value); resetDropdowns(); }}
              style={{
                background: A.surface, border: `1px solid ${A.border}`,
                borderRadius: 8, padding: "8px 12px",
                color: langSlug ? A.text : A.dim,
                fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
              }}
            >
              <option value="">Select language…</option>
              {(languages as LangItem[]).map((l: LangItem) => (
                <option key={l.slug} value={l.slug}>{l.name} ({l.slug})</option>
              ))}
            </select>
          </div>

          {/* Topic cascading dropdowns */}
          {entity === "topic" && langSlug && (
            <>
              {topicsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Spinner size={16} />
                  <span style={{ fontSize: 12, color: A.muted }}>Loading topics…</span>
                </div>
              ) : (
                <>
                  {/* Depth 1 */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
                      textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                      Topic *
                    </label>
                    <select value={d1}
                      onChange={e => { setD1(e.target.value); setD2(""); setD3(""); }}
                      style={{
                        background: A.surface, border: `1px solid ${A.border}`,
                        borderRadius: 8, padding: "8px 12px",
                        color: d1 ? A.text : A.dim,
                        fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
                      }}>
                      <option value="">Select topic…</option>
                      {depth1.map((t: TopicSummary) => (
                        <option key={t.path} value={t.path}>{t.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Depth 2 — only if depth1 selected and has children */}
                  {d1 && depth2.length > 0 && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
                        textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                        Deep Dive (optional)
                      </label>
                      <select value={d2}
                        onChange={e => { setD2(e.target.value); setD3(""); }}
                        style={{
                          background: A.surface, border: `1px solid ${A.border}`,
                          borderRadius: 8, padding: "8px 12px",
                          color: d2 ? A.text : A.dim,
                          fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
                        }}>
                        <option value="">Keep at topic level…</option>
                        {depth2.map((t: TopicSummary) => (
                          <option key={t.path} value={t.path}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Depth 3 — only if depth2 selected and has children */}
                  {d2 && depth3.length > 0 && (
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: A.muted,
                        textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
                        Deeper Level (optional)
                      </label>
                      <select value={d3} onChange={e => setD3(e.target.value)}
                        style={{
                          background: A.surface, border: `1px solid ${A.border}`,
                          borderRadius: 8, padding: "8px 12px",
                          color: d3 ? A.text : A.dim,
                          fontSize: 13, width: "100%", cursor: "pointer", outline: "none",
                        }}>
                        <option value="">Keep at deep dive level…</option>
                        {depth3.map((t: TopicSummary) => (
                          <option key={t.path} value={t.path}>{t.title}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Selected target preview */}
          {target && (
            <div style={{
              background: A.surface, borderRadius: 8, padding: "10px 14px",
              border: `1px solid ${A.border}`,
            }}>
              <div style={{ fontSize: 11, color: A.dim, marginBottom: 4 }}>Selected target:</div>
              <code style={{ fontSize: 13, color: A.blue, fontWeight: 700 }}>{target}</code>
            </div>
          )}
        </Card>

        {/* ── Right: mode selector + action ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Mode cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {modes.map(m => (
              <div
                key={m.mode}
                onClick={() => setMode(m.mode)}
                style={{
                  background: mode === m.mode ? `${m.color}12` : A.card,
                  border:     `1px solid ${mode === m.mode ? m.color + "66" : A.border}`,
                  borderLeft: `3px solid ${mode === m.mode ? m.color : "transparent"}`,
                  borderRadius: 10, padding: "14px 16px",
                  cursor: "pointer", transition: "all .15s",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${mode === m.mode ? m.color : A.border}`,
                  background: mode === m.mode ? m.color : "transparent",
                  flexShrink: 0, marginTop: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {mode === m.mode && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} />}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{m.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: mode === m.mode ? m.color : A.text }}>
                      {m.label}
                    </span>
                    {m.safe && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: A.green,
                        background: `${A.green}18`, border: `1px solid ${A.green}44`,
                        padding: "1px 7px", borderRadius: 20,
                      }}>
                        REVERSIBLE
                      </span>
                    )}
                    {!m.safe && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: A.red,
                        background: `${A.red}18`, border: `1px solid ${A.red}44`,
                        padding: "1px 7px", borderRadius: 20,
                      }}>
                        PERMANENT
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: A.muted, lineHeight: 1.6 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Delete button */}
          <Button
            variant="danger"
            onClick={() => setConfirm(true)}
            disabled={!target}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {mode === "soft" ? "👁️ Hide" : "🗑️ Delete"} {target ? `"${target}"` : "…"}
          </Button>

          <ResponseBox data={response} error={errMsg} />
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          target={target}
          mode={mode}
          loading={isBusy}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(false)}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
