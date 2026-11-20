// API client for FastAPI Tele-Triage backend
import { API_BASE_URL, authenticatedFetch, errorMessage, statusMessage } from "@/lib/api";

const API_BASE = API_BASE_URL.replace(/\/$/, "");

export interface SymptomCatalogResponse {
  total_symptoms: number;
  all_symptoms: string[];
  grouped_categories: Record<string, string[]>;
  critical_keywords: string[];
}

export type ConditionCode =
  | "hiv" | "tb" | "diabetes" | "hypertension" | "asthma"
  | "sickle_cell" | "epilepsy" | "heart_disease" | "kidney_disease";

/** WHO IMCI general danger signs for children under five. */
export type DangerSign = "unable_to_drink" | "vomits_everything" | "convulsions" | "lethargic_or_unconscious";

export interface Allergy {
  substance: string;
  kind: "medicine" | "food" | "other";
  reaction?: string | null;
}

/** Standing health details: kept on the patient's profile and copied onto each case. */
export interface HealthBackground {
  allergy_status: "none" | "has_allergies" | "unknown";
  allergies: Allergy[];
  conditions: ConditionCode[];
  other_conditions?: string | null;
  medications?: string | null;
  weight_kg?: number | null;
}

/** Details that apply to one assessment only. */
export interface VisitDetails {
  pregnant?: "yes" | "no" | "unsure" | null;
  temperature_c?: number | null;
  medicines_taken?: string | null;
  danger_signs: DangerSign[];
}

export interface CaseIntake {
  health: HealthBackground | null;
  visit: VisitDetails | null;
}

export interface HealthBackgroundResponse {
  health: HealthBackground | null;
  updated_at: string | null;
  age: number | null;
  gender: "female" | "male" | "other" | null;
}

export interface DatedEntry {
  name: string;
  year?: number | null;
}

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export interface RecordDetails {
  blood_group?: BloodGroup | null;
  immunisations: DatedEntry[];
  procedures: DatedEntry[];
  family_history?: string | null;
}

export interface MedicalRecord {
  patient_name: string;
  age: number | null;
  gender: string | null;
  health: HealthBackground | null;
  details: RecordDetails | null;
  updated_at: string | null;
  past_assessments: Array<{
    case_id: string;
    created_at: string;
    symptoms: string[];
    urgency: string;
    status: CaseStatus;
    clinician_notes: string | null;
  }>;
}

export interface AccessGrant {
  id: number;
  case_id: string;
  requested_by_name: string | null;
  reason: string;
  status: "pending" | "approved" | "declined" | "revoked";
  requested_at: string;
  decided_at: string | null;
  revoked_at: string | null;
  /** Approved, not withdrawn, and not past the end of access. */
  active: boolean;
  /** When access ends; set once the case is closed. */
  expires_at: string | null;
}

export interface RecordAccessOverview {
  grants: AccessGrant[];
  views: Array<{ viewer_name: string; case_id: string; viewed_at: string }>;
}

export interface CaseRecordResponse {
  access: AccessGrant | null;
  can_request: boolean;
  /** Present only while the signed-in clinician has approved access. */
  record: MedicalRecord | null;
}

export type AppointmentStatus = "proposed" | "confirmed" | "reschedule_requested" | "cancelled" | "attended" | "missed";
export type AppointmentAction = "confirm" | "request_reschedule" | "cancel" | "reschedule" | "attended" | "missed";

export interface Appointment {
  id: number;
  case_id: string;
  patient_name: string;
  clinician_id: number | null;
  clinician_name: string | null;
  booked_by_name: string | null;
  scheduled_at: string;
  duration_minutes: number;
  kind: "in_person" | "phone";
  location: string | null;
  notes_for_patient: string | null;
  status: AppointmentStatus;
  patient_message: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  /** What the signed-in user may do now; the API enforces the same rules. */
  actions: AppointmentAction[];
}

export interface AppointmentTime {
  scheduled_at: string;
  duration_minutes: 15 | 20 | 30 | 45 | 60;
  kind: "in_person" | "phone";
  location?: string | null;
  notes_for_patient?: string | null;
  clinician_id?: number | null;
}

export interface PatientTriageInput {
  age: number;
  gender: "female" | "male" | "other";
  symptoms: string[];
  free_text?: string;
  duration: string;
  severity: "mild" | "moderate" | "severe";
  health?: HealthBackground;
  visit?: VisitDetails;
}

export interface TriagePredictionResult {
  case_id: string;
  patient_name: string;
  urgency: "High" | "Medium" | "Low" | "Doctor review";
  condition: string;
  confidence: number;
  emergency: boolean;
  symptoms_detected: string[];
  disclaimer: string;
  created_at: string;
}

export type CaseStatus = "pending" | "assigned" | "in_review" | "closed";

export interface TriageCase {
  case_id: string;
  patient_name: string;
  age: number | null;
  gender: string | null;
  symptoms: string[];
  free_text?: string;
  duration: string;
  severity: string;
  urgency: "High" | "Medium" | "Low" | "Doctor review";
  condition_category: string;
  confidence: number;
  is_emergency: boolean;
  status: CaseStatus;
  created_at: string;
  assigned_staff_id: number | null;
  assigned_doctor: string | null;
  doctor_notes: string | null;
  /** Status changes the signed-in user may request now; the API enforces the same rules. */
  available_transitions: CaseStatus[];
  can_assign: boolean;
  can_edit_notes: boolean;
  /** Follow-ups can be booked on closed cases too, by the assigned clinician or a doctor. */
  can_book_appointment?: boolean;
  /** Messages from the other side (patient vs. clinical staff) not yet read. */
  unread_messages: number;
  /** Health details the patient reported with this assessment. */
  intake?: CaseIntake | null;
}

export interface ChatMessage {
  id: number;
  sender_id: number | null;
  sender_name: string;
  sender_role: "patient" | "doctor" | "nurse" | "admin";
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface CaseMessages {
  case_id: string;
  /** Whether the signed-in user may send a message now; the API enforces the same rule. */
  can_send: boolean;
  messages: ChatMessage[];
}

/** A partial update: only the fields present are changed. */
export interface CaseUpdate {
  status?: CaseStatus;
  doctor_notes?: string;
  /** Required when a doctor reopens a closed case. */
  reason?: string;
}

export interface CaseEvent {
  id: number;
  event_type: string;
  actor_id: number | null;
  actor_name: string | null;
  actor_role: "patient" | "doctor" | "nurse" | "admin" | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface Clinician {
  id: number;
  full_name: string;
  role: "doctor" | "nurse";
}

export interface AnalyticsSummary {
  generated_at: string;
  window_days: number;
  totals: { all_cases: number; open_cases: number; unassigned: number; open_emergencies: number };
  by_status: Record<CaseStatus, number>;
  by_urgency: Record<TriageCase["urgency"], number>;
  daily: Array<{ date: string; submitted: number; closed: number }>;
  time_to_close_minutes: { median: number | null; closed_cases: number };
  /** IANA zone that days and hours are counted in. */
  timezone: string;
  /** Submission to first assignment, for cases first assigned in the period. */
  waiting_time_minutes: { median: number | null; cases: number };
  /** The same, by the model's urgency rating. */
  waiting_by_urgency: Record<TriageCase["urgency"], { median: number | null; cases: number }>;
  longest_current_wait_minutes: number | null;
  /** First assignment to final closure, for cases closed in the period. */
  review_time_minutes: { median: number | null; cases: number };
  /** 24 counts, index 0 = midnight local time. */
  arrivals_by_hour: number[];
  workload: Array<{ clinician_id: number; full_name: string; role: string; open_cases: number; closed_cases: number }>;
  appointments: {
    attended: number;
    missed: number;
    cancelled: number;
    awaiting_outcome: number;
    upcoming: number;
    attendance_rate: number | null;
  };
}

/**
 * Random key that lets POST /predict be retried without creating a duplicate case.
 * Uses crypto.getRandomValues because crypto.randomUUID is unavailable on plain-HTTP origins.
 */
export function newIdempotencyKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text();
    const fallback = statusMessage(res.status);
    let detail: string;
    try {
      detail = errorMessage(JSON.parse(errorText).detail, fallback);
    } catch {
      detail = errorText || fallback;
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const triageApi = {
  async getSymptoms(): Promise<SymptomCatalogResponse> {
    const res = await authenticatedFetch(`${API_BASE}/symptoms`);
    return handleResponse<SymptomCatalogResponse>(res);
  },

  async predictTriage(data: PatientTriageInput, idempotencyKey: string): Promise<TriagePredictionResult> {
    const res = await authenticatedFetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(data),
    });
    return handleResponse<TriagePredictionResult>(res);
  },

  async getMyRecord(): Promise<MedicalRecord> {
    return handleResponse<MedicalRecord>(await authenticatedFetch(`${API_BASE}/patients/me/record`));
  },

  async updateMyRecord(update: { health: HealthBackground; details: RecordDetails }): Promise<MedicalRecord> {
    const res = await authenticatedFetch(`${API_BASE}/patients/me/record`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return handleResponse<MedicalRecord>(res);
  },

  async getMyRecordAccess(): Promise<RecordAccessOverview> {
    return handleResponse<RecordAccessOverview>(await authenticatedFetch(`${API_BASE}/patients/me/record/access`));
  },

  /** The patient's answer to a clinician's request: approve, decline, or withdraw approved access. */
  async answerAccess(grantId: number, action: "approve" | "decline" | "revoke"): Promise<AccessGrant> {
    const res = await authenticatedFetch(`${API_BASE}/patients/me/record/access/${grantId}/${action}`, { method: "POST" });
    return handleResponse<AccessGrant>(res);
  },

  async getCaseRecord(caseId: string): Promise<CaseRecordResponse> {
    return handleResponse<CaseRecordResponse>(await authenticatedFetch(`${API_BASE}/cases/${caseId}/record`));
  },

  async requestRecordAccess(caseId: string, reason: string): Promise<AccessGrant> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/record-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<AccessGrant>(res);
  },

  async bookAppointment(caseId: string, body: AppointmentTime): Promise<Appointment> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse<Appointment>(res);
  },

  async getCaseAppointments(caseId: string): Promise<{ appointments: Appointment[] }> {
    return handleResponse(await authenticatedFetch(`${API_BASE}/cases/${caseId}/appointments`));
  },

  async getAppointments(params: { start?: string; end?: string; scope?: "mine" | "all"; status?: AppointmentStatus[] } = {}): Promise<{ appointments: Appointment[] }> {
    const query = new URLSearchParams();
    if (params.start) query.set("start", params.start);
    if (params.end) query.set("end", params.end);
    if (params.scope) query.set("scope", params.scope);
    params.status?.forEach((s) => query.append("status", s));
    return handleResponse(await authenticatedFetch(`${API_BASE}/appointments?${query}`));
  },

  async getMyAppointments(): Promise<{ appointments: Appointment[] }> {
    return handleResponse(await authenticatedFetch(`${API_BASE}/patients/me/appointments`));
  },

  async rescheduleAppointment(id: number, body: AppointmentTime): Promise<Appointment> {
    const res = await authenticatedFetch(`${API_BASE}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse<Appointment>(res);
  },

  async confirmAppointment(id: number): Promise<Appointment> {
    return handleResponse(await authenticatedFetch(`${API_BASE}/appointments/${id}/confirm`, { method: "POST" }));
  },

  async requestReschedule(id: number, message: string): Promise<Appointment> {
    const res = await authenticatedFetch(`${API_BASE}/appointments/${id}/request-reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return handleResponse<Appointment>(res);
  },

  async cancelAppointment(id: number, reason: string): Promise<Appointment> {
    const res = await authenticatedFetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return handleResponse<Appointment>(res);
  },

  async recordAppointmentOutcome(id: number, outcome: "attended" | "missed"): Promise<Appointment> {
    return handleResponse(await authenticatedFetch(`${API_BASE}/appointments/${id}/outcome?outcome=${outcome}`, { method: "POST" }));
  },

  /** The signed-in patient's saved health details, for pre-filling the assessment form. */
  async getHealthBackground(): Promise<HealthBackgroundResponse> {
    const res = await authenticatedFetch(`${API_BASE}/patients/me/health-background`);
    return handleResponse<HealthBackgroundResponse>(res);
  },

  async getCases(params?: { urgency?: string; status?: string; search?: string }): Promise<{ total: number; cases: TriageCase[] }> {
    const query = new URLSearchParams();
    if (params?.urgency) query.set("urgency", params.urgency);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const res = await authenticatedFetch(`${API_BASE}/cases?${query.toString()}`);
    return handleResponse<{ total: number; cases: TriageCase[] }>(res);
  },

  async getCase(caseId: string): Promise<{ case: TriageCase }> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}`);
    return handleResponse<{ case: TriageCase }>(res);
  },

  async updateCase(caseId: string, update: CaseUpdate): Promise<{ success: boolean; case: TriageCase }> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return handleResponse<{ success: boolean; case: TriageCase }>(res);
  },

  async assignCase(caseId: string, assigneeId: number): Promise<{ success: boolean; case: TriageCase }> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee_id: assigneeId }),
    });
    return handleResponse<{ success: boolean; case: TriageCase }>(res);
  },

  async getCaseHistory(caseId: string): Promise<{ case_id: string; events: CaseEvent[] }> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/events`);
    return handleResponse<{ case_id: string; events: CaseEvent[] }>(res);
  },

  /** Messages newer than afterId (all when 0). Reading marks the other side's messages as read. */
  async getMessages(caseId: string, afterId = 0): Promise<CaseMessages> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/messages?after_id=${afterId}`);
    return handleResponse<CaseMessages>(res);
  },

  async sendMessage(caseId: string, content: string): Promise<ChatMessage> {
    const res = await authenticatedFetch(`${API_BASE}/cases/${caseId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return handleResponse<ChatMessage>(res);
  },

  async listClinicians(): Promise<Clinician[]> {
    const res = await authenticatedFetch(`${API_BASE}/staff/clinicians`);
    return handleResponse<Clinician[]>(res);
  },

  async getAnalytics(days = 14): Promise<AnalyticsSummary> {
    const res = await authenticatedFetch(`${API_BASE}/analytics?days=${days}`);
    return handleResponse<AnalyticsSummary>(res);
  },

  /** De-identified CSV of the period's patient flow: one row per case, or per day. */
  async exportAnalytics(kind: "cases" | "daily", days: number): Promise<{ blob: Blob; filename: string }> {
    const res = await authenticatedFetch(`${API_BASE}/analytics/export?kind=${kind}&days=${days}`);
    if (!res.ok) await handleResponse<never>(res);
    const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1]
      ?? `patient-flow-${kind}.csv`;
    return { blob: await res.blob(), filename };
  },
};
