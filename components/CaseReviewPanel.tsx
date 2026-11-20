import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  triageApi,
  type CaseEvent,
  type CaseStatus,
  type CaseUpdate,
  type Clinician,
  type TriageCase,
} from "@/lib/triageApi";

const STATUS_LABELS: Record<CaseStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_review: "In review",
  closed: "Closed",
};

function transitionLabel(from: CaseStatus, to: CaseStatus): string {
  if (from === "closed" && to === "in_review") return "Reopen case";
  if (to === "in_review") return "Start review";
  if (to === "closed") return "Close case";
  if (to === "pending") return "Return to queue";
  return STATUS_LABELS[to];
}

function describeEvent(event: CaseEvent, names: Map<number, string>): string {
  const details = event.details ?? {};
  const name = (id: unknown) =>
    typeof id === "number" ? names.get(id) ?? `staff #${id}` : "nobody";
  switch (event.event_type) {
    case "case_submitted":
      return "Case submitted";
    case "assignment_changed":
      return details.new == null ? `Unassigned from ${name(details.old)}` : `Assigned to ${name(details.new)}`;
    case "status_changed": {
      const from = STATUS_LABELS[details.old as CaseStatus] ?? String(details.old);
      const to = STATUS_LABELS[details.new as CaseStatus] ?? String(details.new);
      return `Status ${from} → ${to}${details.reason ? ` (reason: ${String(details.reason)})` : ""}`;
    }
    case "notes_changed":
      return details.new == null ? "Notes cleared" : "Notes updated";
    default:
      return event.event_type.replace(/_/g, " ");
  }
}

interface CaseReviewPanelProps {
  caseItem: TriageCase;
  onCaseUpdated: (updated: TriageCase) => void;
}

export default function CaseReviewPanel({ caseItem, onCaseUpdated }: CaseReviewPanelProps) {
  const { user } = useAuth();
  const isDoctor = user?.role === "doctor";
  const userId = user ? Number(user.id) : null;

  const [notes, setNotes] = useState(caseItem.doctor_notes ?? "");
  const [reason, setReason] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [history, setHistory] = useState<CaseEvent[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(caseItem.doctor_notes ?? "");
    setReason("");
    setAssigneeId("");
  }, [caseItem.case_id, caseItem.doctor_notes]);

  useEffect(() => {
    setError(null);
  }, [caseItem.case_id]);

  useEffect(() => {
    triageApi
      .listClinicians()
      .then(setClinicians)
      .catch(() => setClinicians([]));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryError(null);
      const res = await triageApi.getCaseHistory(caseItem.case_id);
      setHistory(res.events);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not load the case history.");
    }
  }, [caseItem.case_id]);

  useEffect(() => {
    setHistory(null);
    loadHistory();
  }, [loadHistory]);

  const run = async (action: () => Promise<{ case: TriageCase }>) => {
    setBusy(true);
    setError(null);
    try {
      const res = await action();
      onCaseUpdated(res.case);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const notesChanged = notes.trim() !== (caseItem.doctor_notes ?? "");
  const isClosed = caseItem.status === "closed";
  const assignedToMe = userId !== null && caseItem.assigned_staff_id === userId;
  const names = new Map(clinicians.map((c) => [c.id, c.full_name]));

  const handleTransition = (target: CaseStatus) => {
    const update: CaseUpdate = { status: target };
    if (caseItem.can_edit_notes && notesChanged) update.doctor_notes = notes;
    if (target === "closed" && !notes.trim()) {
      setError("Add clinical notes before closing the case.");
      return;
    }
    if (isClosed && target === "in_review") {
      if (!reason.trim()) {
        setError("Enter a reason to reopen this case.");
        return;
      }
      update.reason = reason.trim();
    }
    run(() => triageApi.updateCase(caseItem.case_id, update));
  };

  return (
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
      {/* Assignment */}
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500">Assigned to: </span>
          <span className="font-semibold text-foreground">{caseItem.assigned_doctor ?? "Unassigned"}</span>
          <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
            {STATUS_LABELS[caseItem.status]}
          </span>
        </div>
        {caseItem.can_assign && (
          <div className="flex flex-wrap items-center gap-2">
            {!assignedToMe && userId !== null && (
              <Button size="sm" disabled={busy} onClick={() => run(() => triageApi.assignCase(caseItem.case_id, userId))}>
                Take case
              </Button>
            )}
            {isDoctor && (
              <>
                <label htmlFor="assignee" className="sr-only">Assign to</label>
                <select
                  id="assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-xs"
                >
                  <option value="">Assign to…</option>
                  {clinicians
                    .filter((c) => c.id !== caseItem.assigned_staff_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.role})
                      </option>
                    ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !assigneeId}
                  onClick={() => run(() => triageApi.assignCase(caseItem.case_id, Number(assigneeId)))}
                >
                  Assign
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="clinical-notes" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
          Clinical notes
        </label>
        <textarea
          id="clinical-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!caseItem.can_edit_notes || busy}
          placeholder="Findings, advice given, and the disposition."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background p-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none disabled:opacity-70"
        />
        {!caseItem.can_edit_notes && (
          <p className="text-xs text-muted-foreground">
            {isClosed
              ? "Closed cases are read-only. A doctor can reopen the case."
              : "Only the assigned clinician or a doctor can edit this case. Take the case first."}
          </p>
        )}
        {caseItem.can_edit_notes && notesChanged && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(() => triageApi.updateCase(caseItem.case_id, { doctor_notes: notes }))}
          >
            Save notes
          </Button>
        )}
      </div>

      {/* Status changes */}
      {caseItem.available_transitions.length > 0 && (
        <div className="space-y-2">
          {isClosed && caseItem.available_transitions.includes("in_review") && (
            <div>
              <label htmlFor="reopen-reason" className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Reason for reopening
              </label>
              <input
                id="reopen-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs"
              />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {caseItem.available_transitions.map((target) => (
              <Button
                key={target}
                size="sm"
                variant={target === "pending" ? "outline" : "default"}
                disabled={busy}
                onClick={() => handleTransition(target)}
              >
                {transitionLabel(caseItem.status, target)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      )}

      {/* History */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">Case history</span>
        {historyError ? (
          <p className="text-xs text-red-700">{historyError}</p>
        ) : history === null ? (
          <p className="text-xs text-muted-foreground">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No history recorded.</p>
        ) : (
          <ol className="space-y-1">
            {history.map((event) => (
              <li key={event.id} className="text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-400">{new Date(event.created_at).toLocaleString()}</span>
                {" · "}
                <span className="font-medium text-foreground">{event.actor_name ?? "Deleted account"}</span>
                {" · "}
                {describeEvent(event, names)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
