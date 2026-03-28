import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { A } from "../../theme";

const NAV = [
  { to: "/",           icon: "📊", label: "Dashboard"    },
  { to: "/languages",  icon: "🌐", label: "Languages"    },
  { to: "/topics",     icon: "📚", label: "Topics"       },
  { to: "/bulk",       icon: "🚀", label: "Bulk Insert"  },
  { to: "/delete",     icon: "🗑️",  label: "Delete"       },
  { to: "/diagrams",   icon: "🗺️",  label: "Diagrams"    },
  { to: "/quizzes",    icon: "🧠", label: "Quizzes"      },
  { to: "/cache",      icon: "⚡", label: "Cache"        },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div style={{ display: "flex", height: "100vh", background: A.bg, color: A.text, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 56 : 220,
        background: A.sidebar,
        borderRight: `1px solid ${A.sidebarBorder}`,
        display: "flex", flexDirection: "column",
        transition: "width .2s ease",
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          height: 52, display: "flex", alignItems: "center",
          padding: "0 16px", borderBottom: `1px solid ${A.sidebarBorder}`,
          gap: 10, overflow: "hidden",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚙️</span>
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 700, color: A.text, whiteSpace: "nowrap" }}>
              Content Admin
            </span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              marginLeft: "auto", background: "transparent",
              color: A.muted, border: "none", cursor: "pointer",
              fontSize: 14, flexShrink: 0, padding: 2,
            }}
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "8px 8px" }}>
          {NAV.map(item => {
            const isActive = item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", borderRadius: 8,
                  marginBottom: 2, textDecoration: "none",
                  background: isActive ? A.active : "transparent",
                  color: isActive ? A.blue : A.muted,
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  transition: "all .15s",
                  overflow: "hidden", whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div style={{
            padding: "12px 16px", borderTop: `1px solid ${A.sidebarBorder}`,
            fontSize: 10, color: A.dim,
          }}>
            Admin v1.0 · Port 5174
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 52, borderBottom: `1px solid ${A.border}`,
          display: "flex", alignItems: "center", padding: "0 24px",
          justifyContent: "space-between", flexShrink: 0,
          background: A.surface,
        }}>
          <div style={{ fontSize: 12, color: A.dim }}>
            {location.pathname === "/" ? "Dashboard" : location.pathname.slice(1).replace("/", " › ")}
          </div>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12, color: A.muted, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6,
              background: A.card, border: `1px solid ${A.border}`,
              borderRadius: 7, padding: "4px 12px",
            }}
          >
            <span>👁️</span> View Learner App
          </a>
        </header>

        {/* Page */}
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
