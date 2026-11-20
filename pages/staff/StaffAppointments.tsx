import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffAppointmentItem from "@/components/StaffAppointmentItem";
import { dayHeading, localDay } from "@/lib/appointments";
import { triageApi, type Appointment } from "@/lib/triageApi";

type View = "today" | "week" | "attention" | "past";

const VIEWS: Array<{ key: View; label: string }> = [
  { key: "today", label: "Today" },
  { key: "week", label: "Next 7 days" },
  { key: "attention", label: "Needs attention" },
  { key: "past", label: "Past 30 days" },
];

const EMPTY: Record<View, string> = {
  today: "No appointments today.",
  week: "No appointments in the next 7 days.",
  attention: "Nothing needs attention: no requests for another time and no visits waiting for an outcome.",
  past: "No appointments in the past 30 days.",
};

async function fetchView(view: View, scope: "mine" | "all"): Promise<Appointment[]> {
  const now = new Date().toISOString();
  if (view === "today") return (await triageApi.getAppointments({ ...localDay(0), scope })).appointments;
  if (view === "week") return (await triageApi.getAppointments({ start: localDay(0).start, end: localDay(7).start, scope })).appointments;
  if (view === "past") {
    const list = (await triageApi.getAppointments({ start: localDay(-30).start, end: now, scope })).appointments;
    return list.reverse();
  }
  // Patients asking for another time, and visits that have started but have no outcome yet.
  const [requests, unrecorded] = await Promise.all([
    triageApi.getAppointments({ scope, status: ["reschedule_requested"] }),
    triageApi.getAppointments({ scope, end: now, status: ["proposed", "confirmed"] }),
  ]);
  return [...requests.appointments, ...unrecorded.appointments].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}

export default function StaffAppointments() {
  const [view, setView] = useState<View>("today");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAppointments(await fetchView(view, scope));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Appointments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [view, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (updated: Appointment) =>
    setAppointments((current) => (current ?? []).map((a) => (a.id === updated.id ? updated : a)));

  const groups = (appointments ?? []).reduce<Array<{ day: string; items: Appointment[] }>>((acc, appointment) => {
    const day = dayHeading(appointment.scheduled_at);
    const last = acc.at(-1);
    if (last?.day === day) last.items.push(appointment);
    else acc.push({ day, items: [appointment] });
    return acc;
  }, []);

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-5 px-4 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
              <CalendarDays className="h-7 w-7 text-primary" aria-hidden /> Appointments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Follow-ups booked from cases. Book a new one from a case in the triage queue.</p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> Refresh
          </Button>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Which appointments" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:flex">
            {VIEWS.map(({ key, label }) => (
              <button key={key} role="tab" type="button" aria-selected={view === key} onClick={() => setView(key)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${view === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="appointment-scope" className="text-xs font-semibold text-muted-foreground">Show</label>
            <select id="appointment-scope" value={scope} onChange={(e) => setScope(e.target.value as "mine" | "all")} className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm sm:flex-none">
              <option value="mine">Mine</option>
              <option value="all">Everyone's</option>
            </select>
          </div>
        </div>

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={load}>Try again</Button>
          </div>
        ) : !appointments ? (
          <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{EMPTY[view]}</p>
        ) : (
          groups.map((group) => (
            <section key={group.day} aria-label={group.day} className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.day}</h2>
              {group.items.map((appointment) => (
                <StaffAppointmentItem key={appointment.id} appointment={appointment} onChanged={replace} showPatient />
              ))}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
