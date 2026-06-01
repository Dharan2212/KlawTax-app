/**
 * Task Overdue + Stalled Detection — Batch 3.2
 *
 * Reusable utility functions for detecting overdue and stalled tasks.
 * Designed to be called by:
 *  - BullMQ scheduled jobs (future batches)
 *  - CRM dashboards (query helpers)
 *  - Admin task list filters
 *
 * No HTTP concerns. Pure operational logic.
 */

import { FilterQuery } from 'mongoose';
import { Task, ITask } from '../../models/task';
import {
  TaskStatus,
  TASK_OPEN_STATUSES,
  TASK_ACTIVE_STATUSES,
} from '../../models/taskEnums';
import { logger } from '../../utils/logger';

// ─── Configuration ────────────────────────────────────────────────────────────

/** Default stall threshold in days (matches systemSettings default). */
const DEFAULT_STALL_THRESHOLD_DAYS = 7;

// ─── Overdue Detection ────────────────────────────────────────────────────────

/**
 * Returns true if a task is overdue (dueDate has passed and task is not terminal).
 */
export function isTaskOverdue(task: ITask): boolean {
  if (!task.dueDate) return false;
  if (!TASK_OPEN_STATUSES.has(task.taskStatus)) return false;

  return task.dueDate < new Date();
}

/**
 * Builds the MongoDB filter for overdue tasks.
 * Used by the overdue detector job and dashboard aggregations.
 */
export function buildOverdueTaskFilter(): FilterQuery<ITask> {
  return {
    dueDate: { $lt: new Date() },
    taskStatus: { $in: Array.from(TASK_OPEN_STATUSES) },
    isOverdue: false, // Only tasks not yet flagged
  };
}

/**
 * Flags all unflagged overdue tasks in the database.
 * Returns the count of tasks updated.
 *
 * Called by the scheduled overdue-detector job.
 * Safe to run multiple times (idempotent due to `isOverdue: false` filter).
 */
export async function flagOverdueTasks(): Promise<number> {
  const result = await Task.updateMany(
    buildOverdueTaskFilter(),
    { $set: { isOverdue: true } }
  );

  if (result.modifiedCount > 0) {
    logger.info(`[TaskOverdue] Flagged ${result.modifiedCount} overdue task(s)`);
  }

  return result.modifiedCount;
}

// ─── Stalled Detection ────────────────────────────────────────────────────────

/**
 * Returns true if a task is considered stalled.
 *
 * A task is stalled if:
 *  - It is in an active status (not waiting_client — those are excluded)
 *  - Its lastActivityAt is older than the stall threshold
 */
export function isTaskStalled(
  task: ITask,
  stallThresholdDays: number = DEFAULT_STALL_THRESHOLD_DAYS
): boolean {
  // Tasks waiting for client input are not considered stalled (client is the bottleneck)
  if (task.taskStatus === TaskStatus.WaitingClient) return false;

  // Only active statuses can be stalled
  if (!TASK_ACTIVE_STATUSES.has(task.taskStatus)) return false;

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - stallThresholdDays);

  return task.lastActivityAt < thresholdDate;
}

/**
 * Builds the MongoDB filter for stalled tasks.
 * Excludes WaitingClient tasks (they're legitimately paused).
 */
export function buildStalledTaskFilter(
  stallThresholdDays: number = DEFAULT_STALL_THRESHOLD_DAYS
): FilterQuery<ITask> {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - stallThresholdDays);

  const activeStatusesExcludingClient = Array.from(TASK_ACTIVE_STATUSES).filter(
    (s) => s !== TaskStatus.WaitingClient
  );

  return {
    taskStatus: { $in: activeStatusesExcludingClient },
    lastActivityAt: { $lt: thresholdDate },
    isStalled: false,
  };
}

/**
 * Flags all unflagged stalled tasks in the database.
 * Returns the count of tasks updated.
 */
export async function flagStalledTasks(
  stallThresholdDays: number = DEFAULT_STALL_THRESHOLD_DAYS
): Promise<number> {
  const now = new Date();

  const result = await Task.updateMany(
    buildStalledTaskFilter(stallThresholdDays),
    {
      $set: {
        isStalled: true,
        lastStalledAt: now,
      },
    }
  );

  if (result.modifiedCount > 0) {
    logger.info(`[TaskStalled] Flagged ${result.modifiedCount} stalled task(s)`);
  }

  return result.modifiedCount;
}

// ─── Auto-clear Flags ─────────────────────────────────────────────────────────

/**
 * Clears the `isStalled` flag when a task records new activity.
 * Called from TaskService when any meaningful mutation occurs.
 */
export async function clearStalledFlag(taskId: string): Promise<void> {
  await Task.findByIdAndUpdate(taskId, {
    $set: { isStalled: false },
  });
}

/**
 * Clears the `isOverdue` flag when a task is completed or cancelled.
 * Called from TaskService on terminal status transitions.
 */
export async function clearOverdueFlag(taskId: string): Promise<void> {
  await Task.findByIdAndUpdate(taskId, {
    $set: { isOverdue: false },
  });
}

// ─── Dashboard Aggregation Helpers ───────────────────────────────────────────

/**
 * Returns overdue task count for a given project (used in dashboards).
 */
export async function countOverdueTasksForProject(projectId: string): Promise<number> {
  return Task.countDocuments({
    projectId,
    isOverdue: true,
    taskStatus: { $in: Array.from(TASK_OPEN_STATUSES) },
  });
}

/**
 * Returns overdue task count for a given employee (used in employee dashboard).
 */
export async function countOverdueTasksForEmployee(employeeProfileId: string): Promise<number> {
  return Task.countDocuments({
    assignedEmployeeIds: employeeProfileId,
    isOverdue: true,
    taskStatus: { $in: Array.from(TASK_OPEN_STATUSES) },
  });
}

/**
 * Returns tasks due today for an employee.
 */
export async function getTasksDueTodayForEmployee(
  employeeProfileId: string
): Promise<ITask[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay   = new Date(today.setHours(23, 59, 59, 999));

  const tasks = await Task.find({
    assignedEmployeeIds: employeeProfileId,
    dueDate: { $gte: startOfDay, $lte: endOfDay },
    taskStatus: { $in: Array.from(TASK_OPEN_STATUSES) },
  })
    .select('title taskStatus taskPriority dueDate projectId')
    .sort({ taskPriority: -1 })
    .lean();
  return tasks as unknown as ITask[];
}
