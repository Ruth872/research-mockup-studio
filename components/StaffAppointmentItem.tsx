import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";
import { formatPlace, formatWhen, STAFF_STATUS_LABELS, STATUS_TONES } from "@/lib/appointments";
import { triageApi, type Appointment } from "@/lib/triageApi";

interface StaffAppointmentItemProps {
  appointment: Appointment;
  onChanged: (updated: Appointment) => void;
  /** Show the patient and case (on the appointments page, not inside a case). */
  showPatient?: boolean;
}

/** One appointment for clinicians, with the actions the API allows. */
export default function StaffAppointmentItem({ appointment, onChanged, showPatient = false }: StaffAppointmentItemProps) {
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const can = (action: Appointment["actions"][number]) => appointment.actions.includes(action);

  const run = async (action: () => Promise<Appointment>) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
      setMode("view");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
            <CalendarClock className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden /> {formatWhen(appointment.scheduled_at)}
            <span className="font-normal text-slate-500">· {appointment.duration_minutes} min</span>
          </p>
          {showPatient && (
            <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">
              {appointment.patient_name}{" "}
              <Link to={`/staff/triage?case=${appointment.case_id}`} className="font-mono text-xs text-primary underline-offset-2 hover:underline">
                · Open {appointment.case_id}
              </Link>
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            {appointment.kind === "phone" ? <Phone className="h-3.5 w-3.5" aria-hidden /> : <MapPin className="h-3.5 w-3.5" aria-hidden />}
            {formatPlace(appointment)} · with {appointment.clinician_name ?? "unassigned"}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[appointment.status]}`}>{STAFF_STATUS_LABELS[appointment.status]}</span>
      </div>

      {appointment.status === "reschedule_requested" && appointment.patient_message && (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">Patient: “{appointment.patient_message}”</p>
      )}
      {appointment.notes_for_patient && <p className="text-xs text-slate-600 dark:text-slate-400">Note to patient: {appointment.notes_for_patient}</p>}
      {appointment.status === "cancelled" && appointment.cancel_reason && <p className="text-xs text-slate-500">Cancelled: {appointment.cancel_reason}</p>}

      {mode === "reschedule" && (
        <AppointmentForm
          initial={appointment}
          submitLabel="Propose new time"
          onCancel={() => setMode("view")}
          onSubmit={async (body) => {
            onChanged(await triageApi.rescheduleAppointment(appointment.id, body));
            setMode("view");
          }}
        />
      )}

      {mode === "cancel" && (
        <div className="space-y-2">
          <label htmlFor={`cancel-reason-${appointment.id}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Reason (the patient sees this)</label>
          <input id={`cancel-reason-${appointment.id}`} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={busy || !reason.trim()} onClick={() => run(() => triageApi.cancelAppointment(appointment.id, reason.trim()))}>Cancel appointment</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Back</Button>
          </div>
        </div>
      )}

      {mode === "view" && appointment.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {can("attended") && <Button size="sm" disabled={busy} onClick={() => run(() => triageApi.recordAppointmentOutcome(appointment.id, "attended"))}>Attended</Button>}
          {can("missed") && <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => triageApi.recordAppointmentOutcome(appointment.id, "missed"))}>Missed</Button>}
          {can("reschedule") && <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode("reschedule")}>Reschedule</Button>}
          {can("cancel") && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode("cancel")}>Cancel</Button>}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </article>
  );
}
