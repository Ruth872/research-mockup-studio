import { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Eye,
  RefreshCw,
  Activity,
  ShieldAlert,
  MessageSquare,
  FileHeart,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { triageApi, type TriageCase } from "@/lib/triageApi";
import CaseReviewPanel from "@/components/CaseReviewPanel";
import CaseChat from "@/components/CaseChat";
import IntakeSummary from "@/components/IntakeSummary";
import CaseRecordTab from "@/components/CaseRecordTab";
import CaseAppointments from "@/components/CaseAppointments";

type Urgency = TriageCase["urgency"];

const POLL_MS = 12000;
const SEARCH_DEBOUNCE_MS = 350;

const URGENCY_BADGE: Record<Urgency, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300",
  Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300",
  "Doctor review": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300",
};

const URGENCY_BAR: Record<Urgency, string> = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
  "Doctor review": "bg-slate-400",
};

const STATUS_LABEL: Record<TriageCase["status"], string> = {
  pending: "Pending review",
  assigned: "Assigned",
  in_review: "In review",
  closed: "Closed",
};

const STATUS_BADGE: Record<TriageCase["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  assigned: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
  in_review: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  closed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function UrgencyIcon({ urgency, className = "w-3.5 h-3.5" }: { urgency: Urgency; className?: string }) {
  if (urgency === "High") return <AlertTriangle className={`${className} text-red-600`} />;
  if (urgency === "Medium") return <Clock className={`${className} text-amber-600`} />;
  if (urgency === "Doctor review") return <Eye className={`${className} text-slate-600`} />;
  return <CheckCircle className={`${className} text-emerald-600`} />;
}

function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${URGENCY_BADGE[urgency]}`}>
      <UrgencyIcon urgency={urgency} />
      {urgency}
    </span>
  );
}

function StatusBadge({ status }: { status: TriageCase["status"] }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_BADGE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
      <MessageSquare className="h-3 w-3" aria-hidden />
      {count} new
    </span>
  );
}

/** Facts a clinician should see before opening the case. */
function IntakeBadges({ c }: { c: TriageCase }) {
  const health = c.intake?.health;
  const visit = c.intake?.visit;
  const badges: Array<{ label: string; tone: string }> = [];
  if (visit?.danger_signs.length) badges.push({ label: "Child danger sign", tone: "bg-red-600 text-white" });
  if (health?.allergy_status === "has_allergies") {
    badges.push({ label: `Allergy: ${health.allergies.map((a) => a.substance).join(", ")}`, tone: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300" });
  }
  if (visit?.pregnant === "yes") badges.push({ label: "Pregnant", tone: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300" });
  if (!badges.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {badges.map((badge) => (
        <span key={badge.label} className={`max-w-[16rem] truncate rounded px-1.5 py-0.5 text-[11px] font-semibold ${badge.tone}`}>{badge.label}</span>
      ))}
    </div>
  );
}

function patientLine(c: TriageCase) {
  return [c.age != null ? `${c.age} yrs` : null, c.gender, c.duration].filter(Boolean).join(" • ");
}

export default function DoctorDashboard() {
  const isMobile = useIsMobile();

  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters. Urgency is applied in the browser so the summary counts always cover every urgency.
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Selected case for detailed modal
  const [selectedCase, setSelectedCase] = useState<TriageCase | null>(null);

  // Only the latest request may update the list, so a slow response cannot overwrite newer filters.
  const requestId = useRef(0);
  // A case to open on arrival, e.g. /staff/triage?case=CASE-12 from the appointments page.
  const caseToOpen = useRef(new URLSearchParams(window.location.search).get("case"));

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const fetchCases = useCallback(async (background = false) => {
    const id = ++requestId.current;
    if (!background) setLoading(true);
    try {
      const res = await triageApi.getCases({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search || undefined,
      });
      if (id !== requestId.current) return;
      setCases(res.cases);
      setError(null);
      // Keep an open case in step with changes made by other clinicians.
      setSelectedCase((open) => (open ? res.cases.find((c) => c.case_id === open.case_id) ?? open : open));
      const wanted = caseToOpen.current;
      if (wanted) {
        caseToOpen.current = null;
        const listed = res.cases.find((c) => c.case_id === wanted);
        if (listed) setSelectedCase(listed);
        else triageApi.getCase(wanted).then((detail) => setSelectedCase(detail.case)).catch(() => undefined);
      }
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to load triage cases from API.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCases();
    // Poll for new patient cases without flashing the loading state.
    const interval = setInterval(() => fetchCases(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchCases]);

  const handleCaseUpdated = (updated: TriageCase) => {
    setSelectedCase(updated);
    setCases(prev => prev.map(c => c.case_id === updated.case_id ? updated : c));
  };

  // Opening the conversation marks the patient's messages as read.
  const clearUnread = useCallback((caseId: string) => {
    setCases(prev => prev.map(c => c.case_id === caseId ? { ...c, unread_messages: 0 } : c));
    setSelectedCase(open => open && open.case_id === caseId ? { ...open, unread_messages: 0 } : open);
  }, []);

  const count = (urgency: Urgency) => cases.filter(c => c.urgency === urgency).length;
  const visibleCases = urgencyFilter === "all" ? cases : cases.filter(c => c.urgency === urgencyFilter);

  const summaryCards: Array<{
    key: Urgency | "all";
    label: string;
    hint: string;
    value: number;
    active: string;
    idle: string;
    valueTone: string;
  }> = [
    {
      key: "all",
      label: "All cases",
      hint: "Sorted by urgency",
      value: cases.length,
      active: "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md ring-2 ring-primary",
      idle: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-slate-300",
      valueTone: "",
    },
    {
      key: "High",
      label: "High urgency",
      hint: "Immediate response",
      value: count("High"),
      active: "border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/20 ring-2 ring-red-400",
      idle: "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200 hover:border-red-300",
      valueTone: "text-red-600 dark:text-red-400",
    },
    {
      key: "Medium",
      label: "Medium urgency",
      hint: "Scheduled assessment",
      value: count("Medium"),
      active: "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/20 ring-2 ring-amber-300",
      idle: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 hover:border-amber-300",
      valueTone: "text-amber-600 dark:text-amber-400",
    },
    {
      key: "Low",
      label: "Low urgency",
      hint: "Home supportive care",
      value: count("Low"),
      active: "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-300",
      idle: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 hover:border-emerald-300",
      valueTone: "text-emerald-600 dark:text-emerald-400",
    },
    {
      key: "Doctor review",
      label: "Doctor review",
      hint: "Model could not rate",
      value: count("Doctor review"),
      active: "border-slate-500 bg-slate-700 text-white shadow-md ring-2 ring-slate-400",
      idle: "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-400",
      valueTone: "",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Activity className="w-3.5 h-3.5" /> Clinical Triage Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Triage Queue
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Submitted patient assessments, ordered by the model's preliminary urgency. Updates every {POLL_MS / 1000} seconds.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCases()}
            disabled={loading}
            className="self-start sm:self-auto rounded-xl border-slate-200 dark:border-slate-800 gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {/* Urgency Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {summaryCards.map((card) => {
            const isActive = urgencyFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setUrgencyFilter(card.key)}
                className={`text-left p-4 sm:p-5 rounded-2xl border transition-all ${card.key === "all" ? "col-span-2 sm:col-span-1" : ""} ${isActive ? card.active : card.idle}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold">{card.label}</span>
                  {card.key !== "all" && <UrgencyIcon urgency={card.key} className="w-4 h-4 flex-shrink-0" />}
                </div>
                <div className={`text-2xl sm:text-3xl font-black mt-1 sm:mt-2 ${isActive ? "" : card.valueTone}`}>{card.value}</div>
                <div className="text-xs mt-1 opacity-75 hidden sm:block">{card.hint}</div>
              </button>
            );
          })}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              aria-label="Search cases"
              placeholder="Search by patient or Case ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="status-filter" className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 sm:h-9 flex-1 sm:flex-none px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-background text-sm sm:text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending review</option>
              <option value="assigned">Assigned</option>
              <option value="in_review">In review</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Case List: cards on phones, a table on wider screens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 p-4 bg-red-50 text-red-700 border-b border-red-200 text-sm">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => fetchCases()}>Try again</Button>
            </div>
          )}

          {loading && cases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Loading incoming cases...
            </div>
          ) : visibleCases.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold">No cases match the selected filters.</p>
              <p className="text-xs text-slate-400 mt-1">New patient assessments appear here automatically.</p>
            </div>
          ) : isMobile ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleCases.map((c) => (
                <li key={c.case_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCase(c)}
                    className={`w-full text-left p-4 space-y-2.5 transition-colors active:bg-slate-100 dark:active:bg-slate-800 ${c.urgency === "High" ? "bg-red-50/30 dark:bg-red-950/10" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <UrgencyBadge urgency={c.urgency} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                        {c.patient_name} <UnreadBadge count={c.unread_messages} />
                      </div>
                      <div className="text-xs text-slate-500">{patientLine(c)}</div>
                      <IntakeBadges c={c} />
                    </div>
                    {c.symptoms.length > 0 && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 capitalize line-clamp-2">{c.symptoms.join(", ")}</p>
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold">{c.case_id}</span>
                      <span>{c.assigned_doctor ?? "Unassigned"}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Urgency & Case ID</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Detected Symptoms</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">AI Prediction</th>
                    <th className="py-3.5 px-4 hidden xl:table-cell">Model score*</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleCases.map((c) => (
                    <tr
                      key={c.case_id}
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                        c.urgency === "High" ? "bg-red-50/20 dark:bg-red-950/10" : ""
                      }`}
                    >
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1 xl:flex-row xl:items-center xl:gap-2">
                          <UrgencyBadge urgency={c.urgency} />
                          <span className="font-mono text-xs font-semibold text-slate-500">{c.case_id}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{c.patient_name}</div>
                        <div className="text-xs text-slate-500">{patientLine(c)}</div>
                        <IntakeBadges c={c} />
                        <div className="mt-1"><UnreadBadge count={c.unread_messages} /></div>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {c.symptoms.length > 0 ? (
                            c.symptoms.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">None tagged</span>
                          )}
                          {c.symptoms.length > 3 && (
                            <span className="text-[11px] text-slate-400 font-semibold">+{c.symptoms.length - 3} more</span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden lg:table-cell">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{c.condition_category}</div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${URGENCY_BAR[c.urgency]}`}
                              style={{ width: `${Math.min(c.confidence, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{Math.round(c.confidence)}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={c.status} />
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCase(c)}
                          className="rounded-lg text-xs h-8 px-2.5 font-medium border-slate-300 dark:border-slate-700 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          *Model score is an unvalidated confidence figure from the triage model. A clinician determines the next action.
        </p>
      </div>

      {/* --- Case Detail Modal --- */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        {selectedCase && (
          <DialogContent className="max-w-2xl rounded-2xl p-5 sm:p-8">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2 pr-6 mb-2">
                <span className="font-mono text-xs font-bold text-slate-500 uppercase">
                  {selectedCase.case_id}
                </span>
                <UrgencyBadge urgency={selectedCase.urgency} />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {selectedCase.patient_name}
                <span className="block text-sm font-medium text-slate-500 mt-1">{patientLine(selectedCase)}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Submitted on {new Date(selectedCase.created_at).toLocaleString()} · Reported severity: {selectedCase.severity}
              </DialogDescription>
            </DialogHeader>

            <Tabs key={selectedCase.case_id} defaultValue="review" className="my-2 sm:my-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="review" className="px-1 sm:px-3">Review</TabsTrigger>
                <TabsTrigger value="messages" className="gap-1.5 px-1 sm:px-3">
                  <MessageSquare className="hidden h-4 w-4 sm:block" aria-hidden /> Messages
                  {selectedCase.unread_messages > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">{selectedCase.unread_messages}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="record" className="gap-1.5 px-1 sm:px-3">
                  <FileHeart className="hidden h-4 w-4 sm:block" aria-hidden /> Record
                </TabsTrigger>
                <TabsTrigger value="visits" className="gap-1.5 px-1 sm:px-3">
                  <CalendarDays className="hidden h-4 w-4 sm:block" aria-hidden /> Visits
                </TabsTrigger>
              </TabsList>
              <TabsContent value="visits" className="mt-4">
                <CaseAppointments caseItem={selectedCase} />
              </TabsContent>
              <TabsContent value="record" className="mt-4">
                <CaseRecordTab caseId={selectedCase.case_id} />
              </TabsContent>
              <TabsContent value="messages" className="mt-4">
                <CaseChat caseId={selectedCase.case_id} onActivity={() => clearUnread(selectedCase.case_id)} />
              </TabsContent>
              <TabsContent value="review" className="mt-4 space-y-5">
                {selectedCase.is_emergency && (
                  <div className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Emergency symptom reported</strong>
                      The patient reported a danger sign. Ensure the patient is routed for immediate evaluation or urgent transfer.
                    </div>
                  </div>
                )}
  
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Health Background (reported by the patient)
                  </span>
                  <IntakeSummary intake={selectedCase.intake} />
                </div>

                {selectedCase.free_text && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Patient's Reported Words
                    </span>
                    <p className="text-sm italic text-slate-700 dark:text-slate-300 break-words">
                      "{selectedCase.free_text}"
                    </p>
                  </div>
                )}
  
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                    Symptoms Profile
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.symptoms.map((s, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs capitalize font-medium py-1 px-2.5">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
  
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      AI Clinical Category
                    </span>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {selectedCase.condition_category}
                    </div>
                    <div className="text-xs text-primary font-semibold mt-1">
                      Unvalidated model score: {Math.round(selectedCase.confidence)}%
                    </div>
                  </div>
  
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/20">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Recommended Triage Action
                    </span>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Preliminary model urgency only. A clinician must determine the next action.
                    </div>
                  </div>
                </div>
  
                <CaseReviewPanel caseItem={selectedCase} onCaseUpdated={handleCaseUpdated} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => setSelectedCase(null)}
                className="w-full sm:w-auto rounded-xl text-xs"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
