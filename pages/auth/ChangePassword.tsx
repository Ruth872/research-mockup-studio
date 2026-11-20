import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPath } from "@/lib/utils";

export default function ChangePassword() {
  const { changePassword, isLoading, error, clearError, user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [problem, setProblem] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    if (!currentPassword) return setProblem("Enter your current or temporary password.");
    if (newPassword.length < 12) return setProblem("Your new password needs at least 12 characters.");
    if (newPassword !== confirmPassword) return setProblem("The new passwords do not match.");
    setProblem("");
    if (await changePassword(currentPassword, newPassword)) {
      navigate(dashboardPath(user?.role ?? ""), { replace: true });
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-10 sm:px-6 sm:py-12">
      <form noValidate onSubmit={submit} className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"><KeyRound className="h-7 w-7 text-primary" /></div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Change your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a new password before continuing.</p>
        </div>
        {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error} <button type="button" onClick={clearError} className="ml-2 underline">Dismiss</button></div>}
        <div className="space-y-4">
          {problem && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{problem}</div>}
          <label className="block text-sm font-medium text-foreground">Current password<input type="password" maxLength={72} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5" /></label>
          <label className="block text-sm font-medium text-foreground">New password<span className="block text-xs font-normal text-muted-foreground">At least 12 characters{newPassword && newPassword.length < 12 ? ` · ${12 - newPassword.length} more needed` : ""}</span><input type="password" maxLength={72} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5" /></label>
          <label className="block text-sm font-medium text-foreground">Confirm new password<input type="password" maxLength={72} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5 w-full rounded-lg border border-input bg-background px-4 py-2.5" /></label>
        </div>
        {confirmPassword && newPassword !== confirmPassword && <p className="mt-2 text-sm text-destructive">Passwords do not match.</p>}
        <Button type="submit" className="mt-6 w-full" disabled={isLoading}>{isLoading ? "Saving…" : "Save new password"}</Button>
        <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => void logout()}>Sign out</Button>
      </form>
    </main>
  );
}
