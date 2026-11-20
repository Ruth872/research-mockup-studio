import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, KeyRound, Pencil, UserPlus, UserRoundCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  staffAdminApi,
  type ManagedStaffUser,
  type PageResult,
} from "@/lib/api";

const PAGE_SIZE = 20;
const emptyForm = {
  full_name: "",
  email: "",
  role: "nurse" as "doctor" | "nurse",
  department: "",
  license_number: "",
  phone: "",
};
type StaffForm = typeof emptyForm;
const inputClass = "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export default function StaffManagement() {
  const isMobile = useIsMobile();
  const [result, setResult] = useState<PageResult<ManagedStaffUser> | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editing, setEditing] = useState<ManagedStaffUser | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"doctor" | "nurse" | "">("");
  const [page, setPage] = useState(1);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadStaff = useCallback(async () => {
    try {
      setResult(await staffAdminApi.list(search, roleFilter, page, PAGE_SIZE));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load staff.");
    }
  }, [page, roleFilter, search]);

  useEffect(() => { void loadStaff(); }, [loadStaff]);
  const pageCount = Math.max(1, Math.ceil((result?.total ?? 0) / PAGE_SIZE));

  const createStaff = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const created = await staffAdminApi.create({
        ...form,
        phone: form.phone.trim() || undefined,
      });
      setTemporaryPassword(created.temporary_password);
      setForm(emptyForm);
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create staff account.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (member: ManagedStaffUser) => {
    const action = member.is_active ? "deactivate" : "reactivate";
    const prompt = member.is_active
      ? `Deactivate ${member.full_name}'s account? They will lose access immediately.`
      : `Reactivate ${member.full_name}'s account?`;
    if (!window.confirm(prompt)) return;
    setBusy(true);
    setError("");
    try {
      if (member.is_active) await staffAdminApi.deactivate(member.id);
      else await staffAdminApi.reactivate(member.id);
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to ${action} staff account.`);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (member: ManagedStaffUser) => {
    if (!window.confirm(`Reset ${member.full_name}'s password? Their current refresh sessions will be revoked.`)) return;
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await staffAdminApi.resetPassword(member.id);
      setTemporaryPassword(response.temporary_password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset the password.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    if (!window.confirm(`Save the account changes for ${editing.full_name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await staffAdminApi.update(editing.id, {
        full_name: editing.full_name,
        email: editing.email,
        role: editing.role,
        department: editing.department,
        license_number: editing.license_number,
        phone: editing.phone,
      });
      setEditing(null);
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update staff account.");
    } finally {
      setBusy(false);
    }
  };

  const copyTemporaryPassword = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
    } catch {
      setError("Clipboard access was denied. Select and copy the temporary password manually.");
    }
  };

  const input = (label: string, value: string, onChange: (value: string) => void, required = true, type = "text") => (
    <label className="block text-sm font-medium text-foreground">{label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} mt-1.5`} />
    </label>
  );

  const actions = (member: ManagedStaffUser) => (
    <>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setEditing({ ...member })}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggleActive(member)}>{member.is_active ? <UserRoundX className="mr-1 h-4 w-4" /> : <UserRoundCheck className="mr-1 h-4 w-4" />}{member.is_active ? "Deactivate" : "Reactivate"}</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void resetPassword(member)}><KeyRound className="mr-1 h-4 w-4" />Reset password</Button>
    </>
  );

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8 sm:px-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Manage staff</h1>
          <p className="mt-2 text-muted-foreground">Create and maintain doctor and nurse accounts. Staff cannot register themselves.</p>
        </header>

        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}

        <form onSubmit={createStaff} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground"><UserPlus className="h-5 w-5 text-primary" />Add staff</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {input("Full name", form.full_name, (value) => setForm({ ...form, full_name: value }))}
            {input("Email", form.email, (value) => setForm({ ...form, email: value }), true, "email")}
            <label className="text-sm font-medium text-foreground">Role
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as StaffForm["role"] })} className={`${inputClass} mt-1.5`}>
                <option value="nurse">Nurse</option><option value="doctor">Doctor</option>
              </select>
            </label>
            {input("Department", form.department, (value) => setForm({ ...form, department: value }))}
            {input("License number", form.license_number, (value) => setForm({ ...form, license_number: value }))}
            {input("Phone", form.phone, (value) => setForm({ ...form, phone: value }), false, "tel")}
          </div>
          <Button type="submit" disabled={busy} className="w-full sm:w-auto"><UserPlus className="mr-2 h-4 w-4" />Create staff account</Button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:px-6 lg:flex-row lg:items-end">
            <div className="flex-1">
              <h2 className="font-heading text-xl font-semibold text-foreground">Staff accounts</h2>
              <p className="mt-1 text-sm text-muted-foreground">{result?.total ?? 0} total accounts</p>
            </div>
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput); }}>
              <input aria-label="Search staff" placeholder="Search staff" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className={inputClass} />
              <select aria-label="Filter staff role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value as typeof roleFilter); setPage(1); }} className={inputClass}>
                <option value="">All roles</option><option value="doctor">Doctors</option><option value="nurse">Nurses</option>
              </select>
              <Button type="submit" variant="outline">Search</Button>
            </form>
          </div>
          {!result ? <p role="status" className="p-6 text-sm text-muted-foreground">Loading staff…</p> : result.items.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No staff accounts match this search.</p>
          ) : isMobile ? (
            <ul className="divide-y divide-border">
              {result.items.map((member) => (
                <li key={member.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{member.full_name}</p>
                      <p className="break-all text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <span className={`shrink-0 text-sm ${member.is_active ? "text-safe" : "text-muted-foreground"}`}>{member.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <dt className="font-medium text-foreground">Role</dt><dd className="capitalize">{member.role}</dd>
                    <dt className="font-medium text-foreground">Department</dt><dd>{member.department}</dd>
                    <dt className="font-medium text-foreground">License</dt><dd className="break-all">{member.license_number}</dd>
                    <dt className="font-medium text-foreground">Phone</dt><dd>{member.phone ?? "No phone"}</dd>
                  </dl>
                  <div className="flex flex-wrap gap-2">{actions(member)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Role / department</th><th className="px-5 py-3">License / phone</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {result.items.map((member) => (
                    <tr key={member.id}>
                      <td className="px-5 py-4 font-medium text-foreground">{member.full_name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{member.email}</td>
                      <td className="px-5 py-4 capitalize text-muted-foreground">{member.role}<span className="block text-xs">{member.department}</span></td>
                      <td className="px-5 py-4 text-muted-foreground">{member.license_number}<span className="block text-xs">{member.phone ?? "No phone"}</span></td>
                      <td className="px-5 py-4"><span className={member.is_active ? "text-safe" : "text-muted-foreground"}>{member.is_active ? "Active" : "Inactive"}</span></td>
                      <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{actions(member)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-sm text-muted-foreground sm:px-6">
              <span>Page {page} of {pageCount}</span>
              <div className="flex gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={temporaryPassword !== null} onOpenChange={(open) => { if (!open) { setTemporaryPassword(null); setCopied(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Temporary password</DialogTitle>
            <DialogDescription className="text-left">This password is shown only once. Copy it now and share it securely with the staff member. They must change it after signing in.</DialogDescription>
          </DialogHeader>
          <div className="break-all rounded-lg border border-border bg-muted p-4 font-mono text-sm" aria-label="Temporary password">{temporaryPassword}</div>
          <DialogFooter className="gap-2">
            <Button type="button" onClick={() => void copyTemporaryPassword()}><Copy className="mr-2 h-4 w-4" />{copied ? "Copied" : "Copy password"}</Button>
            <Button type="button" variant="outline" onClick={() => { setTemporaryPassword(null); setCopied(false); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit staff account</DialogTitle>
            <DialogDescription>Update account details. Changing a role is recorded in the admin audit log.</DialogDescription>
          </DialogHeader>
          {editing && (
            <form onSubmit={saveEdit} className="space-y-4">
              {input("Full name", editing.full_name, (value) => setEditing({ ...editing, full_name: value }))}
              {input("Email", editing.email, (value) => setEditing({ ...editing, email: value }), true, "email")}
              <label className="block text-sm font-medium text-foreground">Role
                <select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value as ManagedStaffUser["role"] })} className={`${inputClass} mt-1.5`}>
                  <option value="nurse">Nurse</option><option value="doctor">Doctor</option>
                </select>
              </label>
              {input("Department", editing.department, (value) => setEditing({ ...editing, department: value }))}
              {input("License number", editing.license_number, (value) => setEditing({ ...editing, license_number: value }))}
              {input("Phone", editing.phone ?? "", (value) => setEditing({ ...editing, phone: value || null }), false, "tel")}
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button type="submit" disabled={busy}>Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
