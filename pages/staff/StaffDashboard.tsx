import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, CalendarDays, ClipboardList, Inbox, LogOut, ShieldAlert, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { triageApi, type AnalyticsSummary } from "@/lib/triageApi";
import { useCallback, useEffect, useState } from "react";

const modules = [
  { icon: ClipboardList, title: "Triage Queue", desc: "Take, review and close submitted cases", to: "/staff/triage", color: "bg-urgent/10 text-urgent" },
  { icon: CalendarDays, title: "Appointments", desc: "Today's follow-ups and requests for another time", to: "/staff/appointments", color: "bg-primary/10 text-primary" },
  { icon: BarChart3, title: "Analytics", desc: "Case load, urgency mix and time to close", to: "/staff/analytics", color: "bg-safe/10 text-safe" },
];

const ROLE_LABELS: Record<string, string> = { doctor: "Doctor", nurse: "Nurse" };

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      setStats(await triageApi.getAnalytics(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Case figures could not be loaded.");
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const tiles = stats
    ? [
        { icon: Inbox, label: "Open cases", value: stats.totals.open_cases, tone: "text-card-foreground" },
        { icon: AlertTriangle, label: "Waiting for a clinician", value: stats.totals.unassigned, tone: stats.totals.unassigned > 0 ? "text-warning" : "text-card-foreground" },
        { icon: ShieldAlert, label: "Open emergencies", value: stats.totals.open_emergencies, tone: stats.totals.open_emergencies > 0 ? "text-urgent" : "text-card-foreground" },
        { icon: TrendingUp, label: "Submitted today", value: stats.daily.at(-1)?.submitted ?? 0, tone: "text-card-foreground" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Clinician Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              Welcome, {user?.full_name || "Staff"} · <span className="font-medium text-primary">{ROLE_LABELS[user?.role ?? ""] ?? "Clinician"}</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        {error ? (
          <div role="alert" className="mb-8 rounded-2xl border border-red-300 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">Case figures could not be loaded.</p>
            <p className="mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={loadStats}>Try again</Button>
          </div>
        ) : (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy={!stats}>
            {stats
              ? tiles.map((tile, i) => (
                  <motion.div
                    key={tile.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-border bg-card p-5 shadow-card"
                  >
                    <tile.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                    <p className={`mt-3 font-heading text-2xl font-bold ${tile.tone}`}>{tile.value}</p>
                    <p className="text-xs text-muted-foreground">{tile.label}</p>
                  </motion.div>
                ))
              : [1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card animate-pulse">
                    <div className="h-5 w-5 rounded bg-secondary" />
                    <div className="mt-3 h-8 w-16 rounded bg-secondary" />
                    <div className="mt-1 h-4 w-28 rounded bg-secondary" />
                  </div>
                ))}
          </div>
        )}

        {/* Modules Grid */}
        <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <Link
                to={mod.to}
                className="group block rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${mod.color}`}>
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {mod.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{mod.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
