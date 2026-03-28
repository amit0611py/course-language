import { useState } from "react";
import { useFlushCache } from "../hooks";
import { A } from "../theme";
import { Button, Card, Input, Toast } from "../components/ui";

const PRESETS = [
  { label: "Flush Everything",  scope: "all",    desc: "Clears all topics, nav, and language caches. Use after seeding.",                  icon: "💥" },
  { label: "Flush All Topics",  scope: "topics", desc: "Clears every topic response cache. Next page load re-fetches from DB.",            icon: "📚" },
  { label: "Flush Single Topic",scope: "topic",  desc: "Clears one topic + its language nav tree. Use after editing a specific topic.",    icon: "📄" },
  { label: "Flush Nav Tree",    scope: "nav",    desc: "Clears sidebar navigation for one language. Use after adding/reordering sections.", icon: "🗂️" },
];

export default function Cache() {
  const [path,    setPath]    = useState("");
  const [langSlug,setLangSlug]= useState("");
  const [result,  setResult]  = useState<Record<string, unknown> | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const flush = useFlushCache();

  const handleFlush = async (scope: string) => {
    if (scope === "topic" && !path.trim()) {
      setToast({ msg: "Enter a topic path first", type: "error" }); return;
    }
    if (scope === "nav" && !langSlug.trim()) {
      setToast({ msg: "Enter a language slug first", type: "error" }); return;
    }
    if (scope === "all" && !confirm("Flush the entire cache? All users will see a fresh fetch on next load.")) return;

    try {
      const res = await flush.mutateAsync({ scope, path: path.trim() || undefined, langSlug: langSlug.trim() || undefined });
      setResult(res);
      setToast({ msg: `Cache flushed (scope: ${scope})`, type: "success" });
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: "error" });
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Cache Management</h1>
        <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
          Flush Redis caches after making content changes so learners see updates immediately.
        </p>
      </div>

      {/* Topic path input */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 12 }}>
          Scope Parameters
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Input label="Topic path (for single-topic flush)" value={path}
            onChange={e => setPath(e.target.value)} placeholder="java.jvm.memory" style={{ flex: 1 }} />
          <Input label="Language slug (for nav flush)" value={langSlug}
            onChange={e => setLangSlug(e.target.value)} placeholder="java" style={{ flex: 1 }} />
        </div>
      </Card>

      {/* Preset actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PRESETS.map(p => (
          <Card key={p.scope} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{p.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: A.text }}>{p.label}</div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{p.desc}</div>
            </div>
            <Button
              variant={p.scope === "all" ? "danger" : "secondary"}
              onClick={() => handleFlush(p.scope)}
              loading={flush.isPending}
            >
              Flush
            </Button>
          </Card>
        ))}
      </div>

      {/* Result */}
      {result && (
        <Card style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 10 }}>Last flush result</div>
          <pre style={{
            background: A.surface, borderRadius: 8, padding: 14,
            fontSize: 12, color: A.muted, overflow: "auto",
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      {/* How it works */}
      <Card style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: A.text, marginBottom: 10 }}>How caching works</div>
        {[
          { key: "Topic response", ttl: "30 min", pattern: "ce:topic:v1:{path}" },
          { key: "Navigation tree", ttl: "1 hour", pattern: "ce:nav:v1:{slug}" },
          { key: "Language list",  ttl: "24 hours", pattern: "ce:lang:v1:all" },
        ].map(r => (
          <div key={r.key} style={{
            display: "flex", gap: 16, padding: "8px 0",
            borderBottom: `1px solid ${A.border}`, fontSize: 12,
          }}>
            <span style={{ color: A.text, flex: 1, fontWeight: 500 }}>{r.key}</span>
            <span style={{ color: A.yellow }}>{r.ttl}</span>
            <code style={{ color: A.blue, fontSize: 11 }}>{r.pattern}</code>
          </div>
        ))}
      </Card>

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
