/**
 * Employee Dashboard — Types & DTOs
 * Batch 5.2
 *
 * All types are scoped to what an employee is permitted to see.
 * No admin-only fields (internalNotes, full invoice breakdowns, etc.) are exposed.
 */

import { TaskStatus, TaskPriority } from '../../../models/taskEnums';
import { ProjectStatus, ProjectPriority } from '../../../models/projectEnums';

// ─── Query Options ─────────────────────────────────────────────────────────────

export type DashboardWindow = 'today' | 'week' | 'month' | 'custom';

export interface EmployeeDashboardQuery {
  window?: DashboardWindow;
  dateFrom?: Date;
  dateTo?: Date;
  /** Number of preview items to return per list section (default: 5) */
  previewLimit?: number;
}

// ─── Task Summaries ───────────────────────────────────────────────────────────

export interface TaskCountSummary {
  total: number;
  active: number;
  blocked: number;
  overdue: number;
  completed: number;
  waitingReview: number;
  todo: number;
}

export interface TaskPreviewItem {
  taskId: string;
  title: string;
  taskStatus: TaskStatus;
  taskPriority: TaskPriority;
  projectId: string;
  projectCode: string;
  dueDate?: string;
  isOverdue: boolean;
  isBlocked: boolean;
}

export interface AssignedTaskSummary {
  counts: TaskCountSummary;
  recentlyAssigned: TaskPreviewItem[];
  overdueTasks: TaskPreviewItem[];
  dueTodayTasks: TaskPreviewItem[];
}

// ─── Due Today ────────────────────────────────────────────────────────────────

export interface DueTodayItem {
  type: 'task' | 'project';
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  isOverdue: boolean;
  projectCode?: string;
}

export interface DueTodaySummary {
  total: number;
  overdue: number;
  items: DueTodayItem[];
}

// ─── Pending Reviews ─────────────────────────────────────────────────────────

export interface PendingReviewItem {
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

export interface PendingReviewSummary {
  total: number;
  pending: number;
  underReview: number;
  revisionRequested: number;
  items: PendingReviewItem[];
}

// ─── Active Projects ──────────────────────────────────────────────────────────

export interface ProjectPreviewItem {
  projectId: string;
  projectCode: string;
  clientName: string;
  serviceName: string;
  projectStatus: ProjectStatus;
  projectPriority: ProjectPriority;
  isOverdue: boolean;
  isStalled: boolean;
  expectedDeliveryDate?: string;
  openTaskCount: number;
  completedTaskCount: number;
  lastActivityAt?: string;
}

export interface ActiveProjectSummary {
  total: number;
  active: number;
  waitingClient: number;
  inReview: number;
  overdue: number;
  stalled: number;
  projects: ProjectPreviewItem[];
}

// ─── Workspace Workload ───────────────────────────────────────────────────────

export interface WorkloadSummary {
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

// ─── Full Dashboard Response ──────────────────────────────────────────────────

export interface EmployeeDashboardResponse {
  employeeId: string;
  employeeProfileId: string;
  generatedAt: string;
  window: DashboardWindow;
  workload: WorkloadSummary;
  tasks: AssignedTaskSummary;
  dueToday: DueTodaySummary;
  pendingReviews: PendingReviewSummary;
  activeProjects: ActiveProjectSummary;
}
