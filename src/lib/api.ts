// API service layer for PHP backend
// Configure API_BASE_URL to point to your PHP backend server

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost/tele-triage-system";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────
export interface StaffUser {
  staff_id: number;
  first_name: string;
  last_name: string;
  role: string;
  specialization: string | null;
  license_number: string | null;
  phone_number: string;
  email: string;
  availability_status: string;
}

export interface PatientUser {
  id: number;
  name: string;
  phone: string;
  blood_group: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: StaffUser | PatientUser;
  user_role?: string;
}

export const api = {
  // Staff auth
  staffLogin: (email: string, password: string) =>
    request<AuthResponse>("login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  staffSignup: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: string;
    specialization?: string;
    license_number?: string;
    phone_number: string;
  }) =>
    request<AuthResponse>("signup.php", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Patient auth
  patientLogin: (national_id: string, phone_number: string) =>
    request<AuthResponse>("patient_login.php", {
      method: "POST",
      body: JSON.stringify({ national_id, phone_number }),
    }),

  patientSignup: (data: {
    national_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    phone_number: string;
    email?: string;
    address?: string;
    next_of_kin_name?: string;
    next_of_kin_contact?: string;
    blood_group?: string;
    allergies?: string;
    chronic_conditions?: string;
    current_medications?: string;
  }) =>
    request<AuthResponse>("patient_signup.php", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Chat / AI triage
  sendChat: (message: string, patient_id: number) =>
    request<{
      success: boolean;
      role?: string;
      content?: string;
      urgency?: string;
      message?: string;
    }>("chat_handler.php", {
      method: "POST",
      body: JSON.stringify({ message, patient_id }),
    }),
};
