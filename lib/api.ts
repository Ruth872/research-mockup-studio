/** Base URL of the FastAPI service, always ending in "/". Defaults to the Vite dev proxy. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api/").replace(/\/?$/, "/");

export const ACCESS_TOKEN_KEY = "tele_triage_access_token";
export const REFRESH_TOKEN_KEY = "tele_triage_refresh_token";

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

// One refresh at a time: requests that fail together while the access token is expired
// share the same refresh call, because the API revokes a refresh token once it is used.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const tokens = (await res.json()) as { access_token: string; refresh_token: string };
    accessToken = tokens.access_token;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

function send(input: RequestInfo | URL, options: RequestInit): Promise<Response> {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(input, { ...options, headers });
}

/** Sends the request with the access token; on a 401 it refreshes the session once and retries. */
export async function authenticatedFetch(input: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const hadToken = accessToken !== null;
  let response = await send(input, options);
  if (response.status !== 401 || !hadToken) return response;

  if (await refreshOnce()) {
    response = await send(input, options);
    if (response.status !== 401) return response;
  }
  accessToken = null;
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  window.dispatchEvent(new Event("teletriage:auth-expired"));
  return response;
}

export const UNREACHABLE_MESSAGE = "The server could not be reached. Check your connection and try again.";

/** Fallback text when an error response has no readable detail. */
export function statusMessage(status: number): string {
  if (status === 429) return "Too many attempts. Wait a minute and try again.";
  if (status >= 500) return `The server could not complete the request (HTTP ${status}). Try again shortly.`;
  return `The request failed (HTTP ${status}).`;
}

/** Turns a FastAPI error body (string, {message}, or a validation list) into readable text. */
export function errorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" && "msg" in item ? String(item.msg) : ""))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return fallback;
}

async function request<T>(endpoint: string, options: RequestInit = {}, baseUrl = API_BASE_URL): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  let res: Response;
  try {
    res = await authenticatedFetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error(UNREACHABLE_MESSAGE);
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorMessage(errorData.detail ?? errorData, statusMessage(res.status)));
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json();
  return data as T;
}

export interface AuthUser {
  id: string | number;
  full_name: string;
  email: string;
  role: "patient" | "doctor" | "nurse" | "admin";
  is_active: boolean;
  must_change_password: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: AuthUser["role"];
  must_change_password: boolean;
  expires_in: number;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    age?: number;
    gender?: "female" | "male" | "other";
    phone?: string;
  }) =>
    request<AuthUser>("auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => request<AuthUser>("auth/me", {}),
  logout: (refresh_token: string) =>
    request<void>("auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),
  /** Signs out every other session; returns a fresh token pair for this one. */
  changePassword: (current_password: string, new_password: string) =>
    request<{ access_token: string; refresh_token: string; must_change_password: boolean }>("auth/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),
};

export interface ManagedStaffUser {
  id: string | number;
  full_name: string;
  email: string;
  role: "doctor" | "nurse";
  department: string;
  license_number: string;
  phone: string | null;
  is_active: boolean;
  must_change_password: boolean;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminStats {
  total_patients: number;
  active_doctors: number;
  active_nurses: number;
  cases_today: number;
}

export interface PatientSummary {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminAuditEntry {
  id: number;
  actor_id: number | null;
  actor_name: string | null;
  actor_email: string | null;
  target_user_id: number | null;
  action: string;
  details: Record<string, string | number | boolean | null> | null;
  created_at: string;
}

export const staffAdminApi = {
  list: (search: string, role: "doctor" | "nurse" | "", page: number, pageSize: number) => {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search.trim()) query.set("search", search.trim());
    if (role) query.set("role", role);
    return request<PageResult<ManagedStaffUser>>(`admin/staff?${query}`, {});
  },
  get: (id: string | number) =>
    request<ManagedStaffUser>(`admin/staff/${encodeURIComponent(id)}`, {}),
  create: (data: { full_name: string; email: string; role: "doctor" | "nurse"; department: string; license_number: string; phone?: string }) =>
    request<ManagedStaffUser & { temporary_password: string }>("admin/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string | number, data: Partial<Pick<ManagedStaffUser, "full_name" | "email" | "role" | "department" | "license_number" | "phone">>) =>
    request<ManagedStaffUser>(`admin/staff/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deactivate: (id: string | number) =>
    request<ManagedStaffUser>(`admin/staff/${encodeURIComponent(id)}/deactivate`, { method: "POST" }),
  reactivate: (id: string | number) =>
    request<ManagedStaffUser>(`admin/staff/${encodeURIComponent(id)}/reactivate`, { method: "POST" }),
  resetPassword: (id: string | number) =>
    request<{ temporary_password: string }>(`admin/staff/${encodeURIComponent(id)}/reset-password`, { method: "POST" }),
};

export const adminApi = {
  stats: () => request<AdminStats>("admin/stats", {}),
  patients: (search: string, page: number, pageSize: number) => {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (search.trim()) query.set("search", search.trim());
    return request<PageResult<PatientSummary>>(`admin/users?${query}`, {});
  },
  auditLog: (page: number, pageSize: number) =>
    request<PageResult<AdminAuditEntry>>(`admin/audit-log?page=${page}&page_size=${pageSize}`, {}),
};
