/**
 * Task + Timeline Enums — Batch 3.2
 *
 * Canonical definitions for task lifecycle, priority, dependency state,
 * and timeline event/category types.
 *
 * Import from this file everywhere task/timeline logic is needed.
 * DO NOT duplicate these values in other modules.
 */

// ─── Task Status ──────────────────────────────────────────────────────────────

/**
 * Full task lifecycle status set.
 *
 * Allowed transitions (enforced in TaskService):
 *   todo        → queued | in_progress | blocked | cancelled
 *   queued      → in_progress | blocked | cancelled
 *   in_progress → waiting_review | waiting_client | blocked | completed | cancelled
 *   waiting_review → in_progress | completed | cancelled
 *   waiting_client → in_progress | blocked | cancelled
 *   blocked     → todo | queued | in_progress | cancelled
 *   completed   → archived
 *   cancelled   → (terminal — no outbound transitions)
 *   archived    → (terminal — no outbound transitions)
 */
export enum TaskStatus {
  Todo           = 'todo',
  Queued         = 'queued',
  InProgress     = 'in_progress',
  WaitingReview  = 'waiting_review',
  WaitingClient  = 'waiting_client',
  Blocked        = 'blocked',
  Completed      = 'completed',
  Cancelled      = 'cancelled',
  Archived       = 'archived',
}

/** Terminal statuses — no further transitions allowed. */
export const TASK_TERMINAL_STATUSES = new Set<TaskStatus>([
  TaskStatus.Cancelled,
  TaskStatus.Archived,
]);

/** Active work statuses — tasks that count toward employee workload. */
export const TASK_ACTIVE_STATUSES = new Set<TaskStatus>([
  TaskStatus.Queued,
  TaskStatus.InProgress,
  TaskStatus.WaitingReview,
  TaskStatus.WaitingClient,
]);

/** Non-terminal statuses — valid for overdue/stalled detection queries. */
export const TASK_OPEN_STATUSES = new Set<TaskStatus>([
  TaskStatus.Todo,
  TaskStatus.Queued,
  TaskStatus.InProgress,
  TaskStatus.WaitingReview,
  TaskStatus.WaitingClient,
  TaskStatus.Blocked,
]);

/**
 * Canonical transition matrix.
 * Key = current status, Value = set of allowed next statuses.
 */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.Todo]: [
    TaskStatus.Queued,
    TaskStatus.InProgress,
    TaskStatus.Blocked,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.Queued]: [
    TaskStatus.InProgress,
    TaskStatus.Blocked,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.InProgress]: [
    TaskStatus.WaitingReview,
    TaskStatus.WaitingClient,
    TaskStatus.Blocked,
    TaskStatus.Completed,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.WaitingReview]: [
    TaskStatus.InProgress,
    TaskStatus.Completed,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.WaitingClient]: [
    TaskStatus.InProgress,
    TaskStatus.Blocked,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.Blocked]: [
    TaskStatus.Todo,
    TaskStatus.Queued,
    TaskStatus.InProgress,
    TaskStatus.Cancelled,
  ],
  [TaskStatus.Completed]: [
    TaskStatus.Archived,
  ],
  [TaskStatus.Cancelled]: [],
  [TaskStatus.Archived]:  [],
};

// ─── Task Priority ────────────────────────────────────────────────────────────

export enum TaskPriority {
  Low      = 'low',
  Medium   = 'medium',
  High     = 'high',
  Urgent   = 'urgent',
  Critical = 'critical',
}

// ─── Task Delivery Type ───────────────────────────────────────────────────────

/**
 * Mirrors the serviceDeliveryType on the parent project/service.
 * Used by completion gates and workflow-aware logic.
 */
export enum TaskDeliveryType {
  LegalRegistration = 'legal_registration',
  Certification     = 'certification',
  Filing            = 'filing',
  Digital           = 'digital',
  Advisory          = 'advisory',
}

// ─── Timeline Event Types ─────────────────────────────────────────────────────

/**
 * Granular event types for the timeline.
 * Used by the timeline engine to categorize and filter entries.
 */
export enum TimelineEventType {
  // Task lifecycle
  TaskCreated          = 'task.created',
  TaskUpdated          = 'task.updated',
  TaskStatusChanged    = 'task.status_changed',
  TaskAssigned         = 'task.assigned',
  TaskUnassigned       = 'task.unassigned',
  TaskCompleted        = 'task.completed',
  TaskCancelled        = 'task.cancelled',
  TaskArchived         = 'task.archived',
  TaskBlocked          = 'task.blocked',
  TaskUnblocked        = 'task.unblocked',
  TaskProgressUpdated  = 'task.progress_updated',
  TaskDependencyAdded  = 'task.dependency_added',
  TaskDependencyRemoved = 'task.dependency_removed',
  TaskOverdueDetected  = 'task.overdue_detected',
  TaskStalledDetected  = 'task.stalled_detected',
  TaskNoteAdded        = 'task.note_added',

  // Project lifecycle events
  ProjectStatusChanged = 'project.status_changed',
  ProjectAssigned      = 'project.assigned',
  ProjectCompleted     = 'project.completed',
  ProjectOverdue       = 'project.overdue_detected',
  ProjectStalled       = 'project.stalled_detected',
  ProjectNoteAdded     = 'project.note_added',

  // System events
  SystemGenerated      = 'system.generated',
  SystemAlert          = 'system.alert',
}

// ─── Timeline Event Category ──────────────────────────────────────────────────

/**
 * High-level grouping for timeline entries.
 * Used for filtered feeds and grouped display in the CRM/client portal.
 */
export enum TimelineEventCategory {
  TaskActivity    = 'task_activity',
  ProjectActivity = 'project_activity',
  Assignment      = 'assignment',
  StatusChange    = 'status_change',
  Progress        = 'progress',
  Communication   = 'communication',
  System          = 'system',
  Alert           = 'alert',
}

// ─── Timeline Visibility ──────────────────────────────────────────────────────

/**
 * Visibility tiers for timeline entries.
 * Controls which audience can see each entry in filtered feeds.
 */
export enum TimelineVisibility {
  /** Only admin users can see this entry. */
  AdminOnly = 'admin_only',
  /** Admin and employee users can see this entry. */
  Internal  = 'internal',
  /** All authenticated roles (admin, employee, client) can see this entry. */
  Client    = 'client',
}

// ─── Timeline Actor Role ──────────────────────────────────────────────────────

export enum TimelineActorRole {
  Admin    = 'admin',
  Employee = 'employee',
  Client   = 'client',
  System   = 'system',
}

// ─── Related Entity Types ─────────────────────────────────────────────────────

export enum TimelineRelatedEntityType {
  Task     = 'Task',
  Project  = 'Project',
  Document = 'Document',
  Invoice  = 'Invoice',
  Approval = 'Approval',
  Lead     = 'Lead',
  User     = 'User',
}

// ─── Validation Utilities ─────────────────────────────────────────────────────

/**
 * Returns true if a transition from `current` to `next` is permitted.
 */
export function isValidTaskTransition(current: TaskStatus, next: TaskStatus): boolean {
  return TASK_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * Returns true if the given status is terminal (no outbound transitions).
 */
export function isTerminalTaskStatus(status: TaskStatus): boolean {
  return TASK_TERMINAL_STATUSES.has(status);
}

/**
 * Returns true if the status is considered active work.
 */
export function isActiveTaskStatus(status: TaskStatus): boolean {
  return TASK_ACTIVE_STATUSES.has(status);
}

/**
 * Returns allowed next statuses from a given status.
 */
export function getAllowedTaskTransitions(current: TaskStatus): TaskStatus[] {
  return TASK_STATUS_TRANSITIONS[current] ?? [];
}
