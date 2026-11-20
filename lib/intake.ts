import type { Allergy, ConditionCode, DangerSign, HealthBackground, VisitDetails } from "@/lib/triageApi";

export const CONDITION_LABELS: Record<ConditionCode, string> = {
  hiv: "HIV",
  tb: "Tuberculosis (TB)",
  diabetes: "Diabetes",
  hypertension: "High blood pressure",
  asthma: "Asthma",
  sickle_cell: "Sickle cell disease",
  epilepsy: "Epilepsy",
  heart_disease: "Heart disease",
  kidney_disease: "Kidney disease",
};

export const DANGER_SIGN_LABELS: Record<DangerSign, string> = {
  unable_to_drink: "Not able to drink or breastfeed",
  vomits_everything: "Vomits everything",
  convulsions: "Has had fits (convulsions)",
  lethargic_or_unconscious: "Very sleepy, floppy or cannot be woken",
};

export const ALLERGY_KIND_LABELS: Record<Allergy["kind"], string> = {
  medicine: "Medicine",
  food: "Food",
  other: "Other",
};

export const PREGNANCY_LABELS = { yes: "Pregnant", no: "Not pregnant", unsure: "Unsure if pregnant" } as const;

/** WHO IMCI danger signs apply to children under five (age 0-4 in whole years). */
export const CHILD_MAX_AGE = 4;

export const showsDangerSigns = (age: number | "") => age !== "" && age <= CHILD_MAX_AGE;
export const showsPregnancy = (age: number | "", gender: string) =>
  gender !== "male" && age !== "" && age >= 10 && age <= 55;

export interface IntakeForm {
  allergyStatus: "" | HealthBackground["allergy_status"];
  allergies: Array<{ substance: string; kind: Allergy["kind"]; reaction: string }>;
  conditions: ConditionCode[];
  otherConditions: string;
  medications: string;
  weightKg: string;
  pregnant: "" | NonNullable<VisitDetails["pregnant"]>;
  temperatureC: string;
  medicinesTaken: string;
  dangerSigns: DangerSign[];
}

export const emptyIntake = (): IntakeForm => ({
  allergyStatus: "",
  allergies: [],
  conditions: [],
  otherConditions: "",
  medications: "",
  weightKg: "",
  pregnant: "",
  temperatureC: "",
  medicinesTaken: "",
  dangerSigns: [],
});

/** The fields that apply to one assessment only (not saved to the profile). */
export const visitFields = (form: IntakeForm): Pick<IntakeForm, "pregnant" | "temperatureC" | "medicinesTaken" | "dangerSigns"> => ({
  pregnant: form.pregnant,
  temperatureC: form.temperatureC,
  medicinesTaken: form.medicinesTaken,
  dangerSigns: form.dangerSigns,
});

/** Pre-fills the standing details from the patient's saved background. */
export function intakeFromBackground(health: HealthBackground | null): IntakeForm {
  const form = emptyIntake();
  if (!health) return form;
  return {
    ...form,
    allergyStatus: health.allergy_status,
    allergies: health.allergies.map((a) => ({ substance: a.substance, kind: a.kind, reaction: a.reaction ?? "" })),
    conditions: health.conditions,
    otherConditions: health.other_conditions ?? "",
    medications: health.medications ?? "",
    weightKg: health.weight_kg != null ? String(health.weight_kg) : "",
  };
}

export type IntakeErrors = Partial<Record<"allergyStatus" | "allergies" | "weightKg" | "temperatureC", string>>;

/** The same limits the API applies. */
export function validateIntake(form: IntakeForm): IntakeErrors {
  const errors: IntakeErrors = {};
  if (!form.allergyStatus) errors.allergyStatus = "Tell us whether you have any allergies.";
  if (form.allergyStatus === "has_allergies" && !form.allergies.some((a) => a.substance.trim())) {
    errors.allergies = "Add at least one allergy, or choose a different answer.";
  }
  if (form.weightKg !== "") {
    const weight = Number(form.weightKg);
    if (!Number.isFinite(weight) || weight < 0.5 || weight > 300) errors.weightKg = "Enter a weight between 0.5 and 300 kg.";
  }
  if (form.temperatureC !== "") {
    const temperature = Number(form.temperatureC);
    if (!Number.isFinite(temperature) || temperature < 34 || temperature > 43) {
      errors.temperatureC = "Enter a temperature between 34 and 43 °C, or leave it empty.";
    }
  }
  return errors;
}

const orNull = (value: string) => value.trim() || null;

export function intakePayload(form: IntakeForm, age: number | "", gender: string): { health: HealthBackground; visit: VisitDetails } {
  const hasAllergies = form.allergyStatus === "has_allergies";
  return {
    health: {
      allergy_status: form.allergyStatus || "unknown",
      allergies: hasAllergies
        ? form.allergies
          .filter((a) => a.substance.trim())
          .map((a) => ({ substance: a.substance.trim(), kind: a.kind, reaction: orNull(a.reaction) }))
        : [],
      conditions: form.conditions,
      other_conditions: orNull(form.otherConditions),
      medications: orNull(form.medications),
      weight_kg: form.weightKg === "" ? null : Number(form.weightKg),
    },
    visit: {
      pregnant: showsPregnancy(age, gender) && form.pregnant ? form.pregnant : null,
      temperature_c: form.temperatureC === "" ? null : Number(form.temperatureC),
      medicines_taken: orNull(form.medicinesTaken),
      danger_signs: showsDangerSigns(age) ? form.dangerSigns : [],
    },
  };
}
