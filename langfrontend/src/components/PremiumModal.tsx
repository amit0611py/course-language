import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { C } from "../theme";
import { usePremium } from "../context/PremiumContext";
import PaymentModal from "./PaymentModal";
import {
  authSendOtp, authVerifyOtp, authSignup, authLogin,
  authLogout, authActivateToken,
  authForgotPassword, authVerifyResetOtp, authResetPassword,
  fetchPlans,
  type OtpSendResponse, type SubscriptionPlan,
} from "../api/client";

// Detect user currency: INR if Indian mobile/email, else USD
function detectCurrency(user: { mobile?: string | null; email?: string | null } | null): string {
  if (!user) return "INR";
  if (user.mobile && user.mobile.startsWith("+91")) return "INR";
  if (user.email  && user.email.endsWith(".in"))    return "INR";
  return "INR"; // default INR — change to "USD" for international
}

// ── Constants ─────────────────────────────────────────────────
const SHOWN_KEY       = "io_modal_shown";
const RESEND_COOLDOWN = 60;

// ── Types ──────────────────────────────────────────────────────
type Tab        = "signup" | "login";
type SignupStep = "contact" | "otp" | "details";
type ForgotStep = "contact" | "otp" | "newpass" | "done";

// ── Shared styles ──────────────────────────────────────────────
const iStyle = (err = false): React.CSSProperties => ({
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,.05)",
  border: `1px solid ${err ? "#f87171" : "rgba(255,255,255,.12)"}`,
  borderRadius: 10, color: "#e2e8f0", fontSize: 14,
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color .2s",
});

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "12px 0",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  border: "none", borderRadius: 10, color: "#fff",
  fontWeight: 700, fontSize: 14, cursor: "pointer",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700,
  color: "rgba(255,255,255,.4)", letterSpacing: 0.6,
  textTransform: "uppercase", marginBottom: 5,
};

const linkBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#a78bfa", fontSize: 12, fontFamily: "inherit",
  textDecoration: "underline", textUnderlineOffset: 2,
};

function Err({ m }: { m: string }) {
  return m ? <div style={{ color: "#f87171", fontSize: 12, marginTop: 4, display: "flex", gap: 5 }}><span>⚠</span>{m}</div> : null;
}
function Ok({ m }: { m: string }) {
  return m ? <div style={{ color: "#4ade80", fontSize: 12, marginTop: 4, display: "flex", gap: 5 }}><span>✓</span>{m}</div> : null;
}

// ── Resend timer ───────────────────────────────────────────────
function useTimer() {
  const [secs, setSecs] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useCallback((s = RESEND_COOLDOWN) => {
    setSecs(s);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      setSecs(n => { if (n <= 1) { clearInterval(ref.current!); return 0; } return n - 1; });
    }, 1000);
  }, []);
  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);
  return { secs, start, ready: secs === 0 };
}

// ── OTP boxes ──────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(5, " ").split("").slice(0, 5);
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", position: "relative" }}
      onClick={() => !disabled && ref.current?.focus()}>
      <input ref={ref} type="text" inputMode="numeric" autoComplete="one-time-code"
        value={value} disabled={disabled}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, zIndex: 1 }} />
      {[0,1,2,3,4].map(i => {
        const ch = digits[i] === " " ? "" : digits[i];
        const active = !disabled && value.length === i;
        return (
          <div key={i} style={{
            width: 50, height: 58, borderRadius: 10,
            background: ch ? "rgba(124,58,237,.14)" : "rgba(255,255,255,.04)",
            border: `2px solid ${ch ? "#7c3aed" : active ? "rgba(124,58,237,.5)" : "rgba(255,255,255,.1)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#e2e8f0",
            transition: "border-color .15s", userSelect: "none",
          }}>
            {ch || (active ? <span style={{ width: 2, height: 24, background: "#7c3aed", animation: "blink 1s step-end infinite" }} /> : "")}
          </div>
        );
      })}
    </div>
  );
}

// ── Password field ─────────────────────────────────────────────
function PwField({ label, value, onChange, onEnter, err }: {
  label: string; value: string; onChange: (v: string) => void;
  onEnter?: () => void; err?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type={show ? "text" : "password"} value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onEnter?.()}
          style={{ ...iStyle(err), paddingRight: 42 }}
          autoComplete="current-password" />
        <button onClick={() => setShow(s => !s)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, padding: 0 }}>
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

// ── OTP step (shared by signup + forgot) ──────────────────────
function OtpStep({ contact, info, otp, setOtp, loading, err, ok, timer, onVerify, onResend, onBack }: {
  contact: string; info: OtpSendResponse | null;
  otp: string; setOtp: (v: string) => void;
  loading: boolean; err: string; ok: string;
  timer: ReturnType<typeof useTimer>;
  onVerify: () => void; onResend: () => void; onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>
          OTP sent to <span style={{ color: "#a78bfa", fontWeight: 700 }}>{contact}</span>
        </div>
        {info?._devOtp && (
          <div style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#f59e0b", display: "inline-block" }}>
            Dev OTP: <strong style={{ letterSpacing: 3 }}>{info._devOtp}</strong>
          </div>
        )}
        {info && (
          <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>
            {info.remainingSendsToday} resend{info.remainingSendsToday !== 1 ? "s" : ""} left today
          </div>
        )}
      </div>
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      <Err m={err} /><Ok m={ok} />
      <button onClick={onVerify} disabled={loading || otp.length < 5}
        style={{ ...btnPrimary, opacity: loading || otp.length < 5 ? 0.5 : 1 }}>
        {loading ? "Verifying…" : "Verify OTP"}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={onBack} style={linkBtn}>← Change contact</button>
        {timer.ready
          ? <button onClick={onResend} disabled={loading} style={linkBtn}>Resend OTP</button>
          : <span style={{ fontSize: 12, color: C.dim }}>Resend in <span style={{ color: "#a78bfa" }}>{timer.secs}s</span></span>}
      </div>
    </div>
  );
}

// ── SIGNUP FLOW ────────────────────────────────────────────────
function SignupFlow({ onDone, onLogin }: { onDone: () => void; onLogin: () => void }) {
  const { login } = usePremium();
  const timer = useTimer();
  const [step, setStep]       = useState<SignupStep>("contact");
  const [contact, setContact] = useState("");
  const [cType, setCType]     = useState<"email" | "mobile">("email");
  const [vToken, setVToken]   = useState("");
  const [otp, setOtp]         = useState("");
  const [info, setInfo]       = useState<OtpSendResponse | null>(null);
  const [name, setName]       = useState("");
  const [pw, setPw]           = useState("");
  const [pw2, setPw2]         = useState("");
  const [loading, setL]       = useState(false);
  const [err, setErr]         = useState("");
  const [ok, setOk]           = useState("");

  useEffect(() => {
    if (otp.length === 5 && step === "otp" && !loading) sendVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const sendOtp = async () => {
    setErr(""); setOk("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    setL(true);
    try {
      const r = await authSendOtp(contact.trim());
      setInfo(r); setCType(r.contactType);
      setStep("otp"); timer.start();
      setOk(`OTP sent to your ${r.contactType === "email" ? "email" : "mobile"}`);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const resend = async () => {
    setErr(""); setOk(""); setOtp("");
    setL(true);
    try { const r = await authSendOtp(contact.trim()); setInfo(r); timer.start(); setOk("New OTP sent!"); }
    catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const sendVerify = async () => {
    if (otp.length < 5) { setErr("Enter the 5-digit OTP"); return; }
    setErr(""); setL(true);
    try {
      const r = await authVerifyOtp(contact.trim(), otp);
      setVToken(r.verifiedToken); setStep("details"); setOk("");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const signup = async () => {
    setErr("");
    if (!name.trim())    { setErr("Full name is required"); return; }
    if (pw.length < 6)   { setErr("Password must be at least 6 characters"); return; }
    if (pw !== pw2)      { setErr("Passwords do not match"); return; }
    setL(true);
    try {
      const r = await authSignup({ verifiedToken: vToken, fullName: name.trim(), password: pw, confirmPassword: pw2 });
      login(r.token, r.user); onDone();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  if (step === "contact") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setContact(e.target.value)} onKeyDown={e => e.key === "Enter" && sendOtp()}
          style={iStyle(!!err)} autoComplete="username" />
        <Err m={err} />
      </div>
      <button onClick={sendOtp} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Sending OTP…" : "Send OTP →"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onLogin} style={linkBtn}>Already have an account? Log in</button>
      </div>
    </div>
  );

  if (step === "otp") return (
    <OtpStep contact={contact} info={info} otp={otp} setOtp={setOtp}
      loading={loading} err={err} ok={ok} timer={timer}
      onVerify={sendVerify} onResend={resend}
      onBack={() => { setStep("contact"); setErr(""); setOtp(""); setOk(""); }} />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center", color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
        ✓ {cType === "email" ? "Email" : "Mobile"} verified
      </div>
      <div>
        <label style={labelStyle}>Full name</label>
        <input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} style={iStyle()} />
      </div>
      <PwField label="Password" value={pw} onChange={setPw} />
      <PwField label="Confirm password" value={pw2} onChange={setPw2} onEnter={signup} err={!!err && err.includes("match")} />
      <Err m={err} />
      <button onClick={signup} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </div>
  );
}

// ── FORGOT PASSWORD FLOW ───────────────────────────────────────
function ForgotFlow({ onBack }: { onBack: () => void }) {
  const timer = useTimer();
  const [step, setStep]     = useState<ForgotStep>("contact");
  const [contact, setC]     = useState("");
  const [info, setInfo]     = useState<OtpSendResponse | null>(null);
  const [otp, setOtp]       = useState("");
  const [rToken, setRT]     = useState("");
  const [pw, setPw]         = useState("");
  const [pw2, setPw2]       = useState("");
  const [loading, setL]     = useState(false);
  const [err, setErr]       = useState("");
  const [ok, setOk]         = useState("");

  useEffect(() => {
    if (otp.length === 5 && step === "otp" && !loading) verify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const send = async () => {
    setErr(""); setOk("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    setL(true);
    try {
      const r = await authForgotPassword(contact.trim());
      setInfo(r._devOtp ? { _devOtp: r._devOtp, remainingSendsToday: 2, contactType: "email", contact: contact.trim(), success: true, message: "", expiresInMinutes: 10 } : null);
      setStep("otp"); timer.start(); setOk(r.message);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const resend = async () => {
    setErr(""); setOk(""); setOtp("");
    setL(true);
    try { await authForgotPassword(contact.trim()); timer.start(); setOk("New OTP sent!"); }
    catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const verify = async () => {
    if (otp.length < 5) { setErr("Enter the OTP"); return; }
    setErr(""); setL(true);
    try {
      const r = await authVerifyResetOtp(contact.trim(), otp);
      setRT(r.resetToken); setStep("newpass"); setOk("");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  const reset = async () => {
    setErr("");
    if (pw.length < 6)  { setErr("Password must be at least 6 characters"); return; }
    if (pw !== pw2)     { setErr("Passwords do not match"); return; }
    setL(true);
    try { await authResetPassword(rToken, pw, pw2); setStep("done"); }
    catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  if (step === "contact") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 13 }}>Enter the email or mobile number on your account.</div>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setC(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          style={iStyle(!!err)} />
        <Err m={err} /><Ok m={ok} />
      </div>
      <button onClick={send} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Sending…" : "Send Reset OTP →"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onBack} style={linkBtn}>← Back to login</button>
      </div>
    </div>
  );

  if (step === "otp") return (
    <OtpStep contact={contact} info={info} otp={otp} setOtp={setOtp}
      loading={loading} err={err} ok={ok} timer={timer}
      onVerify={verify} onResend={resend}
      onBack={() => { setStep("contact"); setErr(""); setOtp(""); setOk(""); }} />
  );

  if (step === "newpass") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, textAlign: "center" }}>✓ Identity verified — set your new password</div>
      <PwField label="New password" value={pw} onChange={setPw} />
      <PwField label="Confirm new password" value={pw2} onChange={setPw2} onEnter={reset} err={!!err && err.includes("match")} />
      <Err m={err} />
      <button onClick={reset} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </div>
  );

  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>Password reset successfully!</div>
      <div style={{ color: C.muted, fontSize: 13 }}>Please log in with your new password.</div>
      <button onClick={onBack} style={btnPrimary}>Go to Login →</button>
    </div>
  );
}

// ── LOGIN FLOW ─────────────────────────────────────────────────
function LoginFlow({ onDone, onSignup }: { onDone: () => void; onSignup: () => void }) {
  const { login } = usePremium();
  const [forgot, setForgot]   = useState(false);
  const [contact, setContact] = useState("");
  const [pw, setPw]           = useState("");
  const [loading, setL]       = useState(false);
  const [err, setErr]         = useState("");

  if (forgot) return <ForgotFlow onBack={() => setForgot(false)} />;

  const doLogin = async () => {
    setErr("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    if (!pw)             { setErr("Enter your password"); return; }
    setL(true);
    try {
      const r = await authLogin({ contact: contact.trim(), password: pw });
      login(r.token, r.user); onDone();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setContact(e.target.value)} style={iStyle(!!err)} autoComplete="username" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
          <button onClick={() => setForgot(true)} style={{ ...linkBtn, fontSize: 11 }}>Forgot password?</button>
        </div>
        <PwField label="" value={pw} onChange={setPw} onEnter={doLogin} err={!!err} />
      </div>
      <Err m={err} />
      <button onClick={doLogin} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Logging in…" : "Log In"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onSignup} style={linkBtn}>No account? Sign up free</button>
      </div>
    </div>
  );
}

// ── TOKEN ACTIVATION (only shown to logged-in users) ──────────
function TokenFlow({ onDone }: { onDone: () => void }) {
  const { refreshUser } = usePremium();
  const [token, setToken] = useState("");
  const [loading, setL]   = useState(false);
  const [err, setErr]     = useState("");
  const [ok, setOk]       = useState("");

  const activate = async () => {
    setErr(""); setOk("");
    if (!token.trim()) { setErr("Paste your activation token"); return; }
    setL(true);
    try {
      const r = await authActivateToken(token.trim());
      refreshUser(r.user);
      setOk("✓ Premium access activated!");
      setTimeout(onDone, 1200);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setL(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 13 }}>Paste the activation token you received.</div>
      <div>
        <label style={labelStyle}>Activation token</label>
        <input placeholder="Paste token here…" value={token}
          onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && activate()}
          style={{ ...iStyle(!!err), fontFamily: "monospace", fontSize: 12 }} />
        <Err m={err} /><Ok m={ok} />
      </div>
      <button onClick={activate} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Activating…" : "Activate Token"}
      </button>
    </div>
  );
}

// ── LOGGED-IN VIEW ─────────────────────────────────────────────
function LoggedInView({ onClose }: { onClose: () => void }) {
  const { user, logout, refreshUser } = usePremium();
  const [plans, setPlans]           = useState<SubscriptionPlan[]>([]);
  const [showToken, setToken]       = useState(false);
  const [payingPlan, setPayingPlan] = useState<SubscriptionPlan | null>(null);
  const currency                    = detectCurrency(user);

  useEffect(() => {
    fetchPlans().then(r => setPlans(r.plans)).catch(() => {});
  }, []);

  const doLogout = async () => {
    try { await authLogout(); } catch { /* ignore */ }
    logout(); onClose();
  };

  const fmt = (p: SubscriptionPlan) => {
    const price = currency === "INR" && p.price_inr
      ? `₹${Number(p.price_inr).toLocaleString("en-IN")}`
      : p.price_usd ? `$${Number(p.price_usd).toFixed(2)}` : "Free";
    const dur = !p.duration_days ? "Lifetime"
      : p.duration_days === 30  ? "/ month"
      : p.duration_days === 365 ? "/ year"
      : `/ ${p.duration_days}d`;
    return { price, dur };
  };

  const perks = ["🎥 Video lessons", "🧠 Interview Q&A", "💻 Coding challenges", "🏗️ Project blueprints"];

  if (payingPlan) return (
    <PaymentModal
      plan={payingPlan}
      currency={currency}
      onClose={() => setPayingPlan(null)}
      onSuccess={(result) => {
        refreshUser(result.user);
        setPayingPlan(null);
        // Keep modal open to show other plans (user can buy more)
        fetchPlans().then(r => setPlans(r.plans)).catch(() => {});
      }}
    />
  );

  if (showToken) return (
    <div>
      <button onClick={() => setToken(false)} style={{ ...linkBtn, marginBottom: 16, display: "block" }}>← Back</button>
      <TokenFlow onDone={() => { setToken(false); onClose(); }} />
    </div>
  );

  return (
    <div>
      {/* User card */}
      <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{user?.fullName || "—"}</div>
            {user?.email  && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{user.email}</div>}
            {user?.mobile && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 1 }}>📱 {user.mobile}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {user?.customerId && <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 3 }}>{user.customerId}</div>}
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: user?.isPremium ? "rgba(124,58,237,.2)" : "rgba(255,255,255,.07)",
              color: user?.isPremium ? "#a78bfa" : "#6b7280" }}>
              {user?.isPremium ? "⭐ Premium" : "Free Plan"}
            </span>
          </div>
        </div>
      </div>

      {/* Perks */}
      {perks.map(p => {
        const [icon, ...rest] = p.split(" ");
        return (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
            <span style={{ color: "#e2e8f0", fontSize: 13 }}>{rest.join(" ")}</span>
            <span style={{ marginLeft: "auto", fontSize: 12, color: user?.isPremium ? "#4ade80" : "#4b5563" }}>
              {user?.isPremium ? "✓" : "🔒"}
            </span>
          </div>
        );
      })}

      {/* Plans — always shown so premium users can buy more/different plans */}
      {plans.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            {user?.isPremium ? "📦 Available Plans" : "🚀 Upgrade to Premium"}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {plans.map(plan => {
              const { price, dur } = fmt(plan);
              return (
                <div key={plan.id} style={{
                  background: "rgba(124,58,237,.07)", border: "1px solid rgba(124,58,237,.18)",
                  borderRadius: 10, padding: "12px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 13 }}>{plan.name}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {plan.language_slug ? `Language: ${plan.language_slug}` : "All languages"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 15 }}>{price}</div>
                    <div style={{ color: C.dim, fontSize: 10 }}>{dur}</div>
                  </div>
                  <button
                    onClick={() => setPayingPlan(plan)}
                    style={{
                      padding: "8px 14px",
                      background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                      border: "none", borderRadius: 8,
                      color: "#fff", fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                      flexShrink: 0,
                    }}
                  >
                    Pay Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Token activation fallback */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setToken(true)} style={{ ...linkBtn, fontSize: 12 }}>
          Have an activation token? Activate →
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#e2e8f0", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          Continue Learning
        </button>
        <button onClick={doLogout} style={{ padding: "11px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          Log out
        </button>
      </div>
    </div>
  );
}

// ── MAIN MODAL ─────────────────────────────────────────────────
export interface PremiumModalProps {
  forceOpen?: boolean;
  onClose?:   () => void;
}

export default function PremiumModal({ forceOpen = false, onClose }: PremiumModalProps) {
  const { user, isPremium } = usePremium();
  const [visible, setVisible] = useState(false);
  const [tab, setTab]         = useState<Tab>("signup");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceOpen) { setVisible(true); return; }
    if (!sessionStorage.getItem(SHOWN_KEY)) {
      const t = setTimeout(() => { setVisible(true); sessionStorage.setItem(SHOWN_KEY, "1"); }, 800);
      return () => clearTimeout(t);
    }
  }, [forceOpen]);

  const close = () => { setVisible(false); onClose?.(); };

  if (!visible) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "signup", label: "Sign up" },
    { id: "login",  label: "Log in"  },
  ];

  const content = (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && close()}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: 99999,
        background: "rgba(0,0,0,.80)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn .2s ease",
      }}
    >
      <div style={{
        background: "#0d0d20",
        border: "1px solid rgba(124,58,237,.3)",
        borderRadius: 20, width: "100%", maxWidth: 440,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.04)",
        animation: "slideUp .25s ease",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#5b21b6,#4338ca)", padding: "22px 28px 18px", position: "relative" }}>
          <button onClick={close} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{isPremium ? "⭐" : user ? "👋" : "🚀"}</div>
          <h2 style={{ color: "#fff", margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>
            {isPremium ? `Welcome back, ${user?.fullName?.split(" ")[0] ?? ""}!`
             : user    ? `Hi, ${user.fullName?.split(" ")[0] ?? ""}!`
             :           "Join InfinityOdyssey"}
          </h2>
          {!user && <p style={{ color: "rgba(255,255,255,.6)", margin: "4px 0 0", fontSize: 12, lineHeight: 1.5 }}>Unlock interviews, coding challenges, video lessons &amp; project guides</p>}
        </div>

        {/* Body */}
        <div style={{ padding: "18px 28px 24px" }}>
          {user ? (
            <LoggedInView onClose={close} />
          ) : (
            <>
              <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "7px 16px", fontSize: 13, fontWeight: 600,
                    fontFamily: "inherit",
                    color: tab === t.id ? "#a78bfa" : C.muted,
                    borderBottom: `2px solid ${tab === t.id ? "#7c3aed" : "transparent"}`,
                    marginBottom: -1, transition: "color .15s",
                  }}>{t.label}</button>
                ))}
              </div>
              {tab === "signup" && <SignupFlow onDone={close} onLogin={() => setTab("login")} />}
              {tab === "login"  && <LoginFlow  onDone={close} onSignup={() => setTab("signup")} />}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes blink   { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>
    </div>
  );

  // Always portal to document.body to escape ALL scroll containers and stacking contexts
  return createPortal(content, document.body);
}
