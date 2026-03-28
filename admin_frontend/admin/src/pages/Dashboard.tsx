import { useStats, useTopicsByLang, useBlocksByType } from "../hooks";
import { Card, Spinner, Badge } from "../components/ui";
import { A, BLOCK_COLORS, BLOCK_ICONS } from "../theme";
import { useNavigate } from "react-router-dom";
import type { TopicsByLanguage, BlocksByType } from "../types";

function StatCard({ icon, label, value, sub, color = A.blue, onClick }: {
  icon: string; label: string; value: number | string;
  sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: A.card, border: `1px solid ${A.border}`,
        borderRadius: 12, padding: "20px 24px",
        cursor: onClick ? "pointer" : "default",
        transition: "all .15s",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: A.text, lineHeight: 1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 11, color: A.dim, marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 24, opacity: 0.6 }}>{icon}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: byLang } = useTopicsByLang();
  const { data: byType } = useBlocksByType();

  if (statsLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: A.text, marginBottom: 4 }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: A.muted }}>Content overview and quick actions</p>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <StatCard icon="🌐" label="Languages" value={stats?.languages ?? 0}
          sub={`${stats?.active_languages ?? 0} active`} color={A.blue}
          onClick={() => navigate("/languages")} />
        <StatCard icon="📚" label="Topics" value={stats?.topics ?? 0}
          sub={`${stats?.published_topics ?? 0} published`} color={A.green}
          onClick={() => navigate("/topics")} />
        <StatCard icon="🧱" label="Total Blocks" value={stats?.total_blocks ?? 0}
          color={A.purple} />
        <StatCard icon="🧠" label="Quiz Questions" value={stats?.quiz_questions ?? 0}
          color={A.orange} onClick={() => navigate("/quizzes")} />
        <StatCard icon="🗺️" label="Diagrams" value={stats?.diagrams ?? 0}
          color={A.cyan} onClick={() => navigate("/diagrams")} />
        <StatCard icon="🗂️" label="Sections" value={stats?.sections ?? 0}
          color={A.yellow} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Topics by language ── */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.text, marginBottom: 16 }}>
            Topics by Language
          </div>
          {(byLang as TopicsByLanguage[] ?? []).map((row) => (
            <div key={row.language_slug} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0", borderBottom: `1px solid ${A.border}`,
            }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: row.is_active ? A.text : A.dim }}>
                  {row.language_name}
                </span>
                {!row.is_active && (
                  <Badge color={A.red} children="inactive" />
                )}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: A.muted }}>
                <span style={{ color: A.green }}>{row.published} pub</span>
                {row.unpublished > 0 && <span style={{ color: A.yellow }}>{row.unpublished} draft</span>}
                <span style={{ fontWeight: 700, color: A.text }}>{row.total_topics} total</span>
              </div>
            </div>
          ))}
          {!byLang?.length && (
            <div style={{ color: A.dim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No data yet
            </div>
          )}
        </Card>

        {/* ── Blocks by type ── */}
        <Card>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.text, marginBottom: 16 }}>
            Blocks by Type
          </div>
          {(byType as BlocksByType[] ?? []).map((row) => {
            const color = BLOCK_COLORS[row.block_type] ?? A.muted;
            const icon  = BLOCK_ICONS[row.block_type]  ?? "📦";
            const maxCount = Math.max(...(byType as BlocksByType[]).map(r => r.count));
            const pct = Math.round((row.count / maxCount) * 100);
            return (
              <div key={row.block_type} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: A.muted }}>
                    {icon} {row.block_type}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{row.count}</span>
                </div>
                <div style={{ height: 4, background: A.border, borderRadius: 2 }}>
                  <div style={{ height: "100%", background: color, borderRadius: 2, width: `${pct}%`, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
          {!byType?.length && (
            <div style={{ color: A.dim, fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              No blocks yet
            </div>
          )}
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: A.text, marginBottom: 14 }}>
          Quick Actions
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "New Topic",    icon: "📝", to: "/topics/new"     },
            { label: "New Diagram",  icon: "🗺️",  to: "/diagrams/new"  },
            { label: "New Quiz",     icon: "🧠", to: "/quizzes/new"    },
            { label: "New Language", icon: "🌐", to: "/languages/new"  },
            { label: "Flush Cache",  icon: "⚡", to: "/cache"          },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.to)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: A.card, border: `1px solid ${A.border}`,
                borderRadius: 9, padding: "10px 18px",
                color: A.text, fontSize: 13, cursor: "pointer",
                fontFamily: "inherit", fontWeight: 500,
                transition: "all .15s",
              }}
            >
              <span>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
