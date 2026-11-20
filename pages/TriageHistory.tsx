import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, FileText, Loader2, MessageSquare, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CaseChat from "@/components/CaseChat";
import { triageApi, type TriageCase } from "@/lib/triageApi";

const urgencyStyles: Record<string, string> = {
  High: "border-red-300 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20",
  Medium: "border-amber-300 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20",
  Low: "border-emerald-300 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
  "Doctor review": "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900",
};

const statusLabels: Record<TriageCase["status"], string> = {
  pending: "Pending review",
  assigned: "Assigned",
  in_review: "In review",
  closed: "Closed",
};

const TriageHistory = () => {
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatCase, setChatCase] = useState<TriageCase | null>(null);

  const loadCases = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const result = await triageApi.getCases();
      setCases(result.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your assessments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
    // Pick up status changes and new clinician messages.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") loadCases(true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadCases]);

  const clearUnread = useCallback((caseId: string) => {
    setCases((current) => current.map((c) => (c.case_id === caseId ? { ...c, unread_messages: 0 } : c)));
  }, []);

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> My Assessments
          </h1>
          <Button variant="outline" size="sm" onClick={() => loadCases()} disabled={loading} aria-label="Refresh assessments">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</span>
            <Button variant="ghost" size="sm" onClick={() => loadCases()}>Retry</Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading assessments
          </div>
        ) : cases.length === 0 ? (
          <div className="border-y border-border py-12 text-center text-sm text-muted-foreground">
            <p>No assessments have been submitted from this account.</p>
            <Button asChild size="sm" className="mt-4"><Link to="/triage">Start a symptom check</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((item, index) => (
              <motion.article
                key={item.case_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-lg border p-4 sm:p-5 ${urgencyStyles[item.urgency] || urgencyStyles["Doctor review"]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{item.case_id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="mt-2 font-semibold capitalize text-foreground">{item.symptoms.join(", ")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reported severity: {item.severity} · Duration: {item.duration}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-2 text-sm sm:w-auto sm:flex-col sm:items-end sm:gap-0">
                    <p className="font-semibold text-foreground">{item.urgency}</p>
                    <span className="text-muted-foreground sm:hidden" aria-hidden>·</span>
                    <p className="text-muted-foreground">{statusLabels[item.status]}</p>
                  </div>
                </div>
                {item.free_text && <p className="mt-3 break-words border-t border-border/70 pt-3 text-sm text-muted-foreground">Your description: {item.free_text}</p>}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">Preliminary assessment only. A clinician determines care and disposition.</p>
                  <Button variant={item.unread_messages ? "default" : "outline"} size="sm" onClick={() => setChatCase(item)} className="gap-1.5">
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    {item.unread_messages ? `${item.unread_messages} new message${item.unread_messages > 1 ? "s" : ""}` : "Messages"}
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!chatCase} onOpenChange={(open) => !open && setChatCase(null)}>
        {chatCase && (
          <DialogContent className="max-w-lg p-4 sm:p-6">
            <DialogHeader className="pr-6 text-left">
              <DialogTitle>Messages about {chatCase.case_id}</DialogTitle>
              <DialogDescription>
                Submitted {new Date(chatCase.created_at).toLocaleString()} · {statusLabels[chatCase.status]}
              </DialogDescription>
            </DialogHeader>
            <CaseChat caseId={chatCase.case_id} onActivity={() => clearUnread(chatCase.case_id)} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default TriageHistory;
