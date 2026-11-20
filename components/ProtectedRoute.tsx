import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { dashboardPath } from "@/lib/utils";

interface ProtectedRouteProps {
  children: ReactNode;
  roles: UserRole[];
  allowPasswordChange?: boolean;
}

export default function ProtectedRoute({ children, roles, allowPasswordChange = false }: ProtectedRouteProps) {
  const { user, isLoading, mustChangePassword } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-[50vh] bg-background" aria-label="Loading account" />;
  if (!user) {
    const patientFlow = roles.length === 1 && roles[0] === "patient";
    const loginPath = patientFlow ? "/patient/login" : "/staff/login";
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return (
      <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">No access</h1>
        <p className="mt-3 text-muted-foreground">Your account does not have permission to view this page.</p>
      </main>
    );
  }
  if (mustChangePassword && !allowPasswordChange) return <Navigate to="/change-password" replace />;
  if (!mustChangePassword && allowPasswordChange) {
    return <Navigate to={dashboardPath(user.role)} replace />;
  }
  return <>{children}</>;
}
