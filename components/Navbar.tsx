import { Link, useLocation } from "react-router-dom";
import { Activity, Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  const isPatient = user?.role === "patient";
  const navLinks = user?.role === "admin"
    ? [
        { to: "/admin", label: "Overview" },
        { to: "/admin/staff", label: "Manage Staff" },
        { to: "/admin/patients", label: "Patients" },
        { to: "/admin/audit-log", label: "Audit Log" },
      ]
    : user
      ? isPatient
        ? [
          { to: "/patient/portal", label: "My Portal" },
          { to: "/triage", label: "Symptom Triage" },
          { to: "/triage-history", label: "My Assessments" },
          { to: "/patient/record", label: "Health Record" },
          { to: "/patient/appointments", label: "Appointments" },
        ]
        : [
          { to: "/staff/dashboard", label: "Dashboard" },
          { to: "/staff/triage", label: "Triage Queue" },
          { to: "/staff/appointments", label: "Appointments" },
          { to: "/staff/analytics", label: "Analytics" },
        ]
      : [];

  const hideNavigation = ["/patient/login", "/patient/signup", "/staff/login", "/change-password"].includes(location.pathname);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
              Tele-Triage <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">AI</span>
            </span>
            <span className="-mt-0.5 block text-[11px] font-medium text-slate-500">Clinical Decision Support</span>
          </div>
        </Link>

        {!hideNavigation && (
          <>
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  location.pathname === link.to ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <>
                  <div className="hidden text-right xl:block">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{user.full_name}</span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{user.role}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void logout()}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm"><Link to="/patient/login">Patient sign in</Link></Button>
                  <Button asChild size="sm"><Link to="/staff/login">Staff &amp; admin sign in</Link></Button>
                </>
              )}
            </div>
            <div className="flex items-center lg:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)} className="h-10 w-10 rounded-xl p-0 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen}>
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </>
        )}
      </div>
      {!hideNavigation && mobileOpen && (
        <div className="space-y-2 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          {user ? navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">{link.label}</Link>
          )) : (
            <>
              <Link to="/patient/login" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-bold">Patient sign in</Link>
              <Link to="/staff/login" onClick={() => setMobileOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-bold">Staff &amp; admin sign in</Link>
            </>
          )}
          {user && (
            <>
              <div className="border-t border-slate-200 px-3 pb-1 pt-3 dark:border-slate-800">
                <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-200">{user.full_name}</span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{user.role}</span>
              </div>
              <Button variant="outline" className="w-full" onClick={() => void logout()}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
