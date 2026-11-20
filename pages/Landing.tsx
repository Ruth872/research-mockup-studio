import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stethoscope, BarChart3, Clock, Users, ArrowRight, ShieldCheck,
  Cpu, UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/hero-clinic.jpg";

const features = [
  {
    icon: Stethoscope,
    title: "Symptom Self-Assessment",
    description: "Report symptoms online and receive ML-powered urgency classification before visiting the clinic.",
  },
  {
    icon: ShieldCheck,
    title: "Clinician Review",
    description: "Every assessment is queued for a clinician, who reviews it and records the outcome.",
  },
  {
    icon: BarChart3,
    title: "Patient Flow Analytics",
    description: "Clinical staff see the open case load, urgency mix, daily volumes and time to close.",
  },
  {
    icon: Clock,
    title: "Reduce Wait Times",
    description: "Redirect non-urgent cases via tele-triage so staff can focus on critical patients.",
  },
  {
    icon: Users,
    title: "Staff & Patient Portals",
    description: "Clinicians share a triage queue with assignment and a full audit history; patients see their own assessments.",
  },
  {
    icon: Cpu,
    title: "ML Triage Algorithm",
    description: "A RandomForest model suggests a preliminary urgency. It is advisory only; a clinician makes the decision.",
  },
];

const stats = [
  { value: "70%", label: "Non-urgent visits reducible" },
  { value: "3hrs+", label: "Average wait time" },
  { value: "1:50", label: "Nurse-to-patient ratio" },
];

const Landing = () => {
  const { user } = useAuth();
  // Staff cannot submit assessments, so send each role to the place it can act.
  const cta = user?.role === "admin"
    ? { to: "/admin", label: "Open Admin Console" }
    : user?.role === "doctor" || user?.role === "nurse"
      ? { to: "/staff/triage", label: "Open Triage Queue" }
      : { to: "/triage", label: "Start Symptom Check" };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Kabwata Clinic facility" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-hero-gradient opacity-85" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 md:py-36">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
              Kabwata Clinic · Tele-Triage
            </div>
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-5xl lg:text-6xl">
              Smarter Triage for{" "}
              <span className="underline decoration-accent decoration-4 underline-offset-4">Better Care</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-primary-foreground/80 sm:text-lg md:text-xl">
              A web-based tele-triage and patient flow analytics system with ML-powered urgency prediction, designed for primary healthcare facilities in Zambia.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg">
                <Link to={cta.to}>{cta.label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="px-8 py-8 text-center">
              <p className="font-heading text-3xl font-extrabold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">System Features</h2>
            <p className="mt-3 text-muted-foreground">Bridging patients and healthcare through digital innovation</p>
          </div>

          <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals CTA */}
      <section className="overflow-hidden border-t border-border bg-card py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">Staff &amp; Admin Portal</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For doctors, nurses and administrators: the shared triage queue with assignment, clinical notes and case history, case analytics, and staff account management.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild><Link to="/staff/login">Staff &amp; Admin Sign In</Link></Button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10">
                <Users className="h-6 w-6 text-safe" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground">Patient Portal</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Register, submit your symptoms for clinician review, and follow the status of each assessment you have submitted.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild><Link to="/patient/login">Patient Sign In</Link></Button>
                <Button asChild variant="outline"><Link to="/patient/signup"><UserPlus className="mr-2 h-4 w-4" /> Register</Link></Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-heading text-2xl font-bold text-primary-foreground sm:text-3xl">Not feeling well?</h2>
          <p className="mt-4 text-primary-foreground/80">
            Tell us your symptoms online and a Kabwata Clinic clinician will review your case. If it may be an emergency, do not wait: go to the nearest health facility now.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
