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
  priority?: string;
  leadSource?: string;
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

// ─── Admin Dashboard (Batch 5.1 — matches backend AdminDashboardResponse) ─────

export interface AdminRevenueSummary {
  totalCollected:  number; // paise
  periodCollected: number;
  todayCollected:  number;
  weekCollected:   number;
  monthCollected:  number;
  byStatus: {
    paid:          number;
    partiallyPaid: number;
    overdue:       number;
    disputed:      number;
    outstanding:   number;
  };
  pendingAdvances: number;
  invoiceCounts: {
    total:         number;
    paid:          number;
    partiallyPaid: number;
    overdue:       number;
    disputed:      number;
    draft:         number;
    cancelled:     number;
  };
}

export interface AdminOverdueProjectsSummary {
  total:        number;
  byStatus:     Record<string, number>;
  byPriority:   Record<string, number>;
  ageBuckets:   { label: string; count: number }[];
  stalledCount: number;
  preview: {
    projectId:             string;
    projectNumber:         string;
    status:                string;
    priority:              string;
    daysOverdue:           number;
    expectedDeliveryDate?: string;
  }[];
}

export interface AdminPendingApprovalsSummary {
  total:             number;
  pending:           number;
  underReview:       number;
  revisionRequested: number;
  overdueByAge: {
    overOneDayCount:   number;
    overThreeDayCount: number;
    overSevenDayCount: number;
  };
  preview: {
    approvalId:        string;
    approvalType:      string;
    priority:          string;
    submittedAt:       string;
    daysPending:       number;
    resubmissionCount: number;
  }[];
}

export interface AdminLeadMetricsSummary {
  total:           number;
  active:          number;
  periodNew:       number;
  todayNew:        number;
  weekNew:         number;
  monthNew:        number;
  byStatus: {
    new:          number;
    contacted:    number;
    qualified:    number;
    proposalSent: number;
    onboarding:   number;
    converted:    number;
    lost:         number;
    archived:     number;
  };
  conversionRate:  number;
  followUpOverdue: number;
  unassigned:      number;
  last7DaysTrend:  { date: string; count: number }[];
}

export interface AdminWorkloadSummary {
  totalActiveProjects:     number;
  totalUnassignedProjects: number;
  totalBlockedTasks:       number;
  totalOverdueTasks:       number;
  inReviewProjects:        number;
  waitingClientProjects:   number;
  employeeWorkload: {
    employeeId:       string;
    name:             string;
    activeProjects:   number;
    activeTasks:      number;
    overdueTasks:     number;
    blockedTasks:     number;
    inReviewProjects: number;
  }[];
  tasksByStatus: {
    todo:       number;
    inProgress: number;
    inReview:   number;
    blocked:    number;
    completed:  number;
  };
}

export interface AdminRecentActivity {
  projects:  { projectId: string; projectNumber: string; status: string; updatedAt: string }[];
  leads:     { leadId: string; fullName: string; phone: string; status: string; source: string; createdAt: string }[];
  payments:  { paymentId: string; invoiceId: string; amountPaise: number; status: string; method: string; initiatedAt: string }[];
  approvals: { approvalId: string; approvalType: string; status: string; submittedAt: string; daysPending: number }[];
  support:   { ticketId: string; ticketNumber: string; subject: string; status: string; priority: string; createdAt: string }[];
  exports:   { exportId: string; exportType: string; status: string; requestedAt: string }[];
}

/** New full admin dashboard response shape — Batch 5.1 */
export interface AdminDashboardResponse {
  generatedAt:      string;
  period:           string;
  dateRange:        { from: string; to: string };
  revenue:          AdminRevenueSummary;
  overdueProjects:  AdminOverdueProjectsSummary;
  pendingApprovals: AdminPendingApprovalsSummary;
  leads:            AdminLeadMetricsSummary;
  workload:         AdminWorkloadSummary;
  recentActivity:   AdminRecentActivity;
  clientStats:      AdminClientStats;
  followUpCounts:   FollowUpCounts;
}

export interface AdminClientStats {
  totalClients:      number;
  activeClients:     number;
  newClientsToday:   number;
  newClientsMonth:   number;
  activeEmployees:   number;
}

export interface FollowUpCounts {
  overdue:  number;
  today:    number;
  upcoming: number;
  total:    number;
}

/** Legacy alias kept so other files that import AdminDashboard don't break */
export type AdminDashboard = AdminDashboardResponse;

export async function fetchAdminDashboard(
  params?: { period?: string; limit?: number },
): Promise<AdminDashboardResponse> {
  const q = new URLSearchParams();
  if (params?.period) q.set("period", params.period);
  if (params?.limit)  q.set("limit",  String(params.limit));
  const qs = q.toString();
  return get<AdminDashboardResponse>(`/dashboard/admin${qs ? `?${qs}` : ""}`);
}

export async function fetchAdminRevenueSummary(period?: string): Promise<AdminRevenueSummary> {
  return get<AdminRevenueSummary>(`/dashboard/admin/revenue${period ? `?period=${period}` : ""}`);
}

export async function fetchAdminOverdueSummary(): Promise<AdminOverdueProjectsSummary> {
  return get<AdminOverdueProjectsSummary>("/dashboard/admin/overdue-projects");
}

export async function fetchAdminApprovalsSummary(): Promise<AdminPendingApprovalsSummary> {
  return get<AdminPendingApprovalsSummary>("/dashboard/admin/approvals");
}

export async function fetchAdminLeadsSummary(period?: string): Promise<AdminLeadMetricsSummary> {
  return get<AdminLeadMetricsSummary>(`/dashboard/admin/leads${period ? `?period=${period}` : ""}`);
}

export async function fetchAdminWorkloadSummary(): Promise<AdminWorkloadSummary> {
  return get<AdminWorkloadSummary>("/dashboard/admin/workload");
}

export async function fetchAdminRecentActivity(limit?: number): Promise<AdminRecentActivity> {
  return get<AdminRecentActivity>(`/dashboard/admin/activity${limit ? `?limit=${limit}` : ""}`);
}

// Legacy compat shims (kept so old import sites compile)
export async function fetchAdminRevenue() { return fetchAdminRevenueSummary(); }
export async function fetchOverdueProjects() { return fetchAdminOverdueSummary(); }
export async function fetchPendingApprovals() { return fetchAdminApprovalsSummary(); }

// ─── Employee Dashboard — Rich Types (Batch 5.2) ──────────────

export interface EmpTaskCountSummary {
  total: number;
  active: number;
  blocked: number;
  overdue: number;
  completed: number;
  waitingReview: number;
  todo: number;
}

export interface EmpTaskPreviewItem {
  taskId: string;
  title: string;
  taskStatus: string;
  taskPriority: string;
  projectId: string;
  projectCode: string;
  dueDate?: string;
  isOverdue: boolean;
  isBlocked: boolean;
}

export interface EmpAssignedTaskSummary {
  counts: EmpTaskCountSummary;
  recentlyAssigned: EmpTaskPreviewItem[];
  overdueTasks: EmpTaskPreviewItem[];
  dueTodayTasks: EmpTaskPreviewItem[];
}

export interface EmpDueTodayItem {
  type: 'task' | 'project';
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  projectCode?: string;
}

export interface EmpDueTodaySummary {
  total: number;
  overdue: number;
  items: EmpDueTodayItem[];
}

export interface EmpPendingReviewItem {
  approvalId: string;
  approvalType: string;
  approvalStatus: string;
  reviewPriority: string;
  projectId?: string;
  projectCode?: string;
  taskId?: string;
  taskTitle?: string;
  submittedAt?: string;
  resubmissionCount: number;
}

export interface EmpPendingReviewSummary {
  total: number;
  pending: number;
  underReview: number;
  revisionRequested: number;
  items: EmpPendingReviewItem[];
}

export interface EmpProjectPreviewItem {
  projectId: string;
  projectCode: string;
  clientName: string;
  serviceName: string;
  projectStatus: string;
  projectPriority: string;
  isOverdue: boolean;
  isStalled: boolean;
  expectedDeliveryDate?: string;
  openTaskCount: number;
  completedTaskCount: number;
  lastActivityAt?: string;
}

export interface EmpActiveProjectSummary {
  total: number;
  active: number;
  waitingClient: number;
  inReview: number;
  overdue: number;
  stalled: number;
  projects: EmpProjectPreviewItem[];
}

export interface EmpWorkloadSummary {
  openTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  waitingReviewTasks: number;
  activeProjects: number;
  overdueProjects: number;
  stalledProjects: number;
  pendingApprovals: number;
  completedTodayTasks: number;
}

export interface EmployeeDashboard {
  employeeId: string;
  employeeProfileId: string;
  generatedAt: string;
  window: string;
  workload: EmpWorkloadSummary;
  tasks: EmpAssignedTaskSummary;
  dueToday: EmpDueTodaySummary;
  pendingReviews: EmpPendingReviewSummary;
  activeProjects: EmpActiveProjectSummary;
}

export async function fetchEmployeeDashboard(): Promise<EmployeeDashboard> {
  return get<EmployeeDashboard>("/dashboard/employee");
}

export async function fetchEmployeeWorkload(): Promise<EmpWorkloadSummary> {
  return get<EmpWorkloadSummary>("/dashboard/employee/workload");
}

export async function fetchEmployeeTaskSummary(): Promise<EmpAssignedTaskSummary> {
  return get<EmpAssignedTaskSummary>("/dashboard/employee/tasks");
}

export async function fetchEmployeeDueToday(): Promise<EmpDueTodaySummary> {
  return get<EmpDueTodaySummary>("/dashboard/employee/due-today");
}

export async function fetchEmployeePendingReviews(): Promise<EmpPendingReviewSummary> {
  return get<EmpPendingReviewSummary>("/dashboard/employee/reviews");
}

export async function fetchEmployeeActiveProjects(): Promise<EmpActiveProjectSummary> {
  return get<EmpActiveProjectSummary>("/dashboard/employee/projects");
}

// ─── Client Portal Types (match backend clientDashboardService + portalAggregations) ───

/** Lean project summary returned by client portal — NOT the full ApiProject */
export interface ClientProjectSummary {
  projectId:            string;
  projectCode:          string;
  title:                string;
  primaryServiceSlug:   string;
  projectStatus:        string;
  isOverdue:            boolean;
  isStalled:            boolean;
  expectedDeliveryDate?: string;
  progressPercentage:   number;
  pendingDocuments:     number;
}

/** Lean invoice summary returned by client portal */
export interface ClientInvoiceSummary {
  invoiceId:     string;
  invoiceNumber: string;
  invoiceStatus: string;
  totalAmount:   number;
  amountPaid:    number;
  amountDue:     number;
  dueDate?:      string;
}

/** Client-visible timeline entry (lean) */
export interface ClientTimelineEntry {
  entryId:      string;
  eventType:    string;
  title:        string;
  description?: string;
  createdAt:    string;
}

/** Full dashboard snapshot — GET /dashboard/client */
export interface ClientDashboardSnapshot {
  clientProfileId: string;
  totals: {
    activeProjects:      number;
    completedProjects:   number;
    overdueProjects:     number;
    pendingPayments:     number;
    unreadNotifications: number;
    openSupportTickets:  number;
  };
  activeProjects:  ClientProjectSummary[];
  recentTimeline:  ClientTimelineEntry[];
  pendingInvoices: ClientInvoiceSummary[];
}

/** Paginated project list — GET /dashboard/client/projects */
export interface ClientProjectListResponse {
  projects: ClientProjectSummary[];
  meta:     { page: number; limit: number; total: number; pages: number };
}

/** Payment summary — GET /dashboard/client/payments */
export interface ClientPaymentSummary {
  totalInvoiced:    number;
  totalPaid:        number;
  totalOutstanding: number;
  invoices: Array<{
    invoiceId:     string;
    invoiceNumber: string;
    invoiceStatus: string;
    totalAmount:   number;
    amountPaid:    number;
    amountDue:     number;
    dueDate?:      string;
    projectTitle?: string;
  }>;
  recentPayments: Array<{
    paymentId:     string;
    amount:        number;
    paymentStatus: string;
    paymentMethod: string;
    capturedAt?:   string;
    invoiceNumber: string;
  }>;
}

/** Timeline feed page — GET /dashboard/client/timeline */
export interface ClientTimelineFeedResponse {
  entries: Array<{
    entryId:      string;
    eventType:    string;
    title:        string;
    description?: string;
    projectCode:  string;
    projectTitle: string;
    createdAt:    string;
  }>;
  meta: { page: number; limit: number; total: number; pages: number };
}

/** Document list — GET /dashboard/client/documents */
export interface ClientDocument {
  documentId:      string;
  title:           string;
  fileName:        string;
  mimeType:        string;
  fileSizeBytes:   number;
  documentCategory: string;
  documentStatus:  string;
  versionNumber:   number;
  projectCode:     string;
  projectTitle:    string;
  uploadedAt:      string;
}

export interface ClientDocumentsResponse {
  documents: ClientDocument[];
  meta:      { page: number; limit: number; total: number; pages: number };
}

/** Project detail — GET /dashboard/client/projects/:id */
export interface ClientProjectDetail {
  projectId:             string;
  projectCode:           string;
  title:                 string;
  primaryServiceSlug:    string;
  projectStatus:         string;
  isOverdue:             boolean;
  isStalled:             boolean;
  expectedDeliveryDate?: string;
  progressPercentage:    number;
  assignedEmployeeName?: string;
  timeline: ClientTimelineEntry[];
  invoiceSummary: {
    invoiceStatus: string;
    totalAmount:   number;
    amountPaid:    number;
    amountDue:     number;
  } | null;
  documents: {
    total:         number;
    approved:      number;
    pendingReview: number;
  };
}

/** Legacy alias — kept so existing code that uses ClientDashboard doesn't break */
export type ClientDashboard = ClientDashboardSnapshot;

// ─── Client Dashboard API Functions ──────────────────────────

export async function fetchClientDashboard(): Promise<ClientDashboardSnapshot> {
  return get<ClientDashboardSnapshot>("/dashboard/client");
}

export async function fetchClientProjects(
  opts: { page?: number; limit?: number; status?: string } = {}
): Promise<ClientProjectListResponse> {
  const q = new URLSearchParams();
  if (opts.page)   q.set("page",   String(opts.page));
  if (opts.limit)  q.set("limit",  String(opts.limit));
  if (opts.status) q.set("status", opts.status);
  return get<ClientProjectListResponse>(`/dashboard/client/projects${q.toString() ? `?${q}` : ""}`);
}

export async function fetchClientProjectById(id: string): Promise<ClientProjectDetail> {
  return get<ClientProjectDetail>(`/dashboard/client/projects/${id}`);
}

export async function fetchClientPayments(): Promise<ClientPaymentSummary> {
  return get<ClientPaymentSummary>("/dashboard/client/payments");
}

export async function fetchClientTimeline(
  opts: { page?: number; limit?: number } = {}
): Promise<ClientTimelineFeedResponse> {
  const q = new URLSearchParams();
  if (opts.page)  q.set("page",  String(opts.page));
  if (opts.limit) q.set("limit", String(opts.limit));
  return get<ClientTimelineFeedResponse>(`/dashboard/client/timeline${q.toString() ? `?${q}` : ""}`);
}

export async function fetchClientDocuments(
  opts: { page?: number; limit?: number; projectId?: string } = {}
): Promise<ClientDocumentsResponse> {
  const q = new URLSearchParams();
  if (opts.page)      q.set("page",      String(opts.page));
  if (opts.limit)     q.set("limit",     String(opts.limit));
  if (opts.projectId) q.set("projectId", opts.projectId);
  return get<ClientDocumentsResponse>(`/dashboard/client/documents${q.toString() ? `?${q}` : ""}`);
}

export async function fetchClientNotifications(
  opts: { page?: number; limit?: number } = {}
): Promise<{ unreadCount: number; notifications: ApiNotification[]; meta: unknown }> {
  const q = new URLSearchParams();
  if (opts.page)  q.set("page",  String(opts.page));
  if (opts.limit) q.set("limit", String(opts.limit));
  return get(`/dashboard/client/notifications${q.toString() ? `?${q}` : ""}`);
}

// ─── Projects ─────────────────────────────────────────────────

export interface ProjectsQuery {
  status?: string;
  clientId?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isOverdue?: string;
  isStalled?: string;
  priority?: string;
}

export async function fetchProjects(query: ProjectsQuery = {}): Promise<{ projects: ApiProject[]; total: number; meta: unknown }> {
  const params = new URLSearchParams();
  if (query.status)     params.set("status",     query.status);
  if (query.clientId)   params.set("clientId",   query.clientId);
  if (query.assignedTo) params.set("assignedTo", query.assignedTo);
  if (query.page)       params.set("page",        String(query.page));
  if (query.limit)      params.set("limit",       String(query.limit ?? 20));
  if (query.search)     params.set("search",      query.search);
  if (query.sortBy)     params.set("sortBy",      query.sortBy);
  if (query.sortOrder)  params.set("sortOrder",   query.sortOrder);
  if (query.isOverdue)  params.set("isOverdue",   query.isOverdue);
  if (query.isStalled)  params.set("isStalled",   query.isStalled);
  if (query.priority)   params.set("priority",    query.priority);
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
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  priority?: string;
  assignedTo?: string;
  unassigned?: string;
  createdAfter?: string;
  createdBefore?: string;
}

export async function fetchLeads(query: LeadsQuery = {}): Promise<{ leads: ApiLead[]; total: number; meta: unknown }> {
  const params = new URLSearchParams();
  if (query.status)        params.set("status",        query.status);
  if (query.page)          params.set("page",          String(query.page));
  if (query.limit)         params.set("limit",         String(query.limit ?? 20));
  if (query.search)        params.set("search",        query.search);
  if (query.sortBy)        params.set("sortBy",        query.sortBy);
  if (query.sortOrder)     params.set("sortOrder",     query.sortOrder);
  if (query.priority)      params.set("priority",      query.priority);
  if (query.assignedTo)    params.set("assignedTo",    query.assignedTo);
  if (query.unassigned)    params.set("unassigned",    query.unassigned);
  if (query.createdAfter)  params.set("createdAfter",  query.createdAfter);
  if (query.createdBefore) params.set("createdBefore", query.createdBefore);
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

export interface InvoicesQuery {
  clientId?: string;
  projectId?: string;
  invoiceStatus?: string;
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function fetchInvoices(clientIdOrOpts?: string | InvoicesQuery): Promise<{ invoices: ApiInvoice[]; total: number }> {
  const params = new URLSearchParams();
  if (typeof clientIdOrOpts === "string") {
    params.set("clientId", clientIdOrOpts);
  } else if (clientIdOrOpts) {
    const q = clientIdOrOpts;
    if (q.clientId)       params.set("clientId",       q.clientId);
    if (q.projectId)      params.set("projectId",      q.projectId);
    if (q.invoiceStatus)  params.set("invoiceStatus",  q.invoiceStatus);
    if (q.page)           params.set("page",           String(q.page));
    if (q.limit)          params.set("limit",          String(q.limit ?? 20));
    if (q.search)         params.set("search",         q.search);
    if (q.dateFrom)       params.set("dateFrom",       q.dateFrom);
    if (q.dateTo)         params.set("dateTo",         q.dateTo);
    if (q.sortBy)         params.set("sortBy",         q.sortBy);
    if (q.sortOrder)      params.set("sortOrder",      q.sortOrder);
  }
  const qs = params.toString();
  return get(`/invoices${qs ? `?${qs}` : ""}`);
}

export async function fetchPayments(invoiceId?: string): Promise<unknown[]> {
  const qs = invoiceId ? `?invoiceId=${invoiceId}` : "";
  return get<unknown[]>(`/payments${qs}`);
}

// ─── Users ───────────────────────────────────────────────────

export async function fetchUsers(role?: string): Promise<ApiUser[]> {
  // Backend exposes role-specific sub-routes rather than a generic ?role= query.
  // Map the role argument to the correct path and extract the users array.
  if (role === "employee") {
    const result = await get<{ users: ApiUser[] }>("/users/employees");
    return result.users ?? [];
  }
  if (role === "client") {
    const result = await get<{ users: ApiUser[] }>("/users/clients");
    return result.users ?? [];
  }
  // Fallback: try employees list (admin context without role filter)
  const result = await get<{ users: ApiUser[] }>("/users/employees");
  return result.users ?? [];
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

// ─── Extended User Types (Batch 1) ────────────────────────────

export interface ApiClientProfile {
  _id: string;
  userId: string;
  organizationName?: string;
  category?: string;
  onboardingStatus?: string;
  serviceName?: string;
  serviceNotes?: string;
  workStatus?: string;
  followUpDate?: string;
  totalAmount?: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentStatus?: string;
  remarks?: string;
  communicationPreference?: string;
  createdAt?: string;
}

export interface ApiEmployeeProfile {
  _id: string;
  userId: string;
  designation: string;
  department: string;
  specializations?: string[];
  assignedRegions?: string[];
  activeProjectCount?: number;
  maxProjectCapacity?: number;
  employmentStatus?: string;
  joiningDate?: string;
  employeeCode?: string;
  workEmail?: string;
}

export interface ApiUserWithProfile {
  user: ApiUser & { whatsappNumber?: string; city?: string; address?: string };
  clientProfile?: ApiClientProfile;
  employeeProfile?: ApiEmployeeProfile;
  projects?: ApiProject[];
}

export interface CreateClientPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  whatsappNumber?: string;
  city?: string;
  address?: string;
  organizationName?: string;
  category?: string;
  serviceName?: string;
  serviceNotes?: string;
  workStatus?: string;
  followUpDate?: string;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: string;
  remarks?: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  whatsappNumber?: string;
  designation: string;
  department: string;
  city?: string;
  address?: string;
  specializations?: string[];
  maxProjectCapacity?: number;
  employeeCode?: string;
}

// ─── Extended User API (Batch 1) ──────────────────────────────

export async function fetchClientsEnhanced(opts: {
  page?: number; limit?: number; search?: string; status?: string; payStatus?: string;
  sortBy?: string; sortOrder?: "asc" | "desc";
} = {}): Promise<{ users: ApiUserWithProfile[]; meta: { total: number; page: number; limit: number; pages: number } }> {
  const q = new URLSearchParams();
  if (opts.page)       q.set("page",       String(opts.page));
  if (opts.limit)      q.set("limit",      String(opts.limit ?? 20));
  if (opts.search)     q.set("search",     opts.search);
  if (opts.status)     q.set("status",     opts.status);
  if (opts.payStatus)  q.set("payStatus",  opts.payStatus);
  if (opts.sortBy)     q.set("sortBy",     opts.sortBy);
  if (opts.sortOrder)  q.set("sortOrder",  opts.sortOrder);
  const result = await get<{ users: ApiUserWithProfile[]; meta: { total: number; page: number; limit: number; pages: number } }>(`/users/clients?${q}`);
  return result;
}

export async function fetchEmployeesEnhanced(opts: {
  page?: number; limit?: number; search?: string; status?: string; department?: string;
  sortBy?: string; sortOrder?: "asc" | "desc";
} = {}): Promise<{ users: ApiUserWithProfile[]; meta: { total: number; page: number; limit: number; pages: number } }> {
  const q = new URLSearchParams();
  if (opts.page)       q.set("page",       String(opts.page));
  if (opts.limit)      q.set("limit",      String(opts.limit ?? 20));
  if (opts.search)     q.set("search",     opts.search);
  if (opts.status)     q.set("status",     opts.status);
  if (opts.department) q.set("department", opts.department);
  if (opts.sortBy)     q.set("sortBy",     opts.sortBy);
  if (opts.sortOrder)  q.set("sortOrder",  opts.sortOrder);
  const result = await get<{ users: ApiUserWithProfile[]; meta: { total: number; page: number; limit: number; pages: number } }>(`/users/employees?${q}`);
  return result;
}

export async function fetchClientDetail(id: string): Promise<ApiUserWithProfile> {
  return get<ApiUserWithProfile>(`/users/clients/${id}`);
}

export async function fetchEmployeeDetail(id: string): Promise<ApiUserWithProfile> {
  return get<ApiUserWithProfile>(`/users/employees/${id}`);
}

export async function createClient(data: CreateClientPayload): Promise<ApiUserWithProfile> {
  return post<ApiUserWithProfile>("/users/clients", data);
}

export async function createEmployeeEnhanced(data: CreateEmployeePayload): Promise<ApiUserWithProfile> {
  return post<ApiUserWithProfile>("/users/employees", data);
}

export async function updateClient(id: string, data: Partial<CreateClientPayload>): Promise<ApiUserWithProfile> {
  return patch<ApiUserWithProfile>(`/users/clients/${id}`, data);
}

export async function updateEmployee(id: string, data: Partial<CreateEmployeePayload>): Promise<ApiUserWithProfile> {
  return patch<ApiUserWithProfile>(`/users/employees/${id}`, data);
}

export async function deactivateClient(id: string): Promise<void> {
  await patch(`/users/clients/${id}/deactivate`, {});
}

export async function reactivateClient(id: string): Promise<void> {
  await patch(`/users/clients/${id}/reactivate`, {});
}

export async function archiveClient(id: string): Promise<void> {
  await del(`/users/clients/${id}`);
}

export async function deactivateEmployeeById(id: string): Promise<void> {
  await patch(`/users/employees/${id}/deactivate`, {});
}

export async function reactivateEmployee(id: string): Promise<void> {
  await patch(`/users/employees/${id}/reactivate`, {});
}

export async function archiveEmployee(id: string): Promise<void> {
  await del(`/users/employees/${id}`);
}

// ─── Follow-Up Center (Batch 2) ───────────────────────────────

export interface ApiFollowUp {
  _id: string;
  fullName: string;
  phone: string;
  email?: string;
  organisationName?: string;
  status: string;
  priority: string;
  followUpDate: string;
  lastContactedAt?: string;
  internalNotes?: string;
  notes?: string;
}

export type FollowUpBucket = 'all' | 'today' | 'overdue' | 'upcoming';

export interface FollowUpsQuery {
  bucket?: FollowUpBucket;
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchFollowUps(query: FollowUpsQuery = {}): Promise<{
  followUps: ApiFollowUp[];
  total: number;
  meta: { page: number; limit: number; pages: number };
}> {
  const q = new URLSearchParams();
  if (query.bucket) q.set('bucket', query.bucket);
  if (query.page)   q.set('page',   String(query.page));
  if (query.limit)  q.set('limit',  String(query.limit ?? 20));
  if (query.search) q.set('search', query.search);
  return get(`/followups?${q}`);
}

export async function fetchFollowUpCounts(): Promise<FollowUpCounts> {
  return get<FollowUpCounts>('/followups/counts');
}

export async function snoozeFollowUp(id: string, days = 1): Promise<{ newFollowUpDate: string }> {
  return patch(`/followups/${id}/snooze`, { days });
}

export async function markFollowUpDone(id: string, note?: string): Promise<void> {
  await patch(`/followups/${id}/done`, { note });
}

export async function updateLeadFollowUpDate(id: string, followUpDate: string): Promise<ApiLead> {
  return patch<ApiLead>(`/leads/${id}`, { followUpDate });
}


// ─── Excel Export Helpers ─────────────────────────────────────────────────────

import { downloadBlob } from "@/lib/api";

export interface CrmExportFilters {
  search?:        string;
  status?:        string;
  assignedTo?:    string;
  dateFrom?:      string;
  dateTo?:        string;
  paymentStatus?: string;
  priority?:      string;
}

function buildExportUrl(target: string, filters: CrmExportFilters = {}): string {
  const q = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
  const qs = q.toString();
  return `/api/v1/exports/excel/${target}${qs ? `?${qs}` : ""}`;
}

export async function exportClients(filters?: CrmExportFilters):   Promise<void> { await downloadBlob(buildExportUrl("clients",          filters), "clients-export.xlsx"); }
export async function exportEmployees(filters?: CrmExportFilters): Promise<void> { await downloadBlob(buildExportUrl("employees",        filters), "employees-export.xlsx"); }
export async function exportProjects(filters?: CrmExportFilters):  Promise<void> { await downloadBlob(buildExportUrl("projects",         filters), "projects-export.xlsx"); }
export async function exportPayments(filters?: CrmExportFilters):  Promise<void> { await downloadBlob(buildExportUrl("payments",         filters), "payments-export.xlsx"); }
export async function exportLeads(filters?: CrmExportFilters):     Promise<void> { await downloadBlob(buildExportUrl("leads",            filters), "leads-export.xlsx"); }
export async function exportSupport(filters?: CrmExportFilters):   Promise<void> { await downloadBlob(buildExportUrl("support",          filters), "support-export.xlsx"); }
export async function exportFollowups():                           Promise<void> { await downloadBlob(buildExportUrl("followups"),                 "followups-export.xlsx"); }
export async function exportDashboardReport():                     Promise<void> { await downloadBlob(buildExportUrl("dashboard_report"),          "crm-summary-report.xlsx"); }
