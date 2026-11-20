import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { CaseIntake } from "@/lib/triageApi";
import { ALLERGY_KIND_LABELS, CONDITION_LABELS, DANGER_SIGN_LABELS, PREGNANCY_LABELS } from "@/lib/intake";

const rowLabel = "text-xs font-bold uppercase tracking-wider text-slate-500";

/** What the patient reported about their health with this assessment, for clinicians. */
export default function IntakeSummary({ intake }: { intake: CaseIntake | null | undefined }) {
  if (!intake || (!intake.health && !intake.visit)) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-500">
        No health background was reported with this assessment. Ask the patient about allergies and medicines before advising treatment.
      </p>
    );
  }
  const { health, visit } = intake;
  const conditions = [
    ...(health?.conditions ?? []).map((code) => CONDITION_LABELS[code]),
    ...(health?.other_conditions ? [health.other_conditions] : []),
  ];

  return (
    <section aria-label="Reported health background" className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 text-sm">
      {visit && visit.danger_signs.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <strong className="block">Child danger signs reported</strong>
            {visit.danger_signs.map((sign) => DANGER_SIGN_LABELS[sign]).join(" · ")}
          </div>
        </div>
      )}

      <div>
        <span className={rowLabel}>Allergies</span>
        {health?.allergy_status === "has_allergies" ? (
          <ul className="mt-1 space-y-1">
            {health.allergies.map((allergy, index) => (
              <li key={index} className="flex items-start gap-1.5 font-semibold text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
                <span>
                  {allergy.substance} <span className="font-normal text-slate-500">({ALLERGY_KIND_LABELS[allergy.kind]}{allergy.reaction ? `: ${allergy.reaction}` : ""})</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-800 dark:text-slate-200">
            {health?.allergy_status === "none" ? "No known allergies" : "Unknown: patient not sure or did not say"}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className={rowLabel}>Long-term conditions</dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200">{conditions.length ? conditions.join(", ") : "None reported"}</dd>
        </div>
        <div>
          <dt className={rowLabel}>Regular medicines</dt>
          <dd className="mt-1 whitespace-pre-line text-slate-800 dark:text-slate-200">{health?.medications || "None reported"}</dd>
        </div>
        {visit?.medicines_taken && (
          <div>
            <dt className={rowLabel}>Taken for this illness</dt>
            <dd className="mt-1 text-slate-800 dark:text-slate-200">{visit.medicines_taken}</dd>
          </div>
        )}
        {visit?.temperature_c != null && (
          <div>
            <dt className={rowLabel}>Temperature</dt>
            <dd className={`mt-1 font-semibold ${visit.temperature_c >= 38 ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>{visit.temperature_c} °C</dd>
          </div>
        )}
        {health?.weight_kg != null && (
          <div>
            <dt className={rowLabel}>Weight</dt>
            <dd className="mt-1 text-slate-800 dark:text-slate-200">{health.weight_kg} kg</dd>
          </div>
        )}
        {visit?.pregnant && (
          <div>
            <dt className={rowLabel}>Pregnancy</dt>
            <dd className={`mt-1 ${visit.pregnant === "yes" ? "font-semibold text-violet-700 dark:text-violet-400" : "text-slate-800 dark:text-slate-200"}`}>{PREGNANCY_LABELS[visit.pregnant]}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
