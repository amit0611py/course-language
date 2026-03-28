import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTopic, useSaveTopic, useLanguages, useSections } from "../hooks";
import { A, DIFFICULTIES } from "../theme";
import { Button, Input, Textarea, Select, Card, Spinner, Toast } from "../components/ui";
import BlockListEditor from "../components/editor/BlockListEditor";
import type { Block } from "../types";

export default function TopicEditor() {
  const { "*": pathParam } = useParams<{ "*": string }>();
  const isNew    = !pathParam || pathParam === "new";
  const topicPath = isNew ? "" : pathParam!;
  const navigate  = useNavigate();

  // ── Remote data ───────────────────────────────────────────────
  const { data: existing, isLoading } = useTopic(topicPath);
  const { data: languages = [] }      = useLanguages();
  const save = useSaveTopic(isNew ? undefined : topicPath);

  // ── Local form state ──────────────────────────────────────────
  const [path,         setPath]         = useState("");
  const [title,        setTitle]        = useState("");
  const [langSlug,     setLangSlug]     = useState("java");
  const [sectionSlug,  setSectionSlug]  = useState("");
  const [difficulty,   setDifficulty]   = useState("beginner");
  const [estimatedMins,setEstimatedMins]= useState("5");
  const [tags,         setTags]         = useState("");
  const [isDeepDive,   setIsDeepDive]   = useState(false);
  const [isPublished,  setIsPublished]  = useState(true);
  const [sortOrder,    setSortOrder]    = useState("0");
  const [blocks,       setBlocks]       = useState<Block[]>([]);
  const [activeTab,    setActiveTab]    = useState<"meta" | "blocks">("meta");
  const [toast,        setToast]        = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Sections for chosen language
  const { data: sections = [] } = useSections(langSlug);

  // ── Populate form when editing ────────────────────────────────
  useEffect(() => {
    if (!existing) return;
    setPath(existing.path);
    setTitle(existing.title);
    setLangSlug(existing.languageSlug ?? "java");
    setSectionSlug(existing.sectionSlug ?? "");
    setDifficulty(existing.difficulty);
    setEstimatedMins(String(existing.estimatedMins));
    setTags((existing.tags ?? []).join(", "));
    setIsDeepDive(existing.isDeepDive);
    setIsPublished(existing.isPublished);
    setSortOrder(String(existing.sortOrder));
    setBlocks(existing.blocks ?? []);
  }, [existing]);

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!path.trim()) { setToast({ msg: "Path is required", type: "error" }); return; }
    if (!title.trim()) { setToast({ msg: "Title is required", type: "error" }); return; }

    try {
      await save.mutateAsync({
        meta: {
          path: path.trim(),
          title: title.trim(),
          sectionSlug: sectionSlug || undefined,
          difficulty,
          estimatedMins: Number(estimatedMins) || 5,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          isDeepDive,
          isPublished,
          sortOrder: Number(sortOrder) || 0,
        },
        blocks,
      });
      setToast({ msg: `Topic ${isNew ? "created" : "updated"} successfully!`, type: "success" });
      if (isNew) setTimeout(() => navigate("/topics"), 1200);
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: "error" });
    }
  };

  if (!isNew && isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><Spinner size={32} /></div>;
  }

  const langOptions = [
    { value: "", label: "Select language…" },
    ...(languages as { slug: string; name: string }[]).map(l => ({ value: l.slug, label: l.name })),
  ];

  const sectionOptions = [
    { value: "", label: "No section" },
    ...(sections as { slug: string; title: string }[]).map(s => ({ value: s.slug, label: s.title })),
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <button onClick={() => navigate("/topics")}
            style={{ background: "none", border: "none", color: A.muted, cursor: "pointer", fontSize: 13, marginBottom: 6, padding: 0 }}>
            ← Back to Topics
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>
            {isNew ? "New Topic" : `Edit: ${topicPath}`}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && (
            <a href={`http://localhost:5173/${langSlug}/t/${topicPath}`}
              target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: A.card, border: `1px solid ${A.border}`, borderRadius: 8,
                color: A.muted, fontSize: 13, textDecoration: "none" }}>
              👁 Preview
            </a>
          )}
          <Button variant="primary" onClick={handleSave} loading={save.isPending}>
            {isNew ? "Create Topic" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${A.border}`, paddingBottom: 0 }}>
        {(["meta", "blocks"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 18px", fontSize: 13, fontWeight: 600,
            color: activeTab === tab ? A.blue : A.muted,
            borderBottom: `2px solid ${activeTab === tab ? A.blue : "transparent"}`,
            marginBottom: -1, fontFamily: "inherit",
          }}>
            {tab === "meta" ? "📋 Metadata" : `💾 Blocks (${blocks.length})`}
          </button>
        ))}
      </div>

      {/* Meta tab */}
      {activeTab === "meta" && (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <Input label="Path *  (e.g. java.jvm.memory)"
                value={path} onChange={e => setPath(e.target.value)}
                disabled={!isNew}
                placeholder="language.section.topic" />
              {isNew && (
                <div style={{ fontSize: 11, color: A.dim, marginTop: 4 }}>
                  Dot-separated. First segment must match the language slug. Cannot be changed after creation.
                </div>
              )}
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <Select label="Language" value={langSlug}
              onChange={e => { setLangSlug(e.target.value); setSectionSlug(""); }}
              options={langOptions} />

            <Select label="Section" value={sectionSlug}
              onChange={e => setSectionSlug(e.target.value)}
              options={sectionOptions} />

            <Select label="Difficulty" value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              options={DIFFICULTIES.map(d => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))} />

            <Input label="Estimated minutes" type="number" value={estimatedMins}
              onChange={e => setEstimatedMins(e.target.value)} />

            <Input label="Tags (comma separated)" value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="java, jvm, memory" style={{ gridColumn: "span 2" } as React.CSSProperties} />

            <Input label="Sort order" type="number" value={sortOrder}
              onChange={e => setSortOrder(e.target.value)} />

            <div style={{ display: "flex", gap: 24, alignItems: "center", paddingTop: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={isDeepDive}
                  onChange={e => setIsDeepDive(e.target.checked)} />
                <span style={{ fontSize: 13, color: A.text }}>Deep Dive</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)} />
                <span style={{ fontSize: 13, color: A.text }}>Published</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Blocks tab */}
      {activeTab === "blocks" && (
        <BlockListEditor blocks={blocks} onChange={setBlocks} />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
