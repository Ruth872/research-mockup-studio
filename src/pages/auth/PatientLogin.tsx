import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, CreditCard, Phone, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PatientLogin = () => {
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const { patientLogin, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await patientLogin(nationalId, phone);
    if (ok) navigate("/patient/portal");
  };

  const inputClass = "w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-safe">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Patient Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your NRC and phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-card">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error} <button onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">National Registration Card (NRC)</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input required value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="123456/78/1" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+260 97X XXX XXX" className={inputClass} />
              </div>
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={isLoading}>
            {isLoading ? "Signing in…" : <>Sign In <LogIn className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            New patient? <Link to="/patient/signup" className="font-medium text-primary hover:underline">Register here</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Staff member? <Link to="/staff/login" className="font-medium text-primary hover:underline">Staff Portal</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientLogin;
