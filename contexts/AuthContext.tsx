import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, authApi, setAccessToken, type AuthUser } from "@/lib/api";
import { appUrl, currentRoute } from "@/lib/utils";

export type UserRole = "doctor" | "nurse" | "admin" | "patient";

export interface AppUser extends AuthUser {
  name: string;
}

interface AuthState {
  user: AppUser | null;
  userType: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  error: string | null;
  patientLogin: (email: string, password: string) => Promise<boolean>;
  patientSignup: (data: {
    full_name: string;
    email: string;
    password: string;
    age?: number;
    gender?: "female" | "male" | "other";
    phone?: string;
  }) => Promise<boolean>;
  staffLogin: (email: string, password: string) => Promise<UserRole | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

const ROLE_KEY = "tele_triage_role";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuthenticatedUser = useCallback((authUser: AuthUser) => {
    setUser({ ...authUser, name: authUser.full_name });
    setMustChangePassword(authUser.must_change_password);
    sessionStorage.setItem(ROLE_KEY, authUser.role);
  }, []);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      setAccessToken(token);
      try {
        const authUser = await authApi.me();
        if (mounted) setAuthenticatedUser(authUser);
      } catch {
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        setAccessToken(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void restoreSession();
    return () => { mounted = false; };
  }, [setAuthenticatedUser]);

  const handleExpiredSession = useCallback(() => {
    const role = user?.role ?? sessionStorage.getItem(ROLE_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setAccessToken(null);
    setUser(null);
    setMustChangePassword(false);
    const destination = role === "patient" ? "/patient/login" : "/staff/login";
    const path = currentRoute();
    const isPublicPage = path === "/" || path.endsWith("/login") || path.endsWith("/signup");
    if (!isPublicPage) window.location.assign(appUrl(destination));
  }, [user?.role]);

  useEffect(() => {
    window.addEventListener("teletriage:auth-expired", handleExpiredSession);
    return () => window.removeEventListener("teletriage:auth-expired", handleExpiredSession);
  }, [handleExpiredSession]);

  const login = useCallback(async (email: string, password: string, expectedRole?: "patient" | "staff"): Promise<UserRole | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(email, password);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
      setAccessToken(response.access_token);
      const authUser = await authApi.me();
      if (expectedRole === "patient" && authUser.role !== "patient") {
        await authApi.logout(response.refresh_token).catch(() => undefined);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(ROLE_KEY);
        setAccessToken(null);
        throw new Error("This account is not a patient account. Use the staff sign-in page.");
      }
      if (expectedRole === "staff" && authUser.role === "patient") {
        await authApi.logout(response.refresh_token).catch(() => undefined);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(ROLE_KEY);
        setAccessToken(null);
        throw new Error("This account is not a staff account. Use the patient sign-in page.");
      }
      setAuthenticatedUser({ ...authUser, must_change_password: response.must_change_password || authUser.must_change_password });
      return authUser.role;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthenticatedUser]);

  const patientLogin = useCallback(async (email: string, password: string) => {
    return (await login(email, password, "patient")) === "patient";
  }, [login]);
  const staffLogin = useCallback((email: string, password: string) => login(email, password, "staff"), [login]);

  const patientSignup = useCallback(async (data: {
    full_name: string;
    email: string;
    password: string;
    age?: number;
    gender?: "female" | "male" | "other";
    phone?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(data);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to register.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await authApi.changePassword(currentPassword, newPassword);
      sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
      setAccessToken(tokens.access_token);
      setMustChangePassword(false);
      setUser((current) => current ? { ...current, must_change_password: false } : current);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change password.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) await authApi.logout(refreshToken).catch(() => undefined);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    setAccessToken(null);
    setUser(null);
    setMustChangePassword(false);
    if (!currentRoute().endsWith("/login")) window.location.assign(appUrl("/"));
  }, []);

  useEffect(() => {
    if (!user) return;
    let timeoutId: number;
    const resetTimeout = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => { void logout(); }, 30 * 60 * 1000);
    };
    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimeout, { passive: true }));
    resetTimeout();
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimeout));
    };
  }, [user, logout]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      userType: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      mustChangePassword,
      error,
      patientLogin,
      patientSignup,
      staffLogin,
      changePassword,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
