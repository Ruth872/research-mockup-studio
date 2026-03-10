import { motion } from "framer-motion";
import { FileText, CheckCircle } from "lucide-react";

const mockHistory = [
  { id: 1, date: "2026-03-08", symptoms: "Fever, Cough", severity: "Moderate", priority: "Orange", action: "Same-Day Visit", status: "Completed" },
  { id: 2, date: "2026-02-20", symptoms: "Headache, Fatigue", severity: "Mild", priority: "Green", action: "Home Care Advice", status: "Closed" },
  { id: 3, date: "2026-01-15", symptoms: "Back pain", severity: "Mild", priority: "Green", action: "Routine Appointment", status: "Completed" },
];

const priorityColors: Record<string, string> = {
  Red: "border-urgent bg-urgent/5",
  Orange: "border-warning bg-warning/5",
  Yellow: "border-accent bg-accent/5",
  Green: "border-safe bg-safe/5",
};

const TriageHistory = () => (
  <div className="min-h-screen bg-background py-10">
    <div className="mx-auto max-w-3xl px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" /> Triage History
      </h1>

      <div className="space-y-4">
        {mockHistory.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl border-2 p-5 ${priorityColors[item.priority]}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{item.date}</p>
                <p className="mt-1 font-heading font-semibold text-foreground">{item.symptoms}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Severity: <span className="font-medium">{item.severity}</span> · Priority: <span className="font-medium">{item.priority}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Recommendation: {item.action}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-safe/10 px-2.5 py-0.5 text-xs font-semibold text-safe">
                <CheckCircle className="h-3.5 w-3.5" /> {item.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default TriageHistory;
