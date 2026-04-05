import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

// ── User Profile ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  customerId: string;
  email: string | null;
  mobile: string | null;
  fullName: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  isPremium: boolean;
  premiumScope: "none" | "language" | "all";
  premiumLanguageSlugs: string[];
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isPremium: boolean;
  canAccessLanguage: (languageSlug: string) => boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshUser: (user: UserProfile) => void;
}

// ── Storage — localStorage for persistence across browser sessions ─────────────
const TOKEN_KEY = "io_auth_token";
const USER_KEY  = "io_auth_user";

export const getStoredToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
};

export const getStoredUser = (): UserProfile | null => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const storeAuth = (token: string, user: UserProfile) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* storage full or unavailable */ }
};

const clearAuth = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
};

// Backwards compat exports for api/client.ts interceptor
export const getPremiumToken   = getStoredToken;
export const setPremiumToken   = (t: string) => { try { localStorage.setItem(TOKEN_KEY, t); } catch {} };
export const clearPremiumToken = clearAuth;

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isPremium: false,
  canAccessLanguage: () => false,
  login: () => {}, logout: () => {}, refreshUser: () => {},
});

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user,  setUser]  = useState<UserProfile | null>(() => getStoredUser());
  const queryClient = useQueryClient();

  const flushNavCache = useCallback(() => {
    // removeQueries forces a fresh fetch (not just marks stale)
    // The new X-Auth-Token header will be present because storeAuth/clearAuth
    // already ran before this is called.
    queryClient.removeQueries({ queryKey: ["navigation"] });
    queryClient.removeQueries({ queryKey: ["topic"] });
    queryClient.invalidateQueries({ queryKey: ["languages"] });
  }, [queryClient]);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    storeAuth(newToken, newUser);   // MUST be before flushNavCache
    setToken(newToken);
    setUser(newUser);
    flushNavCache();
  }, [flushNavCache]);

  const logout = useCallback(() => {
    clearAuth();                    // MUST be before flushNavCache
    setToken(null);
    setUser(null);
    flushNavCache();
  }, [flushNavCache]);

  const refreshUser = useCallback((updated: UserProfile) => {
    setUser(updated);
    try { localStorage.setItem(USER_KEY, JSON.stringify(updated)); } catch {}
    flushNavCache();
  }, [flushNavCache]);

  const canAccessLanguage = useCallback((languageSlug: string): boolean => {
    if (!user?.isPremium) return false;
    if (user.premiumScope === "all") return true;
    if (user.premiumScope === "language") {
      return (user.premiumLanguageSlugs ?? []).includes(languageSlug);
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, token,
      isPremium: user?.isPremium ?? false,
      canAccessLanguage,
      login, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const usePremium = () => useContext(AuthContext);
