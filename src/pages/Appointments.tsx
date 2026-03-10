import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Clock, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type Appointment = {
  appointment_id: number;
  patient_name: string;
  staff_name: string;
  facility: string;
  appointment_date: string;
  status: string;
};

const mockAppointments: Appointment[] = [
  { appointment_id: 1, patient_name: "Ruth Mwenya", staff_name: "Dr. Chilufya", facility: "Kabwata Clinic", appointment_date: "2026-03-11 09:00", status: "Scheduled" },
  { appointment_id: 2, patient_name: "Joseph Banda", staff_name: "Nurse Mutale", facility: "Kabwata Clinic", appointment_date: "2026-03-11 10:30", status: "Scheduled" },
  { appointment_id: 3, patient_name: "Grace Phiri", staff_name: "Dr. Mwanza", facility: "UTH", appointment_date: "2026-03-10 14:00", status: "Completed" },
  { appointment_id: 4, patient_name: "David Tembo", staff_name: "Dr. Chilufya", facility: "Kabwata Clinic", appointment_date: "2026-03-12 08:00", status: "Scheduled" },
  { appointment_id: 5, patient_name: "Mary Zulu", staff_name: "CO Moonga", facility: "Kabwata Clinic", appointment_date: "2026-03-09 11:00", status: "Cancelled" },
];

const statusStyle: Record<string, string> = {
  Scheduled: "bg-info/10 text-info",
  Completed: "bg-safe/10 text-safe",
  Cancelled: "bg-destructive/10 text-destructive",
};

const Appointments = () => {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? mockAppointments : mockAppointments.filter((a) => a.status === filter);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" /> Appointments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage clinic appointment schedule</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Appointment
          </Button>
        </div>

        <div className="mb-4 flex gap-2">
          {["All", "Scheduled", "Completed", "Cancelled"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {s}
            </Button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Clinician</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.appointment_id}>
                  <TableCell className="font-medium text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" /> {a.patient_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.staff_name}</TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.facility}</TableCell>
                  <TableCell className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{a.appointment_date}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[a.status]}`}>
                      {a.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  );
};

export default Appointments;
