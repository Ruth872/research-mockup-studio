import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const symptomCategories = [
  {
    id: "general",
    label: "General",
    symptoms: ["Fever", "Fatigue", "Weight loss", "Night sweats", "Loss of appetite"],
  },
  {
    id: "respiratory",
    label: "Respiratory",
    symptoms: ["Cough", "Shortness of breath", "Chest pain", "Sore throat", "Runny nose"],
  },
  {
    id: "gastrointestinal",
    label: "Gastrointestinal",
    symptoms: ["Nausea", "Vomiting", "Diarrhoea", "Abdominal pain", "Blood in stool"],
  },
  {
    id: "musculoskeletal",
    label: "Musculoskeletal",
    symptoms: ["Headache", "Back pain", "Joint pain", "Muscle aches", "Dizziness"],
  },
];

const urgencyLevels = [
  { label: "1–3 days", color: "text-foreground" },
  { label: "Within 7 days", color: "text-foreground" },
];

type TriageResult = {
  level: "urgent" | "moderate" | "low";
  title: string;
  message: string;
  advice: string[];
};

function getTriageResult(symptoms: string[], duration: string): TriageResult {
  const dangerSymptoms = ["Chest pain", "Blood in stool", "Shortness of breath"];
  const hasDanger = symptoms.some((s) => dangerSymptoms.includes(s));
  const isUrgentDuration = duration === "1–3 days";

  if (hasDanger) {
    return {
      level: "urgent",
      title: "Urgent – Visit the Clinic Immediately",
      message:
        "Your symptoms may require immediate medical attention. Please visit Kabwata Clinic as soon as possible.",
      advice: [
        "Do not delay seeking medical care",
        "Bring a list of your current medications",
        "If symptoms worsen, consider visiting the nearest emergency facility",
      ],
    };
  }
  if (symptoms.length >= 3 || isUrgentDuration) {
    return {
      level: "moderate",
      title: "Moderate – Schedule a Visit Soon",
      message:
        "Your symptoms suggest you should visit the clinic within the next few days for proper assessment.",
      advice: [
        "Stay hydrated and rest",
        "Monitor your symptoms for changes",
        "Visit Kabwata Clinic within 2–3 days if symptoms persist",
      ],
    };
  }
  return {
    level: "low",
    title: "Low Priority – Self-Care Recommended",
    message:
      "Based on your reported symptoms, you may be able to manage your condition at home with basic self-care.",
    advice: [
      "Rest and stay hydrated",
      "Use over-the-counter remedies as appropriate",
      "Visit the clinic if symptoms persist beyond 5 days or worsen",
    ],
  };
}

const levelStyles = {
  urgent: "border-urgent bg-urgent/5",
  moderate: "border-warning bg-warning/5",
  low: "border-safe bg-safe/5",
};

const levelIcons = {
  urgent: <AlertTriangle className="h-8 w-8 text-urgent" />,
  moderate: <Info className="h-8 w-8 text-warning" />,
  low: <CheckCircle className="h-8 w-8 text-safe" />,
};

const SymptomChecker = () => {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [result, setResult] = useState<TriageResult | null>(null);

  const toggleSymptom = (s: string) =>
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const handleSubmit = () => {
    setResult(getTriageResult(selected, duration));
    setStep(3);
  };

  const reset = () => {
    setStep(0);
    setSelected([]);
    setDuration("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Symptom Self-Assessment
          </h1>
          <p className="mt-2 text-muted-foreground">
            Answer a few questions to receive initial care guidance
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= step ? "w-10 bg-primary" : "w-6 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Personal info */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card"
            >
              <h2 className="font-heading text-xl font-semibold text-card-foreground">
                Patient Information
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This information helps provide better guidance
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ruth Mwenya"
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="25"
                      className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Sex
                    </label>
                    <select className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">Select</option>
                      <option>Female</option>
                      <option>Male</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(1)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Symptoms */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card"
            >
              <h2 className="font-heading text-xl font-semibold text-card-foreground">
                Select Your Symptoms
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose all symptoms you are currently experiencing
              </p>
              <div className="mt-6 space-y-6">
                {symptomCategories.map((cat) => (
                  <div key={cat.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.symptoms.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggleSymptom(s)}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                            selected.includes(s)
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-secondary text-secondary-foreground hover:border-primary/40"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(2)} disabled={selected.length === 0}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Duration */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-card"
            >
              <h2 className="font-heading text-xl font-semibold text-card-foreground">
                Duration of Symptoms
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How long have you been experiencing these symptoms?
              </p>
              <div className="mt-6 grid gap-3">
                {["Less than 24 hours", "1–3 days", "4–7 days", "More than a week"].map(
                  (opt) => (
                    <button
                      key={opt}
                      onClick={() => setDuration(opt)}
                      className={`rounded-xl border px-5 py-4 text-left text-sm font-medium transition-colors ${
                        duration === opt
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-secondary-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt}
                    </button>
                  )
                )}
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={!duration}>
                  Get Recommendation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && result && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl border-2 p-8 shadow-card ${levelStyles[result.level]}`}
            >
              <div className="flex items-start gap-4">
                {levelIcons[result.level]}
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {result.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {result.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold text-foreground">
                  Recommended Actions:
                </p>
                <ul className="space-y-2">
                  {result.advice.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <p className="text-xs text-muted-foreground">
                  <strong>Disclaimer:</strong> This is a prototype assessment tool and
                  does not replace professional medical diagnosis. Always consult a
                  qualified healthcare provider for medical advice.
                </p>
              </div>
              <div className="mt-8">
                <Button onClick={reset} variant="outline">
                  Start New Assessment
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SymptomChecker;
