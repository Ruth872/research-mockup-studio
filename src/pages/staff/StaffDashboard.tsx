import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, BarChart3, Calendar, FileText, Bell, ClipboardList,
  ArrowUpRight, Shield, Activity, LogOut, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { StaffUser } from "@/lib/api";

const modules = [
  { icon: Users, title: "Patient Records", desc: "View and manage registered patients", to: "/staff/patients", color: "bg-primary/10 text-primary" },
  { icon: ClipboardList, title: "Triage Queue", desc: "Active triage records and assessments", to: "/staff/triage", color: "bg-urgent/10 text-urgent" },
  { icon: Calendar, title: "Appointments", desc: "Manage clinic appointments", to: "/appointments", color: "bg-warning/10 text-warning" },
  { icon: ArrowUpRight, title: "Referrals", desc: "Track patient referrals to facilities", to: "/staff/referrals", color: "bg-info/10 text-info" },
  { icon: BarChart3, title: "Analytics", desc: "Patient flow and performance metrics", to: "/dashboard", color: "bg-safe/10 text-safe" },
  { icon: Bell, title: "Notifications", desc: "SMS/Email notification history", to: "/staff/notifications", color: "bg-accent/10 text-accent" },
  { icon: Cpu, title: "Algorithm Logs", desc: "ML triage algorithm performance", to: "/staff/algorithm-logs", color: "bg-primary/10 text-primary" },
  { icon: Shield, title: "Audit Logs", desc: "System access and action history", to: "/staff/audit-logs", color: "bg-muted-foreground/10 text-muted-foreground" },
];

const quickStats = [
  { label: "Pending Triage", value: "18", icon: ClipboardList, change: "+5 today" },
  { label: "Today's Appointments", value: "24", icon: Calendar, change: "3 upcoming" },
  { label: "Active Referrals", value: "7", icon: ArrowUpRight, change: "2 pending" },
  { label: "Online Staff", value: "4", icon: Activity, change: "" },
];

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const staff = user as StaffUser | null;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Clinician Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Welcome, {staff?.first_name || "Staff"} · <span className="font-medium text-primary">{staff?.role || "Clinician"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              staff?.availability_status === "Online" ? "bg-safe/10 text-safe" : "bg-muted text-muted-foreground"
            }`}>
              <span className={`h-2 w-2 rounded-full ${staff?.availability_status === "Online" ? "bg-safe" : "bg-muted-foreground"}`} />
              {staff?.availability_status || "Offline"}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                {stat.change && <span className="text-xs text-muted-foreground">{stat.change}</span>}
              </div>
              <p className="mt-3 font-heading text-2xl font-bold text-card-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

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
