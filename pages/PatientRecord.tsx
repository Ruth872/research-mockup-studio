import { useCallback, useEffect, useState } from "react";
import { Eye, FileHeart, Loader2, Plus, ShieldCheck, ShieldQuestion, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthBackgroundFields } from "@/components/IntakeFields";
import { intakeFromBackground, intakePayload, validateIntake, type IntakeErrors, type IntakeForm } from "@/lib/intake";
import {
  triageApi,
  type AccessGrant,
  type BloodGroup,
  type MedicalRecord,
  type RecordAccessOverview,
  type RecordDetails,
} from "@/lib/triageApi";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const STATUS_LABELS: Record<string, string> = { pending: "Pending review", assigned: "Assigned", in_review: "In review", closed: "Closed" };
const GRANT_LABELS: Record<AccessGrant["status"], string> = { pending: "Waiting for you", approved: "Approved", declined: "Declined", revoked: "Withdrawn" };

type EntryRow = { name: string; year: string };
interface DetailsForm {
  bloodGroup: "" | BloodGroup;
  immunisations: EntryRow[];
  procedures: EntryRow[];
  familyHistory: string;
}

const card = "rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6";
const inputClass = "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

function detailsForm(details: RecordDetails | null): DetailsForm {
  const rows = (items: RecordDetails["immunisations"] = []) => items.map((i) => ({ name: i.name, year: i.year ? String(i.year) : "" }));
  return {
    bloodGroup: details?.blood_group ?? "",
    immunisations: rows(details?.immunisations),
    procedures: rows(details?.procedures),
    familyHistory: details?.family_history ?? "",
  };
}

function entriesPayload(rows: EntryRow[]) {
  return rows.filter((r) => r.name.trim()).map((r) => ({ name: r.name.trim(), year: r.year ? Number(r.year) : null }));
}

function EntryList({ label, id, rows, onChange, placeholder }: { label: string; id: string; rows: EntryRow[]; onChange: (rows: EntryRow[]) => void; placeholder: string }) {
  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <span id={`${id}-label`} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{label}</span>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-2">
            <label htmlFor={`${id}-${index}-name`} className="sr-only">{label} {index + 1}</label>
            <input id={`${id}-${index}-name`} value={row.name} maxLength={200} placeholder={placeholder} onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))} className={inputClass} />
            <label htmlFor={`${id}-${index}-year`} className="sr-only">Year</label>
            <input id={`${id}-${index}-year`} value={row.year} inputMode="numeric" maxLength={4} placeholder="Year" onChange={(e) => onChange(rows.map((r, i) => (i === index ? { ...r, year: e.target.value.replace(/\D/g, "") } : r)))} className={`${inputClass} w-20 flex-shrink-0`} />
            <Button type="button" variant="ghost" size="sm" className="h-10 flex-shrink-0" aria-label={`Remove ${label.toLowerCase()} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {rows.length < 50 && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { name: "", year: "" }])}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PatientRecord() {
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [access, setAccess] = useState<RecordAccessOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [health, setHealth] = useState<IntakeForm>(() => intakeFromBackground(null));
  const [details, setDetails] = useState<DetailsForm>(() => detailsForm(null));
  const [errors, setErrors] = useState<IntakeErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [answering, setAnswering] = useState<number | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [mine, overview] = await Promise.all([triageApi.getMyRecord(), triageApi.getMyRecordAccess()]);
      setRecord(mine);
      setAccess(overview);
      setHealth(intakeFromBackground(mine.health));
      setDetails(detailsForm(mine.details));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Your record could not be loaded.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAccess = async () => setAccess(await triageApi.getMyRecordAccess());

  const answer = async (grant: AccessGrant, action: "approve" | "decline" | "revoke") => {
    const who = grant.requested_by_name ?? "The clinician";
    const prompts = {
      approve: `Share your record for ${grant.case_id}?\n\n${who} and the clinician assigned to this case will be able to see it until 7 days after the case is closed. You can withdraw access at any time.`,
      decline: `Decline ${who}'s request to see your record?`,
      revoke: `Withdraw access to your record for ${grant.case_id}? Clinicians will no longer be able to see it.`,
    };
    if (!window.confirm(prompts[action])) return;
    setAnswering(grant.id);
    setAccessError(null);
    try {
      await triageApi.answerAccess(grant.id, action);
      await refreshAccess();
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : "Your answer could not be saved.");
      await refreshAccess().catch(() => undefined);
    } finally {
      setAnswering(null);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveMessage(null);
    const found = validateIntake({ ...health, temperatureC: "" });
    setErrors(found);
    if (Object.keys(found).length) {
      setSaveMessage({ ok: false, text: Object.values(found)[0] ?? "Please check the highlighted fields." });
      return;
    }
    setSaving(true);
    try {
      const updated = await triageApi.updateMyRecord({
        health: intakePayload(health, "", "").health,
        details: {
          blood_group: details.bloodGroup || null,
          immunisations: entriesPayload(details.immunisations),
          procedures: entriesPayload(details.procedures),
          family_history: details.familyHistory.trim() || null,
        },
      });
      setRecord(updated);
      setSaveMessage({ ok: true, text: "Your record is saved." });
    } catch (err) {
      setSaveMessage({ ok: false, text: err instanceof Error ? err.message : "Your record could not be saved." });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">
          <p className="font-semibold">Your record could not be loaded.</p>
          <p className="mt-1">{loadError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>Try again</Button>
        </div>
      </main>
    );
  }
  if (!record || !access) {
    return <main className="flex justify-center py-16 text-sm text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your record…</main>;
  }

  const pending = access.grants.filter((g) => g.status === "pending");
  const active = access.grants.filter((g) => g.active);
  const earlier = access.grants.filter((g) => g.status !== "pending" && !g.active);

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <header>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            <FileHeart className="h-7 w-7 text-primary" aria-hidden /> My Health Record
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only you can see this record. A clinician can see it only if you approve their request for a specific case, and you can withdraw access at any time.
          </p>
        </header>

        <section aria-labelledby="requests-heading" className={card}>
          <h2 id="requests-heading" className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <ShieldQuestion className="h-5 w-5 text-primary" aria-hidden /> Requests to see your record
          </h2>
          {accessError && <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">{accessError}</p>}
          {access.grants.length === 0 && <p className="text-sm text-muted-foreground">No clinician has asked to see your record.</p>}

          <div className="space-y-3">
            {pending.map((grant) => (
              <article key={grant.id} className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-amber-950 dark:text-amber-100">
                  <strong>{grant.requested_by_name ?? "A clinician"}</strong> is asking to see your record for <strong>{grant.case_id}</strong>.
                </p>
                <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">Reason: “{grant.reason}”</p>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">Asked {new Date(grant.requested_at).toLocaleString()}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" disabled={answering === grant.id} onClick={() => answer(grant, "approve")}>Approve</Button>
                  <Button size="sm" variant="outline" disabled={answering === grant.id} onClick={() => answer(grant, "decline")}>Decline</Button>
                </div>
              </article>
            ))}

            {active.map((grant) => (
              <article key={grant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <p className="flex items-start gap-2 text-sm text-emerald-950 dark:text-emerald-100">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
                  <span>
                    Shared for <strong>{grant.case_id}</strong> with {grant.requested_by_name ?? "a clinician"} and the assigned clinician.
                    {grant.expires_at ? ` Ends ${new Date(grant.expires_at).toLocaleDateString()}.` : " Ends 7 days after the case closes."}
                  </span>
                </p>
                <Button size="sm" variant="outline" disabled={answering === grant.id} onClick={() => answer(grant, "revoke")}>Withdraw access</Button>
              </article>
            ))}

            {earlier.length > 0 && (
              <ul className="divide-y divide-border text-sm">
                {earlier.map((grant) => (
                  <li key={grant.id} className="flex flex-wrap justify-between gap-2 py-2 text-muted-foreground">
                    <span>{grant.case_id} · {grant.requested_by_name ?? "Clinician"}</span>
                    <span>{grant.status === "approved" ? "Ended" : GRANT_LABELS[grant.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <form noValidate onSubmit={save} aria-labelledby="record-heading" className={`${card} space-y-6`}>
          <div>
            <h2 id="record-heading" className="font-heading text-lg font-semibold text-foreground">Your record</h2>
            {record.updated_at && <p className="text-xs text-muted-foreground">Last updated {new Date(record.updated_at).toLocaleString()}</p>}
          </div>
          <HealthBackgroundFields form={health} onChange={(patch) => setHealth({ ...health, ...patch })} errors={errors} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor="blood-group" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Blood group</label>
              <select id="blood-group" value={details.bloodGroup} onChange={(e) => setDetails({ ...details, bloodGroup: e.target.value as DetailsForm["bloodGroup"] })} className={inputClass}>
                <option value="">Not known</option>
                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="family-history" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Family health history</label>
              <input id="family-history" value={details.familyHistory} maxLength={1000} placeholder="e.g. Mother has diabetes" onChange={(e) => setDetails({ ...details, familyHistory: e.target.value })} className={inputClass} />
            </div>
          </div>
          <EntryList label="Immunisations" id="immunisations" placeholder="e.g. Tetanus" rows={details.immunisations} onChange={(rows) => setDetails({ ...details, immunisations: rows })} />
          <EntryList label="Operations and hospital stays" id="procedures" placeholder="e.g. Caesarean section" rows={details.procedures} onChange={(rows) => setDetails({ ...details, procedures: rows })} />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save record"}</Button>
            {saveMessage && <p role={saveMessage.ok ? "status" : "alert"} className={`text-sm ${saveMessage.ok ? "text-safe" : "text-red-700"}`}>{saveMessage.text}</p>}
          </div>
        </form>

        <section aria-labelledby="history-heading" className={card}>
          <h2 id="history-heading" className="mb-3 font-heading text-lg font-semibold text-foreground">Past assessments</h2>
          {record.past_assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not submitted an assessment yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {record.past_assessments.map((item) => (
                <li key={item.case_id} className="py-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{item.case_id} · {new Date(item.created_at).toLocaleDateString()}</span>
                    <span>{STATUS_LABELS[item.status] ?? item.status}</span>
                  </div>
                  <p className="mt-1 capitalize text-foreground">{item.symptoms.join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="views-heading" className={card}>
          <h2 id="views-heading" className="mb-3 flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
            <Eye className="h-5 w-5 text-primary" aria-hidden /> Who has viewed your record
          </h2>
          {access.views.length === 0 ? (
            <p className="text-sm text-muted-foreground">No clinician has viewed your record.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {access.views.map((view, index) => (
                <li key={index} className="flex flex-wrap justify-between gap-2 py-2">
                  <span className="text-foreground">{view.viewer_name} <span className="text-muted-foreground">· {view.case_id}</span></span>
                  <span className="text-muted-foreground">{new Date(view.viewed_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
