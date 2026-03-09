import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, BarChart3, Clock, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-clinic.jpg";

const features = [
  {
    icon: Stethoscope,
    title: "Symptom Self-Assessment",
    description:
      "Report symptoms online and receive initial care guidance before visiting the clinic.",
  },
  {
    icon: BarChart3,
    title: "Patient Flow Analytics",
    description:
      "Visualise attendance trends, common complaints, and peak consultation hours.",
  },
  {
    icon: Clock,
    title: "Reduce Wait Times",
    description:
      "Redirect non-urgent cases, allowing healthcare workers to focus on critical patients.",
  },
  {
    icon: Users,
    title: "Data-Driven Decisions",
    description:
      "Empower administrators with evidence-based insights for staffing and resource planning.",
  },
];

const stats = [
  { value: "70%", label: "Non-urgent visits reducible" },
  { value: "3hrs+", label: "Average wait time" },
  { value: "1:50", label: "Nurse-to-patient ratio" },
];

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Kabwata Clinic facility"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-hero-gradient opacity-85" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 text-sm text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
              Research Prototype · Kabwata Clinic
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Smarter Triage for{" "}
              <span className="underline decoration-accent decoration-4 underline-offset-4">
                Better Care
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
              A web-based tele-triage and patient flow analytics system designed
              for primary healthcare facilities in Zambia.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-lg"
              >
                <Link to="/triage">
                  Start Symptom Check
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="px-8 py-8 text-center"
            >
              <p className="font-heading text-3xl font-extrabold text-primary">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Bridging patients and healthcare through digital innovation
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">
                  {feat.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground">
            Ready to Try the Prototype?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Experience how digital triage can transform primary healthcare delivery at Kabwata Clinic.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              <Link to="/triage">Begin Symptom Check</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/dashboard">Explore Analytics</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
