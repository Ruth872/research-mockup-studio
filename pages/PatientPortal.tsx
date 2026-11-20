import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, FileText, User, LogOut, MessageSquare, FileHeart, ShieldQuestion, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { triageApi } from "@/lib/triageApi";

const cards = [
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    description: "Submit your symptoms for a preliminary assessment and clinician review.",
    to: "/triage",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: FileText,
    title: "Triage History",
    description: "See your past assessments and where each one is in clinician review.",
    to: "/triage-history",
    color: "bg-safe/10 text-safe",
  },
  {
    icon: FileHeart,
    title: "My Health Record",
    description: "Your allergies, conditions and history. Private to you; you decide who sees it.",
    to: "/patient/record",
    color: "bg-urgent/10 text-urgent",
  },
  {
    icon: CalendarDays,
    title: "My Appointments",
    description: "Follow-up visits and calls booked by your clinician.",
    to: "/patient/appointments",
    color: "bg-info/10 text-info",
  },
];

const PatientPortal = () => {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [toConfirm, setToConfirm] = useState(0);

  useEffect(() => {
    let active = true;
    // Only a convenience notice: if it fails, My Assessments still shows each case's messages.
    triageApi.getCases()
      .then((result) => {
        if (active) setUnread(result.cases.reduce((sum, c) => sum + c.unread_messages, 0));
      })
      .catch(() => undefined);
    triageApi.getMyAppointments()
      .then((result) => {
        if (active) setToConfirm(result.appointments.filter((a) => a.actions.includes("confirm")).length);
      })
      .catch(() => undefined);
    triageApi.getMyRecordAccess()
      .then((result) => {
        if (active) setPendingRequests(result.grants.filter((g) => g.status === "pending").length);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Welcome */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
          <div className="min-w-0">
            <h1 className="break-words font-heading text-2xl font-bold text-foreground sm:text-3xl">
              Welcome, {user?.full_name || "Patient"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your health dashboard at Kabwata Clinic
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <User className="h-5 w-5 text-secondary-foreground" />
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        {unread > 0 && (
          <Link
            to="/triage-history"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200"
          >
            <MessageSquare className="h-5 w-5 flex-shrink-0" aria-hidden />
            <span className="flex-1">
              <strong>{unread} new message{unread > 1 ? "s" : ""}</strong> from the clinic about your assessments.
            </span>
            <span className="font-semibold underline">Read</span>
          </Link>
        )}

        {toConfirm > 0 && (
          <Link
            to="/patient/appointments"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
          >
            <CalendarDays className="h-5 w-5 flex-shrink-0" aria-hidden />
            <span className="flex-1">
              <strong>Your clinician has booked {toConfirm > 1 ? `${toConfirm} appointments` : "an appointment"} for you.</strong> Please confirm.
            </span>
            <span className="font-semibold underline">View</span>
          </Link>
        )}

        {pendingRequests > 0 && (
          <Link
            to="/patient/record"
            className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          >
            <ShieldQuestion className="h-5 w-5 flex-shrink-0" aria-hidden />
            <span className="flex-1">
              <strong>A clinician is asking to see your health record.</strong> Review the request.
            </span>
            <span className="font-semibold underline">Review</span>
          </Link>
        )}

        {/* Feature cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={card.to}
                className="group block rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientPortal;
