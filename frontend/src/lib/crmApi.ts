/**
 * KlawTax CRM API Client (Batch 2 — B7-B12)
 *
 * All CRM operations — Admin, Employee, and Client portal.
 * Every method maps to a documented backend endpoint from v1.5 spec.
 */

import { get, post, patch, del } from "@/lib/api";

// ─── Shared Types ─────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiProject {
  _id: string;
  projectCode: string;
  title: string;
  primaryServiceSlug: string;
  serviceSlugs: string[];
  projectStatus: string;
  projectPriority: string;
  clientId: string;
  primaryManagerId?: string;
  assignedEmployees: { userId: string; employeeProfileId: string; isPrimary: boolean; isActive: boolean }[];
  isOverdue: boolean;
  isStalled: boolean;
  expectedDeliveryDate?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLead {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  serviceName?: string;
  message?: string;
  status: string;
  assignedTo?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiApproval {
  _id: string;
  projectId: string;
  submittedById: string;
  approvedById?: string;
  status: string;
  reviewNote?: string;
  resubmissionCount: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface ApiInvoice {
  _id: string;
  invoiceNumber: string;
  title: string;
  clientId: string;
  projectId?: string;
  invoiceStatus: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  dueDate?: string;
  createdAt: string;
}

export interface ApiUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  accountStatus: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface ApiTask {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  taskStatus: string;
  priority: string;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ApiNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export interface ApiSupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  clientId: string;
  projectId?: string;
  messages: { content: string; senderRole: string; createdAt: string }[];
  escalationTier?: number;
  escalatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTimelineEntry {
  _id: string;
  projectId: string;
  entryType: string;
  title: string;
  content?: string;
  isClientVisible: boolean;
  createdByRole: string;
  createdAt: string;
}

// ─── Admin Dashboard ──────────────────────────────────────────

export interface AdminDashboard {
  activeProjectCount:    number;
  overdueProjectCount:   number;
  stalledProjectCount:   number;
  pendingApprovalsCount: number;
  newLeadsToday:         number;
  revenueThisMonth:      number;
  revenueLastMonth:      number;
  overdueProjects:       ApiProject[];
  recentTimelineEntries: ApiTimelineEntry[];
  pendingApprovalsList:  ApiApproval[];
  employeeWorkloadSummary: { employeeId: string; name: string; projectCount: number }[];
}

export async function fetchAdminDashboard(): Promise<AdminDashboard> {
  return get<AdminDashboard>("/dashboard/admin");
}

export async function fetchAdminRevenue(): Promise<{ thisMonth: number; lastMonth: number; total: number }> {
  return get("/dashboard/admin/revenue");
}

export async function fetchOverdueProjects(): Promise<ApiProject[]> {
  return get<ApiProject[]>("/dashboard/admin/overdue-projects");
}

export async function fetchPendingApprovals(): Promise<ApiApproval[]> {
  return get<ApiApproval[]>("/dashboard/admin/approvals");
}

// ─── Employee Dashboard ───────────────────────────────────────

export interface EmployeeDashboard {
  assignedProjectCount: number;
  tasksOverdueCount:    number;
  tasksDueToday:        number;
  pendingSubmissions:   number;
  recentProjects:       ApiProject[];
  myTasksList:          ApiTask[];
}

export async function fetchEmployeeDashboard(): Promise<EmployeeDashboard> {
  return get<EmployeeDashboard>("/dashboard/employee");
}

export async function fetchEmployeeTasks(): Promise<ApiTask[]> {
  return get<ApiTask[]>("/dashboard/employee/tasks");
}

// ─── Client Dashboard ─────────────────────────────────────────

export interface ClientDashboard {
  activeProjects:        ApiProject[];
  completedProjects:     ApiProject[];
  pendingPayments:       ApiInvoice[];
  recentTimelineEntries: ApiTimelineEntry[];
}

export async function fetchClientDashboard(): Promise<ClientDashboard> {
  return get<ClientDashboard>("/dashboard/client");
}

export async function fetchClientProjects(): Promise<ApiProject[]> {
  return get<ApiProject[]>("/dashboard/client/projects");
}

export async function fetchClientProjectById(id: string): Promise<ApiProject> {
  return get<ApiProject>(`/dashboard/client/projects/${id}`);
}

export async function fetchClientPayments(): Promise<ApiInvoice[]> {
  return get<ApiInvoice[]>("/dashboard/client/payments");
}

export async function fetchClientTimeline(): Promise<ApiTimelineEntry[]> {
  return get<ApiTimelineEntry[]>("/dashboard/client/timeline");
}

export async function fetchClientDocuments(): Promise<unknown[]> {
  return get<unknown[]>("/dashboard/client/documents");
}

// ─── Projects ─────────────────────────────────────────────────

export interface ProjectsQuery {
  status?: string;
  clientId?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchProjects(query: ProjectsQuery = {}): Promise<{ projects: ApiProject[]; total: number; meta: unknown }> {
  const params = new URLSearchParams();
  if (query.status)     params.set("status",     query.status);
  if (query.clientId)   params.set("clientId",   query.clientId);
  if (query.assignedTo) params.set("assignedTo", query.assignedTo);
  if (query.page)       params.set("page",        String(query.page));
  if (query.limit)      params.set("limit",       String(query.limit ?? 20));
  if (query.search)     params.set("search",      query.search);
  return get(`/projects?${params.toString()}`);
}

export async function fetchProjectById(id: string): Promise<ApiProject> {
  return get<ApiProject>(`/projects/${id}`);
}

export async function fetchProjectSummary(id: string): Promise<ApiProject & { taskSummary?: unknown; financials?: unknown }> {
  return get(`/projects/${id}/summary`);
}

export async function updateProjectStatus(id: string, status: string, note?: string): Promise<ApiProject> {
  return patch<ApiProject>(`/projects/${id}/status`, { status, note });
}

export async function assignProject(id: string, employeeUserId: string): Promise<ApiProject> {
  return patch<ApiProject>(`/projects/${id}/assign`, { employeeUserId });
}

export async function submitProjectForReview(id: string, note?: string): Promise<unknown> {
  return post(`/projects/${id}/submit-for-review`, { note });
}

// ─── Tasks ────────────────────────────────────────────────────

export async function fetchTasks(projectId?: string): Promise<ApiTask[]> {
  const qs = projectId ? `?projectId=${projectId}` : "";
  return get<ApiTask[]>(`/tasks${qs}`);
}

export async function createTask(data: {
  projectId: string;
  title: string;
  description?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
}): Promise<ApiTask> {
  return post<ApiTask>("/tasks", data);
}

export async function updateTask(id: string, data: Partial<ApiTask>): Promise<ApiTask> {
  return patch<ApiTask>(`/tasks/${id}`, data);
}

export async function completeTask(id: string): Promise<ApiTask> {
  return patch<ApiTask>(`/tasks/${id}/complete`, {});
}

// ─── Leads ───────────────────────────────────────────────────

export interface LeadsQuery {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchLeads(query: LeadsQuery = {}): Promise<{ leads: ApiLead[]; total: number; meta: unknown }> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page)   params.set("page",   String(query.page));
  if (query.limit)  params.set("limit",  String(query.limit ?? 20));
  if (query.search) params.set("search", query.search);
  return get(`/leads?${params.toString()}`);
}

export async function fetchLeadById(id: string): Promise<ApiLead> {
  return get<ApiLead>(`/leads/${id}`);
}

export async function updateLeadStatus(id: string, status: string): Promise<ApiLead> {
  return patch<ApiLead>(`/leads/${id}/status`, { status });
}

export async function convertLead(id: string): Promise<unknown> {
  return patch(`/leads/${id}/convert`, {});
}

export async function addLeadNote(id: string, content: string): Promise<unknown> {
  return post(`/leads/${id}/notes`, { content });
}

// ─── Approvals ────────────────────────────────────────────────

export async function fetchApprovals(status?: string): Promise<{ approvals: ApiApproval[]; total: number }> {
  const qs = status ? `?status=${status}` : "";
  return get(`/approvals${qs}`);
}

export async function approveSubmission(id: string, note?: string): Promise<ApiApproval> {
  return patch<ApiApproval>(`/approvals/${id}/approve`, { note });
}

export async function rejectSubmission(id: string, note: string): Promise<ApiApproval> {
  return patch<ApiApproval>(`/approvals/${id}/reject`, { note });
}

export async function requestRevision(id: string, note: string): Promise<ApiApproval> {
  return patch<ApiApproval>(`/approvals/${id}/request-revision`, { note });
}

// ─── Invoices & Payments ──────────────────────────────────────

export async function fetchInvoices(clientId?: string): Promise<{ invoices: ApiInvoice[]; total: number }> {
  const qs = clientId ? `?clientId=${clientId}` : "";
  return get(`/invoices${qs}`);
}

export async function fetchPayments(invoiceId?: string): Promise<unknown[]> {
  const qs = invoiceId ? `?invoiceId=${invoiceId}` : "";
  return get<unknown[]>(`/payments${qs}`);
}

// ─── Users ───────────────────────────────────────────────────

export async function fetchUsers(role?: string): Promise<ApiUser[]> {
  const qs = role ? `?role=${role}` : "";
  return get<ApiUser[]>(`/users${qs}`);
}

export async function fetchUserById(id: string): Promise<ApiUser> {
  return get<ApiUser>(`/users/${id}`);
}

export async function createEmployee(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  password: string;
}): Promise<ApiUser> {
  return post<ApiUser>("/users/employees", data);
}

export async function deactivateUser(id: string): Promise<void> {
  await patch(`/users/${id}/deactivate`, {});
}

// ─── Support Tickets ──────────────────────────────────────────

export async function fetchTickets(query: { status?: string; page?: number } = {}): Promise<{ tickets: ApiSupportTicket[]; total: number }> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.page)   params.set("page",   String(query.page));
  return get(`/support/tickets?${params.toString()}`);
}

export async function fetchTicketById(id: string): Promise<ApiSupportTicket> {
  return get<ApiSupportTicket>(`/support/tickets/${id}`);
}

export async function createTicket(data: { subject: string; message: string; projectId?: string; category?: string }): Promise<ApiSupportTicket> {
  return post<ApiSupportTicket>("/support/tickets", data);
}

export async function addTicketMessage(id: string, content: string): Promise<unknown> {
  return post(`/support/tickets/${id}/messages`, { content });
}

export async function updateTicketStatus(id: string, status: string): Promise<ApiSupportTicket> {
  return patch<ApiSupportTicket>(`/support/tickets/${id}`, { status });
}

// ─── Notifications ────────────────────────────────────────────

export async function fetchUnreadCount(): Promise<number> {
  const result = await get<{ count: number }>("/notifications/unread-count");
  return result.count;
}

export async function fetchNotifications(page = 1): Promise<{ notifications: ApiNotification[]; total: number }> {
  return get(`/notifications?page=${page}&limit=20`);
}

export async function markNotifRead(id: string): Promise<void> {
  await patch(`/notifications/${id}/read`);
}

export async function markAllNotifRead(): Promise<void> {
  await patch("/notifications/read-all");
}

export async function dismissNotif(id: string): Promise<void> {
  await del(`/notifications/${id}`);
}

// ─── Timeline ─────────────────────────────────────────────────

export async function fetchProjectTimeline(projectId: string): Promise<ApiTimelineEntry[]> {
  return get<ApiTimelineEntry[]>(`/timeline/${projectId}`);
}

export async function addTimelineEntry(projectId: string, data: { title: string; content: string; isClientVisible: boolean }): Promise<ApiTimelineEntry> {
  return post<ApiTimelineEntry>("/timeline", { projectId, ...data });
}

// ─── Admin Settings ───────────────────────────────────────────

export async function fetchSystemSettings(): Promise<unknown[]> {
  return get<unknown[]>("/admin/settings");
}

export async function updateSystemSetting(key: string, value: unknown): Promise<unknown> {
  return patch(`/admin/settings/${key}`, { value });
}

// ─── Admin Jobs ───────────────────────────────────────────────

export async function fetchScheduledJobs(): Promise<unknown[]> {
  return get<unknown[]>("/admin/jobs");
}

export async function toggleScheduledJob(jobName: string): Promise<unknown> {
  return patch(`/admin/jobs/${jobName}/toggle`, {});
}

export async function fetchFailedJobs(): Promise<unknown[]> {
  return get<unknown[]>("/admin/jobs/failed");
}

// ─── Exports ─────────────────────────────────────────────────

export async function requestExport(data: { exportType: string; entityId?: string; filters?: unknown }): Promise<{ jobId: string }> {
  return post<{ jobId: string }>("/exports", data);
}

export async function fetchExportStatus(jobId: string): Promise<{ status: string; downloadUrl?: string }> {
  return get(`/exports/${jobId}`);
}

// ─── Status label helpers (frontend display) ─────────────────

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft:          "Draft",
  onboarding:     "Onboarding",
  active:         "Active",
  waiting_client: "Waiting Client",
  in_review:      "In Review",
  completed:      "Completed",
  delivered:      "Delivered",
  archived:       "Archived",
  cancelled:      "Cancelled",
};

export const PROJECT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:          { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  onboarding:     { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  active:         { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  waiting_client: { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  in_review:      { bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
  completed:      { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  delivered:      { bg: "rgba(22,163,74,0.15)",   color: "#14532D" },
  archived:       { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  cancelled:      { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new:       "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost:      "Lost",
  archived:  "Archived",
};
