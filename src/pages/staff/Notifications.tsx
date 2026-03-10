import { motion } from "framer-motion";
import { Bell, Mail, MessageSquare } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const mockNotifications = [
  { id: 1, recipient: "Ruth Mwenya", type: "SMS", message: "Your triage assessment is complete. Please visit the clinic by 11 March.", status: "Sent", sent_at: "2026-03-10 08:35" },
  { id: 2, recipient: "Dr. Chilufya", type: "Email", message: "New critical triage case #3 requires immediate review.", status: "Sent", sent_at: "2026-03-10 07:50" },
  { id: 3, recipient: "Joseph Banda", type: "SMS", message: "Appointment reminder: Tomorrow at 10:30 AM with Nurse Mutale.", status: "Pending", sent_at: "2026-03-10 18:00" },
  { id: 4, recipient: "Grace Phiri", type: "Email", message: "Your referral to UTH has been accepted. Ref #R001.", status: "Failed", sent_at: "2026-03-10 09:10" },
];

const statusColors: Record<string, string> = {
  Sent: "bg-safe/10 text-safe",
  Pending: "bg-warning/10 text-warning",
  Failed: "bg-destructive/10 text-destructive",
};

const Notifications = () => (
  <div className="min-h-screen bg-background py-10">
    <div className="mx-auto max-w-6xl px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
        <Bell className="h-6 w-6 text-primary" /> Notifications
      </h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockNotifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {n.type === "SMS" ? <MessageSquare className="h-4 w-4 text-info" /> : <Mail className="h-4 w-4 text-primary" />}
                    <span className="text-sm">{n.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">{n.recipient}</TableCell>
                <TableCell className="max-w-[300px] text-xs text-muted-foreground truncate">{n.message}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[n.status]}`}>
                    {n.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{n.sent_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  </div>
);

export default Notifications;
