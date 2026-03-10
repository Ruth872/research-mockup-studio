import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const mockAlgoLogs = [
  { id: 1, triage_id: 1, version: "RF-v1.2", risk_score: 85, confidence: 92.5, processed_at: "2026-03-10 08:30" },
  { id: 2, triage_id: 2, version: "RF-v1.2", risk_score: 25, confidence: 88.0, processed_at: "2026-03-10 09:15" },
  { id: 3, triage_id: 3, version: "RF-v1.2", risk_score: 95, confidence: 96.3, processed_at: "2026-03-10 07:45" },
  { id: 4, triage_id: 4, version: "RF-v1.2", risk_score: 55, confidence: 78.1, processed_at: "2026-03-10 10:00" },
  { id: 5, triage_id: 5, version: "RF-v1.2", risk_score: 45, confidence: 82.7, processed_at: "2026-03-09 14:30" },
];

function riskColor(score: number) {
  if (score >= 80) return "text-urgent";
  if (score >= 50) return "text-warning";
  return "text-safe";
}

const AlgorithmLogs = () => (
  <div className="min-h-screen bg-background py-10">
    <div className="mx-auto max-w-5xl px-6">
      <h1 className="mb-2 font-heading text-2xl font-bold text-foreground flex items-center gap-2">
        <Cpu className="h-6 w-6 text-primary" /> Triage Algorithm Logs
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">RandomForest classifier v1.2 performance tracking</p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Triage #</TableHead>
              <TableHead>Algorithm</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Processed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAlgoLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">#{log.triage_id}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.version}</TableCell>
                <TableCell>
                  <span className={`font-bold ${riskColor(log.risk_score)}`}>{log.risk_score}</span>
                  <span className="text-muted-foreground">/100</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-border">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${log.confidence}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{log.confidence}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{log.processed_at}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  </div>
);

export default AlgorithmLogs;
