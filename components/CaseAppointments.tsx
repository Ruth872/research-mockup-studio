import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppointmentForm from "@/components/AppointmentForm";
import StaffAppointmentItem from "@/components/StaffAppointmentItem";
import { isOpen } from "@/lib/appointments";
import { triageApi, type Appointment, type TriageCase } from "@/lib/triageApi";

/** Follow-up appointments for one case, and booking a new one. */
export default function CaseAppointments({ caseItem }: { caseItem: TriageCase }) {
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const canBook = !!caseItem.can_book_appointment;

  const load = useCallback(async () => {
    setError(null);
    try {
      setAppointments((await triageApi.getCaseAppointments(caseItem.case_id)).appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Appointments could not be loaded.");
    }
  }, [caseItem.case_id]);

  useEffect(() => {
    load();
  }, [load]);

  const replace = (updated: Appointment) =>
    setAppointments((current) => (current ?? []).map((a) => (a.id === updated.id ? updated : a)));

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
        {error} <Button variant="outline" size="sm" className="ml-2" onClick={load}>Try again</Button>
      </div>
    );
  }
  if (!appointments) {
    return <p className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading appointments…</p>;
  }

  const hasOpen = appointments.some(isOpen);

  return (
    <div className="space-y-3">
      {booking ? (
        <AppointmentForm
          defaultClinicianId={caseItem.assigned_staff_id}
          submitLabel="Book appointment"
          onCancel={() => setBooking(false)}
          onSubmit={async (body) => {
            const created = await triageApi.bookAppointment(caseItem.case_id, body);
            setAppointments((current) => [created, ...(current ?? [])]);
            setBooking(false);
          }}
        />
      ) : canBook ? (
        <Button size="sm" onClick={() => setBooking(true)} className="gap-1.5">
          <CalendarPlus className="h-4 w-4" aria-hidden /> {hasOpen ? "Book another appointment" : "Book follow-up appointment"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Take the case to book a follow-up appointment.</p>
      )}

      {appointments.length === 0 ? (
        !booking && <p className="text-sm text-muted-foreground">No appointments for this case yet.</p>
      ) : (
        appointments.map((appointment) => <StaffAppointmentItem key={appointment.id} appointment={appointment} onChanged={replace} />)
      )}
    </div>
  );
}
