/**
 * Timeline Service — Batch 3.2
 *
 * Centralized engine for:
 *  - Generating timeline entries from lifecycle events
 *  - Grouped timeline feed construction
 *  - Client-visible timeline filtering
 *  - Actor-aware event attribution
 *
 * Integration points:
 *  - Called by TaskService on every meaningful mutation
 *  - Will be called by ProjectService (Batch 3.1) on project lifecycle events
 *  - Exposed via Timeline routes for CRM + client portal feeds
 *
 * DO NOT scatter timeline creation logic across other modules.
 * All timeline writes go through this service.
 */

import { Types, FilterQuery } from 'mongoose';
import { TimelineEntry, ITimelineEntry } from '../../models/timelineEntry';
import { ITask } from '../../models/task';
import {
  TimelineEventType,
  TimelineEventCategory,
  TimelineVisibility,
  TimelineActorRole,
  TimelineRelatedEntityType,
  TaskStatus,
} from '../../models/taskEnums';
import { buildPaginationMeta } from '../../utils/response';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineActorContext {
  actorId?: string | Types.ObjectId;
  actorRole: TimelineActorRole;
  actorDisplayName?: string;
}

export interface CreateTimelineEntryInput {
  projectId?: string | Types.ObjectId;
  taskId?: string | Types.ObjectId;
  relatedEntityId?: string | Types.ObjectId;
  relatedEntityType?: TimelineRelatedEntityType;

  eventType: TimelineEventType;
  eventCategory: TimelineEventCategory;

  title: string;
  description?: string;

  visibility: TimelineVisibility;

  actor: TimelineActorContext;

  metadata?: Record<string, unknown>;
  snapshot?: Record<string, unknown>;
  tags?: string[];

  systemGenerated?: boolean;
}

export interface TimelineFeedOptions {
  projectId?: string;
  taskId?: string;
  eventCategory?: TimelineEventCategory;
  eventType?: TimelineEventType;
  /** If true, only returns entries visible to clients. */
  clientView?: boolean;
  /** If true, returns grouped (de-duplicated) entries. */
  grouped?: boolean;
  since?: Date;
  until?: Date;
  page?: number;
  limit?: number;
}

export interface GroupedTimelineEntry {
  groupKey: string;
  groupedAt: Date;
  eventCategory: TimelineEventCategory;
  eventCount: number;
  latestEvent: ITimelineEntry;
  events?: ITimelineEntry[];
}

// ─── Group Key Generation ─────────────────────────────────────────────────────

/**
 * Generates a deterministic group key for a timeline entry.
 * Groups events that share the same project, category, and actor within a 15-minute window.
 */
function buildGroupKey(
  projectId: string | Types.ObjectId | undefined,
  eventCategory: TimelineEventCategory,
  actorId: string | Types.ObjectId | undefined,
  timestamp: Date
): string {
  const projPart = projectId?.toString() ?? 'global';
  const actorPart = actorId?.toString() ?? 'system';

  // Round timestamp to nearest 15-minute window
  const windowMs = 15 * 60 * 1000;
  const windowStart = new Date(Math.floor(timestamp.getTime() / windowMs) * windowMs);
  const windowPart = windowStart.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

  return `${projPart}:${eventCategory}:${actorPart}:${windowPart}`;
}

// ─── Core Entry Creation ──────────────────────────────────────────────────────

/**
 * Creates a single timeline entry.
 * This is the single point of entry for all timeline writes.
 */
export async function createTimelineEntry(
  input: CreateTimelineEntryInput
): Promise<ITimelineEntry> {
  const now = new Date();

  const groupKey = buildGroupKey(
    input.projectId,
    input.eventCategory,
    input.actor.actorId,
    now
  );

  // Round to the 15-minute window for groupedAt
  const windowMs = 15 * 60 * 1000;
  const groupedAt = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  const entry = new TimelineEntry({
    projectId:         input.projectId ? new Types.ObjectId(input.projectId.toString()) : undefined,
    taskId:            input.taskId    ? new Types.ObjectId(input.taskId.toString())    : undefined,
    relatedEntityId:   input.relatedEntityId
      ? new Types.ObjectId(input.relatedEntityId.toString())
      : undefined,
    relatedEntityType: input.relatedEntityType,

    eventType:     input.eventType,
    eventCategory: input.eventCategory,

    title:       input.title,
    description: input.description,

    visibility: input.visibility,

    actorId:          input.actor.actorId
      ? new Types.ObjectId(input.actor.actorId.toString())
      : undefined,
    actorRole:        input.actor.actorRole,
    actorDisplayName: input.actor.actorDisplayName,

    metadata:        input.metadata ?? {},
    snapshot:        input.snapshot,
    tags:            input.tags ?? [],

    groupKey,
    groupedAt,

    systemGenerated: input.systemGenerated ?? false,
  });

  await entry.save();

  logger.debug('[Timeline] Entry created', {
    eventType: input.eventType,
    projectId: input.projectId?.toString(),
    taskId:    input.taskId?.toString(),
  });

  return entry;
}

// ─── Task Lifecycle Event Generators ─────────────────────────────────────────

/**
 * Creates a timeline entry when a task is created.
 */
export async function recordTaskCreated(
  task: ITask,
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskCreated,
    eventCategory: TimelineEventCategory.TaskActivity,

    title:       `Task created: "${task.title}"`,
    description: task.description,

    visibility: task.isInternalOnly
      ? TimelineVisibility.Internal
      : TimelineVisibility.Internal, // Task creation is internal by default

    actor,
    metadata: {
      taskSlug:    task.slug,
      taskStatus:  task.taskStatus,
      taskPriority: task.taskPriority,
    },
  });
}

/**
 * Creates a timeline entry when a task's status changes.
 */
export async function recordTaskStatusChanged(
  task: ITask,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
  actor: TimelineActorContext,
  reason?: string
): Promise<void> {
  const isCompletion = toStatus === TaskStatus.Completed;
  const isCancellation = toStatus === TaskStatus.Cancelled;

  // Completion events are surfaced to clients; other transitions are internal
  const visibility = isCompletion
    ? TimelineVisibility.Client
    : TimelineVisibility.Internal;

  const eventType = isCompletion
    ? TimelineEventType.TaskCompleted
    : isCancellation
      ? TimelineEventType.TaskCancelled
      : TimelineEventType.TaskStatusChanged;

  const title = isCompletion
    ? `Task completed: "${task.title}"`
    : `Task status changed: "${task.title}" → ${toStatus.replace(/_/g, ' ')}`;

  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType,
    eventCategory: TimelineEventCategory.StatusChange,

    title,
    description: reason,

    visibility,

    actor,
    metadata: {
      fromStatus,
      toStatus,
      reason,
    },
    snapshot: {
      taskStatus:         toStatus,
      progressPercentage: task.progressPercentage,
    },
    tags: [toStatus, isCompletion ? 'completion' : 'status_change'],
  });
}

/**
 * Creates a timeline entry when a task is assigned.
 */
export async function recordTaskAssigned(
  task: ITask,
  assignedEmployeeIds: string[],
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskAssigned,
    eventCategory: TimelineEventCategory.Assignment,

    title:       `Task assigned: "${task.title}"`,
    description: `Assigned to ${assignedEmployeeIds.length} employee(s)`,

    visibility: TimelineVisibility.Internal,

    actor,
    metadata: {
      assignedEmployeeIds,
    },
    tags: ['assignment'],
  });
}

/**
 * Creates a timeline entry when a task is blocked.
 */
export async function recordTaskBlocked(
  task: ITask,
  reason: string | undefined,
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskBlocked,
    eventCategory: TimelineEventCategory.Alert,

    title:       `Task blocked: "${task.title}"`,
    description: reason,

    visibility: TimelineVisibility.Internal,

    actor,
    metadata: { reason },
    tags: ['blocked', 'alert'],
    systemGenerated: actor.actorRole === TimelineActorRole.System,
  });
}

/**
 * Creates a timeline entry when a task is unblocked.
 */
export async function recordTaskUnblocked(
  task: ITask,
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskUnblocked,
    eventCategory: TimelineEventCategory.TaskActivity,

    title:       `Task unblocked: "${task.title}"`,

    visibility: TimelineVisibility.Internal,

    actor,
    tags: ['unblocked'],
    systemGenerated: actor.actorRole === TimelineActorRole.System,
  });
}

/**
 * Creates a timeline entry when task progress is updated.
 */
export async function recordTaskProgressUpdated(
  task: ITask,
  previousProgress: number,
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskProgressUpdated,
    eventCategory: TimelineEventCategory.Progress,

    title:       `Task progress updated: "${task.title}" → ${task.progressPercentage}%`,

    visibility: TimelineVisibility.Internal,

    actor,
    metadata: {
      previousProgress,
      newProgress: task.progressPercentage,
    },
    tags: ['progress'],
  });
}

/**
 * Records a dependency addition event.
 */
export async function recordDependencyAdded(
  task: ITask,
  dependencyTaskId: string,
  dependencyTitle: string,
  actor: TimelineActorContext
): Promise<void> {
  await createTimelineEntry({
    projectId: task.projectId,
    taskId:    task._id as Types.ObjectId,
    relatedEntityId:   task._id as Types.ObjectId,
    relatedEntityType: TimelineRelatedEntityType.Task,

    eventType:     TimelineEventType.TaskDependencyAdded,
    eventCategory: TimelineEventCategory.TaskActivity,

    title:       `Dependency added to "${task.title}": depends on "${dependencyTitle}"`,

    visibility: TimelineVisibility.Internal,

    actor,
    metadata: { dependencyTaskId, dependencyTitle },
    tags: ['dependency'],
  });
}

// ─── Feed Queries ─────────────────────────────────────────────────────────────

/**
 * Retrieves a paginated timeline feed with optional filtering.
 * Applies visibility filtering based on the caller's role.
 */
export async function getTimelineFeed(
  options: TimelineFeedOptions,
  viewerVisibilityFilter: TimelineVisibility[]
): Promise<{
  entries: ITimelineEntry[];
  total: number;
  meta: ReturnType<typeof buildPaginationMeta>;
}> {
  const {
    projectId,
    taskId,
    eventCategory,
    eventType,
    since,
    until,
    page = 1,
    limit = 20,
  } = options;

  const query: FilterQuery<ITimelineEntry> = {
    visibility: { $in: viewerVisibilityFilter },
  };

  if (projectId)     query.projectId    = new Types.ObjectId(projectId);
  if (taskId)        query.taskId       = new Types.ObjectId(taskId);
  if (eventCategory) query.eventCategory = eventCategory;
  if (eventType)     query.eventType    = eventType;

  if (since || until) {
    query.createdAt = {};
    if (since) query.createdAt.$gte = since;
    if (until) query.createdAt.$lte = until;
  }

  const skip = (page - 1) * limit;

  const [rawEntries, total] = await Promise.all([
    TimelineEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TimelineEntry.countDocuments(query),
  ]);

  const entries = rawEntries as unknown as ITimelineEntry[];

  return {
    entries,
    total,
    meta: buildPaginationMeta(page, limit, total),
  };
}

/**
 * Returns the visibility filter array for a given actor role.
 * Admins see all. Employees see internal + client. Clients see client only.
 */
export function resolveVisibilityFilter(
  actorRole: TimelineActorRole | string
): TimelineVisibility[] {
  switch (actorRole) {
    case TimelineActorRole.Admin:
      return [
        TimelineVisibility.AdminOnly,
        TimelineVisibility.Internal,
        TimelineVisibility.Client,
      ];
    case TimelineActorRole.Employee:
      return [
        TimelineVisibility.Internal,
        TimelineVisibility.Client,
      ];
    case TimelineActorRole.Client:
      return [TimelineVisibility.Client];
    default:
      return [TimelineVisibility.Client];
  }
}

/**
 * Returns a grouped timeline feed.
 * Groups entries by groupKey and returns the latest event per group
 * with an event count.
 */
export async function getGroupedTimelineFeed(
  options: TimelineFeedOptions,
  viewerVisibilityFilter: TimelineVisibility[]
): Promise<GroupedTimelineEntry[]> {
  const { projectId, taskId, since, until } = options;

  const match: FilterQuery<ITimelineEntry> = {
    visibility: { $in: viewerVisibilityFilter },
    groupKey: { $exists: true },
  };

  if (projectId) match.projectId = new Types.ObjectId(projectId);
  if (taskId)    match.taskId    = new Types.ObjectId(taskId);
  if (since || until) {
    match.createdAt = {};
    if (since) match.createdAt.$gte = since;
    if (until) match.createdAt.$lte = until;
  }

  // Aggregate: group by groupKey, get count and latest entry
  const groups = await TimelineEntry.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id:           '$groupKey',
        groupKey:      { $first: '$groupKey' },
        groupedAt:     { $first: '$groupedAt' },
        eventCategory: { $first: '$eventCategory' },
        eventCount:    { $sum: 1 },
        latestEvent:   { $first: '$$ROOT' },
      },
    },
    { $sort: { groupedAt: -1 } },
    { $limit: options.limit ?? 20 },
  ]);

  return groups.map((g) => ({
    groupKey:      g.groupKey,
    groupedAt:     g.groupedAt,
    eventCategory: g.eventCategory,
    eventCount:    g.eventCount,
    latestEvent:   g.latestEvent,
  }));
}
