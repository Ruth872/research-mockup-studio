import type { Appointment, AppointmentStatus } from "@/lib/triageApi";

export const STAFF_STATUS_LABELS: Record<AppointmentStatus, string> = {
  proposed: "Waiting for the patient to confirm",
  confirmed: "Confirmed",
  reschedule_requested: "Patient asked for another time",
  cancelled: "Cancelled",
  attended: "Attended",
  missed: "Missed",
};

export const PATIENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  proposed: "Please confirm",
  confirmed: "Confirmed",
  reschedule_requested: "You asked for another time",
  cancelled: "Cancelled",
  attended: "Attended",
  missed: "Missed",
};

export const STATUS_TONES: Record<AppointmentStatus, string> = {
  proposed: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  reschedule_requested: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  attended: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  missed: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
};

export const OPEN_STATUSES: AppointmentStatus[] = ["proposed", "confirmed", "reschedule_requested"];

export const isOpen = (appointment: Appointment) => OPEN_STATUSES.includes(appointment.status);

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatPlace(appointment: Appointment): string {
  return appointment.kind === "phone" ? "Phone call" : appointment.location || "In person at the clinic";
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Local date and time strings for <input type="date"> and <input type="time">. */
export function localParts(date: Date): { date: string; time: string } {
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

/** Combines local date and time inputs into an ISO time with an explicit offset (UTC). */
export function toIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const value = new Date(`${date}T${time}`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

/** Start and end (exclusive) of the local day, `offsetDays` from today. */
export function localDay(offsetDays = 0): { start: string; end: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offsetDays);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function dayHeading(iso: string): string {
  const day = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (day.toDateString() === today.toDateString()) return "Today";
  if (day.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return day.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}
