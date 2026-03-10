import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PatientSignup = () => {
  const [form, setForm] = useState({
    national_id: "", first_name: "", last_name: "", date_of_birth: "",
    gender: "", phone_number: "", email: "", address: "",
    next_of_kin_name: "", next_of_kin_contact: "", blood_group: "",
    allergies: "", chronic_conditions: "", current_medications: "",
  });
  const { patientSignup, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await patientSignup(form);
    if (ok) navigate("/patient/login");
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-safe">
            <Heart className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Patient Registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your health profile at Kabwata Clinic</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error} <button onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          {/* Section: Personal */}
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Personal Information</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">National ID (NRC) *</label>
              <input required value={form.national_id} onChange={set("national_id")} placeholder="123456/78/1" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Phone Number *</label>
              <input required value={form.phone_number} onChange={set("phone_number")} placeholder="+260 97X XXX XXX" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">First Name *</label>
              <input required value={form.first_name} onChange={set("first_name")} placeholder="Ruth" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Last Name *</label>
              <input required value={form.last_name} onChange={set("last_name")} placeholder="Mwenya" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Date of Birth *</label>
              <input type="date" required value={form.date_of_birth} onChange={set("date_of_birth")} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Gender *</label>
              <select required value={form.gender} onChange={set("gender")} className={inputClass}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Blood Group</label>
              <select value={form.blood_group} onChange={set("blood_group")} className={inputClass}>
                <option value="">Select</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Address</label>
            <input value={form.address} onChange={set("address")} placeholder="Kabwata, Lusaka" className={inputClass} />
          </div>

          {/* Section: Next of Kin */}
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground pt-2">Next of Kin</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
              <input value={form.next_of_kin_name} onChange={set("next_of_kin_name")} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Contact</label>
              <input value={form.next_of_kin_contact} onChange={set("next_of_kin_contact")} placeholder="Optional" className={inputClass} />
            </div>
          </div>

          {/* Section: Medical */}
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground pt-2">Medical History</h3>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Allergies</label>
            <textarea value={form.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin, Peanuts" rows={2} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Chronic Conditions</label>
            <textarea value={form.chronic_conditions} onChange={set("chronic_conditions")} placeholder="e.g. Hypertension, Diabetes" rows={2} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Current Medications</label>
            <textarea value={form.current_medications} onChange={set("current_medications")} placeholder="e.g. Metformin 500mg" rows={2} className={inputClass} />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering…" : <>Register <UserPlus className="ml-2 h-4 w-4" /></>}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already registered? <Link to="/patient/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientSignup;
