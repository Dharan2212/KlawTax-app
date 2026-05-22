// ============================================================
// KlawTax — Centralized API Client
// Batch 4.3: Auth refresh, payload fixes, post-payment hydration
// ============================================================

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";
const DEBUG    = (import.meta.env.VITE_API_DEBUG as string) === "true";

// ── Types ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

// ── Token / Session Storage ──────────────────────────────────

const TOKEN_KEY   = "kt_access_token";
const REFRESH_KEY = "kt_refresh_token";
const ROLE_KEY    = "kt_user_role";
const USER_KEY    = "kt_user_info";

export function getStoredToken(): string | null {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setStoredToken(token: string): void {
  try { sessionStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
}

export function getStoredRefreshToken(): string | null {
  try { return sessionStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setStoredRefreshToken(token: string): void {
  try { sessionStorage.setItem(REFRESH_KEY, token); } catch { /* ignore */ }
}

export function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

export function getStoredRole(): string | null {
  try { return sessionStorage.getItem(ROLE_KEY); } catch { return null; }
}
export function setStoredRole(role: string): void {
  try { sessionStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
}

export interface StoredUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  clientProfileId?: string;
  employeeProfileId?: string;
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function setStoredUser(user: StoredUser): void {
  try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* ignore */ }
}

// ── Refresh token rotation ───────────────────────────────────
// Prevents concurrent refresh races

let _refreshPromise: Promise<string> | null = null;

async function attemptTokenRefresh(): Promise<string> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    const url   = `${BASE_URL}/api/v1/auth/refresh`;
    const res   = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ refreshToken }),
    });
    const json  = await res.json();

    if (!res.ok || !json.success) {
      clearStoredToken();
      throw new Error("Session expired");
    }

    const { accessToken, refreshToken: newRefresh } = json.data ?? json;
    setStoredToken(accessToken);
    if (newRefresh) setStoredRefreshToken(newRefresh);
    return accessToken as string;
  })().finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}

// ── Core Fetch Wrapper ───────────────────────────────────────

async function request<T>(
  method:    string,
  path:      string,
  body?:     unknown,
  headers?:  Record<string, string>,
  _isRetry = false,
): Promise<T> {
  const url = `${BASE_URL}/api/v1${path}`;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) init.body = JSON.stringify(body);

  const token = getStoredToken();
  if (token && init.headers) {
    (init.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  if (DEBUG) console.log(`[KlawTax API] ${method} ${url}`, body ?? "");

  const res = await fetch(url, init);

  let json: ApiResponse<T> | undefined;
  try { json = await res.json(); } catch {
    if (!res.ok) throw { status: res.status, message: "Network error — please try again." } as ApiError;
  }

  // ── Auto-refresh on 401 ───────────────────────────────────
  if (res.status === 401 && !_isRetry) {
    try {
      await attemptTokenRefresh();
      // Retry with fresh access token
      return request<T>(method, path, body, headers, true);
    } catch {
      // Refresh failed — clear session and re-throw 401
      clearStoredToken();
      throw { status: 401, message: "Session expired. Please log in again.", code: "SESSION_EXPIRED" } as ApiError;
    }
  }

  if (!res.ok || (json && !json.success)) {
    const err: ApiError = {
      status:  res.status,
      message: json?.message ?? json?.error ?? "An unexpected error occurred.",
      code:    json?.code,
    };
    if (DEBUG) console.error("[KlawTax API] Error:", err);
    throw err;
  }

  return (json?.data ?? json) as T;
}

// ── Typed API helpers ────────────────────────────────────────

export const get   = <T>(path: string, h?: Record<string, string>) => request<T>("GET",    path, undefined, h);
export const post  = <T>(path: string, body?: unknown)             => request<T>("POST",   path, body);
export const patch = <T>(path: string, body?: unknown)             => request<T>("PATCH",  path, body);
export const del   = <T>(path: string)                             => request<T>("DELETE", path);

// ── Auth ─────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken:  string;
  refreshToken?: string;
  user: {
    userId:             string;
    email:              string;
    firstName:          string;
    lastName:           string;
    role:               string;
    clientProfileId?:   string;
    employeeProfileId?: string;
  };
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return post<LoginResponse>("/auth/login", payload);
}

export async function logout(): Promise<void> {
  try {
    const token   = getStoredToken();
    const refresh = getStoredRefreshToken();
    if (token || refresh) {
      await post("/auth/logout", { refreshToken: refresh ?? undefined });
    }
  } catch { /* always clear local state */ }
  clearStoredToken();
}

export async function forgotPassword(email: string): Promise<void> {
  await post("/auth/password/request-reset", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await post("/auth/password/reset", { token, newPassword });
}

export async function verifyEmail(token: string): Promise<void> {
  await post("/auth/verify-email", { token });
}

// ── Public — Leads (Contact Form) ───────────────────────────

export interface LeadPayload {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  message?: string;
  serviceSlug?: string;
}

export interface LeadSubmitResponse {
  submitted: boolean;
  message:   string;
}

export async function submitLead(payload: LeadPayload): Promise<LeadSubmitResponse> {
  const noteParts: string[] = [];
  if (payload.service && payload.service !== "General Inquiry") {
    noteParts.push(`Service Interest: ${payload.service}`);
  }
  if (payload.message?.trim()) noteParts.push(payload.message.trim());

  const body: Record<string, unknown> = {
    fullName: payload.name.trim(),
    phone:    payload.phone.trim(),
  };
  if (payload.email?.trim())      body.email = payload.email.trim();
  if (noteParts.length > 0)       body.notes = noteParts.join("\n");
  if (payload.serviceSlug)        body.serviceInterestSlugs = [payload.serviceSlug];

  return post<LeadSubmitResponse>("/contact", body);
}

// ── Public — Services ────────────────────────────────────────

export interface ServiceApiRecord {
  _id:          string;
  slug:         string;
  title:        string;
  category:     string;
  price:        number;
  advancePrice: number;
  featured:     boolean;
  isActive:     boolean;
}

export async function fetchServices(): Promise<ServiceApiRecord[]> {
  return get<ServiceApiRecord[]>("/services");
}

// ── Payments — Guest Checkout (PUBLIC — no auth) ─────────────

export interface CreateOrderPayload {
  serviceId:   string;
  serviceName: string;
  amount:      number;
  paymentType: "full" | "advance";
  customer: {
    name:   string;
    email:  string;
    phone:  string;
    city?:  string;
  };
}

export interface CreateOrderResponse {
  razorpayOrderId: string;
  invoiceId:       string;
  projectId:       string;
  amount:          number;
  currency:        string;
  keyId:           string;
  clientId?:       string;
}

/**
 * Guest checkout — creates client, invoice, project, and Razorpay order.
 * POST /api/v1/payments/checkout (PUBLIC)
 */
export async function createPaymentOrder(
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> {
  return post<CreateOrderResponse>("/payments/checkout", payload);
}

// ── Payments — Verify (PUBLIC — signature-based) ─────────────

export interface VerifyPaymentPayload {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  invoiceId:         string;
  clientId?:         string;
}

export interface VerifyPaymentResponse {
  verified:           boolean;
  projectId:          string;
  orderId:            string;
  clientAccessToken?: string;
  redirectUrl?:       string;
}

/**
 * Verify payment signature and capture payment.
 * POST /api/v1/payments/verify-guest (PUBLIC)
 *
 * ⚠ Backend expects snake_case field names (Razorpay convention).
 */
export async function verifyPayment(
  payload: VerifyPaymentPayload,
): Promise<VerifyPaymentResponse> {
  return post<VerifyPaymentResponse>("/payments/verify-guest", {
    razorpay_order_id:   payload.razorpayOrderId,
    razorpay_payment_id: payload.razorpayPaymentId,
    razorpay_signature:  payload.razorpaySignature,
    invoiceId:           payload.invoiceId,
    ...(payload.clientId ? { clientId: payload.clientId } : {}),
  });
}

// ── Client Dashboard ─────────────────────────────────────────

export interface ClientDashboardData {
  activeProjects:       unknown[];
  completedProjects:    unknown[];
  pendingPayments:      unknown[];
  recentTimelineEntries: unknown[];
}

export async function fetchClientDashboard(): Promise<ClientDashboardData> {
  return get<ClientDashboardData>("/dashboard/client");
}

// ── Admin Dashboard ──────────────────────────────────────────

export interface AdminDashboardData {
  activeProjectCount:      number;
  overdueProjectCount:     number;
  stalledProjectCount:     number;
  pendingApprovalsCount:   number;
  newLeadsToday:           number;
  revenueThisMonth:        number;
  revenueLastMonth:        number;
  overdueProjects:         unknown[];
  recentTimelineEntries:   unknown[];
  pendingApprovalsList:    unknown[];
  employeeWorkloadSummary: unknown[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return get<AdminDashboardData>("/dashboard/admin");
}

// ── Employee Dashboard ───────────────────────────────────────

export async function fetchEmployeeDashboard(): Promise<unknown> {
  return get("/dashboard/employee");
}

// ── Notifications ─────────────────────────────────────────────

export interface NotificationRecord {
  _id:       string;
  type:      string;
  title:     string;
  message:   string;
  priority:  string;
  isRead:    boolean;
  createdAt: string;
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  return get<{ count: number }>("/notifications/unread-count");
}

export async function fetchNotifications(
  page = 1,
  limit = 20,
): Promise<{ notifications: NotificationRecord[]; total: number }> {
  return get(`/notifications?page=${page}&limit=${limit}`);
}

export async function markNotificationRead(id: string): Promise<void> {
  await patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await patch("/notifications/read-all");
}

// ── JWT Decode Helper (no library needed) ────────────────────

/**
 * Decode a JWT payload without verifying the signature.
 * Used client-side to extract role / userId from issued tokens.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    // atob expects standard base64; JWT uses base64url
    const b64  = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

// ── Error Helpers ─────────────────────────────────────────────

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return (err as ApiError).message;
  }
  return "Something went wrong. Please try again or contact us on WhatsApp.";
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message.includes("fetch")) return true;
  if (err && typeof err === "object" && "status" in err) {
    return (err as ApiError).status === 0;
  }
  return false;
}

export function isAuthError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === "object" &&
    "status" in err &&
    (err as ApiError).status === 401
  );
}

export default {
  get, post, patch, del,
  submitLead, fetchServices,
  createPaymentOrder, verifyPayment,
  fetchClientDashboard, fetchAdminDashboard,
};
