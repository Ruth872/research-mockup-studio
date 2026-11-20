import { Check, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConditionCode, DangerSign } from "@/lib/triageApi";
import {
  ALLERGY_KIND_LABELS,
  CONDITION_LABELS,
  DANGER_SIGN_LABELS,
  type IntakeErrors,
  type IntakeForm,
} from "@/lib/intake";

interface FieldsProps {
  form: IntakeForm;
  onChange: (patch: Partial<IntakeForm>) => void;
  errors: IntakeErrors;
}

const labelClass = "text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2";
const inputClass = "w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
const textareaClass = "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

function choiceClass(selected: boolean) {
  return `px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
    selected
      ? "border-primary bg-primary/10 text-primary shadow-sm"
      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300"
  }`;
}

const FieldError = ({ message, id }: { message?: string; id: string }) =>
  message ? <p id={id} className="mt-1.5 text-xs text-red-600 dark:text-red-400">{message}</p> : null;

/** Allergies, long-term conditions, medicines and weight: saved for next time. */
export function HealthBackgroundFields({ form, onChange, errors }: FieldsProps) {
  const toggleCondition = (code: ConditionCode) =>
    onChange({
      conditions: form.conditions.includes(code) ? form.conditions.filter((c) => c !== code) : [...form.conditions, code],
    });

  const setAllergy = (index: number, patch: Partial<IntakeForm["allergies"][number]>) =>
    onChange({ allergies: form.allergies.map((a, i) => (i === index ? { ...a, ...patch } : a)) });

  const chooseAllergyStatus = (status: IntakeForm["allergyStatus"]) =>
    onChange({
      allergyStatus: status,
      allergies: status === "has_allergies" && form.allergies.length === 0 ? [{ substance: "", kind: "medicine", reaction: "" }] : form.allergies,
    });

  return (
    <div className="space-y-6">
      <div role="group" aria-labelledby="allergy-question" aria-describedby={errors.allergyStatus ? "allergy-status-error" : undefined}>
        <span id="allergy-question" className={labelClass}>Do you have any allergies? *</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            ["none", "No known allergies"],
            ["has_allergies", "Yes, I have allergies"],
            ["unknown", "I'm not sure"],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={form.allergyStatus === value} onClick={() => chooseAllergyStatus(value)} className={choiceClass(form.allergyStatus === value)}>
              {label}
            </button>
          ))}
        </div>
        <FieldError id="allergy-status-error" message={errors.allergyStatus} />

        {form.allergyStatus === "has_allergies" && (
          <div className="mt-3 space-y-3">
            {form.allergies.map((allergy, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:grid-cols-[1fr_8rem_1fr_auto] sm:items-end">
                <div>
                  <label htmlFor={`allergy-${index}-substance`} className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Allergic to</label>
                  <input id={`allergy-${index}-substance`} value={allergy.substance} maxLength={100} placeholder="e.g. Penicillin" onChange={(e) => setAllergy(index, { substance: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor={`allergy-${index}-kind`} className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Type</label>
                  <select id={`allergy-${index}-kind`} value={allergy.kind} onChange={(e) => setAllergy(index, { kind: e.target.value as typeof allergy.kind })} className={inputClass}>
                    {Object.entries(ALLERGY_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor={`allergy-${index}-reaction`} className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Reaction (optional)</label>
                  <input id={`allergy-${index}-reaction`} value={allergy.reaction} maxLength={200} placeholder="e.g. Rash, swelling" onChange={(e) => setAllergy(index, { reaction: e.target.value })} className={inputClass} />
                </div>
                <Button type="button" variant="ghost" size="sm" className="justify-self-start sm:justify-self-auto h-10" aria-label={`Remove allergy ${index + 1}`} onClick={() => onChange({ allergies: form.allergies.filter((_, i) => i !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {form.allergies.length < 20 && (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange({ allergies: [...form.allergies, { substance: "", kind: "medicine", reaction: "" }] })}>
                <Plus className="mr-1 h-4 w-4" /> Add another allergy
              </Button>
            )}
            <FieldError id="allergies-error" message={errors.allergies} />
          </div>
        )}
      </div>

      <div role="group" aria-labelledby="conditions-question">
        <span id="conditions-question" className={labelClass}>Long-term conditions (tick any that apply)</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.keys(CONDITION_LABELS) as ConditionCode[]).map((code) => {
            const selected = form.conditions.includes(code);
            return (
              <button key={code} type="button" aria-pressed={selected} onClick={() => toggleCondition(code)} className={`${choiceClass(selected)} flex items-center justify-between gap-2`}>
                {CONDITION_LABELS[code]}
                {selected && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        <label htmlFor="other-conditions" className="mt-3 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">Other conditions (optional)</label>
        <input id="other-conditions" value={form.otherConditions} maxLength={300} onChange={(e) => onChange({ otherConditions: e.target.value })} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_10rem]">
        <div>
          <label htmlFor="medications" className={labelClass}>Medicines you take regularly</label>
          <textarea id="medications" rows={2} value={form.medications} maxLength={1000} placeholder="One per line, e.g. Metformin 500 mg" onChange={(e) => onChange({ medications: e.target.value })} className={textareaClass} />
        </div>
        <div>
          <label htmlFor="weight" className={labelClass}>Weight (kg)</label>
          <input id="weight" type="number" inputMode="decimal" step="0.1" min={0.5} max={300} value={form.weightKg} onChange={(e) => onChange({ weightKg: e.target.value })} aria-invalid={!!errors.weightKg} aria-describedby={errors.weightKg ? "weight-error" : undefined} className={inputClass} />
          <FieldError id="weight-error" message={errors.weightKg} />
        </div>
      </div>
    </div>
  );
}

/** WHO IMCI general danger signs, asked first for children under five. */
export function DangerSignsFields({ form, onChange }: Omit<FieldsProps, "errors">) {
  const toggle = (sign: DangerSign) =>
    onChange({ dangerSigns: form.dangerSigns.includes(sign) ? form.dangerSigns.filter((s) => s !== sign) : [...form.dangerSigns, sign] });

  return (
    <div role="group" aria-labelledby="danger-signs-question" className="rounded-xl border-2 border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20 p-4">
      <span id="danger-signs-question" className="flex items-center gap-2 text-sm font-bold text-rose-800 dark:text-rose-300 mb-1">
        <ShieldAlert className="h-5 w-5" aria-hidden /> For a child under 5: does the child have any of these?
      </span>
      <p className="mb-3 text-xs text-rose-800/80 dark:text-rose-300/80">Tick any that apply. If any do, take the child to the nearest health facility now.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Object.keys(DANGER_SIGN_LABELS) as DangerSign[]).map((sign) => {
          const selected = form.dangerSigns.includes(sign);
          return (
            <button key={sign} type="button" aria-pressed={selected} onClick={() => toggle(sign)} className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left flex items-center justify-between gap-2 ${selected ? "border-rose-600 bg-rose-600 text-white" : "border-rose-200 bg-white text-rose-800 hover:bg-rose-100 dark:bg-slate-900 dark:text-rose-300 dark:border-rose-900"}`}>
              {DANGER_SIGN_LABELS[sign]}
              {selected && <Check className="h-4 w-4 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Temperature, medicines already taken and pregnancy: this assessment only. */
export function TodayDetailsFields({ form, onChange, errors, showPregnancy }: FieldsProps & { showPregnancy: boolean }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="temperature" className={labelClass}>Temperature (°C)</label>
          <input id="temperature" type="number" inputMode="decimal" step="0.1" min={34} max={43} placeholder="If measured" value={form.temperatureC} onChange={(e) => onChange({ temperatureC: e.target.value })} aria-invalid={!!errors.temperatureC} aria-describedby={errors.temperatureC ? "temperature-error" : undefined} className={inputClass} />
          <FieldError id="temperature-error" message={errors.temperatureC} />
        </div>
        <div>
          <label htmlFor="medicines-taken" className={labelClass}>Medicines already taken for this illness</label>
          <input id="medicines-taken" value={form.medicinesTaken} maxLength={500} placeholder="e.g. Paracetamol this morning" onChange={(e) => onChange({ medicinesTaken: e.target.value })} className={inputClass} />
        </div>
      </div>

      {showPregnancy && (
        <div role="group" aria-labelledby="pregnancy-question">
          <span id="pregnancy-question" className={labelClass}>Are you pregnant?</span>
          <div className="grid grid-cols-3 gap-2">
            {([["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={form.pregnant === value} onClick={() => onChange({ pregnant: form.pregnant === value ? "" : value })} className={choiceClass(form.pregnant === value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
