/**
 * Task Service — Batch 3.2
 *
 * Orchestrates all task lifecycle operations:
 *  - CRUD
 *  - Status transitions (validated against the transition matrix)
 *  - Dependency management
 *  - Assignment updates
 *  - Timeline event generation
 *  - Overdue/stalled flag management
 *
 * No HTTP concerns — pure business logic.
 * All timeline writes are delegated to timelineService.
 */

import { Types, FilterQuery } from 'mongoose';
import { Task, ITask } from '../../models/task';
import { TimelineEntry } from '../../models/timelineEntry';
import {
  TaskStatus,
  TaskPriority,
  isValidTaskTransition,
  isTerminalTaskStatus,
  getAllowedTaskTransitions,
  TimelineEventType,
  TimelineEventCategory,
  TimelineVisibility,
  TimelineRelatedEntityType,
} from '../../models/taskEnums';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';
import { buildPaginationMeta } from '../../utils/response';
import { logger } from '../../utils/logger';
import {
  validateDependencyAddition,
  assertDependenciesCompleted,
  propagateCompletionToDependents,
  computeIsBlocked,
} from './taskDependencyEngine';
import { clearStalledFlag, clearOverdueFlag } from './taskOverdueUtils';
import {
  recordTaskCreated,
  recordTaskStatusChanged,
  recordTaskAssigned,
  recordTaskBlocked,
  recordTaskUnblocked,
  recordTaskProgressUpdated,
  recordDependencyAdded,
  createTimelineEntry,
} from '../timeline/timelineService';
import type { TimelineActorContext } from '../timeline/timelineService';
import type {
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskStatusTransitionDTO,
  TaskQueryDTO,
} from '../../validators/taskValidators';

// Re-export for inter-module usage (Batch 3.1 compatibility)
export type { TimelineActorContext };

// ─── Create Task ──────────────────────────────────────────────────────────────

export async function createTask(
  dto: CreateTaskDTO,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = new Task({
    title:       dto.title,
    description: dto.description,
    projectId:   new Types.ObjectId(dto.projectId),
    parentTaskId: dto.parentTaskId
      ? new Types.ObjectId(dto.parentTaskId)
      : undefined,

    taskPriority: dto.taskPriority ?? TaskPriority.Medium,
    taskStatus:   TaskStatus.Todo,

    dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    expectedCompletionDate: dto.expectedCompletionDate
      ? new Date(dto.expectedCompletionDate)
      : undefined,

    assignedEmployeeIds: (dto.assignedEmployeeIds ?? []).map(
      (id) => new Types.ObjectId(id)
    ),

    estimatedHours:      dto.estimatedHours,
    serviceDeliveryTypes: dto.serviceDeliveryTypes ?? [],

    requiresReview:      dto.requiresReview ?? false,
    requiresClientInput: dto.requiresClientInput ?? false,
    isInternalOnly:      dto.isInternalOnly ?? false,
    visibleToClient:     dto.visibleToClient ?? false,

    internalNotes: dto.internalNotes,

    completionChecklist: (dto.completionChecklist ?? []).map((item) => ({
      _id:         new Types.ObjectId(),
      label:       item.label,
      isCompleted: false,
    })),

    createdBy:     actor.actorId
      ? new Types.ObjectId(actor.actorId.toString())
      : new Types.ObjectId(),
    lastActivityAt: new Date(),
  });

  await task.save();

  recordTaskCreated(task, actor).catch((err) =>
    logger.error('[TaskService] Failed to record task.created timeline event', { err })
  );

  logger.info('[TaskService] Task created', {
    taskId:    task._id.toString(),
    projectId: dto.projectId,
  });

  return task;
}

// ─── Get Task by ID ───────────────────────────────────────────────────────────

export async function getTaskById(taskId: string): Promise<ITask> {
  if (!Types.ObjectId.isValid(taskId)) {
    throw new NotFoundError('Task');
  }

  const task = await Task.findById(taskId).lean();
  if (!task) throw new NotFoundError('Task');

  return task as unknown as ITask;
}

// ─── List Tasks ───────────────────────────────────────────────────────────────

export async function listTasks(filters: TaskQueryDTO): Promise<{
  tasks: ITask[];
  total: number;
  meta:  ReturnType<typeof buildPaginationMeta>;
}> {
  const query: FilterQuery<ITask> = { archivedAt: null };

  if (filters.projectId)           query.projectId          = new Types.ObjectId(filters.projectId);
  if (filters.taskStatus)          query.taskStatus          = filters.taskStatus;
  if (filters.assignedEmployeeId)  query.assignedEmployeeIds = new Types.ObjectId(filters.assignedEmployeeId);
  if (filters.isOverdue !== undefined) query.isOverdue = filters.isOverdue;
  if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;
  if (filters.isStalled !== undefined) query.isStalled = filters.isStalled;

  const page  = filters.page  ?? 1;
  const limit = filters.limit ?? 20;
  const skip  = (page - 1) * limit;

  const sortField = filters.sortBy    ?? 'createdAt';
  const sortOrder = filters.sortOrder ?? 'desc';
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

  const [tasks, total] = await Promise.all([
    Task.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Task.countDocuments(query),
  ]);

  return {
    tasks: tasks as unknown as ITask[],
    total,
    meta:  buildPaginationMeta(page, limit, total),
  };
}

// ─── Update Task ──────────────────────────────────────────────────────────────

export async function updateTask(
  taskId: string,
  dto: UpdateTaskDTO,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  if (isTerminalTaskStatus(task.taskStatus)) {
    throw new AppError(
      `Task is in a terminal status (${task.taskStatus}) and cannot be updated`,
      422,
      'TASK_TERMINAL_STATUS'
    );
  }

  const previousProgress = task.progressPercentage;

  if (dto.title             !== undefined) task.title             = dto.title;
  if (dto.description       !== undefined) task.description       = dto.description;
  if (dto.taskPriority      !== undefined) task.taskPriority      = dto.taskPriority;
  if (dto.internalNotes     !== undefined) task.internalNotes     = dto.internalNotes;
  if (dto.requiresReview    !== undefined) task.requiresReview    = dto.requiresReview;
  if (dto.requiresClientInput !== undefined) task.requiresClientInput = dto.requiresClientInput;
  if (dto.isInternalOnly    !== undefined) task.isInternalOnly    = dto.isInternalOnly;
  if (dto.visibleToClient   !== undefined) task.visibleToClient   = dto.visibleToClient;
  if (dto.estimatedHours    !== undefined) task.estimatedHours    = dto.estimatedHours;
  if (dto.serviceDeliveryTypes !== undefined) task.serviceDeliveryTypes = dto.serviceDeliveryTypes;
  if (dto.loggedHours       !== undefined) task.loggedHours       = dto.loggedHours;

  if (dto.dueDate !== undefined) {
    task.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
  }
  if (dto.expectedCompletionDate !== undefined) {
    task.expectedCompletionDate = dto.expectedCompletionDate
      ? new Date(dto.expectedCompletionDate)
      : undefined;
  }

  const progressChanged =
    dto.progressPercentage !== undefined &&
    dto.progressPercentage !== previousProgress;

  if (progressChanged) task.progressPercentage = dto.progressPercentage!;

  const assignmentChanged = dto.assignedEmployeeIds !== undefined;
  if (assignmentChanged) {
    task.assignedEmployeeIds = dto.assignedEmployeeIds!.map(
      (id) => new Types.ObjectId(id)
    );
  }

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();
  await clearStalledFlag(taskId);

  if (progressChanged) {
    recordTaskProgressUpdated(task, previousProgress, actor).catch((err) =>
      logger.error('[TaskService] Failed to record progress timeline event', { err })
    );
  }
  if (assignmentChanged) {
    recordTaskAssigned(task, dto.assignedEmployeeIds!, actor).catch((err) =>
      logger.error('[TaskService] Failed to record assignment timeline event', { err })
    );
  }

  return task;
}

// ─── Status Transition ────────────────────────────────────────────────────────

export async function transitionTaskStatus(
  taskId: string,
  dto: TaskStatusTransitionDTO,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  const { status: toStatus, reason } = dto;
  const fromStatus = task.taskStatus;

  // 1. Guard: terminal status
  if (isTerminalTaskStatus(fromStatus)) {
    throw new AppError(
      `Task is in terminal status "${fromStatus}" — no further transitions are allowed`,
      422,
      'TASK_TERMINAL_STATUS'
    );
  }

  // 2. Guard: valid transition
  if (!isValidTaskTransition(fromStatus, toStatus)) {
    const allowed = getAllowedTaskTransitions(fromStatus);
    throw new AppError(
      `Invalid status transition: "${fromStatus}" → "${toStatus}". Allowed: ${allowed.join(', ')}`,
      422,
      'TASK_INVALID_TRANSITION',
      { fromStatus, toStatus, allowedTransitions: allowed }
    );
  }

  // 3. Guard: dependency completion check
  if (toStatus === TaskStatus.Completed) {
    await assertDependenciesCompleted(task);
  }

  // 4. Apply transition
  task.previousStatus = fromStatus;
  task.taskStatus     = toStatus;

  if (toStatus === TaskStatus.Blocked) {
    task.isBlocked   = true;
    task.blockReason = reason;
  } else if (fromStatus === TaskStatus.Blocked) {
    task.isBlocked   = false;
    task.blockReason = undefined;
  }

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();

  // 5. Clear flags on terminal transitions
  if (isTerminalTaskStatus(toStatus)) {
    await clearOverdueFlag(taskId);
    await clearStalledFlag(taskId);
  }

  // 6. Propagate completion to dependents
  if (toStatus === TaskStatus.Completed) {
    propagateCompletionToDependents(taskId).then((unblocked) => {
      if (unblocked.length > 0) {
        logger.info('[TaskService] Propagated completion to dependents', {
          taskId,
          unblockedCount: unblocked.length,
        });
      }
    }).catch((err) =>
      logger.error('[TaskService] Failed to propagate completion', { err })
    );
  }

  // 7. Record timeline events
  recordTaskStatusChanged(task, fromStatus, toStatus, actor, reason).catch((err) =>
    logger.error('[TaskService] Failed to record status change timeline event', { err })
  );

  if (toStatus === TaskStatus.Blocked) {
    recordTaskBlocked(task, reason, actor).catch(() => null);
  } else if (fromStatus === TaskStatus.Blocked) {
    recordTaskUnblocked(task, actor).catch(() => null);
  }

  logger.info('[TaskService] Task status transitioned', { taskId, fromStatus, toStatus });

  return task;
}

// ─── Add Dependency ───────────────────────────────────────────────────────────

export async function addTaskDependency(
  taskId: string,
  dependencyTaskId: string,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  if (isTerminalTaskStatus(task.taskStatus)) {
    throw new AppError(
      'Cannot modify dependencies of a terminal task',
      422,
      'TASK_TERMINAL_STATUS'
    );
  }

  await validateDependencyAddition(taskId, dependencyTaskId);

  const alreadyExists = task.dependencyTaskIds.some(
    (id) => id.toString() === dependencyTaskId
  );
  if (alreadyExists) {
    throw new AppError('This task is already a dependency', 422, 'DEPENDENCY_ALREADY_EXISTS');
  }

  const depTask = await Task.findById(dependencyTaskId).select('title');
  if (!depTask) throw new NotFoundError('Dependency task');

  task.dependencyTaskIds.push(new Types.ObjectId(dependencyTaskId));

  await Task.findByIdAndUpdate(dependencyTaskId, {
    $addToSet: { dependentTaskIds: task._id },
  });

  const shouldBeBlocked = await computeIsBlocked(task);
  if (shouldBeBlocked && !task.isBlocked) {
    task.isBlocked   = true;
    task.blockReason = `Waiting for dependency "${depTask.title}" to complete`;
  }

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();

  recordDependencyAdded(task, dependencyTaskId, depTask.title, actor).catch(() => null);

  return task;
}

// ─── Remove Dependency ────────────────────────────────────────────────────────

export async function removeTaskDependency(
  taskId: string,
  dependencyTaskId: string,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  const depExists = task.dependencyTaskIds.some(
    (id) => id.toString() === dependencyTaskId
  );
  if (!depExists) {
    throw new AppError(
      'The specified dependency does not exist on this task',
      422,
      'DEPENDENCY_NOT_FOUND'
    );
  }

  task.dependencyTaskIds = task.dependencyTaskIds.filter(
    (id) => id.toString() !== dependencyTaskId
  );

  await Task.findByIdAndUpdate(dependencyTaskId, {
    $pull: { dependentTaskIds: task._id },
  });

  const shouldBeBlocked = await computeIsBlocked(task);
  if (!shouldBeBlocked && task.isBlocked) {
    task.isBlocked   = false;
    task.blockReason = undefined;
  }

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();

  createTimelineEntry({
    projectId:         task.projectId,
    taskId:            task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,
    eventType:         TimelineEventType.TaskDependencyRemoved,
    eventCategory:     TimelineEventCategory.TaskActivity,
    title:             `Dependency removed from "${task.title}"`,
    visibility:        TimelineVisibility.Internal,
    actor,
    metadata: { dependencyTaskId },
    tags:    ['dependency'],
  }).catch(() => null);

  return task;
}

// ─── Update Checklist Item ────────────────────────────────────────────────────

export async function updateChecklistItem(
  taskId: string,
  checklistItemId: string,
  isCompleted: boolean,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  const item = task.completionChecklist.find(
    (c) => c._id.toString() === checklistItemId
  );
  if (!item) throw new NotFoundError('Checklist item');

  item.isCompleted = isCompleted;
  if (isCompleted) {
    item.completedAt = new Date();
    if (actor.actorId) {
      item.completedBy = new Types.ObjectId(actor.actorId.toString());
    }
  } else {
    item.completedAt = undefined;
    item.completedBy = undefined;
  }

  const { percentage } = task.checklistProgress();
  task.progressPercentage = percentage;

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();
  await clearStalledFlag(taskId);

  return task;
}

// ─── Archive Task ─────────────────────────────────────────────────────────────

export async function archiveTask(
  taskId: string,
  actor: TimelineActorContext
): Promise<ITask> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  if (task.taskStatus !== TaskStatus.Completed) {
    throw new AppError('Only completed tasks can be archived', 422, 'TASK_NOT_COMPLETED');
  }

  task.taskStatus = TaskStatus.Archived;
  task.archivedAt = new Date();

  if (actor.actorId) {
    task.updatedBy = new Types.ObjectId(actor.actorId.toString());
  }

  await task.save();

  createTimelineEntry({
    projectId:         task.projectId,
    taskId:            task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,
    eventType:         TimelineEventType.TaskArchived,
    eventCategory:     TimelineEventCategory.TaskActivity,
    title:             `Task archived: "${task.title}"`,
    visibility:        TimelineVisibility.Internal,
    actor,
    tags: ['archived'],
  }).catch(() => null);

  return task;
}

// ─── Delete Task (Admin Only) ─────────────────────────────────────────────────

export async function deleteTask(taskId: string): Promise<void> {
  const task = await Task.findById(taskId);
  if (!task) throw new NotFoundError('Task');

  if (!isTerminalTaskStatus(task.taskStatus)) {
    throw new AppError(
      'Only terminal tasks (completed, cancelled, archived) can be deleted',
      422,
      'TASK_NOT_TERMINAL'
    );
  }

  if (task.dependencyTaskIds.length > 0) {
    await Task.updateMany(
      { _id: { $in: task.dependencyTaskIds } },
      { $pull: { dependentTaskIds: task._id } }
    );
  }

  await Task.findByIdAndDelete(taskId);
  await TimelineEntry.deleteMany({ taskId: task._id });

  logger.info('[TaskService] Task deleted', { taskId });
}

// ─── Get Task Children ────────────────────────────────────────────────────────

export async function getTaskChildren(parentTaskId: string): Promise<ITask[]> {
  const tasks = await Task.find({ parentTaskId: new Types.ObjectId(parentTaskId) }).limit(100).lean()
    .sort({ createdAt: 1 })
    .lean();
  return tasks as unknown as ITask[];
}

// ─── Task Summary for Project ─────────────────────────────────────────────────

export interface TaskSummaryForProject {
  totalTasks:      number;
  completedTasks:  number;
  overdueTasks:    number;
  blockedTasks:    number;
  stalledTasks:    number;
  progressAverage: number;
}

export async function getTaskSummaryForProject(
  projectId: string
): Promise<TaskSummaryForProject> {
  const result = await Task.aggregate<{
    totalTasks:      number;
    completedTasks:  number;
    overdueTasks:    number;
    blockedTasks:    number;
    stalledTasks:    number;
    progressAverage: number | null;
  }>([
    {
      $match: {
        projectId: new Types.ObjectId(projectId),
        archivedAt: null,
      },
    },
    {
      $group: {
        _id:             null,
        totalTasks:      { $sum: 1 },
        completedTasks:  {
          $sum: { $cond: [{ $eq: ['$taskStatus', TaskStatus.Completed] }, 1, 0] },
        },
        overdueTasks:    { $sum: { $cond: ['$isOverdue',  1, 0] } },
        blockedTasks:    { $sum: { $cond: ['$isBlocked',  1, 0] } },
        stalledTasks:    { $sum: { $cond: ['$isStalled',  1, 0] } },
        progressAverage: { $avg: '$progressPercentage' },
      },
    },
  ]);

  if (result.length === 0) {
    return {
      totalTasks:      0,
      completedTasks:  0,
      overdueTasks:    0,
      blockedTasks:    0,
      stalledTasks:    0,
      progressAverage: 0,
    };
  }

  const r = result[0];

  return {
    totalTasks:      r.totalTasks,
    completedTasks:  r.completedTasks,
    overdueTasks:    r.overdueTasks,
    blockedTasks:    r.blockedTasks,
    stalledTasks:    r.stalledTasks,
    progressAverage: Math.round(r.progressAverage ?? 0),
  };
}
