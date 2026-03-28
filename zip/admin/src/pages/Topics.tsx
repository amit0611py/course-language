import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopics, useUnpublishTopic } from "../hooks";
import { A } from "../theme";
import { Badge, Button, Input, Select, Empty, Spinner, Toast } from "../components/ui";
import type { TopicSummary } from "../types";

export default function Topics() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("");
  const [search,   setSearch]   = useState("");
  const [offset,   setOffset]   = useState(0);
  const [toast,    setToast]     = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const limit = 30;
  const { data, isLoading } = useTopics({ language, search, limit, offset });
  const unpublish = useUnpublishTopic();

  const topics: TopicSummary[] = data?.topics ?? [];
  const total:  number         = data?.total   ?? 0;

  const handleUnpublish = async (path: string) => {
    if (!confirm(`Unpublish "${path}"? It will be hidden from learners.`)) return;
    try {
      await unpublish.mutateAsync(path);
      setToast({ msg: `Unpublished: ${path}`, type: "success" });
    } catch (e: unknown) {
      setToast({ msg: (e as Error).message, type: "error" });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, margin: 0 }}>Topics</h1>
          <p style={{ fontSize: 13, color: A.muted, marginTop: 4 }}>
            {total} total topics
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate("/topics/new")}>
          + New Topic
        </Button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <Input placeholder="Search title or path…" value={search}
          onChange={e => { setSearch(e.target.value); setOffset(0); }}
          style={{ flex: 1 }} />
        <Input placeholder="Language (e.g. java)" value={language}
          onChange={e => { setLanguage(e.target.value); setOffset(0); }}
          style={{ width: 160 }} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner size={28} /></div>
      ) : topics.length === 0 ? (
        <Empty icon="📚" title="No topics found" desc="Try adjusting your filters or create a new topic."
          action={<Button variant="primary" onClick={() => navigate("/topics/new")}>Create Topic</Button>} />
      ) : (
        <div style={{ background: A.card, border: `1px solid ${A.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${A.border}` }}>
                {["Path", "Title", "Section", "Difficulty", "Depth", "Status", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, color: A.dim,
                    letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((t, i) => (
                <tr key={t.path} style={{
                  borderBottom: i < topics.length - 1 ? `1px solid ${A.border}` : "none",
                  background: "transparent",
                }}>
                  <td style={{ padding: "10px 16px" }}>
                    <code style={{ fontSize: 11, color: A.blue }}>{t.path}</code>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: A.text, maxWidth: 200 }}>
                    {t.title}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 11, color: A.muted }}>{t.sectionTitle ?? "—"}</span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Badge color={t.difficulty === "beginner" ? A.green : t.difficulty === "intermediate" ? A.yellow : A.red}>
                      {t.difficulty}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 11, color: A.dim }}>{t.depth}</span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <Badge color={t.isPublished ? A.green : A.yellow}>
                      {t.isPublished ? "published" : "draft"}
                    </Badge>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" onClick={() => navigate(`/topics/edit/${t.path}`)}>Edit</Button>
                      {t.isPublished && (
                        <Button size="sm" variant="danger"
                          onClick={() => handleUnpublish(t.path)}
                          loading={unpublish.isPending}>
                          Unpublish
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Button size="sm" disabled={offset === 0} onClick={() => setOffset(o => o - limit)}>← Prev</Button>
          <span style={{ fontSize: 12, color: A.muted, alignSelf: "center" }}>
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <Button size="sm" disabled={offset + limit >= total} onClick={() => setOffset(o => o + limit)}>Next →</Button>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  );
}
