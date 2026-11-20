import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { localParts, toIso } from "@/lib/appointments";
import { triageApi, type Appointment, type AppointmentTime, type Clinician } from "@/lib/triageApi";

const DURATIONS: AppointmentTime["duration_minutes"][] = [15, 20, 30, 45, 60];
const DEFAULT_LOCATION = "Kabwata Clinic";

const labelClass = "mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300";
const inputClass = "w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

function tomorrowAtNine() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

interface AppointmentFormProps {
  /** Existing appointment when rescheduling. */
  initial?: Appointment;
  /** Pre-selected clinician for a new booking. */
  defaultClinicianId?: number | null;
  submitLabel: string;
  onSubmit: (body: AppointmentTime) => Promise<void>;
  onCancel: () => void;
}

/** Date, time, length, place and clinician for booking or moving an appointment. */
export default function AppointmentForm({ initial, defaultClinicianId, submitLabel, onSubmit, onCancel }: AppointmentFormProps) {
  const start = localParts(initial ? new Date(initial.scheduled_at) : tomorrowAtNine());
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [duration, setDuration] = useState<AppointmentTime["duration_minutes"]>((initial?.duration_minutes as AppointmentTime["duration_minutes"]) ?? 30);
  const [kind, setKind] = useState<AppointmentTime["kind"]>(initial?.kind ?? "in_person");
  const [location, setLocation] = useState(initial?.location ?? DEFAULT_LOCATION);
  const [notes, setNotes] = useState(initial?.notes_for_patient ?? "");
  const [clinicianId, setClinicianId] = useState<string>(String(initial?.clinician_id ?? defaultClinicianId ?? ""));
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    triageApi.listClinicians().then(setClinicians).catch(() => setClinicians([]));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const scheduledAt = toIso(date, time);
    if (!scheduledAt) return setError("Choose a date and time.");
    if (new Date(scheduledAt) <= new Date()) return setError("Choose a time in the future.");
    if (kind === "in_person" && !location.trim()) return setError("Say where the patient should come.");
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        kind,
        location: kind === "in_person" ? location.trim() : null,
        notes_for_patient: notes.trim() || null,
        clinician_id: clinicianId ? Number(clinicianId) : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The appointment could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="appt-date" className={labelClass}>Date</label>
          <input id="appt-date" type="date" min={localParts(new Date()).date} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="appt-time" className={labelClass}>Time</label>
          <input id="appt-time" type="time" step={300} value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="appt-duration" className={labelClass}>Length</label>
          <select id="appt-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value) as AppointmentTime["duration_minutes"])} className={inputClass}>
            {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}
          </select>
        </div>
      </div>

      <div role="group" aria-labelledby="appt-kind-label">
        <span id="appt-kind-label" className={labelClass}>Type</span>
        <div className="grid grid-cols-2 gap-2">
          {([["in_person", "In person"], ["phone", "Phone call"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)}
              className={`h-10 rounded-lg border text-sm font-semibold ${kind === value ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-slate-700 dark:text-slate-300"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {kind === "in_person" && (
          <div>
            <label htmlFor="appt-location" className={labelClass}>Where</label>
            <input id="appt-location" value={location} maxLength={200} onChange={(e) => setLocation(e.target.value)} className={inputClass} />
          </div>
        )}
        <div>
          <label htmlFor="appt-clinician" className={labelClass}>With</label>
          <select id="appt-clinician" value={clinicianId} onChange={(e) => setClinicianId(e.target.value)} className={inputClass}>
            <option value="">The assigned clinician (or me)</option>
            {clinicians.map((c) => <option key={c.id} value={c.id}>{c.full_name} ({c.role})</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="appt-notes" className={labelClass}>Note for the patient (optional)</label>
        <textarea id="appt-notes" rows={2} maxLength={1000} value={notes} placeholder="e.g. Bring your clinic card and current medicines." onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : submitLabel}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Back</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">The patient is asked to confirm the time.</p>
    </form>
  );
}
