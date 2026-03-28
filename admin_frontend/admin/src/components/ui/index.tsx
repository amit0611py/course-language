import { A } from "../../theme";

// ── Badge ─────────────────────────────────────────────────────
export function Badge({ children, color = A.blue }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      padding: "2px 8px", borderRadius: 20,
      background: `${color}22`, color, border: `1px solid ${color}44`,
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  loading?: boolean;
}

export function Button({ children, variant = "secondary", size = "md", loading, disabled, style, ...rest }: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    borderRadius: 8, fontWeight: 600, fontSize: size === "sm" ? 12 : 13,
    padding: size === "sm" ? "5px 12px" : "8px 16px",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.5 : 1,
    transition: "all .15s",
    border: "1px solid transparent",
    fontFamily: "inherit",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: A.blue,    color: "#000", borderColor: A.blue },
    secondary: { background: A.card,    color: A.text, borderColor: A.border },
    danger:    { background: `${A.red}22`, color: A.red, borderColor: `${A.red}44` },
    ghost:     { background: "transparent", color: A.muted, borderColor: "transparent" },
  };
  return (
    <button disabled={disabled || loading} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {loading ? <span style={{ animation: "spin .7s linear infinite", display: "inline-block" }}>⟳</span> : children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
      <input
        style={{
          background: A.surface, border: `1px solid ${error ? A.red : A.border}`,
          borderRadius: 8, padding: "8px 12px", color: A.text,
          fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%",
          transition: "border-color .15s",
          ...style,
        }}
        {...rest}
      />
      {error && <span style={{ fontSize: 11, color: A.red }}>{error}</span>}
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  mono?: boolean;
}

export function Textarea({ label, mono, style, ...rest }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
      <textarea
        style={{
          background: A.surface, border: `1px solid ${A.border}`,
          borderRadius: 8, padding: "10px 12px", color: A.text,
          fontSize: 13, outline: "none", resize: "vertical",
          fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit",
          lineHeight: 1.6, width: "100%", minHeight: 80,
          transition: "border-color .15s",
          ...style,
        }}
        {...rest}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, style, ...rest }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: A.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</label>}
      <select
        style={{
          background: A.surface, border: `1px solid ${A.border}`,
          borderRadius: 8, padding: "8px 12px", color: A.text,
          fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%",
          cursor: "pointer",
          ...style,
        }}
        {...rest}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: A.card, border: `1px solid ${A.border}`,
      borderRadius: 12, padding: "20px 24px", ...style,
    }}>
      {children}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 640 }: {
  title: string; onClose: () => void;
  children: React.ReactNode; width?: number;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: A.card, border: `1px solid ${A.border}`,
        borderRadius: 16, width: "100%", maxWidth: width,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,.6)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: `1px solid ${A.border}`,
        }}>
          <h3 style={{ color: A.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "transparent", color: A.muted, fontSize: 18,
            border: "none", cursor: "pointer", lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon, title, desc, action }: {
  icon: string; title: string; desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", padding: "60px 24px", color: A.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: A.text, marginBottom: 6 }}>{title}</div>
      {desc && <div style={{ fontSize: 13, marginBottom: 20 }}>{desc}</div>}
      {action}
    </div>
  );
}

// ── Loading spinner ───────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${A.border}`,
      borderTopColor: A.blue,
      borderRadius: "50%",
      animation: "spin .7s linear infinite",
      display: "inline-block",
    }} />
  );
}

// ── Toast notification (simple) ───────────────────────────────
export function Toast({ msg, type = "success", onDismiss }: {
  msg: string; type?: "success" | "error" | "info";
  onDismiss: () => void;
}) {
  const colors = { success: A.green, error: A.red, info: A.blue };
  const icons  = { success: "✓", error: "✗", info: "ℹ" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: A.card, border: `1px solid ${colors[type]}44`,
      borderRadius: 10, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
      animation: "fadeUp .25s ease-out",
      maxWidth: 360,
    }}>
      <span style={{ color: colors[type], fontSize: 15, flexShrink: 0 }}>{icons[type]}</span>
      <span style={{ color: A.text, fontSize: 13, flex: 1 }}>{msg}</span>
      <button onClick={onDismiss} style={{
        background: "transparent", color: A.muted, border: "none",
        cursor: "pointer", fontSize: 16, lineHeight: 1, flexShrink: 0,
      }}>×</button>
    </div>
  );
}
