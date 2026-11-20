import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, CalendarCheck, CalendarClock, Clock, Download, Hourglass, Inbox, RefreshCw, ShieldAlert, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triageApi, type AnalyticsSummary } from "@/lib/triageApi";

const WINDOWS = [7, 14, 30, 90] as const;

const URGENCY_COLORS: Record<string, string> = {
  High: "hsl(var(--urgent))",
  Medium: "hsl(var(--warning))",
  Low: "hsl(var(--safe))",
  "Doctor review": "hsl(var(--muted-foreground))",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  in_review: "In review",
  closed: "Closed",
};

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 48) return `${hours.toFixed(1)} h`;
  return `${(hours / 24).toFixed(1)} days`;
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const hourLabel = (hour: number) => String(hour).padStart(2, "0");

function StatCard({ icon: Icon, label, value, hint, tone = "text-card-foreground" }: {
  icon: typeof Inbox;
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      <p className={`mt-3 font-heading text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="mb-4 font-heading text-sm font-semibold text-card-foreground">{title}</h2>
      {children}
    </section>
  );
}

const AnalyticsDashboard = () => {
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"cases" | "daily" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const download = async (kind: "cases" | "daily") => {
    setExporting(kind);
    setExportError(null);
    try {
      const { blob, filename } = await triageApi.exportAnalytics(kind, days);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "The export could not be downloaded.");
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await triageApi.getAnalytics(days);
      // An API started before the patient flow measures existed answers without them.
      if (!Array.isArray(summary.arrivals_by_hour) || !summary.waiting_by_urgency || !summary.appointments) {
        throw new Error("The API is running an older version. Restart it (npm run dev:api) and refresh this page.");
      }
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analytics could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const urgencyData = data
    ? Object.entries(data.by_urgency).map(([urgency, count]) => ({ urgency, count }))
    : [];
  const statusData = data
    ? Object.entries(data.by_status).map(([status, count]) => ({ status: STATUS_LABELS[status] ?? status, count }))
    : [];
  const dailyData = data
    ? data.daily.map((day) => ({ ...day, label: day.date.slice(5) }))
    : [];
  const hourData = data
    ? data.arrivals_by_hour.map((count, hour) => ({ hour: hourLabel(hour), count }))
    : [];
  const peak = data ? Math.max(...data.arrivals_by_hour) : 0;
  const busiestHour = data && peak > 0 ? data.arrivals_by_hour.indexOf(peak) : null;

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
              <BarChart3 className="h-6 w-6 text-primary" aria-hidden /> Patient Flow Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Computed from live cases. Days and hours are clinic time{data ? ` (${data.timezone})` : ""}.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <label htmlFor="window" className="text-xs text-muted-foreground">Period</label>
            <select
              id="window"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
            >
              {WINDOWS.map((option) => (
                <option key={option} value={option}>Last {option} days</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => download("cases")} disabled={exporting !== null}>
              <Download className="mr-2 h-4 w-4" aria-hidden /> {exporting === "cases" ? "Preparing…" : "Cases CSV"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => download("daily")} disabled={exporting !== null}>
              <Download className="mr-2 h-4 w-4" aria-hidden /> {exporting === "daily" ? "Preparing…" : "Daily CSV"}
            </Button>
          </div>
        </div>
        <p className="-mt-4 mb-6 text-xs text-muted-foreground sm:-mt-6 sm:mb-8">
          Exports cover the selected period and contain no patient names, contact details, symptoms or notes.
        </p>
        {exportError && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {exportError}
          </div>
        )}

        {error ? (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-semibold">Analytics could not be loaded.</p>
            <p className="mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={load}>Try again</Button>
          </div>
        ) : !data ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">Loading analytics…</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard icon={Inbox} label="Open cases" value={data.totals.open_cases.toLocaleString()} hint={`${data.totals.all_cases.toLocaleString()} cases in total`} />
              <StatCard
                icon={AlertTriangle}
                label="Waiting for a clinician"
                value={data.totals.unassigned.toLocaleString()}
                hint={data.longest_current_wait_minutes === null ? undefined : `Longest wait ${formatMinutes(data.longest_current_wait_minutes)}`}
                tone={data.totals.unassigned > 0 ? "text-warning" : undefined}
              />
              <StatCard icon={ShieldAlert} label="Open emergencies" value={data.totals.open_emergencies.toLocaleString()} tone={data.totals.open_emergencies > 0 ? "text-urgent" : undefined} />
              <StatCard
                icon={Clock}
                label="Median time to close"
                value={formatMinutes(data.time_to_close_minutes.median)}
                hint={`${data.time_to_close_minutes.closed_cases} closed in the last ${data.window_days} days`}
              />
            </div>

            <h2 className="mb-3 font-heading text-base font-semibold text-foreground">Patient flow, last {data.window_days} days</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard
                icon={Hourglass}
                label="Median waiting time"
                value={formatMinutes(data.waiting_time_minutes.median)}
                hint={`Submission to first clinician · ${plural(data.waiting_time_minutes.cases, "case")}`}
              />
              <StatCard
                icon={Stethoscope}
                label="Median time in review"
                value={formatMinutes(data.review_time_minutes.median)}
                hint={`First clinician to closure · ${plural(data.review_time_minutes.cases, "case")}`}
              />
              <StatCard
                icon={CalendarCheck}
                label="Appointment attendance"
                value={formatPercent(data.appointments.attendance_rate)}
                hint={`${data.appointments.attended} attended · ${data.appointments.missed} missed`}
              />
              <StatCard
                icon={CalendarClock}
                label="Upcoming appointments"
                value={data.appointments.upcoming.toLocaleString()}
                hint={data.appointments.awaiting_outcome > 0 ? `${plural(data.appointments.awaiting_outcome, "past appointment")} with no outcome recorded` : undefined}
              />
            </div>

            {data.totals.all_cases === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No triage cases have been submitted yet. Figures appear here as patients submit assessments.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <ChartCard title={`Demand and throughput: submitted and closed per day (last ${data.window_days} days)`}>
                    <div className="-mx-2 h-64 sm:mx-0 sm:h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" fontSize={11} minTickGap={8} />
                          <YAxis allowDecimals={false} fontSize={11} width={40} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="submitted" name="Submitted" fill="hsl(var(--info))" />
                          <Bar dataKey="closed" name="Closed" fill="hsl(var(--safe))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartCard>
                </div>
                <ChartCard title={`Arrivals by hour of day (last ${data.window_days} days)`}>
                  <div className="-mx-2 h-56 sm:mx-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hourData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="hour" fontSize={11} interval={2} />
                        <YAxis allowDecimals={false} fontSize={11} width={40} />
                        <Tooltip labelFormatter={(hour) => `${hour}:00 to ${hour}:59`} />
                        <Bar dataKey="count" name="Cases submitted" fill="hsl(var(--info))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {busiestHour !== null && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Busiest hour: {hourLabel(busiestHour)}:00 to {hourLabel(busiestHour)}:59
                    </p>
                  )}
                </ChartCard>
                <ChartCard title="Clinician workload">
                  {data.workload.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active doctors or nurses.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="pb-2 font-medium">Clinician</th>
                          <th className="pb-2 text-right font-medium">Open now</th>
                          <th className="pb-2 text-right font-medium">Closed ({data.window_days} d)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.workload.map((row) => (
                          <tr key={row.clinician_id} className="border-t border-border">
                            <td className="py-2 text-foreground">
                              {row.full_name}{" "}
                              <span className="ml-1 text-xs capitalize text-muted-foreground">{row.role}</span>
                            </td>
                            <td className="py-2 text-right font-semibold tabular-nums text-foreground">{row.open_cases}</td>
                            <td className="py-2 text-right tabular-nums text-foreground">{row.closed_cases}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </ChartCard>
                <ChartCard title={`Waiting time by urgency (last ${data.window_days} days)`}>
                  <p className="mb-3 text-xs text-muted-foreground">Median time from submission to first clinician. High cases should wait least.</p>
                  <ul className="space-y-2">
                    {urgencyData.map(({ urgency }) => {
                      const wait = data.waiting_by_urgency[urgency as keyof typeof data.waiting_by_urgency];
                      return (
                        <li key={urgency} className="flex items-center gap-3 text-sm">
                          <span className="h-3 w-3 rounded-full" style={{ background: URGENCY_COLORS[urgency] }} aria-hidden />
                          <span className="flex-1 text-foreground">{urgency}</span>
                          <span className="text-xs text-muted-foreground">{plural(wait?.cases ?? 0, "case")}</span>
                          <span className="w-16 text-right font-semibold tabular-nums text-foreground">{formatMinutes(wait?.median ?? null)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </ChartCard>
                <ChartCard title={`Appointment outcomes (last ${data.window_days} days)`}>
                  <ul className="space-y-2">
                    {([
                      ["Attended", data.appointments.attended],
                      ["Missed", data.appointments.missed],
                      ["Cancelled", data.appointments.cancelled],
                      ["Time passed, no outcome recorded", data.appointments.awaiting_outcome],
                    ] as const).map(([label, count]) => (
                      <li key={label} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{label}</span>
                        <span className="font-semibold tabular-nums text-foreground">{count}</span>
                      </li>
                    ))}
                  </ul>
                </ChartCard>
                <div className="lg:col-span-2">
                <ChartCard title="Case mix: all cases by model urgency and by status">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <ul className="space-y-2" aria-label="By model urgency">
                      {urgencyData.map(({ urgency, count }) => (
                        <li key={urgency} className="flex items-center gap-3 text-sm">
                          <span className="h-3 w-3 rounded-full" style={{ background: URGENCY_COLORS[urgency] }} aria-hidden />
                          <span className="flex-1 text-foreground">{urgency}</span>
                          <span className="font-semibold tabular-nums text-foreground">{count}</span>
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2" aria-label="By status">
                      {statusData.map(({ status, count }) => (
                        <li key={status} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{status}</span>
                          <span className="font-semibold tabular-nums text-foreground">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ChartCard>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
