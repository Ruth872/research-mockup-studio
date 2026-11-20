import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CalendarDays, Loader2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPlace, formatWhen, isOpen, PATIENT_STATUS_LABELS, STATUS_TONES } from "@/lib/appointments";
import { triageApi, type Appointment } from "@/lib/triageApi";

function PatientAppointmentItem({ appointment, onChanged }: { appointment: Appointment; onChanged: (a: Appointment) => void }) {
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const can = (action: Appointment["actions"][number]) => appointment.actions.includes(action);

  const run = async (action: () => Promise<Appointment>) => {
    setBusy(true);
    setError(null);
    try {
      onChanged(await action());
      setMode("view");
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your answer could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const highlight = appointment.status === "proposed" && can("confirm");

  return (
    <article className={`rounded-2xl border p-4 space-y-2 ${highlight ? "border-2 border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <CalendarClock className="h-5 w-5 flex-shrink-0 text-primary" aria-hidden /> {formatWhen(appointment.scheduled_at)}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[appointment.status]}`}>{PATIENT_STATUS_LABELS[appointment.status]}</span>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {appointment.kind === "phone" ? <Phone className="h-4 w-4" aria-hidden /> : <MapPin className="h-4 w-4" aria-hidden />}
        {appointment.kind === "phone" ? "The clinic will phone you" : formatPlace(appointment)} · {appointment.duration_minutes} min
        {appointment.clinician_name && ` · with ${appointment.clinician_name}`}
      </p>
      {appointment.notes_for_patient && <p className="text-sm text-foreground">Note from the clinic: {appointment.notes_for_patient}</p>}
      {appointment.status === "cancelled" && appointment.cancel_reason && <p className="text-xs text-muted-foreground">Cancelled: {appointment.cancel_reason}</p>}
      <p className="text-xs text-muted-foreground">For assessment {appointment.case_id}</p>

      {mode === "reschedule" && (
        <div className="space-y-2">
          <label htmlFor={`reschedule-${appointment.id}`} className="block text-xs font-semibold text-foreground">Which days or times suit you better?</label>
          <textarea id={`reschedule-${appointment.id}`} rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Any afternoon next week"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy || !text.trim()} onClick={() => run(() => triageApi.requestReschedule(appointment.id, text.trim()))}>Send request</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Back</Button>
          </div>
        </div>
      )}

      {mode === "cancel" && (
        <div className="space-y-2">
          <label htmlFor={`cancel-${appointment.id}`} className="block text-xs font-semibold text-foreground">Why are you cancelling?</label>
          <input id={`cancel-${appointment.id}`} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. I am feeling better"
            className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" disabled={busy || !text.trim()} onClick={() => run(() => triageApi.cancelAppointment(appointment.id, text.trim()))}>Cancel appointment</Button>
            <Button size="sm" variant="ghost" onClick={() => setMode("view")}>Back</Button>
          </div>
        </div>
      )}

      {mode === "view" && appointment.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {can("confirm") && <Button size="sm" disabled={busy} onClick={() => run(() => triageApi.confirmAppointment(appointment.id))}>Confirm</Button>}
          {can("request_reschedule") && <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode("reschedule")}>Ask for another time</Button>}
          {can("cancel") && <Button size="sm" variant="ghost" disabled={busy} onClick={() => setMode("cancel")}>Cancel</Button>}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </article>
  );
}

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setAppointments((await triageApi.getMyAppointments()).appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your appointments could not be loaded.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (updated: Appointment) =>
    setAppointments((current) => (current ?? []).map((a) => (a.id === updated.id ? updated : a)));

  const now = Date.now();
  const upcoming = (appointments ?? [])
    .filter((a) => isOpen(a) && new Date(a.scheduled_at).getTime() > now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const earlier = (appointments ?? []).filter((a) => !upcoming.includes(a));

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
        <header>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
            <CalendarDays className="h-7 w-7 text-primary" aria-hidden /> My Appointments
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Follow-up appointments booked by your clinician. Please confirm, or ask for another time if it does not suit you.
          </p>
        </header>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={load}>Try again</Button>
          </div>
        ) : !appointments ? (
          <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading appointments…</p>
        ) : (
          <>
            <section aria-labelledby="upcoming-heading" className="space-y-3">
              <h2 id="upcoming-heading" className="font-heading text-lg font-semibold text-foreground">Upcoming</h2>
              {upcoming.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No upcoming appointments. If a clinician needs to see you, the appointment will appear here.
                </p>
              ) : (
                upcoming.map((appointment) => <PatientAppointmentItem key={appointment.id} appointment={appointment} onChanged={replace} />)
              )}
            </section>
            {earlier.length > 0 && (
              <section aria-labelledby="earlier-heading" className="space-y-3">
                <h2 id="earlier-heading" className="font-heading text-lg font-semibold text-foreground">Earlier and cancelled</h2>
                {earlier.map((appointment) => <PatientAppointmentItem key={appointment.id} appointment={appointment} onChanged={replace} />)}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
