import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ScrollText, Stethoscope, Users, UserRound, UserCog } from "lucide-react";
import { adminApi, type AdminStats } from "@/lib/api";

const links = [
  { to: "/admin/staff", title: "Manage staff", description: "Create doctor and nurse accounts, reset passwords, deactivate accounts.", icon: UserCog },
  { to: "/admin/patients", title: "Patients", description: "Registered patient accounts. Basic account details only.", icon: Users },
  { to: "/admin/audit-log", title: "Audit log", description: "Every administrative change and who made it.", icon: ScrollText },
];

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi.stats()
      .then((result) => { if (active) setStats(result); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load admin overview.");
      });
    return () => { active = false; };
  }, []);

  const cards = stats ? [
    { label: "Total patients", value: stats.total_patients, icon: Users },
    { label: "Active doctors", value: stats.active_doctors, icon: Stethoscope },
    { label: "Active nurses", value: stats.active_nurses, icon: UserRound },
    { label: "Cases today", value: stats.cases_today, icon: Activity },
  ] : [];

  return (
    <main className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:space-y-8 sm:px-6">
        <header>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Admin overview</h1>
          <p className="mt-2 text-muted-foreground">Account and service totals. Patient medical details are not shown here.</p>
        </header>
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
        {!stats && !error && <p role="status" className="text-sm text-muted-foreground">Loading overview…</p>}
        <section aria-label="System counts" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 font-heading text-2xl font-bold text-foreground sm:mt-4 sm:text-3xl">{value.toLocaleString()}</p>
            </article>
          ))}
        </section>
        <section aria-label="Admin tasks" className="grid gap-4 sm:grid-cols-3">
          {links.map(({ to, title, description, icon: Icon }) => (
            <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 font-heading text-base font-semibold text-foreground group-hover:text-primary">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
