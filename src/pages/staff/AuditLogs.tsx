import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const mockLogs = [
  { log_id: 1, user: "Dr. Chilufya", role: "Staff", action: "User Logged In", ip: "192.168.1.100", timestamp: "2026-03-10 07:30" },
  { log_id: 2, user: "Admin Banda", role: "Admin", action: "Viewed Patient Records", ip: "192.168.1.101", timestamp: "2026-03-10 07:35" },
  { log_id: 3, user: "Dr. Chilufya", role: "Staff", action: "Completed Triage #2", ip: "192.168.1.100", timestamp: "2026-03-10 09:20" },
  { log_id: 4, user: "Nurse Mutale", role: "Staff", action: "Created Appointment #2", ip: "192.168.1.102", timestamp: "2026-03-10 09:45" },
  { log_id: 5, user: "Admin Banda", role: "Admin", action: "Generated Monthly Report", ip: "192.168.1.101", timestamp: "2026-03-10 10:00" },
  { log_id: 6, user: "Dr. Mwanza", role: "Staff", action: "Referred Patient #3 to UTH", ip: "192.168.1.103", timestamp: "2026-03-10 08:05" },
];

const AuditLogs = () => (
  <div className="min-h-screen bg-background py-10">
    <div className="mx-auto max-w-6xl px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" /> Audit Logs
      </h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockLogs.map((log) => (
              <TableRow key={log.log_id}>
                <TableCell className="font-medium">{log.log_id}</TableCell>
                <TableCell className="font-medium text-foreground">{log.user}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    log.role === "Admin" ? "bg-accent/10 text-accent-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {log.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{log.action}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  </div>
);

export default AuditLogs;
