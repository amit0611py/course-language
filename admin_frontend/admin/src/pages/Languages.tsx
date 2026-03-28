import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useLanguages, useCreateLanguage, useUpdateLanguage, useDeleteLanguage,
  useSections, useCreateSection, useUpdateSection, useDeleteSection,
} from "../hooks";
import { A } from "../theme";
import { Badge, Button, Input, Textarea, Card, Modal, Empty, Spinner, Toast } from "../components/ui";
import type { Language, Section } from "../types";

// ── Language form ─────────────────────────────────────────────
function LanguageForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<Language>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [slug,        setSlug]        = useState(initial?.slug        ?? "");
  const [name,        setName]        = useState(initial?.name        ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [iconUrl,     setIconUrl]     = useState(initial?.iconUrl     ?? "");
  const [color,       setColor]       = useState((initial?.meta?.color as string) ?? "#f59e0b");
  const [tagline,     setTagline]     = useState((initial?.meta?.tagline as string) ?? "");
  const [sortOrder,   setSortOrder]   = useState(String(initial?.sortOrder ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Slug *" value={slug} onChange={e => setSlug(e.target.value)}
          placeholder="java" disabled={!!initial?.slug} style={{ flex: 1 }} />
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)}
          placeholder="Java" style={{ flex: 1 }} />
      </div>
      <Textarea label="Description" value={description}
        onChange={e => setDescription(e.target.value)} style={{ minHeight: 60 }} />
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Icon URL" value={iconUrl} onChange={e => setIconUrl(e.target.value)}
          placeholder="/icons/java.svg" style={{ flex: 2 }} />
        <Input label="Sort Order" type="number" value={sortOrder}
          onChange={e => setSortOrder(e.target.value)} style={{ flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Accent Color" type="color" value={color}
          onChange={e => setColor(e.target.value)} style={{ width: 80 }} />
        <Input label="Tagline" value={tagline} onChange={e => setTagline(e.target.value)}
          placeholder="Write once, run anywhere" style={{ flex: 1 }} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading}
          onClick={() => onSubmit({ slug, name, description, iconUrl, sortOrder: Number(sortOrder),
            meta: { color, tagline } })}>
          {initial?.slug ? "Save Changes" : "Create Language"}
        </Button>
      </div>
    </div>
  );
}

// ── Section form ──────────────────────────────────────────────
function SectionForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<Section>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [slug,        setSlug]        = useState(initial?.slug        ?? "");
  const [title,       setTitle]       = useState(initial?.title       ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder,   setSortOrder]   = useState(String(initial?.sortOrder ?? 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Slug *" value={slug} onChange={e => setSlug(e.target.value)}
          placeholder="core-language" disabled={!!initial?.slug} style={{ flex: 1 }} />
        <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Core Language" style={{ flex: 1 }} />
      </div>
      <Textarea label="Description" value={description}
        onChange={e => setDescription(e.target.value)} style={{ minHeight: 60 }} />
      <Input label="Sort Order" type="number" value={sortOrder}
        onChange={e => setSortOrder(e.target.value)} style={{ width: 120 }} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading}
          onClick={() => onSubmit({ slug, title, description, sortOrder: Number(sortOrder) })}>
          {initial?.slug ? "Save Changes" : "Create Section"}
        </Button>
      </div>
    </div>
  );
}

// ── Language card ─────────────────────────────────────────────
function LanguageCard({ lang }: { lang: Language }) {
  const navigate      = useNavigate();
  const [expanded,    setExpanded]    = useState(false);
  const [editLang,    setEditLang]    = useState(false);
  const [newSection,  setNewSection]  = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: sections = [] } = useSections(lang.slug);
  const updateLang   = useUpdateLanguage(lang.slug);
  const deleteLang   = useDeleteLanguage();
  const createSection = useCreateSection(lang.slug);
  const updateSection = useUpdateSection(lang.slug);
  const deleteSection = useDeleteSection(lang.slug);

  const color = (lang.meta?.color as string) ?? A.blue;

  return (
    <Card style={{ borderLeft: `3px solid ${color}`, padding: 0 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}22`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {lang.iconUrl ? <img src={lang.iconUrl} style={{ width: 24, height: 24 }} alt="" /> : lang.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: A.text }}>{lang.name}</span>
            <code style={{ fontSize: 10, color: A.dim, background: A.surface, padding: "1px 6px", borderRadius: 4 }}>
              {lang.slug}
            </code>
            <Badge color={lang.isActive ? A.green : A.red}>
              {lang.isActive ? "active" : "inactive"}
            </Badge>
          </div>
          {lang.description && (
            <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{lang.description}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="sm" onClick={() => navigate(`/topics?language=${lang.slug}`)}>
            View Topics
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditLang(true)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)}>
            {expanded ? "▲" : `▼ Sections (${(sections as Section[]).length})`}
          </Button>
        </div>
      </div>

      {/* Sections */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${A.border}`, padding: "12px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Sections
            </span>
            <Button size="sm" variant="secondary" onClick={() => setNewSection(true)}>+ Add Section</Button>
          </div>
          {(sections as Section[]).map(s => (
            <div key={s.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: A.surface, borderRadius: 8, marginBottom: 6,
            }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: A.text, flex: 1 }}>{s.title}</span>
              <code style={{ fontSize: 10, color: A.dim }}>{s.slug}</code>
              <span style={{ fontSize: 11, color: A.dim }}>order: {s.sortOrder}</span>
              <Badge color={s.isActive ? A.green : A.yellow}>{s.isActive ? "active" : "inactive"}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setEditSection(s)}>Edit</Button>
              <Button size="sm" variant="danger"
                onClick={async () => {
                  if (!confirm(`Delete section "${s.title}"?`)) return;
                  try { await deleteSection.mutateAsync(s.id); setToast({ msg: "Section deleted", type: "success" }); }
                  catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
                }}>
                Delete
              </Button>
            </div>
          ))}
          {!(sections as Section[]).length && (
            <div style={{ fontSize: 12, color: A.dim, padding: "8px 0" }}>No sections yet.</div>
          )}
        </div>
      )}

      {/* Edit language modal */}
      {editLang && (
        <Modal title={`Edit ${lang.name}`} onClose={() => setEditLang(false)}>
          <LanguageForm initial={lang} loading={updateLang.isPending}
            onCancel={() => setEditLang(false)}
            onSubmit={async (data) => {
              try { await updateLang.mutateAsync(data); setEditLang(false); setToast({ msg: "Language updated", type: "success" }); }
              catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
            }} />
        </Modal>
      )}

      {/* New section modal */}
      {newSection && (
        <Modal title="New Section" onClose={() => setNewSection(false)}>
          <SectionForm loading={createSection.isPending}
            onCancel={() => setNewSection(false)}
            onSubmit={async (data) => {
              try { await createSection.mutateAsync(data); setNewSection(false); setToast({ msg: "Section created", type: "success" }); }
              catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
            }} />
        </Modal>
      )}

      {/* Edit section modal */}
      {editSection && (
        <Modal title={`Edit: ${editSection.title}`} onClose={() => setEditSection(null)}>
          <SectionForm initial={editSection} loading={updateSection.isPending}
            onCancel={() => setEditSection(null)}
            onSubmit={async (data) => {
              try { await updateSection.mutateAsync({ id: editSection.id, body: data }); setEditSection(null); setToast({ msg: "Section updated", type: "success" }); }
              catch (e: unknown) { setToast({ msg: (e as Error).message, type: "error" }); }
            }} />
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </Card>
  );
}

// ── Languages page ────────────────────────────────────────────
export default function Languages() {
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: langs = [], isLoading } = useLanguages();
  const createLang = useCreateLanguage();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Languages</h1>
          <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
            {(langs as Language[]).length} languages configured
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>+ New Language</Button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={28} /></div>
      ) : (langs as Language[]).length === 0 ? (
        <Empty icon="🌐" title="No languages yet"
          desc="Create your first language to get started."
          action={<Button variant="primary" onClick={() => setShowNew(true)}>Create Language</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(langs as Language[]).map(l => <LanguageCard key={l.slug} lang={l} />)}
        </div>
      )}

      {showNew && (
        <Modal title="New Language" onClose={() => setShowNew(false)}>
          <LanguageForm loading={createLang.isPending}
            onCancel={() => setShowNew(false)}
            onSubmit={async (data) => {
              try {
                await createLang.mutateAsync(data);
                setShowNew(false);
                setToast({ msg: "Language created!", type: "success" });
              } catch (e: unknown) {
                setToast({ msg: (e as Error).message, type: "error" });
              }
            }} />
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
