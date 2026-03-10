import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const roles = ["Doctor", "Clinical Officer", "Nurse", "Admin", "IT Support"];

const StaffSignup = () => {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "", confirm_password: "",
    role: "Nurse", specialization: "", license_number: "", phone_number: "",
  });
  const { staffSignup, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) return;
    const ok = await staffSignup({
      first_name: form.first_name, last_name: form.last_name,
      email: form.email, password: form.password, role: form.role,
      specialization: form.specialization || undefined,
      license_number: form.license_number || undefined,
      phone_number: form.phone_number,
    });
    if (ok) navigate("/staff/login");
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Staff Registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a clinician account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error} <button onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">First Name</label>
              <input required value={form.first_name} onChange={set("first_name")} placeholder="John" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name</label>
              <input required value={form.last_name} onChange={set("last_name")} placeholder="Mwale" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input type="email" required value={form.email} onChange={set("email")} placeholder="john@kabwata.clinic" className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number</label>
            <input required value={form.phone_number} onChange={set("phone_number")} placeholder="+260 97X XXX XXX" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Role</label>
              <select required value={form.role} onChange={set("role")} className={inputClass}>
                {roles.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Specialization</label>
              <input value={form.specialization} onChange={set("specialization")} placeholder="Optional" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">License Number</label>
            <input value={form.license_number} onChange={set("license_number")} placeholder="Optional" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <input type="password" required minLength={6} value={form.password} onChange={set("password")} placeholder="••••••••" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm</label>
              <input type="password" required value={form.confirm_password} onChange={set("confirm_password")} placeholder="••••••••" className={inputClass} />
            </div>
          </div>
          {form.password && form.confirm_password && form.password !== form.confirm_password && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || (form.password !== form.confirm_password)}>
            {isLoading ? "Creating…" : <>Create Account <UserPlus className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already registered? <Link to="/staff/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default StaffSignup;
