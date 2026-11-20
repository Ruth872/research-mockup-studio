import { useCallback, useEffect, useState } from "react";
import { Clock, Loader2, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecordView from "@/components/RecordView";
import { triageApi, type CaseRecordResponse } from "@/lib/triageApi";

/**
 * The patient's medical record for a clinician: hidden until the patient approves a
 * request made on this case. Every time the record is shown, the view is logged.
 */
export default function CaseRecordTab({ caseId }: { caseId: string }) {
  const [state, setState] = useState<CaseRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setState(await triageApi.getCaseRecord(caseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The record status could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const request = async () => {
    if (reason.trim().length < 5) {
      setError("Explain in a few words why you need the record; the patient sees this.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await triageApi.requestRecordAccess(caseId, reason.trim());
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request could not be sent.");
    } finally {
      setSending(false);
    }
  };

  if (loading && !state) {
    return <p className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Checking access…</p>;
  }

  const access = state?.access;
  const record = state?.record;

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}

      {record ? (
        <>
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <span>
              Shared by the patient for this case. Your viewing is recorded and visible to the patient.
              {access?.expires_at
                ? ` Access ends ${new Date(access.expires_at).toLocaleString()}.`
                : " Access ends 7 days after the case is closed, or earlier if the patient withdraws it."}
            </span>
          </p>
          <RecordView record={record} />
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <p className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" aria-hidden />
            The medical record is private to the patient. They decide whether to share it for this case.
          </p>

          {access?.status === "pending" && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
              Waiting for the patient. {access.requested_by_name} asked on {new Date(access.requested_at).toLocaleString()}: “{access.reason}”
            </p>
          )}
          {access?.status === "declined" && <p className="text-xs text-slate-600 dark:text-slate-400">The patient declined the last request.</p>}
          {access?.status === "revoked" && <p className="text-xs text-slate-600 dark:text-slate-400">The patient withdrew access.</p>}
          {access?.status === "approved" && !access.active && <p className="text-xs text-slate-600 dark:text-slate-400">Access for this case has ended.</p>}
          {access?.status === "approved" && access.active && (
            <p className="text-xs text-slate-600 dark:text-slate-400">The patient approved access for the clinician who asked and the clinician assigned to this case.</p>
          )}

          {state?.can_request ? (
            <div className="space-y-2">
              <label htmlFor={`record-reason-${caseId}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Why do you need the record? The patient sees this.
              </label>
              <textarea
                id={`record-reason-${caseId}`}
                rows={2}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. To check past treatment and allergies before advising medicine."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" onClick={request} disabled={sending}>
                {sending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Request access
              </Button>
            </div>
          ) : (
            access?.status !== "pending" && (
              <p className="text-xs text-muted-foreground">Take the case to ask the patient for their record. Closed cases cannot request access.</p>
            )
          )}

          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden /> Check again
          </Button>
        </div>
      )}
    </div>
  );
}
