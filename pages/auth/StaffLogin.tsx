import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPath } from "@/lib/utils";

const StaffLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { staffLogin, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = await staffLogin(email, password);
    // Return to the page that asked for sign-in when this role may open it.
    // Otherwise open the role's dashboard.
    if (role === "admin") navigate(from?.startsWith("/admin") ? from : dashboardPath(role), { replace: true });
    else if (role === "doctor" || role === "nurse") {
      navigate(from && !from.startsWith("/admin") ? from : dashboardPath(role), { replace: true });
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Staff &amp; Admin Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Doctors, nurses and administrators sign in here</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8"
        >
          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
              <button type="button" onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="staff-email" className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@kabwata.clinic"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="staff-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : <>Sign In <LogIn className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Are you a patient?{" "}
            <Link to="/patient/login" className="font-medium text-primary hover:underline">Patient Portal</Link>
          </p>
          <p className="mt-4 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            Staff accounts are created by an administrator. Ask your administrator for access.
          </p>
          {import.meta.env.DEV && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Setting up for the first time? Create the first administrator with{" "}
              <code className="rounded bg-muted px-1 py-0.5">npm run create-admin</code>.
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default StaffLogin;
