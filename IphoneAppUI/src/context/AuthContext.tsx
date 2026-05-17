import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mobileApi } from "@/api/endpoints";
import { clearMobileTokens, setMobileTokens } from "@/api/authTransport";
import { isPaidUser } from "@/lib/membership";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  membership_tier: string;
  membership_expires_at: string | null;
  subscription_status: string;
  billing_provider: string | null;
  subscription_entitlement_id?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isPaid: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await mobileApi.authMe();
      setUser(res.user);
    } catch {
      setUser(null);
      clearMobileTokens();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshUser();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await mobileApi.authLogin(email, password);
    setMobileTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await mobileApi.authLogout();
    } catch {
      /* ignore */
    }
    clearMobileTokens();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isPaid: isPaidUser(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
