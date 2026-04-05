import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { C } from "../theme";
import { usePremium } from "../context/PremiumContext";
import {
  initiatePayment, verifyRazorpay, capturePayPal, getPaymentStatus,
  type SubscriptionPlan, type PaymentVerifyResponse,
} from "../api/client";

// ── Declare Razorpay global (loaded via CDN script) ───────────────────────────
declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

// ── Load Razorpay SDK once ─────────────────────────────────────────────────────
function loadRazorpaySDK(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src   = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPrice(plan: SubscriptionPlan, currency: string) {
  if (currency === "INR" && plan.price_inr)
    return { display: `₹${Number(plan.price_inr).toLocaleString("en-IN")}`, amount: plan.price_inr };
  if (currency === "USD" && plan.price_usd)
    return { display: `$${Number(plan.price_usd).toFixed(2)}`, amount: plan.price_usd };
  return { display: "—", amount: 0 };
}

function formatDuration(plan: SubscriptionPlan) {
  if (!plan.duration_days) return "Lifetime";
  if (plan.duration_days === 30)  return "Monthly";
  if (plan.duration_days === 365) return "Yearly";
  return `${plan.duration_days} days`;
}

// ── Status result screen ──────────────────────────────────────────────────────
type PayStatus = "success" | "pending" | "failed" | "cancelled";

interface StatusScreenProps {
  status:       PayStatus;
  txnId:        string;
  plan:         SubscriptionPlan;
  currency:     string;
  languageSlug: string | null;
  onClose:      () => void;
  onDone:       () => void;
}

function StatusScreen({ status, txnId, plan, currency, languageSlug, onClose, onDone }: StatusScreenProps) {
  const navigate = useNavigate();

  const config = {
    success:   { emoji: "🎉", color: "#4ade80", title: "Payment Successful!", msg: "Your premium access has been activated." },
    pending:   { emoji: "⏳", color: "#f59e0b", title: "Payment Pending",     msg: "Your payment is being processed. We'll activate your plan once confirmed." },
    failed:    { emoji: "❌", color: "#f87171", title: "Payment Failed",       msg: "Your payment was not processed. No amount was charged." },
    cancelled: { emoji: "🚫", color: "#94a3b8", title: "Payment Cancelled",   msg: "You cancelled the payment. No amount was charged." },
  }[status];

  const { display } = formatPrice(plan, currency);

  const goToLanguage = () => {
    onDone();
    if (languageSlug) navigate(`/${languageSlug}`);
  };

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: 52, marginBottom: 12 }}>{config.emoji}</div>
      <div style={{ color: config.color, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
        {config.title}
      </div>
      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
        {config.msg}
      </div>

      {/* Transaction details */}
      <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "12px 14px", marginBottom: 20, textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#6b7280", fontSize: 11 }}>Transaction ID</span>
          <span style={{ color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{txnId}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#6b7280", fontSize: 11 }}>Plan</span>
          <span style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600 }}>{plan.name}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6b7280", fontSize: 11 }}>Amount</span>
          <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>{display}</span>
        </div>
      </div>

      {status === "success" && languageSlug && (
        <button onClick={goToLanguage} style={{
          width: "100%", padding: "12px 0",
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          border: "none", borderRadius: 10, color: "#fff",
          fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          marginBottom: 10,
        }}>
          Start Learning {languageSlug.charAt(0).toUpperCase() + languageSlug.slice(1)} →
        </button>
      )}

      {status === "success" && !languageSlug && (
        <button onClick={onDone} style={{
          width: "100%", padding: "12px 0",
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
          border: "none", borderRadius: 10, color: "#fff",
          fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          marginBottom: 10,
        }}>
          Start Exploring →
        </button>
      )}

      {(status === "pending" || status === "failed" || status === "cancelled") && (
        <button onClick={onClose} style={{
          width: "100%", padding: "12px 0",
          background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 10, color: "#e2e8f0",
          fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>
          Close
        </button>
      )}
    </div>
  );
}

// ── Main PaymentModal ─────────────────────────────────────────────────────────
export interface PaymentModalProps {
  plan:      SubscriptionPlan;
  currency:  string;
  onClose:   () => void;
  onSuccess: (result: PaymentVerifyResponse) => void;
}

export default function PaymentModal({ plan, currency, onClose, onSuccess }: PaymentModalProps) {
  const { user, refreshUser }   = usePremium();
  const overlayRef              = useRef<HTMLDivElement>(null);
  const [provider, setProvider] = useState<"razorpay" | "paypal" | null>(null);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [status, setStatus]     = useState<PayStatus | null>(null);
  const [txnId, setTxnId]       = useState("");
  const [langSlug, setLangSlug] = useState<string | null>(null);

  const { display, amount } = formatPrice(plan, currency);

  // Check for PayPal return in URL (after redirect back from PayPal)
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const txn     = params.get("txn");
    const ppOrd   = params.get("token");          // PayPal appends token=ORDER_ID
    if (txn && ppOrd) {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      handlePayPalReturn(txn, ppOrd);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayPalReturn = async (txn: string, ppOrderId: string) => {
    setTxnId(txn);
    setLoading(true);
    try {
      const res = await capturePayPal(ppOrderId, txn);
      setLangSlug(res.languageSlug);
      refreshUser(res.user);
      setStatus("success");
      onSuccess(res);
    } catch (e: unknown) {
      setErr((e as Error).message);
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!provider) { setErr("Select a payment method"); return; }
    if (!user)     { setErr("Please log in to continue"); return; }
    setErr(""); setLoading(true);

    try {
      const initRes = await initiatePayment(plan.id, provider, currency);
      setTxnId(initRes.txnId);
      setLangSlug(initRes.plan.languageSlug);

      if (provider === "razorpay") {
        const loaded = await loadRazorpaySDK();
        if (!loaded) throw new Error("Razorpay SDK failed to load");

        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key:         initRes.keyId,
            order_id:    initRes.orderId,
            amount:      Math.round(amount * 100),
            currency:    "INR",
            name:        "InfinityOdyssey",
            description: `${initRes.plan.name}${initRes.plan.languageName ? ` — ${initRes.plan.languageName}` : ""}`,
            prefill: {
              name:  initRes.user.name,
              email: initRes.user.email ?? "",
              contact: initRes.user.phone ?? "",
            },
            theme: { color: "#7c3aed" },
            modal: {
              ondismiss: () => {
                setStatus("cancelled");
                setLoading(false);
                resolve();
              },
            },
            handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              try {
                const verifyRes = await verifyRazorpay({
                  razorpayOrderId:   response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  txnId:             initRes.txnId,
                });
                refreshUser(verifyRes.user);
                setStatus("success");
                onSuccess(verifyRes);
                resolve();
              } catch (e) {
                setErr((e as Error).message);
                setStatus("failed");
                reject(e);
              } finally {
                setLoading(false);
              }
            },
          });
          rzp.open();
        });

      } else if (provider === "paypal") {
        // Redirect to PayPal approval URL
        if (initRes.approvalUrl) {
          window.location.href = initRes.approvalUrl;
          // Don't setLoading(false) — page is navigating
        } else {
          throw new Error("Could not get PayPal approval link");
        }
      }
    } catch (e: unknown) {
      if (!status) {
        setErr((e as Error).message);
        setStatus("failed");
      }
      setLoading(false);
    }
  };

  const content = (
    <div
      ref={overlayRef}
      onClick={e => e.target === overlayRef.current && !loading && onClose()}
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100vw", height: "100vh",
        zIndex: 99999,
        background: "rgba(0,0,0,.82)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "fadeIn .2s ease",
      }}
    >
      <div style={{
        background: "#0d0d20",
        border: "1px solid rgba(124,58,237,.25)",
        borderRadius: 20, width: "100%", maxWidth: 440,
        maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 32px 80px rgba(0,0,0,.9)",
        animation: "slideUp .25s ease",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1e1035,#1a1a40)", padding: "20px 24px 18px", borderBottom: "1px solid rgba(255,255,255,.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>Complete Purchase</div>
            <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 17 }}>{plan.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 3 }}>
              {plan.language_slug ? `Language: ${plan.language_slug}` : "All languages"} · {formatDuration(plan)}
            </div>
          </div>
          {!loading && !status && (
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "#9ca3af", width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          )}
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {status ? (
            <StatusScreen
              status={status}
              txnId={txnId}
              plan={plan}
              currency={currency}
              languageSlug={langSlug}
              onClose={onClose}
              onDone={() => { onClose(); }}
            />
          ) : (
            <>
              {/* Amount summary */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.07)", marginBottom: 20 }}>
                <span style={{ color: "#94a3b8", fontSize: 14 }}>Total</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 22 }}>{display}</div>
                  <div style={{ color: "#6b7280", fontSize: 11 }}>
                    {formatDuration(plan)} · {currency === "INR" ? "Indian Rupees" : "US Dollars"}
                  </div>
                </div>
              </div>

              {/* Payment method selection */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
                  Select Payment Method
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Razorpay — India only */}
                  {currency === "INR" && (
                    <button
                      onClick={() => setProvider("razorpay")}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px",
                        background: provider === "razorpay" ? "rgba(124,58,237,.12)" : "rgba(255,255,255,.04)",
                        border: `2px solid ${provider === "razorpay" ? "#7c3aed" : "rgba(255,255,255,.1)"}`,
                        borderRadius: 12, cursor: "pointer",
                        transition: "all .15s", textAlign: "left",
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#072654,#3395ff)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>💳</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>Razorpay</div>
                        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>UPI · Cards · Net Banking · Wallets</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${provider === "razorpay" ? "#7c3aed" : "#4b5563"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {provider === "razorpay" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />}
                      </div>
                    </button>
                  )}

                  {/* PayPal — International */}
                  {currency === "USD" && (
                    <button
                      onClick={() => setProvider("paypal")}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "14px 16px",
                        background: provider === "paypal" ? "rgba(0,112,204,.12)" : "rgba(255,255,255,.04)",
                        border: `2px solid ${provider === "paypal" ? "#0070cc" : "rgba(255,255,255,.1)"}`,
                        borderRadius: 12, cursor: "pointer",
                        transition: "all .15s", textAlign: "left",
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#003087,#009cde)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>🅿️</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>PayPal</div>
                        <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>Credit Card · Debit Card · PayPal Balance</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${provider === "paypal" ? "#0070cc" : "#4b5563"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {provider === "paypal" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0070cc" }} />}
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {err && (
                <div style={{ background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, color: "#f87171", fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
                  <span>⚠</span> {err}
                </div>
              )}

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={loading || !provider}
                style={{
                  width: "100%", padding: "13px 0",
                  background: loading || !provider
                    ? "rgba(255,255,255,.07)"
                    : "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  border: "none", borderRadius: 12,
                  color: loading || !provider ? "#4b5563" : "#fff",
                  fontWeight: 700, fontSize: 15, cursor: loading || !provider ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "all .2s",
                  boxShadow: loading || !provider ? "none" : "0 6px 20px rgba(124,58,237,.35)",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                    Processing…
                  </span>
                ) : `Pay ${display}`}
              </button>

              <div style={{ textAlign: "center", marginTop: 10, color: "#4b5563", fontSize: 11 }}>
                🔒 Secure payment · Transaction ID generated · No data stored on our servers
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
