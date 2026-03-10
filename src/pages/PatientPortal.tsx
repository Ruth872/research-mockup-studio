import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Stethoscope, Calendar, FileText, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import type { PatientUser } from "@/lib/api";

const cards = [
  {
    icon: Stethoscope,
    title: "Symptom Checker",
    description: "Complete a guided symptom assessment and get initial care guidance.",
    to: "/triage",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "AI Health Chat",
    description: "Chat with our AI assistant about your health concerns.",
    to: "/chat",
    color: "bg-info/10 text-info",
  },
  {
    icon: Calendar,
    title: "Appointments",
    description: "View your scheduled and past appointments at Kabwata Clinic.",
    to: "/appointments",
    color: "bg-warning/10 text-warning",
  },
  {
    icon: FileText,
    title: "Triage History",
    description: "Review past triage assessments and recommendations.",
    to: "/triage-history",
    color: "bg-safe/10 text-safe",
  },
];

const PatientPortal = () => {
  const { user, logout } = useAuth();
  const patient = user as PatientUser | null;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="mx-auto max-w-4xl px-6">
        {/* Welcome */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              Welcome, {patient?.name || "Patient"}
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

        {/* Quick info */}
        {patient?.blood_group && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-card">
            Blood Group: <span className="font-semibold text-foreground">{patient.blood_group}</span>
          </div>
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
