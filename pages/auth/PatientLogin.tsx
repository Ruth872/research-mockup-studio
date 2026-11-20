import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPath } from "@/lib/utils";

const PatientLogin = () => {
  const location = useLocation();
  const state = location.state as { from?: string; registered?: string } | null;
  const [email, setEmail] = useState(state?.registered ?? "");
  const [password, setPassword] = useState("");
  const { patientLogin, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await patientLogin(email, password)) navigate(state?.from ?? dashboardPath("patient"), { replace: true });
  };
  const inputClass = "w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-safe"><Heart className="h-7 w-7 text-primary-foreground" /></div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Patient Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your email and password</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
          {state?.registered && !error && <div role="status" className="mb-4 rounded-lg border border-safe/30 bg-safe/10 p-3 text-sm text-foreground">Your account has been created. Sign in to continue.</div>}
          {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error} <button type="button" onClick={clearError} className="ml-2 underline">Dismiss</button></div>}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">Email
              <span className="relative mt-1.5 block"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} /></span>
            </label>
            <label className="block text-sm font-medium text-foreground">Password
              <span className="relative mt-1.5 block"><Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} /></span>
            </label>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={isLoading}>{isLoading ? "Signing in…" : <>Sign In <LogIn className="ml-2 h-4 w-4" /></>}</Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">New patient? <Link to="/patient/signup" className="font-medium text-primary hover:underline">Register here</Link></p>
          <p className="mt-2 text-center text-sm text-muted-foreground">Staff member? <Link to="/staff/login" className="font-medium text-primary hover:underline">Staff sign in</Link></p>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientLogin;
