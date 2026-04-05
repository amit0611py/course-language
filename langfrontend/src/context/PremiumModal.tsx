import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { C } from "../theme";
import { usePremium } from "../context/PremiumContext";
import {
  authSendOtp, authVerifyOtp, authSignup, authLogin,
  authLogout, authActivateToken,
  authForgotPassword, authVerifyResetOtp, authResetPassword,
  fetchPlans,
  type OtpSendResponse, type SubscriptionPlan,
} from "../api/client";

// ─────────────────────────────────────────────────────────────
const SHOWN_KEY       = "io_modal_shown";
const RESEND_COOLDOWN = 60;

type MainTab    = "signup" | "login" | "token";
type SignupStep = "contact" | "otp" | "details";
type ForgotStep = "contact" | "otp" | "newpass" | "done";

// ─────────────────────────────────────────────────────────────
// Shared micro-styles
// ─────────────────────────────────────────────────────────────
const inputStyle = (hasError = false): React.CSSProperties => ({
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,.04)",
  border: `1px solid ${hasError ? "#f87171" : "rgba(255,255,255,.12)"}`,
  borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s",
});

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: "12px 0",
  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
  border: "none", borderRadius: 10, color: "#fff",
  fontWeight: 700, fontSize: 14, cursor: "pointer",
  fontFamily: "inherit", transition: "opacity .2s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(255,255,255,.45)", letterSpacing: 0.5,
  textTransform: "uppercase", marginBottom: 6,
};

const linkBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#a78bfa", fontSize: 12, fontFamily: "inherit",
  textDecoration: "underline", textUnderlineOffset: 2,
};

const eyeBtn: React.CSSProperties = {
  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
  background: "none", border: "none", cursor: "pointer", fontSize: 14,
  padding: 0, lineHeight: 1,
};

function ErrMsg({ msg }: { msg: string }) {
  return msg ? (
    <div style={{ color: "#f87171", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
      <span>⚠</span>{msg}
    </div>
  ) : null;
}

function OkMsg({ msg }: { msg: string }) {
  return msg ? (
    <div style={{ color: "#4ade80", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
      <span>✓</span>{msg}
    </div>
  ) : null;
}

// ─────────────────────────────────────────────────────────────
// Resend timer hook
// ─────────────────────────────────────────────────────────────
function useResendTimer() {
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback((secs = RESEND_COOLDOWN) => {
    setSeconds(secs);
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(ref.current!); return 0; } return s - 1; });
    }, 1000);
  }, []);

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  return { seconds, start, canResend: seconds === 0 };
}

// ─────────────────────────────────────────────────────────────
// OTP input (single hidden input + visual boxes)
// ─────────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(5, " ").split("").slice(0, 5);

  return (
    <div
      style={{ display: "flex", gap: 10, justifyContent: "center", position: "relative", cursor: disabled ? "not-allowed" : "text" }}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text" inputMode="numeric" autoComplete="one-time-code"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 5))}
        disabled={disabled}
        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, zIndex: 1, cursor: disabled ? "not-allowed" : "text" }}
      />
      {[0,1,2,3,4].map(i => {
        const char = digits[i] === " " ? "" : digits[i];
        const isActive = !disabled && value.length === i;
        return (
          <div key={i} style={{
            width: 50, height: 58,
            background: char ? "rgba(124,58,237,.14)" : "rgba(255,255,255,.04)",
            border: `2px solid ${char ? "#7c3aed" : isActive ? "rgba(124,58,237,.5)" : "rgba(255,255,255,.1)"}`,
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 700, color: "#e2e8f0",
            transition: "border-color .15s, background .15s", userSelect: "none",
          }}>
            {char || (isActive ? <span style={{ width: 2, height: 24, background: "#7c3aed", animation: "blink 1s step-end infinite" }} /> : "")}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Password field with show/hide
// ─────────────────────────────────────────────────────────────
function PasswordInput({ label, placeholder, value, onChange, onKeyDown, hasError = false, autoComplete }: {
  label: string; placeholder?: string; value: string;
  onChange: (v: string) => void; onKeyDown?: React.KeyboardEventHandler;
  hasError?: boolean; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••"}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ ...inputStyle(hasError), paddingRight: 44 }}
          autoComplete={autoComplete ?? "current-password"}
        />
        <button onClick={() => setShow(s => !s)} style={eyeBtn}>{show ? "🙈" : "👁️"}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OTP step (reused in signup + forgot password)
// ─────────────────────────────────────────────────────────────
function OtpStep({ contact, sendInfo, otp, setOtp, loading, err, ok, timer, onVerify, onResend, onBack }: {
  contact: string; sendInfo: OtpSendResponse | null;
  otp: string; setOtp: (v: string) => void;
  loading: boolean; err: string; ok: string;
  timer: ReturnType<typeof useResendTimer>;
  onVerify: () => void; onResend: () => void; onBack: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>
          OTP sent to <span style={{ color: "#a78bfa", fontWeight: 700 }}>{contact}</span>
        </div>
        {sendInfo?._devOtp && (
          <div style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#f59e0b", display: "inline-block" }}>
            Dev OTP: <strong style={{ letterSpacing: 2 }}>{sendInfo._devOtp}</strong>
          </div>
        )}
        {sendInfo && sendInfo.remainingSendsToday !== undefined && (
          <div style={{ fontSize: 11, color: C.dim, marginTop: 4 }}>
            {sendInfo.remainingSendsToday} resend{sendInfo.remainingSendsToday !== 1 ? "s" : ""} left today
          </div>
        )}
      </div>

      <OtpInput value={otp} onChange={setOtp} disabled={loading} />

      <ErrMsg msg={err} />
      <OkMsg msg={ok} />

      <button onClick={onVerify} disabled={loading || otp.length < 5}
        style={{ ...btnPrimary, opacity: loading || otp.length < 5 ? 0.5 : 1 }}>
        {loading ? "Verifying…" : "Verify OTP"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onBack} style={linkBtn}>← Change contact</button>
        {timer.canResend
          ? <button onClick={onResend} disabled={loading} style={linkBtn}>Resend OTP</button>
          : <span style={{ fontSize: 12, color: C.dim }}>Resend in <span style={{ color: "#a78bfa" }}>{timer.seconds}s</span></span>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SIGNUP FLOW
// ─────────────────────────────────────────────────────────────
function SignupFlow({ onSuccess, onSwitchToLogin }: { onSuccess: () => void; onSwitchToLogin: () => void }) {
  const { login } = usePremium();
  const timer = useResendTimer();

  const [step,            setStep]            = useState<SignupStep>("contact");
  const [contact,         setContact]         = useState("");
  const [contactType,     setContactType]     = useState<"email" | "mobile">("email");
  const [verifiedToken,   setVerifiedToken]   = useState("");
  const [otp,             setOtp]             = useState("");
  const [sendInfo,        setSendInfo]        = useState<OtpSendResponse | null>(null);
  const [fullName,        setFullName]        = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [err,             setErr]             = useState("");
  const [ok,              setOk]              = useState("");

  // Auto-submit OTP when 5 digits entered
  useEffect(() => {
    if (otp.length === 5 && step === "otp" && !loading) handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleSendOtp = async () => {
    setErr(""); setOk("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    setLoading(true);
    try {
      const res = await authSendOtp(contact.trim());
      setSendInfo(res); setContactType(res.contactType);
      setStep("otp"); timer.start();
      setOk(`OTP sent to your ${res.contactType === "email" ? "email" : "mobile number"}`);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setErr(""); setOk(""); setOtp("");
    setLoading(true);
    try {
      const res = await authSendOtp(contact.trim());
      setSendInfo(res); timer.start(); setOk("New OTP sent!");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 5) { setErr("Enter the 5-digit OTP"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await authVerifyOtp(contact.trim(), otp);
      setVerifiedToken(res.verifiedToken); setStep("details"); setOk("");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleSignup = async () => {
    setErr("");
    if (!fullName.trim())             { setErr("Full name is required"); return; }
    if (password.length < 6)          { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setErr("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await authSignup({ verifiedToken, fullName: fullName.trim(), password, confirmPassword });
      login(res.token, res.user);
      onSuccess();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  if (step === "contact") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setContact(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendOtp()}
          style={inputStyle(!!err)} autoComplete="username" />
        <ErrMsg msg={err} />
      </div>
      <button onClick={handleSendOtp} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Sending OTP…" : "Send OTP →"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onSwitchToLogin} style={linkBtn}>Already have an account? Log in</button>
      </div>
    </div>
  );

  if (step === "otp") return (
    <OtpStep contact={contact} sendInfo={sendInfo} otp={otp} setOtp={setOtp}
      loading={loading} err={err} ok={ok} timer={timer}
      onVerify={handleVerifyOtp} onResend={handleResend}
      onBack={() => { setStep("contact"); setErr(""); setOtp(""); setOk(""); }} />
  );

  // step === "details"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ textAlign: "center", color: "#4ade80", fontSize: 12, fontWeight: 600 }}>
        ✓ {contactType === "email" ? "Email" : "Mobile"} verified
      </div>
      <div>
        <label style={labelStyle}>Full name</label>
        <input placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)}
          style={inputStyle()} autoComplete="name" />
      </div>
      <PasswordInput label="Password" placeholder="Min. 6 characters" value={password}
        onChange={setPassword} autoComplete="new-password" />
      <PasswordInput label="Confirm password" value={confirmPassword}
        onChange={setConfirmPassword} onKeyDown={e => e.key === "Enter" && handleSignup()}
        hasError={!!err && err.includes("match")} autoComplete="new-password" />
      <ErrMsg msg={err} />
      <button onClick={handleSignup} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD FLOW
// ─────────────────────────────────────────────────────────────
function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const timer = useResendTimer();
  const [step,    setStep]    = useState<ForgotStep>("contact");
  const [contact, setContact] = useState("");
  const [sendInfo,setSendInfo] = useState<OtpSendResponse | null>(null);
  const [otp,     setOtp]     = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password,   setPassword]   = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [ok,      setOk]      = useState("");

  // Auto-submit OTP
  useEffect(() => {
    if (otp.length === 5 && step === "otp" && !loading) handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleSend = async () => {
    setErr(""); setOk("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    setLoading(true);
    try {
      const res = await authForgotPassword(contact.trim());
      setSendInfo(res._devOtp ? { _devOtp: res._devOtp, remainingSendsToday: 2, contactType: "email", contact, success: true, message: "", expiresInMinutes: 10 } : null);
      setStep("otp"); timer.start();
      setOk(res.message);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setErr(""); setOk(""); setOtp("");
    setLoading(true);
    try {
      await authForgotPassword(contact.trim());
      timer.start(); setOk("New OTP sent!");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 5) { setErr("Enter the 5-digit OTP"); return; }
    setErr(""); setLoading(true);
    try {
      const res = await authVerifyResetOtp(contact.trim(), otp);
      setResetToken(res.resetToken); setStep("newpass"); setOk("");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setErr("");
    if (password.length < 6)          { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirmPw)        { setErr("Passwords do not match"); return; }
    setLoading(true);
    try {
      await authResetPassword(resetToken, password, confirmPw);
      setStep("done");
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  if (step === "contact") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 13 }}>Enter the email or mobile number associated with your account.</div>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setContact(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
          style={inputStyle(!!err)} />
        <ErrMsg msg={err} />
        <OkMsg msg={ok} />
      </div>
      <button onClick={handleSend} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Sending OTP…" : "Send Reset OTP →"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onBack} style={linkBtn}>← Back to login</button>
      </div>
    </div>
  );

  if (step === "otp") return (
    <OtpStep contact={contact} sendInfo={sendInfo} otp={otp} setOtp={setOtp}
      loading={loading} err={err} ok={ok} timer={timer}
      onVerify={handleVerifyOtp} onResend={handleResend}
      onBack={() => { setStep("contact"); setErr(""); setOtp(""); setOk(""); }} />
  );

  if (step === "newpass") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, textAlign: "center" }}>✓ Identity verified — set your new password</div>
      <PasswordInput label="New password" placeholder="Min. 6 characters" value={password}
        onChange={setPassword} autoComplete="new-password" />
      <PasswordInput label="Confirm new password" value={confirmPw}
        onChange={setConfirmPw} onKeyDown={e => e.key === "Enter" && handleReset()}
        hasError={!!err && err.includes("match")} autoComplete="new-password" />
      <ErrMsg msg={err} />
      <button onClick={handleReset} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </div>
  );

  // done
  return (
    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>Password reset successfully!</div>
      <div style={{ color: C.muted, fontSize: 13 }}>Please log in with your new password.</div>
      <button onClick={onBack} style={btnPrimary}>Go to Login →</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN FLOW
// ─────────────────────────────────────────────────────────────
function LoginFlow({ onSuccess, onSwitchToSignup }: { onSuccess: () => void; onSwitchToSignup: () => void }) {
  const { login } = usePremium();
  const [showForgot, setShowForgot] = useState(false);
  const [contact,  setContact]  = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState("");

  if (showForgot) return <ForgotPasswordFlow onBack={() => setShowForgot(false)} />;

  const handleLogin = async () => {
    setErr("");
    if (!contact.trim()) { setErr("Enter your email or mobile number"); return; }
    if (!password)       { setErr("Enter your password"); return; }
    setLoading(true);
    try {
      const res = await authLogin({ contact: contact.trim(), password });
      login(res.token, res.user);
      onSuccess();
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={labelStyle}>Email or mobile number</label>
        <input placeholder="you@example.com  or  +91 9876543210" value={contact}
          onChange={e => setContact(e.target.value)} style={inputStyle(!!err)} autoComplete="username" />
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
          <button onClick={() => setShowForgot(true)} style={{ ...linkBtn, fontSize: 11 }}>Forgot password?</button>
        </div>
        <div style={{ position: "relative" }}>
          <PasswordInput label="" value={password} onChange={setPassword}
            onKeyDown={e => e.key === "Enter" && handleLogin()} hasError={!!err} />
        </div>
      </div>
      <ErrMsg msg={err} />
      <button onClick={handleLogin} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Logging in…" : "Log In"}
      </button>
      <div style={{ textAlign: "center" }}>
        <button onClick={onSwitchToSignup} style={linkBtn}>No account? Sign up free</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOKEN ACTIVATION
// ─────────────────────────────────────────────────────────────
function TokenFlow({ onSuccess }: { onSuccess: () => void }) {
  const { refreshUser } = usePremium();
  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");
  const [ok,      setOk]      = useState("");

  const handleActivate = async () => {
    setErr(""); setOk("");
    if (!token.trim()) { setErr("Paste your activation token"); return; }
    setLoading(true);
    try {
      const res = await authActivateToken(token.trim());
      refreshUser(res.user);
      setOk("✓ Premium access activated!");
      setTimeout(onSuccess, 1200);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
        Log in first, then paste the activation token you received from the admin.
      </div>
      <div>
        <label style={labelStyle}>Activation token</label>
        <input placeholder="Paste token here…" value={token}
          onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && handleActivate()}
          style={{ ...inputStyle(!!err), fontFamily: "monospace", fontSize: 12 }} />
        <ErrMsg msg={err} />
        <OkMsg msg={ok} />
      </div>
      <button onClick={handleActivate} disabled={loading}
        style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Activating…" : "Activate Token"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGGED-IN VIEW — different for free vs premium users
// ─────────────────────────────────────────────────────────────
function LoggedInView({ onClose, onSwitchToToken }: { onClose: () => void; onSwitchToToken: () => void }) {
  const { user, logout } = usePremium();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (!user?.isPremium) {
      fetchPlans().then(r => setPlans(r.plans)).catch(() => {});
    }
  }, [user?.isPremium]);

  const handleLogout = async () => {
    try { await authLogout(); } catch { /* ignore */ }
    logout();
    onClose();
  };

  const perks = [
    ["🎥", "Video lessons",      "HD walkthroughs from CDN"],
    ["🧠", "Interview Q&A",      "Advanced questions with full answers"],
    ["💻", "Coding challenges",  "Solutions, test cases & approaches"],
    ["🏗️", "Project blueprints", "Full architecture, code & deploy guide"],
  ];

  const formatPrice = (p: SubscriptionPlan) => {
    if (p.price_inr) return `₹${p.price_inr}`;
    if (p.price_usd) return `$${p.price_usd}`;
    return "Free";
  };

  const formatDuration = (p: SubscriptionPlan) => {
    if (!p.duration_days) return "Lifetime";
    if (p.duration_days === 30)  return "/ month";
    if (p.duration_days === 365) return "/ year";
    return `/ ${p.duration_days} days`;
  };

  return (
    <div>
      {/* User info */}
      <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 14 }}>{user?.fullName || "—"}</div>
            {user?.email  && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{user.email}</div>}
            {user?.mobile && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 1 }}>📱 {user.mobile}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {user?.customerId && <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 2 }}>{user.customerId}</div>}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20,
              background: user?.isPremium ? "rgba(124,58,237,.2)" : "rgba(255,255,255,.07)",
              color: user?.isPremium ? "#a78bfa" : "#94a3b8",
            }}>
              {user?.isPremium ? "⭐ Premium" : "Free Plan"}
            </span>
          </div>
        </div>
      </div>

      {/* Perks */}
      {perks.map(([icon, title, desc]) => (
        <div key={title} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontSize:15,flexShrink:0 }}>{icon}</span>
          <div>
            <div style={{ color:C.text,fontSize:13,fontWeight:600 }}>{title}</div>
            <div style={{ color:C.muted,fontSize:11 }}>{desc}</div>
          </div>
          <span style={{ marginLeft:"auto",flexShrink:0,fontSize:12,color:user?.isPremium?"#4ade80":"#4b5563" }}>
            {user?.isPremium ? "✓" : "🔒"}
          </span>
        </div>
      ))}

      {/* Upgrade section — free users only */}
      {!user?.isPremium && (
        <div style={{ marginTop: 16 }}>
          <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            🚀 Upgrade to Premium
          </div>

          {/* Plans list */}
          {plans.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {plans.map(plan => (
                <div key={plan.id} style={{
                  background: "rgba(124,58,237,.08)", border: "1px solid rgba(124,58,237,.2)",
                  borderRadius: 10, padding: "12px 14px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{plan.name}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                      {plan.language_slug ? `Language: ${plan.language_slug}` : "All languages"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 15 }}>{formatPrice(plan)}</div>
                    <div style={{ color: C.dim, fontSize: 10 }}>{formatDuration(plan)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: C.dim, fontSize: 12, marginBottom: 12 }}>
              No plans available yet. Contact admin for access.
            </div>
          )}

          <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>
              To purchase, contact the admin to receive an activation token, then enter it below.
            </div>
          </div>

          <button onClick={onSwitchToToken} style={{ ...btnPrimary, boxShadow: "0 4px 16px rgba(124,58,237,.3)" }}>
            I Have a Token — Activate →
          </button>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:"flex",gap:10,marginTop:16 }}>
        <button onClick={onClose} style={{ flex:1,padding:"11px 0",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:C.text,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit" }}>
          Continue Learning
        </button>
        <button onClick={handleLogout} style={{ padding:"11px 16px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
          Log out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────
interface PremiumModalProps {
  forceOpen?: boolean;
  onClose?:   () => void;
}

export default function PremiumModal({ forceOpen = false, onClose }: PremiumModalProps) {
  const { user, isPremium } = usePremium();
  const [visible, setVisible] = useState(false);
  const [tab,     setTab]     = useState<MainTab>("signup");
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

  const tabs: { id: MainTab; label: string }[] = [
    { id: "signup", label: "Sign up" },
    { id: "login",  label: "Log in"  },
    { id: "token",  label: "Token"   },
  ];

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && close()}
      style={{ position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.78)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"fadeIn .2s ease" }}
    >
      <div style={{ background:"#0d0d20",border:"1px solid rgba(124,58,237,.25)",borderRadius:20,width:"100%",maxWidth:440,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.04)",animation:"slideUp .25s ease",maxHeight:"90vh",overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#5b21b6 0%,#4338ca 100%)",padding:"22px 28px 18px",position:"relative" }}>
          <button onClick={close} style={{ position:"absolute",top:14,right:14,background:"rgba(255,255,255,.12)",border:"none",color:"#fff",width:28,height:28,borderRadius:8,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit" }}>×</button>
          <div style={{ fontSize:28,marginBottom:6 }}>{isPremium ? "⭐" : user ? "👋" : "🚀"}</div>
          <h2 style={{ color:"#fff",margin:0,fontSize:18,fontWeight:800,letterSpacing:-0.3 }}>
            {isPremium ? `Welcome back, ${user?.fullName?.split(" ")[0] ?? ""}!`
             : user    ? `Hi, ${user.fullName?.split(" ")[0] ?? ""}!`
             :           "Join InfinityOdyssey"}
          </h2>
          {!user && (
            <p style={{ color:"rgba(255,255,255,.6)",margin:"4px 0 0",fontSize:12,lineHeight:1.5 }}>
              Unlock interviews, coding challenges, video lessons &amp; project guides
            </p>
          )}
        </div>

        {/* Body */}
        <div style={{ padding:"18px 28px 24px" }}>
          {user ? (
            <LoggedInView onClose={close} onSwitchToToken={() => { /* no-op: token flow shown via LoggedInView button */ }} />
          ) : (
            <div>
              {/* Tabs */}
              <div style={{ display:"flex",gap:2,marginBottom:20,borderBottom:`1px solid rgba(255,255,255,.07)`,paddingBottom:0 }}>
                {tabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:"7px 14px",fontSize:13,fontWeight:600,fontFamily:"inherit",color:tab===t.id?"#a78bfa":C.muted,borderBottom:`2px solid ${tab===t.id?"#7c3aed":"transparent"}`,marginBottom:-1,transition:"color .15s" }}>{t.label}</button>
                ))}
              </div>

              {tab==="signup" && <SignupFlow onSuccess={close} onSwitchToLogin={() => setTab("login")} />}
              {tab==="login"  && <LoginFlow  onSuccess={close} onSwitchToSignup={() => setTab("signup")} />}
              {tab==="token"  && <TokenFlow  onSuccess={close} />}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes blink   { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>
    </div>
  );

  // Render into document.body via portal — escapes any scroll containers
  // that would trap position:fixed overlays or clip z-index stacking
  return createPortal(modalContent, document.body);
}
