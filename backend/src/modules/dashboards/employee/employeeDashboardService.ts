/**
 * Employee Dashboard Service
 * Batch 5.2
 *
 * Aggregates workspace data from existing modules (projects, tasks, approvals)
 * scoped strictly to the authenticated employee. No business logic is duplicated
 * from domain modules — this layer only queries and shapes data for the workspace.
 *
 * Security contract:
 *  - Every query uses the User._id (userId) for filters — tasks, projects,
 *    and approvals all store User references, not EmployeeProfile references.
 *  - Internal admin fields (internalNotes, full invoice breakdowns) are stripped.
 *  - Caller must provide a verified userId extracted from the auth token.
 *
 * Performance contract:
 *  - All aggregations within each section run in parallel via Promise.all.
 *  - All top-level dashboard sections also run in parallel.
 *  - Queries use indexed fields (assignedEmployeeIds, assignedEmployees.userId).
 */

import { Types } from 'mongoose';
import { ProjectModel } from '../../../models/project';
import { Task as TaskModel } from '../../../models/task';
import { ApprovalModel } from '../../../models/approval';
import { ProjectStatus, ProjectPriority, ACTIVE_WORK_STATUSES } from '../../../models/projectEnums';
import { TaskStatus, TaskPriority, TASK_OPEN_STATUSES } from '../../../models/taskEnums';
import { ApprovalStatus } from '../../../models/documentEnums';

import {
  buildTaskEmployeeFilter,
  buildProjectEmployeeFilter,
  startOfDay,
  endOfDay,
  toStr,
  toISOStr,
} from '../../workspace/workspaceHelpers';

import {
  type EmployeeDashboardQuery,
  type EmployeeDashboardResponse,
  type TaskCountSummary,
  type TaskPreviewItem,
  type AssignedTaskSummary,
  type DueTodaySummary,
  type DueTodayItem,
  type PendingReviewSummary,
  type PendingReviewItem,
  type ActiveProjectSummary,
  type ProjectPreviewItem,
  type WorkloadSummary,
  type DashboardWindow,
} from './employeeDashboardTypes';

// ─── Internal Typing Helpers ──────────────────────────────────────────────────

/** Shape returned by Mongoose .aggregate() group-by-status operations. */
interface StatusGroupRow {
  _id: string;
  count: number;
}

/** Shape returned by the task-count-per-project aggregation. */
interface TaskCountRow {
  _id: Types.ObjectId;
  open: number;
  completed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PREVIEW_LIMIT = 5;
const MAX_PREVIEW_LIMIT = 20;

/** Task statuses that count as "active" in the workload view. */
const ACTIVE_TASK_STATUSES = [
  TaskStatus.Queued,
  TaskStatus.InProgress,
  TaskStatus.WaitingReview,
  TaskStatus.WaitingClient,
];

/** Task statuses that are neither completed nor cancelled — still actionable. */
const NON_TERMINAL_TASK_STATUSES = [
  TaskStatus.Todo,
  TaskStatus.Queued,
  TaskStatus.InProgress,
  TaskStatus.WaitingReview,
  TaskStatus.WaitingClient,
  TaskStatus.Blocked,
];

const OPEN_TASK_STATUSES_ARRAY = Array.from(TASK_OPEN_STATUSES);
const ACTIVE_PROJECT_STATUSES_ARRAY = Array.from(ACTIVE_WORK_STATUSES);

const APPROVAL_PENDING_STATUSES = [
  ApprovalStatus.Pending,
  ApprovalStatus.UnderReview,
  ApprovalStatus.RevisionRequested,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampPreviewLimit(requested?: number): number {
  if (!requested || requested < 1) return DEFAULT_PREVIEW_LIMIT;
  return Math.min(requested, MAX_PREVIEW_LIMIT);
}

/** Maps a lean task document to a TaskPreviewItem DTO. */
function toTaskPreviewItem(t: Record<string, unknown>): TaskPreviewItem {
  return {
    taskId: toStr(t._id as Types.ObjectId),
    title: t.title as string,
    taskStatus: t.taskStatus as TaskStatus,
    taskPriority: t.taskPriority as TaskPriority,
    projectId: toStr(t.projectId as Types.ObjectId),
    projectCode: (t.projectId as { projectCode?: string } | null)?.projectCode ?? '',
    dueDate: toISOStr(t.dueDate as Date | undefined),
    isOverdue: Boolean(t.isOverdue),
    isBlocked: Boolean(t.isBlocked),
  };
}

// ─── Task Aggregation ────────────────────────────────────────────────────────

/**
 * Task count summary for the employee.
 * @param userId - User._id from auth token (tasks store User refs in assignedEmployeeIds)
 */
async function getTaskCounts(userId: string): Promise<TaskCountSummary> {
  const baseFilter = buildTaskEmployeeFilter(userId);
  const openFilter = { ...baseFilter, archivedAt: { $exists: false } };

  const [rows, overdueCount] = await Promise.all([
    TaskModel.aggregate<StatusGroupRow>([
      { $match: openFilter },
      { $group: { _id: '$taskStatus', count: { $sum: 1 } } },
    ]),

    TaskModel.countDocuments({
      ...baseFilter,
      isOverdue: true,
      archivedAt: { $exists: false },
    }),
  ]);

  const byStatus: Record<string, number> = Object.fromEntries(rows.map((r: StatusGroupRow) => [r._id, r.count]));
  const total = rows.reduce((acc: number, r: StatusGroupRow) => acc + r.count, 0);

  return {
    total,
    active: ACTIVE_TASK_STATUSES.reduce((acc: number, s: string) => acc + (byStatus[s] ?? 0), 0),
    blocked: byStatus[TaskStatus.Blocked] ?? 0,
    overdue: overdueCount,
    completed: byStatus[TaskStatus.Completed] ?? 0,
    waitingReview: byStatus[TaskStatus.WaitingReview] ?? 0,
    todo: byStatus[TaskStatus.Todo] ?? 0,
  };
}

async function getRecentlyAssignedTasks(
  userId: string,
  limit: number
): Promise<TaskPreviewItem[]> {
  const tasks = await TaskModel.find({
    ...buildTaskEmployeeFilter(userId),
    archivedAt: { $exists: false },
    taskStatus: { $in: NON_TERMINAL_TASK_STATUSES },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('projectId', 'projectCode')
    .lean() as Record<string, unknown>[];

  return tasks.map(toTaskPreviewItem);
}

async function getOverdueTasks(userId: string, limit: number): Promise<TaskPreviewItem[]> {
  const tasks = await TaskModel.find({
    ...buildTaskEmployeeFilter(userId),
    isOverdue: true,
    archivedAt: { $exists: false },
  })
    .sort({ dueDate: 1 })
    .limit(limit)
    .populate('projectId', 'projectCode')
    .lean() as Record<string, unknown>[];

  return tasks.map(toTaskPreviewItem);
}

async function getDueTodayTaskList(userId: string, limit: number): Promise<TaskPreviewItem[]> {
  const now = new Date();
  const tasks = await TaskModel.find({
    ...buildTaskEmployeeFilter(userId),
    dueDate: { $gte: startOfDay(now), $lte: endOfDay(now) },
    taskStatus: { $in: NON_TERMINAL_TASK_STATUSES },
    archivedAt: { $exists: false },
  })
    .sort({ isOverdue: -1, dueDate: 1 })
    .limit(limit)
    .populate('projectId', 'projectCode')
    .lean() as Record<string, unknown>[];

  return tasks.map(toTaskPreviewItem);
}

async function buildAssignedTaskSummary(
  userId: string,
  previewLimit: number
): Promise<AssignedTaskSummary> {
  const [counts, recentlyAssigned, overdueTasks, dueTodayTasks] = await Promise.all([
    getTaskCounts(userId),
    getRecentlyAssignedTasks(userId, previewLimit),
    getOverdueTasks(userId, previewLimit),
    getDueTodayTaskList(userId, previewLimit),
  ]);

  return { counts, recentlyAssigned, overdueTasks, dueTodayTasks };
}

// ─── Due Today Aggregation ────────────────────────────────────────────────────

async function buildDueTodaySummary(
  userId: string,
  previewLimit: number
): Promise<DueTodaySummary> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const taskFilter = buildTaskEmployeeFilter(userId);
  const projectFilter = buildProjectEmployeeFilter(userId);

  const [rawTodayTasks, overdueTaskCount, rawTodayProjects] = await Promise.all([
    TaskModel.find({
      ...taskFilter,
      $or: [
        { dueDate: { $gte: todayStart, $lte: todayEnd } },
        { isOverdue: true },
      ],
      taskStatus: { $in: NON_TERMINAL_TASK_STATUSES },
      archivedAt: { $exists: false },
    })
      .sort({ isOverdue: -1, dueDate: 1 })
      .limit(previewLimit)
      .populate('projectId', 'projectCode')
      .lean(),

    TaskModel.countDocuments({
      ...taskFilter,
      isOverdue: true,
      archivedAt: { $exists: false },
    }),

    ProjectModel.find({
      ...projectFilter,
      $or: [
        { expectedDeliveryDate: { $gte: todayStart, $lte: todayEnd } },
        { isOverdue: true },
      ],
      projectStatus: { $in: ACTIVE_PROJECT_STATUSES_ARRAY },
    })
      .sort({ isOverdue: -1, expectedDeliveryDate: 1 })
      .limit(previewLimit)
      .lean(),
  ]);
  const dueTodayTasks = rawTodayTasks as Record<string, unknown>[];
  const dueTodayProjects = rawTodayProjects as Record<string, unknown>[];

  const taskItems: DueTodayItem[] = dueTodayTasks.map((t) => ({
    type: 'task' as const,
    id: toStr(t._id as Types.ObjectId),
    title: t.title as string,
    status: t.taskStatus as string,
    priority: t.taskPriority as string,
    dueDate: toISOStr(t.dueDate as Date | undefined) ?? '',
    isOverdue: Boolean(t.isOverdue),
    projectCode: (t.projectId as { projectCode?: string } | null)?.projectCode,
  }));

  const projectItems: DueTodayItem[] = dueTodayProjects.map((p) => ({
    type: 'project' as const,
    id: toStr(p._id as Types.ObjectId),
    title: p.title as string,
    status: p.projectStatus as string,
    priority: p.projectPriority as string,
    dueDate: toISOStr(p.expectedDeliveryDate as Date | undefined) ?? '',
    isOverdue: Boolean(p.isOverdue),
    projectCode: p.projectCode as string,
  }));

  // Merge and prioritise overdue first, capped at previewLimit
  const items: DueTodayItem[] = [...taskItems, ...projectItems]
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue))
    .slice(0, previewLimit);

  return {
    total: items.length,
    overdue: overdueTaskCount,
    items,
  };
}

// ─── Pending Reviews Aggregation ──────────────────────────────────────────────

/**
 * Employees see approvals they submitted (requestedBy = User._id).
 * They never see admin-only approvals or submissions from other employees.
 * @param userId - User._id (approvals store User._id in requestedBy)
 */
async function buildPendingReviewSummary(
  userId: string,
  previewLimit: number
): Promise<PendingReviewSummary> {
  const requestedByFilter = { requestedBy: new Types.ObjectId(userId) };
  const baseFilter = { ...requestedByFilter, isDeleted: { $ne: true } };

  const [approvalCounts, items] = await Promise.all([
    ApprovalModel.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
    ]) as Promise<StatusGroupRow[]>,

    ApprovalModel.find({
      ...baseFilter,
      approvalStatus: { $in: APPROVAL_PENDING_STATUSES },
    })
      .sort({ submittedAt: -1 })
      .limit(previewLimit)
      .populate('projectId', 'projectCode')
      .populate('taskId', 'title')
      .lean() as Promise<Record<string, unknown>[]>,
  ]);

  const byStatus = Object.fromEntries(approvalCounts.map((r) => [r._id, r.count]));
  const totalApprovals = approvalCounts.reduce((acc, r) => acc + r.count, 0);

  const previewItems: PendingReviewItem[] = items.map((a) => ({
    approvalId: toStr(a._id as Types.ObjectId),
    approvalType: a.approvalType as string,
    approvalStatus: a.approvalStatus as string,
    reviewPriority: a.reviewPriority as string,
    projectId: a.projectId ? toStr(a.projectId as Types.ObjectId) : undefined,
    projectCode: (a.projectId as { projectCode?: string } | null)?.projectCode,
    taskId: a.taskId ? toStr(a.taskId as Types.ObjectId) : undefined,
    taskTitle: (a.taskId as { title?: string } | null)?.title,
    submittedAt: toISOStr(a.submittedAt as Date | undefined),
    resubmissionCount: (a.resubmissionCount as number) ?? 0,
  }));

  return {
    total: totalApprovals,
    pending: byStatus[ApprovalStatus.Pending] ?? 0,
    underReview: byStatus[ApprovalStatus.UnderReview] ?? 0,
    revisionRequested: byStatus[ApprovalStatus.RevisionRequested] ?? 0,
    items: previewItems,
  };
}

// ─── Active Projects Aggregation ─────────────────────────────────────────────

/**
 * Active projects assigned to the employee.
 * @param userId - User._id (projects store User._id in assignedEmployees.userId)
 */
async function buildActiveProjectSummary(
  userId: string,
  previewLimit: number
): Promise<ActiveProjectSummary> {
  const baseFilter = buildProjectEmployeeFilter(userId);

  const [statusCounts, overdueCount, stalledCount, projects] = await Promise.all([
    ProjectModel.aggregate<StatusGroupRow>([
      {
        $match: {
          ...baseFilter,
          projectStatus: { $in: ACTIVE_PROJECT_STATUSES_ARRAY },
        },
      },
      { $group: { _id: '$projectStatus', count: { $sum: 1 } } },
    ]),

    ProjectModel.countDocuments({ ...baseFilter, isOverdue: true }),
    ProjectModel.countDocuments({ ...baseFilter, isStalled: true }),

    ProjectModel.find({
      ...baseFilter,
      projectStatus: { $in: ACTIVE_PROJECT_STATUSES_ARRAY },
    })
      .sort({ isOverdue: -1, isStalled: -1, lastActivityAt: -1 })
      .limit(previewLimit)
      .populate('clientId', 'organizationName contactPersonName')
      .lean(),
  ]);

  const byStatus: Record<string, number> = Object.fromEntries(
    statusCounts.map((r: StatusGroupRow) => [r._id, r.count])
  );
  const total = statusCounts.reduce((acc: number, r: StatusGroupRow) => acc + r.count, 0);

  // Batch-fetch task counts for the returned projects
  const typedProjects = projects as Record<string, unknown>[];
  const projectIds = typedProjects.map((p) => p._id as Types.ObjectId);

  const taskCountsRaw: TaskCountRow[] = await TaskModel.aggregate([
    {
      $match: {
        projectId: { $in: projectIds },
        archivedAt: { $exists: false },
      },
    },
    {
      $group: {
        _id: '$projectId',
        open: {
          $sum: { $cond: [{ $in: ['$taskStatus', OPEN_TASK_STATUSES_ARRAY] }, 1, 0] },
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$taskStatus', TaskStatus.Completed] }, 1, 0] },
        },
      },
    },
  ]);

  const taskCountMap = new Map<string, { open: number; completed: number }>(
    taskCountsRaw.map((r) => [r._id.toString(), { open: r.open, completed: r.completed }])
  );

  const projectPreviews: ProjectPreviewItem[] = typedProjects.map((p) => {
    const pid = toStr(p._id as Types.ObjectId);
    const taskCounts = taskCountMap.get(pid) ?? { open: 0, completed: 0 };
    const client = p.clientId as
      | { organizationName?: string; contactPersonName?: string }
      | null;

    return {
      projectId: pid,
      projectCode: p.projectCode as string,
      clientName: client?.organizationName ?? client?.contactPersonName ?? 'Unknown',
      serviceName: p.primaryServiceSlug as string,
      projectStatus: p.projectStatus as ProjectStatus,
      projectPriority: p.projectPriority as ProjectPriority,
      isOverdue: Boolean(p.isOverdue),
      isStalled: Boolean(p.isStalled),
      expectedDeliveryDate: toISOStr(p.expectedDeliveryDate as Date | undefined),
      openTaskCount: taskCounts.open,
      completedTaskCount: taskCounts.completed,
      lastActivityAt: toISOStr(p.lastActivityAt as Date | undefined),
    };
  });

  return {
    total,
    active: byStatus[ProjectStatus.Active] ?? 0,
    waitingClient: byStatus[ProjectStatus.WaitingClient] ?? 0,
    inReview: byStatus[ProjectStatus.InReview] ?? 0,
    overdue: overdueCount,
    stalled: stalledCount,
    projects: projectPreviews,
  };
}

// ─── Workload Summary ─────────────────────────────────────────────────────────

/**
 * Lightweight aggregate workload counters for the employee.
 * @param userId - User._id from auth token
 */
async function buildWorkloadSummary(userId: string): Promise<WorkloadSummary> {
  const taskFilter = buildTaskEmployeeFilter(userId);
  const projectFilter = buildProjectEmployeeFilter(userId);
  const userObjectId = new Types.ObjectId(userId);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    openTasks,
    blockedTasks,
    overdueTasks,
    waitingReviewTasks,
    activeProjects,
    overdueProjects,
    stalledProjects,
    pendingApprovals,
    completedTodayTasks,
  ] = await Promise.all([
    TaskModel.countDocuments({
      ...taskFilter,
      taskStatus: { $in: OPEN_TASK_STATUSES_ARRAY },
      archivedAt: { $exists: false },
    }),
    TaskModel.countDocuments({
      ...taskFilter,
      isBlocked: true,
      archivedAt: { $exists: false },
    }),
    TaskModel.countDocuments({
      ...taskFilter,
      isOverdue: true,
      archivedAt: { $exists: false },
    }),
    TaskModel.countDocuments({
      ...taskFilter,
      taskStatus: TaskStatus.WaitingReview,
      archivedAt: { $exists: false },
    }),
    ProjectModel.countDocuments({
      ...projectFilter,
      projectStatus: { $in: ACTIVE_PROJECT_STATUSES_ARRAY },
    }),
    ProjectModel.countDocuments({ ...projectFilter, isOverdue: true }),
    ProjectModel.countDocuments({ ...projectFilter, isStalled: true }),
    ApprovalModel.countDocuments({
      requestedBy: userObjectId,
      approvalStatus: { $in: APPROVAL_PENDING_STATUSES },
      isDeleted: { $ne: true },
    }),
    TaskModel.countDocuments({
      ...taskFilter,
      taskStatus: TaskStatus.Completed,
      completedAt: { $gte: todayStart, $lte: todayEnd },
    }),
  ]);

  return {
    openTasks,
    blockedTasks,
    overdueTasks,
    waitingReviewTasks,
    activeProjects,
    overdueProjects,
    stalledProjects,
    pendingApprovals,
    completedTodayTasks,
  };
}

// ─── Main Dashboard Aggregator ────────────────────────────────────────────────

/**
 * Builds the full employee dashboard response.
 *
 * @param userId           - The authenticated user's ID (User._id from auth token).
 *                           Used for all assignment-based filtering.
 * @param employeeProfileId - The EmployeeProfile._id (from auth token).
 *                           Included in response for client-side reference only.
 * @param query            - Optional filter options (window, preview limits).
 */
export async function getEmployeeDashboard(
  userId: string,
  employeeProfileId: string,
  query: EmployeeDashboardQuery = {}
): Promise<EmployeeDashboardResponse> {
  const window: DashboardWindow = query.window ?? 'today';
  const previewLimit = clampPreviewLimit(query.previewLimit);

  // All top-level aggregations run in parallel
  const [workload, tasks, dueToday, pendingReviews, activeProjects] = await Promise.all([
    buildWorkloadSummary(userId),
    buildAssignedTaskSummary(userId, previewLimit),
    buildDueTodaySummary(userId, previewLimit),
    buildPendingReviewSummary(userId, previewLimit),
    buildActiveProjectSummary(userId, previewLimit),
  ]);

  return {
    employeeId: userId,
    employeeProfileId,
    generatedAt: new Date().toISOString(),
    window,
    workload,
    tasks,
    dueToday,
    pendingReviews,
    activeProjects,
  };
}

// ─── Scoped Sub-Endpoints ─────────────────────────────────────────────────────

/** Returns only the assigned task summary for the employee workspace. */
export async function getEmployeeTaskSummary(
  userId: string,
  previewLimit?: number
): Promise<AssignedTaskSummary> {
  return buildAssignedTaskSummary(userId, clampPreviewLimit(previewLimit));
}

/** Returns only due-today items for the employee workspace. */
export async function getEmployeeDueTodaySummary(
  userId: string,
  previewLimit?: number
): Promise<DueTodaySummary> {
  return buildDueTodaySummary(userId, clampPreviewLimit(previewLimit));
}

/** Returns only pending reviews for the employee workspace. */
export async function getEmployeePendingReviews(
  userId: string,
  previewLimit?: number
): Promise<PendingReviewSummary> {
  return buildPendingReviewSummary(userId, clampPreviewLimit(previewLimit));
}

/** Returns only active project summaries for the employee workspace. */
export async function getEmployeeActiveProjects(
  userId: string,
  previewLimit?: number
): Promise<ActiveProjectSummary> {
  return buildActiveProjectSummary(userId, clampPreviewLimit(previewLimit));
}

/** Returns only the workload summary for the employee workspace. */
export async function getEmployeeWorkload(userId: string): Promise<WorkloadSummary> {
  return buildWorkloadSummary(userId);
}
