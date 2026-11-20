import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Heart, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const MIN_PASSWORD = 12;
const MAX_PASSWORD = 72;

type Form = { full_name: string; email: string; password: string; confirm_password: string; age: string; gender: string; phone: string };
type FieldErrors = Partial<Record<keyof Form, string>>;

/** The same rules the API applies, so problems are explained before anything is sent. */
function validate(form: Form): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.full_name.trim()) errors.full_name = "Enter your full name.";
  if (!form.email.trim()) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Enter a valid email address, for example name@example.com.";
  if (form.age !== "") {
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 0 || age > 130) errors.age = "Age must be a whole number from 0 to 130.";
  }
  if (form.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  else if (new TextEncoder().encode(form.password).length > MAX_PASSWORD) errors.password = `Use at most ${MAX_PASSWORD} characters.`;
  if (!errors.password && form.confirm_password !== form.password) errors.confirm_password = "The passwords do not match.";
  return errors;
}

const PatientSignup = () => {
  const [form, setForm] = useState<Form>({
    full_name: "", email: "", password: "", confirm_password: "", age: "", gender: "", phone: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { patientSignup, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const set = (key: keyof Form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...form, [key]: event.target.value };
    setForm(next);
    // After a first attempt, re-check as the user corrects each field.
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    clearError();
    const found = validate(form);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as Array<keyof Form>)[0];
    if (firstInvalid) {
      document.getElementById(`signup-${firstInvalid}`)?.focus();
      return;
    }
    const ok = await patientSignup({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      ...(form.age ? { age: Number(form.age) } : {}),
      ...(form.gender ? { gender: form.gender as "female" | "male" | "other" } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    });
    if (ok) navigate("/patient/login", { replace: true, state: { registered: form.email.trim() } });
  };

  const inputClass = (field: keyof Form) =>
    `mt-1.5 w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
      errors[field] ? "border-destructive" : "border-input"
    }`;

  const labelClass = "block text-sm font-medium text-foreground";

  const fieldError = (field: keyof Form) =>
    errors[field] ? <p id={`signup-${field}-error`} className="mt-1 text-xs text-destructive">{errors[field]}</p> : null;

  const describedBy = (field: keyof Form, hint?: string) =>
    [errors[field] ? `signup-${field}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  const remaining = MIN_PASSWORD - form.password.length;

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-safe"><Heart className="h-7 w-7 text-primary-foreground" /></div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Patient Registration</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your patient account.</p>
        </div>
        <form noValidate onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
          {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error} <button type="button" onClick={clearError} className="ml-2 underline">Dismiss</button></div>}
          {submitted && Object.keys(errors).length > 0 && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Please correct the highlighted fields.</div>
          )}

          <div>
            <label htmlFor="signup-full_name" className={labelClass}>Full name</label>
            <input id="signup-full_name" maxLength={200} autoComplete="name" value={form.full_name} onChange={set("full_name")} aria-invalid={!!errors.full_name} aria-describedby={describedBy("full_name")} className={inputClass("full_name")} />
            {fieldError("full_name")}
          </div>
          <div>
            <label htmlFor="signup-email" className={labelClass}>Email</label>
            <input id="signup-email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={describedBy("email")} className={inputClass("email")} />
            {fieldError("email")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="signup-age" className={labelClass}>Age (optional)</label>
              <input id="signup-age" type="number" inputMode="numeric" min={0} max={130} value={form.age} onChange={set("age")} aria-invalid={!!errors.age} aria-describedby={describedBy("age")} className={inputClass("age")} />
              {fieldError("age")}
            </div>
            <div>
              <label htmlFor="signup-gender" className={labelClass}>Gender (optional)</label>
              <select id="signup-gender" value={form.gender} onChange={set("gender")} className={inputClass("gender")}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select>
            </div>
          </div>
          <div>
            <label htmlFor="signup-phone" className={labelClass}>Phone (optional)</label>
            <input id="signup-phone" type="tel" autoComplete="tel" maxLength={32} value={form.phone} onChange={set("phone")} className={inputClass("phone")} />
          </div>

          <div>
            <label htmlFor="signup-password" className={labelClass}>Password</label>
            <div className="relative">
              <input id="signup-password" type={showPassword ? "text" : "password"} maxLength={MAX_PASSWORD} autoComplete="new-password" value={form.password} onChange={set("password")} aria-invalid={!!errors.password} aria-describedby={describedBy("password", "signup-password-hint")} className={`${inputClass("password")} pr-11`} />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 top-1/2 mt-[3px] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldError("password") ?? (
              <p id="signup-password-hint" className={`mt-1 text-xs ${remaining > 0 ? "text-muted-foreground" : "text-safe"}`}>
                {remaining > 0
                  ? `At least ${MIN_PASSWORD} characters${form.password ? ` · ${remaining} more needed` : ""}. A short phrase is easiest to remember.`
                  : "Password length is good."}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="signup-confirm_password" className={labelClass}>Confirm password</label>
            <input id="signup-confirm_password" type={showPassword ? "text" : "password"} maxLength={MAX_PASSWORD} autoComplete="new-password" value={form.confirm_password} onChange={set("confirm_password")} aria-invalid={!!errors.confirm_password} aria-describedby={describedBy("confirm_password")} className={inputClass("confirm_password")} />
            {fieldError("confirm_password") ?? (!submitted && form.confirm_password && form.password !== form.confirm_password
              ? <p className="mt-1 text-xs text-destructive">The passwords do not match yet.</p>
              : null)}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Registering…" : <>Register <UserPlus className="ml-2 h-4 w-4" /></>}
          </Button>
          <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/patient/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientSignup;
