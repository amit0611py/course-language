import { useState } from "react";
import { useDiagrams, useCreateDiagram, useUpdateDiagram, useDeleteDiagram } from "../hooks";
import { A } from "../theme";
import { Badge, Button, Input, Textarea, Select, Card, Modal, Empty, Spinner, Toast } from "../components/ui";
import type { Diagram } from "../types";

const TYPE_OPTS = [
  { value: "svg",     label: "SVG (static HTML)" },
  { value: "mermaid", label: "Mermaid (source)"  },
  { value: "png",     label: "Image URL"          },
];

function DiagramForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Partial<Diagram>;
  onSubmit: (d: Record<string, unknown>) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [key,   setKey]   = useState(initial?.diagramKey ?? "");
  const [title, setTitle] = useState(initial?.title      ?? "");
  const [type,  setType]  = useState(initial?.type        ?? "svg");

  const existingData = initial?.data ?? {};
  const [svg,    setSvg]    = useState((existingData.svg    as string) ?? "");
  const [source, setSource] = useState((existingData.source as string) ?? "");
  const [url,    setUrl]    = useState((existingData.url    as string) ?? "");

  const buildData = () => {
    if (type === "svg")     return { svg };
    if (type === "mermaid") return { source };
    return { url };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Input label="Diagram Key *" value={key} onChange={e => setKey(e.target.value)}
          placeholder="java_jvm" disabled={!!initial?.diagramKey} style={{ flex: 1 }} />
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)}
          placeholder="JVM Architecture" style={{ flex: 1 }} />
        <Select label="Type" value={type} onChange={e => setType(e.target.value)} options={TYPE_OPTS} />
      </div>

      {type === "svg" && (
        <Textarea label="SVG / HTML content" mono value={svg}
          onChange={e => setSvg(e.target.value)} style={{ minHeight: 200 }} />
      )}
      {type === "mermaid" && (
        <Textarea label="Mermaid source" mono value={source}
          onChange={e => setSource(e.target.value)} style={{ minHeight: 140 }}
          placeholder={"graph TD\n  A --> B\n  B --> C"} />
      )}
      {type === "png" && (
        <Input label="Image URL" value={url} onChange={e => setUrl(e.target.value)} />
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" loading={loading}
          onClick={() => onSubmit({ diagramKey: key, title, type, data: buildData() })}>
          {initial?.diagramKey ? "Save Changes" : "Create Diagram"}
        </Button>
      </div>
    </div>
  );
}

export default function Diagrams() {
  const [search,  setSearch]  = useState("");
  const [typeF,   setTypeF]   = useState("");
  const [modal,   setModal]   = useState<"new" | Diagram | null>(null);
  const [toast,   setToast]   = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const { data: diagrams = [], isLoading } = useDiagrams({ search, type: typeF || undefined });
  const createDiagram = useCreateDiagram();
  const deleteDiagram = useDeleteDiagram();

  const editKey = typeof modal === "object" && modal !== null ? modal.diagramKey : null;
  const updateDiagram = useUpdateDiagram(editKey ?? "");

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete diagram "${key}"? Topics referencing it will show a placeholder.`)) return;
    try {
      await deleteDiagram.mutateAsync(key);
      setToast({ msg: `Deleted: ${key}`, type: "success" });
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: "error" });
    }
  };

  const typeColor = { svg: A.purple, mermaid: A.blue, png: A.yellow };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Diagrams</h1>
          <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
            {(diagrams as Diagram[]).length} diagrams in library
          </p>
        </div>
        <Button variant="primary" onClick={() => setModal("new")}>+ New Diagram</Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Input placeholder="Search diagram key…" value={search}
          onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Select value={typeF} onChange={e => setTypeF(e.target.value)}
          options={[{ value: "", label: "All types" }, ...TYPE_OPTS]} />
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={28} /></div>
      ) : (diagrams as Diagram[]).length === 0 ? (
        <Empty icon="🗺️" title="No diagrams yet"
          desc="Create a diagram or run npm run export:diagrams to import from React components."
          action={<Button variant="primary" onClick={() => setModal("new")}>Create Diagram</Button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {(diagrams as Diagram[]).map(d => (
            <Card key={d.diagramKey} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <code style={{ fontSize: 12, color: A.blue }}>{d.diagramKey}</code>
                  {d.title && (
                    <div style={{ fontSize: 13, color: A.text, marginTop: 2 }}>{d.title}</div>
                  )}
                </div>
                <Badge color={typeColor[d.type as keyof typeof typeColor] ?? A.muted}>{d.type}</Badge>
              </div>

              {/* Preview snippet */}
              {d.type === "svg" && d.data.svg && (
                <div style={{
                  background: A.surface, borderRadius: 8, padding: 12,
                  maxHeight: 120, overflow: "hidden", fontSize: 10,
                  color: A.dim, fontFamily: "monospace",
                }}>
                  {String(d.data.svg).slice(0, 200)}…
                </div>
              )}
              {d.type === "mermaid" && d.data.source && (
                <pre style={{
                  background: A.surface, borderRadius: 8, padding: 10,
                  fontSize: 10, color: A.muted, overflow: "hidden",
                  maxHeight: 80, margin: 0,
                }}>
                  {String(d.data.source).slice(0, 180)}
                </pre>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <Button size="sm" onClick={() => setModal(d)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(d.diagramKey)}>Delete</Button>
                <span style={{ fontSize: 10, color: A.dim, alignSelf: "center", marginLeft: "auto" }}>
                  {new Date(d.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New / Edit modal */}
      {modal !== null && (
        <Modal
          title={modal === "new" ? "New Diagram" : `Edit: ${(modal as Diagram).diagramKey}`}
          onClose={() => setModal(null)}
          width={720}
        >
          <DiagramForm
            initial={modal === "new" ? undefined : modal as Diagram}
            loading={modal === "new" ? createDiagram.isPending : updateDiagram.isPending}
            onCancel={() => setModal(null)}
            onSubmit={async (data) => {
              try {
                if (modal === "new") {
                  await createDiagram.mutateAsync(data);
                  setToast({ msg: "Diagram created!", type: "success" });
                } else {
                  await updateDiagram.mutateAsync(data);
                  setToast({ msg: "Diagram updated!", type: "success" });
                }
                setModal(null);
              } catch (e: unknown) {
                setToast({ msg: (e as Error).message, type: "error" });
              }
            }}
          />
        </Modal>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
