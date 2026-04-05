import axios from "axios";
import type {
  Language, NavigationResponse, Topic, Project,
  InterviewQuestion, CodingChallenge, VideoContent,
} from "../types";

const BASE_URL = "/v1";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Auth token helpers ─────────────────────────────────────────────────────────
// Uses localStorage so token persists across browser sessions
export const getPremiumToken   = (): string | null => { try { return localStorage.getItem("io_auth_token"); } catch { return null; } };
export const setPremiumToken   = (t: string)       => { try { localStorage.setItem("io_auth_token", t); } catch {} };
export const clearPremiumToken = ()                => { try { localStorage.removeItem("io_auth_token"); } catch {} };
export const getIsPremium      = (): boolean       => !!getPremiumToken();

apiClient.interceptors.request.use((config) => {
  const token = getPremiumToken();
  if (token) {
    config.headers["x-auth-token"]    = token;
    config.headers["x-premium-token"] = token;  // legacy compat
  }
  return config;
});

// ── HTML-response guard ────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => {
    const ct: string = res.headers["content-type"] ?? "";
    if (ct.includes("text/html") || (typeof res.data === "string" && res.data.trimStart().startsWith("<"))) {
      throw new Error(
        `Backend not reachable — received HTML.\nStart API server: cd ../lang && npm run dev  (port 3001)`
      );
    }
    return res;
  },
  (err) => {
    // Extract the human-readable message from the backend error envelope:
    //   { error: { code: "INVALID_CREDENTIALS", message: "Invalid email/mobile or password" } }
    // Fall back to the generic axios message only if we can't find a better one.
    const backendMsg =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      null;

    if (backendMsg) {
      // Replace the raw axios error message with the backend's message
      const friendly = new Error(backendMsg);
      (friendly as Error & { statusCode?: number }).statusCode = err?.response?.status;
      return Promise.reject(friendly);
    }

    return Promise.reject(err);
  }
);

if (import.meta.env.DEV) {
  apiClient.interceptors.response.use((res) => {
    console.debug(`[api] ${res.config.method?.toUpperCase()} ${res.config.url}`, res.data);
    return res;
  });
}

// ── Normalizers ────────────────────────────────────────────────────────────────
function toArray<T>(raw: unknown, ...extraKeys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    for (const key of ["data", "items", "results", ...extraKeys]) {
      const v = (raw as Record<string, unknown>)[key];
      if (Array.isArray(v)) return v as T[];
    }
  }
  return [];
}

function normalizeLanguage(raw: Record<string, unknown>): Language {
  const meta = (raw.meta ?? {}) as Language["meta"];
  return {
    ...(raw as unknown as Language),
    meta,
    color:   (meta.color   as string | undefined) ?? undefined,
    tagline: (meta.tagline as string | undefined) ?? (raw.description as string | undefined),
  };
}

// ── Content API ────────────────────────────────────────────────────────────────
export const fetchLanguages = (): Promise<Language[]> =>
  apiClient.get("/languages").then(r => toArray<Record<string, unknown>>(r.data, "languages").map(normalizeLanguage));

export const fetchNavigation = (slug: string): Promise<NavigationResponse> =>
  apiClient.get(`/navigation/${slug}`).then(r => {
    const raw = r.data as Record<string, unknown>;
    return {
      language: normalizeLanguage((raw.language ?? { id: "", slug, name: slug, meta: {} }) as Record<string, unknown>),
      sections: Array.isArray(raw.sections) ? raw.sections : [],
    } as NavigationResponse;
  });

export const fetchTopic = (path: string): Promise<Topic> =>
  apiClient.get(`/topics/${path}`).then(r => {
    const raw = r.data as Record<string, unknown>;
    if (raw.topic && typeof raw.topic === "object") {
      const t = raw.topic as Record<string, unknown>;
      return {
        id:           t.id as string,
        path:         (t.path ?? path) as string,
        title:        (t.title ?? "") as string,
        difficulty:   t.difficulty as string | undefined,
        estimatedMins: t.estimatedMins as number | undefined,
        tags:         (t.tags ?? []) as string[],
        isDeepDive:   t.isDeepDive as boolean | undefined,
        section:      t.sectionTitle as string | undefined,
        sectionSlug:  t.sectionSlug as string | undefined,
        languageSlug: t.languageSlug as string | undefined,
        meta:         t.meta,
        contentTier:  (t.contentTier ?? "free") as "free" | "premium",
        languageTier: (t.languageTier ?? "free") as "free" | "premium",
        isPremium:    (t.isPremium ?? false) as boolean,
        isLocked:     (t.isLocked ?? false) as boolean,
        breadcrumb:   Array.isArray(raw.breadcrumb) ? raw.breadcrumb : [],
        children:     Array.isArray(raw.children) ? raw.children : [],
        blocks:       Array.isArray(raw.blocks) ? raw.blocks : [],
      } as Topic;
    }
    return raw as unknown as Topic;
  });

export const fetchTopicChildren   = (path: string) =>
  apiClient.get(`/topics/children/${path}`).then(r => toArray<Topic>(r.data, "children"));
export const fetchTopicBreadcrumb = (path: string) =>
  apiClient.get(`/topics/breadcrumb/${path}`).then(r => toArray<string>(r.data, "breadcrumb"));
export const fetchProject          = (slug: string): Promise<Project> =>
  apiClient.get(`/projects/${slug}`).then(r => r.data as Project);
export const fetchProjectsByLanguage = (lang: string) =>
  apiClient.get(`/projects/by-language/${lang}`).then(r => toArray<Project>(r.data, "projects"));

// ── Paid content ───────────────────────────────────────────────────────────────
export const fetchInterviews = (slug: string) =>
  apiClient.get(`/paid/interviews/${slug}`).then(r => r.data as { isPremium: boolean; questions: InterviewQuestion[] });
export const fetchCodingChallenges = (slug: string) =>
  apiClient.get(`/paid/coding/${slug}`).then(r => r.data as { isPremium: boolean; challenges: CodingChallenge[] });
export const fetchVideos = (type: "topic" | "project", id: string) =>
  apiClient.get(`/paid/videos/${type}/${id}`).then(r => r.data as { isPremium: boolean; videos: VideoContent[] });
export const fetchProjectArchitecture = (id: string) =>
  apiClient.get(`/paid/project-architecture/${id}`).then(r => r.data as { isPremium: boolean; is_locked: boolean; architecture: unknown });

export interface SubscriptionPlan {
  id: string;
  name: string;
  plan_type: string;
  language_slug: string | null;
  price_inr: number | null;
  price_usd: number | null;
  duration_days: number | null;
  features: Record<string, unknown>;
}

export const fetchPlans = (): Promise<{ plans: SubscriptionPlan[] }> =>
  apiClient.get("/paid/plans").then(r => r.data);

// ── Auth API ───────────────────────────────────────────────────────────────────
import type { UserProfile } from "../context/PremiumContext";

export interface AuthResponse {
  token:     string;
  expiresAt: string;
  user:      UserProfile;
}

export interface OtpSendResponse {
  success:             boolean;
  contact:             string;
  contactType:         "email" | "mobile";
  message:             string;
  expiresInMinutes:    number;
  remainingSendsToday: number;
  _devOtp?:            string;
}

export interface OtpVerifyResponse {
  success:          boolean;
  verifiedToken:    string;
  contact:          string;
  contactType:      "email" | "mobile";
  expiresInMinutes: number;
}

export const authSendOtp = (contact: string): Promise<OtpSendResponse> =>
  apiClient.post("/auth/send-otp", { contact }).then(r => r.data);

export const authVerifyOtp = (contact: string, otp: string): Promise<OtpVerifyResponse> =>
  apiClient.post("/auth/verify-otp", { contact, otp }).then(r => r.data);

export const authSignup = (body: {
  verifiedToken:   string;
  fullName:        string;
  password:        string;
  confirmPassword: string;
  email?:          string;
  mobile?:         string;
}): Promise<AuthResponse> =>
  apiClient.post("/auth/signup", body).then(r => r.data);

export const authLogin = (body: { contact: string; password: string }): Promise<AuthResponse> =>
  apiClient.post("/auth/login", body).then(r => r.data);

export const authLogout = (): Promise<void> =>
  apiClient.post("/auth/logout").then(() => {});

export const authMe = (): Promise<{ user: UserProfile; subscriptions: unknown[] }> =>
  apiClient.get("/auth/me").then(r => r.data);

export const authActivateToken = (activationToken: string): Promise<{ success: boolean; user: UserProfile }> =>
  apiClient.post("/auth/activate-token", { activationToken }).then(r => r.data);

export const authForgotPassword = (contact: string): Promise<{ success: boolean; message: string; _devOtp?: string }> =>
  apiClient.post("/auth/forgot-password", { contact }).then(r => r.data);

export const authVerifyResetOtp = (contact: string, otp: string): Promise<{ success: boolean; resetToken: string; contactType: string }> =>
  apiClient.post("/auth/verify-reset-otp", { contact, otp }).then(r => r.data);

export const authResetPassword = (resetToken: string, password: string, confirmPassword: string): Promise<{ success: boolean; message: string }> =>
  apiClient.post("/auth/reset-password", { resetToken, password, confirmPassword }).then(r => r.data);

// ── Payment API ────────────────────────────────────────────────────────────────
export interface PaymentInitResponse {
  provider:    "razorpay" | "paypal";
  txnId:       string;
  paymentId:   string;
  amount:      number;
  currency:    string;
  // Razorpay
  orderId?:    string;
  keyId?:      string;
  // PayPal
  ppOrderId?:  string;
  approvalUrl?: string;
  plan: {
    id:           string;
    name:         string;
    planType:     string;
    languageSlug: string | null;
    languageName: string | null;
    durationDays: number | null;
  };
  user: {
    name:  string;
    email: string | null;
    phone: string | null;
  };
}

export interface PaymentVerifyResponse {
  success:      boolean;
  status:       string;
  txnId:        string;
  languageSlug: string | null;
  user:         UserProfile;
  message:      string;
}

export interface PaymentStatusResponse {
  payment: {
    transaction_id: string;
    status:         string;
    amount:         number;
    currency:       string;
    provider:       string;
    plan_type:      string;
    language_slug:  string | null;
    plan_name:      string;
    created_at:     string;
    ends_at:        string | null;
  };
}

export const initiatePayment = (planId: string, provider: "razorpay" | "paypal", currency: string): Promise<PaymentInitResponse> =>
  apiClient.post("/payment/initiate", { planId, provider, currency }).then(r => r.data);

export const verifyRazorpay = (body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  txnId: string;
}): Promise<PaymentVerifyResponse> =>
  apiClient.post("/payment/razorpay/verify", body).then(r => r.data);

export const capturePayPal = (ppOrderId: string, txnId: string): Promise<PaymentVerifyResponse> =>
  apiClient.post("/payment/paypal/capture", { ppOrderId, txnId }).then(r => r.data);

export const getPaymentStatus = (txnId: string): Promise<PaymentStatusResponse> =>
  apiClient.get(`/payment/status/${txnId}`).then(r => r.data);
