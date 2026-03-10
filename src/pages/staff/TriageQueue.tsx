import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type TriageRecord = {
  triage_id: number;
  patient_name: string;
  triage_mode: string;
  symptoms: string;
  symptom_duration: string;
  severity_level: string;
  priority_level: string;
  recommended_action: string;
  status: string;
  triage_datetime: string;
};

const mockRecords: TriageRecord[] = [
  { triage_id: 1, patient_name: "Ruth Mwenya", triage_mode: "Web", symptoms: "Fever, Cough, Night sweats", symptom_duration: "3 days", severity_level: "Severe", priority_level: "Red", recommended_action: "Emergency Referral", status: "Pending", triage_datetime: "2026-03-10 08:30" },
  { triage_id: 2, patient_name: "Joseph Banda", triage_mode: "Mobile App", symptoms: "Headache, Fatigue", symptom_duration: "1 day", severity_level: "Mild", priority_level: "Green", recommended_action: "Home Care Advice", status: "Completed", triage_datetime: "2026-03-10 09:15" },
  { triage_id: 3, patient_name: "Grace Phiri", triage_mode: "Web", symptoms: "Chest pain, Shortness of breath", symptom_duration: "2 days", severity_level: "Critical", priority_level: "Red", recommended_action: "Emergency Referral", status: "Referred", triage_datetime: "2026-03-10 07:45" },
  { triage_id: 4, patient_name: "David Tembo", triage_mode: "SMS", symptoms: "Diarrhoea, Abdominal pain", symptom_duration: "5 days", severity_level: "Moderate", priority_level: "Orange", recommended_action: "Same-Day Visit", status: "Pending", triage_datetime: "2026-03-10 10:00" },
  { triage_id: 5, patient_name: "Mary Zulu", triage_mode: "Phone", symptoms: "Back pain, Joint pain", symptom_duration: "1 week", severity_level: "Moderate", priority_level: "Yellow", recommended_action: "Routine Appointment", status: "Pending", triage_datetime: "2026-03-09 14:30" },
];

const priorityColors: Record<string, string> = {
  Red: "bg-urgent/10 text-urgent border-urgent/30",
  Orange: "bg-warning/10 text-warning border-warning/30",
  Yellow: "bg-accent/10 text-accent-foreground border-accent/30",
  Green: "bg-safe/10 text-safe border-safe/30",
};

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Completed: "bg-safe/10 text-safe",
  Referred: "bg-info/10 text-info",
  Closed: "bg-muted text-muted-foreground",
};

const TriageQueue = () => {
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? mockRecords : mockRecords.filter((r) => r.status === filter);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Triage Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{mockRecords.length} total assessments</p>
        </div>

        {/* Filters */}
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["All", "Pending", "Completed", "Referred", "Closed"].map((s) => (
            <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
              {s}
            </Button>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.triage_id}>
                  <TableCell className="font-medium">#{r.triage_id}</TableCell>
                  <TableCell className="font-medium text-foreground">{r.patient_name}</TableCell>
                  <TableCell className="text-muted-foreground">{r.triage_mode}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.symptoms}</TableCell>
                  <TableCell className="text-muted-foreground">{r.symptom_duration}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityColors[r.priority_level]}`}>
                      {r.priority_level}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.recommended_action}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.triage_datetime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  );
};

export default TriageQueue;
