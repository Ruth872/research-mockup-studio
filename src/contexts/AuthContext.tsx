import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { api, type StaffUser, type PatientUser } from "@/lib/api";

type UserType = "staff" | "patient" | null;

interface AuthState {
  user: StaffUser | PatientUser | null;
  userType: UserType;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  staffLogin: (email: string, password: string) => Promise<boolean>;
  staffSignup: (data: Parameters<typeof api.staffSignup>[0]) => Promise<boolean>;
  patientLogin: (national_id: string, phone_number: string) => Promise<boolean>;
  patientSignup: (data: Parameters<typeof api.patientSignup>[0]) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<StaffUser | PatientUser | null>(() => {
    const saved = localStorage.getItem("kc_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [userType, setUserType] = useState<UserType>(() => {
    return (localStorage.getItem("kc_user_type") as UserType) || null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (u: StaffUser | PatientUser, type: UserType) => {
    setUser(u);
    setUserType(type);
    localStorage.setItem("kc_user", JSON.stringify(u));
    localStorage.setItem("kc_user_type", type || "");
  };

  const staffLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.staffLogin(email, password);
      if (res.success && res.user) {
        persist(res.user as StaffUser, "staff");
        return true;
      }
      setError(res.message);
      return false;
    } catch {
      setError("Unable to connect to server. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const staffSignup = useCallback(async (data: Parameters<typeof api.staffSignup>[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.staffSignup(data);
      if (res.success) return true;
      setError(res.message);
      return false;
    } catch {
      setError("Unable to connect to server.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const patientLogin = useCallback(async (national_id: string, phone_number: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patientLogin(national_id, phone_number);
      if (res.success && res.user) {
        persist(res.user as PatientUser, "patient");
        return true;
      }
      setError(res.message);
      return false;
    } catch {
      setError("Unable to connect to server.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const patientSignup = useCallback(async (data: Parameters<typeof api.patientSignup>[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patientSignup(data);
      if (res.success) return true;
      setError(res.message);
      return false;
    } catch {
      setError("Unable to connect to server.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem("kc_user");
    localStorage.removeItem("kc_user_type");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        isLoading,
        error,
        staffLogin,
        staffSignup,
        patientLogin,
        patientSignup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
