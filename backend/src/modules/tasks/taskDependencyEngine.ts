/**
 * Task Dependency Engine — Batch 3.2
 *
 * Handles:
 *  - Circular dependency detection (DFS traversal)
 *  - Self-dependency prevention
 *  - Dependency completion validation (can this task complete?)
 *  - Blocked-state awareness
 *
 * All database access goes through the Task model.
 * This module is pure logic — no HTTP concerns.
 */

import { Types } from 'mongoose';
import { Task, ITask } from '../../models/task';
import { TaskStatus } from '../../models/taskEnums';
import { AppError } from '../../middlewares/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DependencyValidationResult {
  isValid: boolean;
  error?: string;
}

export interface BlockedDependency {
  taskId: string;
  title: string;
  taskStatus: TaskStatus;
}

// ─── Self-Dependency Guard ────────────────────────────────────────────────────

/**
 * Throws if `taskId` is in `dependencyIds` (a task cannot depend on itself).
 */
export function assertNoDependencyOnSelf(
  taskId: string,
  dependencyIds: string[]
): void {
  if (dependencyIds.includes(taskId)) {
    throw new AppError(
      'A task cannot depend on itself',
      422,
      'DEPENDENCY_SELF_REFERENCE'
    );
  }
}

// ─── Circular Dependency Detection ───────────────────────────────────────────

/**
 * Determines whether adding `newDepId` as a dependency of `taskId`
 * would create a circular dependency chain.
 *
 * Algorithm: BFS from `newDepId` through its dependencies. If we encounter
 * `taskId` at any point in the traversal, a cycle exists.
 *
 * @param taskId     The task that would receive the new dependency.
 * @param newDepId   The task being added as a dependency.
 * @returns          True if a cycle would be introduced.
 */
export async function wouldCreateCircularDependency(
  taskId: string,
  newDepId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [newDepId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    if (currentId === taskId) {
      // Found the original task in the dependency tree — cycle detected
      return true;
    }

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    // Load the current node's dependencies
    const current = await Task.findById(currentId).select('dependencyTaskIds').lean();
    if (!current) continue;

    for (const depId of current.dependencyTaskIds ?? []) {
      queue.push(depId.toString());
    }
  }

  return false;
}

/**
 * Validates that adding `newDepId` as a dependency of `taskId` is safe.
 * Throws AppError on violation.
 */
export async function validateDependencyAddition(
  taskId: string,
  newDepId: string
): Promise<void> {
  // 1. Self-dependency check
  assertNoDependencyOnSelf(taskId, [newDepId]);

  // 2. Verify the dependency task exists
  const depTask = await Task.findById(newDepId).select('_id taskStatus').lean();
  if (!depTask) {
    throw new AppError(
      `Dependency task ${newDepId} does not exist`,
      404,
      'DEPENDENCY_TASK_NOT_FOUND'
    );
  }

  // 3. Circular dependency check
  const wouldCycle = await wouldCreateCircularDependency(taskId, newDepId);
  if (wouldCycle) {
    throw new AppError(
      'Adding this dependency would create a circular dependency chain',
      422,
      'DEPENDENCY_CIRCULAR'
    );
  }
}

// ─── Completion Dependency Validation ────────────────────────────────────────

/**
 * Returns all incomplete dependencies for a given task.
 * If any exist, the task cannot be marked as completed.
 */
export async function getIncompleteDependencies(
  task: ITask
): Promise<BlockedDependency[]> {
  if (!task.dependencyTaskIds || task.dependencyTaskIds.length === 0) {
    return [];
  }

  const deps = await Task.find({
    _id: { $in: task.dependencyTaskIds },
    taskStatus: { $ne: TaskStatus.Completed },
  })
    .select('_id title taskStatus')
    .lean();

  return deps.map((d) => ({
    taskId: d._id.toString(),
    title: d.title,
    taskStatus: d.taskStatus as TaskStatus,
  }));
}

/**
 * Validates that a task can be completed based on its dependency state.
 * Throws AppError with details if any dependencies are not completed.
 */
export async function assertDependenciesCompleted(task: ITask): Promise<void> {
  const incomplete = await getIncompleteDependencies(task);

  if (incomplete.length > 0) {
    const titles = incomplete.map((d) => `"${d.title}" (${d.taskStatus})`).join(', ');
    throw new AppError(
      `Cannot complete this task — the following dependencies are not yet completed: ${titles}`,
      422,
      'DEPENDENCY_INCOMPLETE',
      { incompleteDependencies: incomplete }
    );
  }
}

// ─── Blocked State Management ─────────────────────────────────────────────────

/**
 * Determines whether a task should be in the `blocked` state based on its
 * current dependencies.
 *
 * A task is dependency-blocked if ANY of its dependencies are not completed.
 */
export async function computeIsBlocked(task: ITask): Promise<boolean> {
  if (!task.dependencyTaskIds || task.dependencyTaskIds.length === 0) {
    return false;
  }

  const incomplete = await getIncompleteDependencies(task);
  return incomplete.length > 0;
}

/**
 * After a task is completed, finds all tasks that depended on it and
 * recalculates their blocked state.
 *
 * Returns the list of task IDs whose blocked state was updated.
 */
export async function propagateCompletionToDependents(
  completedTaskId: string
): Promise<string[]> {
  // Find tasks that list this task as a dependency
  const dependents = await Task.find({
    dependencyTaskIds: new Types.ObjectId(completedTaskId),
    taskStatus: TaskStatus.Blocked,
  })
    .select('_id dependencyTaskIds')
    .lean();

  const unblocked: string[] = [];

  for (const dep of dependents) {
    const depDoc = await Task.findById(dep._id);
    if (!depDoc) continue;

    const isStillBlocked = await computeIsBlocked(depDoc);
    if (!isStillBlocked) {
      depDoc.isBlocked = false;
      depDoc.blockReason = undefined;
      await depDoc.save();
      unblocked.push(dep._id.toString());
    }
  }

  return unblocked;
}
