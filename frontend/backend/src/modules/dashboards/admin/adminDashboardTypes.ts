/**
 * Admin Dashboard — Type Definitions & DTOs
 *
 * Strict TypeScript contracts for the admin analytics dashboard.
 * All service functions and route handlers must use these types.
 */

// ─── Query / Filter Types ─────────────────────────────────────────────────────

export type DashboardPeriod =
  | 'today'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom';

export interface ResolvedDateRange {
  from: Date;
  to:   Date;
}

export interface AdminDashboardQuery {
  /** Time window for date-filtered metrics (default: 'month') */
  period?: DashboardPeriod;
  /** ISO date string — required when period === 'custom' */
  from?: string;
  /** ISO date string — required when period === 'custom' */
  to?: string;
  /** Max items in preview lists (1–20, default: 5) */
  limit?: number;
}

// ─── Revenue Summary ──────────────────────────────────────────────────────────

export interface RevenueByStatus {
  /** Sum of amountPaid for Paid invoices (paise) */
  paid:          number;
  /** Sum of amountPaid for PartiallyPaid invoices (paise) */
  partiallyPaid: number;
  /** Unpaid portion of Overdue invoices (paise) */
  overdue:       number;
  /** Unpaid portion of Disputed invoices (paise) */
  disputed:      number;
  /** Total unpaid across Issued + PartiallyPaid + Overdue (paise) */
  outstanding:   number;
}

export interface InvoiceCounts {
  total:         number;
  paid:          number;
  partiallyPaid: number;
  overdue:       number;
  disputed:      number;
  draft:         number;
  cancelled:     number;
}

export interface RevenueSummary {
  /** Total captured payments ever (paise) */
  totalCollected:  number;
  /** Captured payments within the requested date window (paise) */
  periodCollected: number;
  /** Captured payments today (paise) */
  todayCollected:  number;
  /** Captured payments last 7 days (paise) */
  weekCollected:   number;
  /** Captured payments last 30 days (paise) */
  monthCollected:  number;
  byStatus:        RevenueByStatus;
  /** Reserved — Phase 2 advance tracking */
  pendingAdvances: number;
  invoiceCounts:   InvoiceCounts;
}

// ─── Overdue Projects Summary ─────────────────────────────────────────────────

export interface OverdueAgeBucket {
  label: string;
  count: number;
}

export interface OverdueProjectPreview {
  projectId:             string;
  /** Human-readable project code e.g. KT-00042 */
  projectNumber:         string;
  status:                string;
  priority:              string;
  daysOverdue:           number;
  expectedDeliveryDate?: Date;
}

export interface OverdueProjectsSummary {
  total:        number;
  byStatus:     Record<string, number>;
  byPriority:   Record<string, number>;
  ageBuckets:   OverdueAgeBucket[];
  stalledCount: number;
  preview:      OverdueProjectPreview[];
}

// ─── Pending Approvals Summary ────────────────────────────────────────────────

export interface OverdueByAge {
  overOneDayCount:   number;
  overThreeDayCount: number;
  overSevenDayCount: number;
}

export interface PendingApprovalPreview {
  approvalId:        string;
  approvalType:      string;
  priority:          string;
  submittedAt:       Date;
  daysPending:       number;
  resubmissionCount: number;
}

export interface PendingApprovalsSummary {
  total:             number;
  pending:           number;
  underReview:       number;
  revisionRequested: number;
  overdueByAge:      OverdueByAge;
  preview:           PendingApprovalPreview[];
}

// ─── Lead Metrics Summary ─────────────────────────────────────────────────────

export interface LeadStatusCounts {
  new:          number;
  contacted:    number;
  qualified:    number;
  proposalSent: number;
  onboarding:   number;
  converted:    number;
  lost:         number;
  archived:     number;
}

export interface TrendPoint {
  date:  string;
  count: number;
}

export interface LeadMetricsSummary {
  total:           number;
  active:          number;
  periodNew:       number;
  todayNew:        number;
  weekNew:         number;
  monthNew:        number;
  byStatus:        LeadStatusCounts;
  /** 0–100 integer percentage (converted / (converted + lost)) */
  conversionRate:  number;
  followUpOverdue: number;
  unassigned:      number;
  last7DaysTrend:  TrendPoint[];
}

// ─── Workload Metrics Summary ─────────────────────────────────────────────────

export interface EmployeeWorkloadItem {
  employeeId:       string;
  name:             string;
  activeProjects:   number;
  activeTasks:      number;
  overdueTasks:     number;
  blockedTasks:     number;
  inReviewProjects: number;
}

export interface TasksByStatus {
  todo:       number;
  inProgress: number;
  inReview:   number;
  blocked:    number;
  completed:  number;
}

export interface WorkloadSummary {
  totalActiveProjects:      number;
  totalUnassignedProjects:  number;
  totalBlockedTasks:        number;
  totalOverdueTasks:        number;
  inReviewProjects:         number;
  waitingClientProjects:    number;
  /** Top 10 employees by active project count */
  employeeWorkload:         EmployeeWorkloadItem[];
  tasksByStatus:            TasksByStatus;
}

// ─── Recent Activity Summary ──────────────────────────────────────────────────

export interface RecentProjectActivity {
  projectId:     string;
  projectNumber: string;
  status:        string;
  updatedAt:     Date;
}

export interface RecentLeadActivity {
  leadId:    string;
  fullName:  string;
  phone:     string;
  status:    string;
  source:    string;
  createdAt: Date;
}

export interface RecentPaymentActivity {
  paymentId:    string;
  invoiceId:    string;
  amountPaise:  number;
  status:       string;
  method:       string;
  initiatedAt:  Date;
}

export interface RecentApprovalActivity {
  approvalId:   string;
  approvalType: string;
  status:       string;
  submittedAt:  Date;
  daysPending:  number;
}

export interface RecentSupportActivity {
  ticketId:     string;
  ticketNumber: string;
  subject:      string;
  status:       string;
  priority:     string;
  createdAt:    Date;
}

export interface RecentExportActivity {
  exportId:    string;
  exportType:  string;
  status:      string;
  requestedAt: Date;
}

export interface RecentActivitySummary {
  projects:  RecentProjectActivity[];
  leads:     RecentLeadActivity[];
  payments:  RecentPaymentActivity[];
  approvals: RecentApprovalActivity[];
  support:   RecentSupportActivity[];
  exports:   RecentExportActivity[];
}

// ─── Full Admin Dashboard Response ───────────────────────────────────────────

export interface AdminDashboardResponse {
  /** ISO timestamp of snapshot generation */
  generatedAt:      string;
  period:           DashboardPeriod;
  dateRange:        { from: string; to: string };
  revenue:          RevenueSummary;
  overdueProjects:  OverdueProjectsSummary;
  pendingApprovals: PendingApprovalsSummary;
  leads:            LeadMetricsSummary;
  workload:         WorkloadSummary;
  recentActivity:   RecentActivitySummary;
}
