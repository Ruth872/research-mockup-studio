import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const mockReferrals = [
  { referral_id: 1, triage_id: 3, patient: "Grace Phiri", referred_facility: "UTH - Emergency", reason: "Suspected cardiac event — chest pain + SOB", status: "Accepted", date: "2026-03-10 08:00" },
  { referral_id: 2, triage_id: 1, patient: "Ruth Mwenya", referred_facility: "Levy Mwanawasa Hospital", reason: "Persistent high fever with night sweats — rule out TB", status: "Pending", date: "2026-03-10 09:00" },
  { referral_id: 3, triage_id: 6, patient: "Peter Lungu", referred_facility: "Cancer Diseases Hospital", reason: "Unexplained weight loss and lymphadenopathy", status: "Completed", date: "2026-03-08 11:30" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-warning/10 text-warning",
  Accepted: "bg-info/10 text-info",
  Rejected: "bg-destructive/10 text-destructive",
  Completed: "bg-safe/10 text-safe",
};

const Referrals = () => (
  <div className="min-h-screen bg-background py-10">
    <div className="mx-auto max-w-6xl px-6">
      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
        <ArrowUpRight className="h-6 w-6 text-primary" /> Referrals
      </h1>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Referred To</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReferrals.map((r) => (
              <TableRow key={r.referral_id}>
                <TableCell className="font-medium">#{r.referral_id}</TableCell>
                <TableCell className="font-medium text-foreground">{r.patient}</TableCell>
                <TableCell className="text-muted-foreground">{r.referred_facility}</TableCell>
                <TableCell className="max-w-[250px] text-xs text-muted-foreground">{r.reason}</TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{r.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  </div>
);

export default Referrals;
