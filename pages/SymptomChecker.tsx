import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  HeartPulse,
  Info,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  User,
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
  ClipboardList,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  newIdempotencyKey,
  triageApi,
  type PatientTriageInput,
  type SymptomCatalogResponse,
  type TriagePredictionResult,
} from "@/lib/triageApi";
import { useAuth } from "@/contexts/AuthContext";
import { DangerSignsFields, HealthBackgroundFields, TodayDetailsFields } from "@/components/IntakeFields";
import {
  emptyIntake,
  intakeFromBackground,
  intakePayload,
  showsDangerSigns,
  showsPregnancy,
  validateIntake,
  visitFields,
  type IntakeErrors,
  type IntakeForm,
} from "@/lib/intake";

const durationOptions = [
  "less than 1 day",
  "1-3 days",
  "4-7 days",
  "more than 1 week"
];

const severityOptions: Array<{ level: "Mild" | "Moderate" | "Severe"; desc: string; color: string }> = [
  { level: "Mild", desc: "Noticeable, but does not interfere with daily activities", color: "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" },
  { level: "Moderate", desc: "Uncomfortable and moderately restricts normal tasks", color: "border-amber-500/30 text-amber-600 bg-amber-500/10" },
  { level: "Severe", desc: "Intense, debilitating, or incapacitating", color: "border-rose-500/30 text-rose-600 bg-rose-500/10" }
];

export default function SymptomChecker() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [patientName, setPatientName] = useState(user?.full_name || "");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"female" | "male" | "other">("female");
  const [duration, setDuration] = useState("1-3 days");
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe">("Moderate");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [intake, setIntake] = useState<IntakeForm>(emptyIntake);
  const [intakeErrors, setIntakeErrors] = useState<IntakeErrors>({});
  const [backgroundSavedAt, setBackgroundSavedAt] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Catalog & Response State
  const [catalog, setCatalog] = useState<SymptomCatalogResponse | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [prediction, setPrediction] = useState<TriagePredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // An identical resubmission (e.g. a retry after a network error) reuses its key so the
  // server returns the original case; any change to the answers gets a new key.
  const submissionKey = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    if (user?.full_name) setPatientName(user.full_name);
  }, [user?.full_name]);

  const loadCatalog = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      setCatalogError(null);
      setCatalog(await triageApi.getSymptoms());
    } catch (err) {
      setCatalog(null);
      setCatalogError(err instanceof Error ? err.message : "Could not load the symptom catalog.");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Pre-fill from the patient's registration and last assessment. If this fails the
  // patient simply fills the form in, so the error is not shown.
  useEffect(() => {
    let active = true;
    triageApi.getHealthBackground()
      .then((saved) => {
        if (!active) return;
        if (saved.age != null) setAge((current) => (current === "" ? saved.age as number : current));
        if (saved.gender) setGender(saved.gender);
        if (saved.health) {
          setIntake((current) => ({ ...intakeFromBackground(saved.health), ...visitFields(current) }));
          setBackgroundSavedAt(saved.updated_at);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [error]);

  const updateIntake = (patch: Partial<IntakeForm>) => {
    const next = { ...intake, ...patch };
    setIntake(next);
    if (Object.keys(intakeErrors).length) setIntakeErrors(validateIntake(next));
  };

  // Real-time emergency keyword detection in free text
  const isEmergencyKeywordPresent = () => {
    if (!catalog) return false;
    const lower = freeText.toLowerCase();
    const freeTextMatch = catalog.critical_keywords.some(kw => lower.includes(kw.toLowerCase()));
    const selectedEmergency = selectedSymptoms.some(s =>
      catalog.critical_keywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))
    );
    return freeTextMatch || selectedEmergency;
  };

  const handleToggleSymptom = (sym: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError("Please provide the patient's name.");
      return;
    }
    if (age === "" || !Number.isInteger(Number(age)) || Number(age) < 0 || Number(age) > 120) {
      setError("Please provide a valid age between 0 and 120. For a baby under 1 year, enter 0.");
      return;
    }
    const foundIntakeErrors = validateIntake(intake);
    setIntakeErrors(foundIntakeErrors);
    if (Object.keys(foundIntakeErrors).length) {
      setError(Object.values(foundIntakeErrors)[0] ?? "Please check your health background.");
      return;
    }
    if (selectedSymptoms.length === 0) {
      setError("Select at least one symptom. Your written description is stored for clinician review and is not analyzed by the model.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const submission: PatientTriageInput = {
        age: Number(age),
        gender,
        symptoms: selectedSymptoms,
        free_text: freeText.trim(),
        duration,
        severity: severity.toLowerCase() as "mild" | "moderate" | "severe",
        ...intakePayload(intake, age, gender),
      };
      const fingerprint = JSON.stringify(submission);
      if (submissionKey.current?.fingerprint !== fingerprint) {
        submissionKey.current = { fingerprint, key: newIdempotencyKey() };
      }
      const result = await triageApi.predictTriage(submission, submissionKey.current.key);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit triage case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Keeps age and the saved health background; clears what applies to one assessment.
  const handleReset = () => {
    submissionKey.current = null;
    setPrediction(null);
    setSelectedSymptoms([]);
    setFreeText("");
    setIntake((current) => ({ ...current, ...visitFields(emptyIntake()) }));
    setError(null);
  };

  const childDangerSign = showsDangerSigns(age) && intake.dangerSigns.length > 0;
  const emergencyAlertActive = isEmergencyKeywordPresent() || childDangerSign;
  const urgencyBanner: Record<TriagePredictionResult["urgency"], string> = {
    High: "bg-gradient-to-r from-red-600 to-rose-700",
    Medium: "bg-gradient-to-r from-amber-500 to-orange-600",
    Low: "bg-gradient-to-r from-emerald-600 to-teal-700",
    "Doctor review": "bg-gradient-to-r from-slate-600 to-slate-800",
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Clinical Triage
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Patient Symptom Assessment
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Submit symptoms for a preliminary assessment and clinician review. Your written description is saved with the case but is not analyzed by the model.
          </p>
        </div>

        {/* Global Medical Disclaimer Box */}
        <div className="mb-6 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/30 p-4 flex items-start gap-3 text-sm text-blue-900 dark:text-blue-300">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Preliminary Triage Notice:</span> This digital assessment is not a diagnosis or care plan. Clinical staff must review the submitted case.
          </div>
        </div>

        {/* Real-time Emergency Warning Banner */}
        {emergencyAlertActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/60 p-4 flex items-start gap-3 text-red-900 dark:text-red-200 shadow-lg shadow-red-500/10"
          >
            <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 animate-pulse" />
            <div className="text-sm">
              <strong className="block text-base font-bold text-red-700 dark:text-red-400">
                CRITICAL EMERGENCY WARNING DETECTED
              </strong>
              Your entered symptoms mention severe danger signs (e.g., chest pain, breathing difficulty, or altered consciousness).
              If this may be life-threatening, do not wait for an online assessment. Contact your local emergency service or go to the nearest hospital emergency unit now.
            </div>
          </motion.div>
        )}

        {/* --- VIEW 1: RESULTS VIEW --- */}
        {prediction ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Urgency Header Banner */}
            <div
              className={`p-5 sm:p-8 text-white ${urgencyBanner[prediction.urgency]}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md mb-2">
                    Case Ref: {prediction.case_id}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-extrabold flex items-center gap-3">
                    {prediction.urgency === "High" ? (
                      <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                    ) : prediction.urgency === "Medium" ? (
                      <Clock className="w-8 h-8 flex-shrink-0" />
                    ) : prediction.urgency === "Doctor review" ? (
                      <Info className="w-8 h-8 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-8 h-8 flex-shrink-0" />
                    )}
                    {prediction.urgency === "Doctor review" ? "Clinician review needed" : `${prediction.urgency} Urgency Priority`}
                  </h2>
                  <p className="mt-1 text-white/90 text-base font-medium">
                    {prediction.condition}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 sm:text-right min-w-[130px]">
                  <span className="text-xs uppercase tracking-wider text-white/80 block">AI Confidence</span>
                  <span className="text-2xl font-black">{Math.round(prediction.confidence)}%</span>
                  <span className="text-[11px] block text-white/70">scikit-learn RF</span>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-6">
              {/* Patient summary chips */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Account:</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                  {prediction.patient_name} ({age}y, {gender})
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                  Duration: {duration}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                  Reported Severity: {severity}
                </span>
              </div>

              {/* Detected Symptoms list */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Symptoms Submitted
                </h3>
                <div className="flex flex-wrap gap-2">
                  {prediction.symptoms_detected.length > 0 ? (
                    prediction.symptoms_detected.map((sym, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="px-3 py-1 text-xs font-medium capitalize bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      >
                        {sym}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 italic">No structured symptoms</span>
                  )}
                </div>
              </div>

              {/* Clinical Recommendation Box */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Info className="w-5 h-5" /> Preliminary result for clinician review
                </h4>
                <p className="text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
                  {prediction.disclaimer} This is not a diagnosis or care plan. Your case reference is {prediction.case_id}.
                </p>
              </div>

              {/* Status Note */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-sm flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <strong>Case submitted:</strong> Your assessment is saved as <strong>{prediction.case_id}</strong> for review by clinical staff.
                  {" "}A clinician may message you with questions. Check <strong>My Assessments</strong> for replies.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => navigate("/triage-history")}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                >
                  <CheckCircle className="w-5 h-5" /> View My Assessments
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="sm:w-auto py-6 rounded-xl font-medium border-slate-300 dark:border-slate-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Submit Another Assessment
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- VIEW 2: PATIENT INTAKE FORM --- */
          <motion.form
            noValidate
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 sm:p-8 space-y-8"
          >
            {error && (
              <div ref={errorRef} role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Patient Profile */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" /> 1. Patient Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label htmlFor="patient-name" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <Input
                    id="patient-name"
                    required
                    placeholder="Patient full name"
                    value={patientName}
                    readOnly
                    className="rounded-xl border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="patient-age" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Age (Years) *
                  </label>
                  <Input
                    id="patient-age"
                    inputMode="numeric"
                    required
                    type="number"
                    min={0}
                    max={120}
                    placeholder="e.g. 34"
                    aria-describedby="patient-age-hint"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="rounded-xl border-slate-300 dark:border-slate-700"
                  />
                  <p id="patient-age-hint" className="text-[11px] text-slate-500">Baby under 1 year? Enter 0.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="patient-gender" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Biological Gender *
                  </label>
                  <select
                    id="patient-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "female" | "male" | "other")}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {showsDangerSigns(age) && (
                <div className="mt-4">
                  <DangerSignsFields form={intake} onChange={updateIntake} />
                </div>
              )}
            </div>

            {/* Section 2: Health background (saved for next time) */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
                <ClipboardList className="w-5 h-5 text-primary" /> 2. Your Health Background
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Shared with the clinicians who review this assessment, and saved so you do not have to type it again.
                {backgroundSavedAt && ` Filled in from ${new Date(backgroundSavedAt).toLocaleDateString()}: check it is still correct.`}
              </p>
              <HealthBackgroundFields form={intake} onChange={updateIntake} errors={intakeErrors} />
            </div>

            {/* Section 3: Duration & Severity */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" /> 3. Duration & Perceived Severity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    How long have you had symptoms?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {durationOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        aria-pressed={duration === opt}
                        onClick={() => setDuration(opt)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                          duration === opt
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
                    Severity Rating
                  </label>
                  <div className="space-y-2">
                    {severityOptions.map((sev) => (
                      <button
                        type="button"
                        key={sev.level}
                        aria-pressed={severity === sev.level}
                        onClick={() => setSeverity(sev.level)}
                        className={`w-full text-left cursor-pointer p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          severity === sev.level
                            ? `${sev.color} ring-2 ring-primary/40 font-bold`
                            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <span className="font-bold text-sm block">{sev.level}</span>
                          <span className="text-[11px] opacity-80">{sev.desc}</span>
                        </div>
                        {severity === sev.level && <Check className="w-4 h-4 ml-2 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Symptoms Checklist */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-primary" /> 4. Select Common Symptoms
                </h2>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  {selectedSymptoms.length} selected
                </span>
              </div>

              {loadingCatalog ? (
                <div className="flex items-center justify-center p-8 text-sm text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading symptom database...
                </div>
              ) : catalogError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <p>Symptom catalog unavailable: {catalogError}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => loadCatalog()}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {catalog &&
                    Object.entries(catalog.grouped_categories).map(([category, items]) => (
                      <div key={category} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-800/20">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {items.map((sym) => {
                            const isSelected = selectedSymptoms.includes(sym);
                            const isRedFlag = category.toLowerCase().includes("emergency");
                            return (
                              <button
                                key={sym}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => handleToggleSymptom(sym)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 capitalize ${
                                  isSelected
                                    ? isRedFlag
                                      ? "bg-rose-600 text-white shadow-sm"
                                      : "bg-primary text-white shadow-sm"
                                    : isRedFlag
                                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                                }`}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                {sym}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Section 5: Details for this assessment only */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <Thermometer className="w-5 h-5 text-primary" /> 5. Today's Details
              </h2>
              <TodayDetailsFields form={intake} onChange={updateIntake} errors={intakeErrors} showPregnancy={showsPregnancy(age, gender)} />
            </div>

            {/* Section 6: Free-text Patient Description */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" /> 6. Describe Your Complaints in Your Own Words
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Add details you want clinical staff to see. This text is stored with the case but is not interpreted by the model.
              </p>
              <Textarea
                rows={3}
                placeholder="e.g., I've had a bad cough for three days, my throat hurts whenever I swallow, and my temperature feels very high..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                className="rounded-xl border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || loadingCatalog || !catalog}
              className="w-full py-6 rounded-xl font-bold text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting assessment...
                </>
              ) : (
                <>
                  Submit for Clinician Review <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}