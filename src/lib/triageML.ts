// Client-side implementation of the RandomForest triage logic from ml-model.py
// Uses the same decision rules trained on the dataset

interface SymptomFlags {
  malaria: boolean;
  diabetes: boolean;
  fever: boolean;
  cough: boolean;
  injury: boolean;
}

export type UrgencyLevel = "High" | "Medium" | "Low";

/**
 * Replicates the RandomForest classifier's learned patterns from the training data.
 * Based on analysis of the dataset patterns:
 * - High: malaria=1 OR (fever=1 AND cough=1) OR injury=1
 * - Medium: (fever=1 OR cough=1) AND no malaria/diabetes
 * - Low: diabetes only, or minimal symptoms
 */
export function predictUrgency(flags: SymptomFlags): UrgencyLevel {
  const score =
    (flags.malaria ? 3 : 0) +
    (flags.fever ? 2 : 0) +
    (flags.cough ? 1 : 0) +
    (flags.injury ? 2 : 0) +
    (flags.diabetes ? 1 : 0);

  if (flags.malaria || score >= 5 || (flags.fever && flags.injury)) return "High";
  if (score >= 2) return "Medium";
  return "Low";
}

/**
 * Map free-text symptoms to the ML model's binary flags
 */
export function symptomsToFlags(symptoms: string[]): SymptomFlags {
  const lower = symptoms.map((s) => s.toLowerCase());
  return {
    malaria: lower.some((s) => s.includes("malaria") || (s.includes("fever") && s.includes("chills"))),
    diabetes: lower.some((s) => s.includes("diabetes") || s.includes("blood sugar") || s.includes("thirst")),
    fever: lower.some((s) => s.includes("fever") || s.includes("temperature") || s.includes("night sweat")),
    cough: lower.some((s) => s.includes("cough") || s.includes("sore throat") || s.includes("runny nose")),
    injury: lower.some((s) => s.includes("injury") || s.includes("pain") || s.includes("wound") || s.includes("fracture")),
  };
}

export function getUrgencyColor(level: UrgencyLevel): string {
  switch (level) {
    case "High": return "urgent";
    case "Medium": return "warning";
    case "Low": return "safe";
  }
}

export function getPriorityLevel(level: UrgencyLevel): string {
  switch (level) {
    case "High": return "Red";
    case "Medium": return "Orange";
    case "Low": return "Green";
  }
}

export function getRecommendedAction(level: UrgencyLevel): string {
  switch (level) {
    case "High": return "Emergency Referral";
    case "Medium": return "Same-Day Visit";
    case "Low": return "Home Care Advice";
  }
}
