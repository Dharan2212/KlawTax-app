/**
 * Task Model — Batch 3.2
 *
 * Represents an atomic unit of work within a project.
 *
 * Design decisions:
 *  - Loosely coupled to Project (projectId ref only) so Batch 3.1 owns project logic.
 *  - Dependency tracking stored as an array of ObjectIds; circular-dependency
 *    validation is enforced at the service layer (not the schema).
 *  - Soft-delete via `archivedAt` — never hard-delete tasks (audit safety).
 *  - `completionChecklist` is a lightweight embedded array — not a sub-collection.
 *  - All timestamps managed by the application layer for precision control.
 */

import mongoose, { Schema, Document, Types, Model } from 'mongoose';
import {
  TaskStatus,
  TaskPriority,
  TaskDeliveryType,
  TASK_TERMINAL_STATUSES,
} from './taskEnums';

// ─── Checklist Item ───────────────────────────────────────────────────────────

export interface IChecklistItem {
  _id: Types.ObjectId;
  label: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
}

// ─── Task Document Interface ──────────────────────────────────────────────────

export interface ITask extends Document {
  // ── Identity ──────────────────────────────────────────────────────────────
  title: string;
  slug: string;
  description?: string;

  // ── Project Reference (loosely coupled — Batch 3.1 owns project model) ────
  projectId: Types.ObjectId;

  // ── Hierarchy ─────────────────────────────────────────────────────────────
  parentTaskId?: Types.ObjectId;

  // ── Dependencies ──────────────────────────────────────────────────────────
  /** Tasks that must be completed before this task can complete. */
  dependencyTaskIds: Types.ObjectId[];
  /** Tasks that depend on this task (maintained for reverse lookup). */
  dependentTaskIds: Types.ObjectId[];

  // ── Assignments ───────────────────────────────────────────────────────────
  assignedEmployeeIds: Types.ObjectId[];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  taskStatus: TaskStatus;
  previousStatus?: TaskStatus;
  taskPriority: TaskPriority;

  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  archivedAt?: Date;

  // ── Operational Dates ─────────────────────────────────────────────────────
  dueDate?: Date;
  expectedCompletionDate?: Date;
  lastActivityAt: Date;

  // ── Workflow Flags ────────────────────────────────────────────────────────
  /** True when a dependency task is incomplete (auto-managed by service). */
  isBlocked: boolean;
  blockReason?: string;

  /** True when dueDate has passed and task is not terminal. */
  isOverdue: boolean;

  /** True when no activity recorded within the stall threshold. */
  isStalled: boolean;
  lastStalledAt?: Date;

  /** True when the task requires an admin/employee review step before completion. */
  requiresReview: boolean;

  /** True when the task is waiting for client action/input. */
  requiresClientInput: boolean;

  // ── Progress ──────────────────────────────────────────────────────────────
  progressPercentage: number;  // 0–100
  estimatedHours?: number;
  loggedHours: number;

  // ── Delivery Metadata ─────────────────────────────────────────────────────
  serviceDeliveryTypes: TaskDeliveryType[];

  /** Embedded checklist — lightweight, not a separate collection. */
  completionChecklist: IChecklistItem[];

  // ── Visibility ────────────────────────────────────────────────────────────
  /** If true, this task is never surfaced in client-facing timeline feeds. */
  isInternalOnly: boolean;
  /** If false, the task exists but is hidden from the client portal. */
  visibleToClient: boolean;

  // ── Internal Notes ────────────────────────────────────────────────────────
  internalNotes?: string;

  // ── Audit ─────────────────────────────────────────────────────────────────
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;

  // ── Timestamps (Mongoose auto-manages these) ──────────────────────────────
  createdAt: Date;
  updatedAt: Date;

  // ── Virtual / Instance Methods ────────────────────────────────────────────
  /** Returns true if the task status is terminal. */
  isTerminal(): boolean;

  /** Returns the fraction of checklist items completed. */
  checklistProgress(): { total: number; completed: number; percentage: number };
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    label:       { type: String, required: true, trim: true, maxlength: 500 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 300,
      index: 'text',
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    // ── Project Reference ────────────────────────────────────────────────────
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },

    // ── Hierarchy ────────────────────────────────────────────────────────────
    parentTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },

    // ── Dependencies ─────────────────────────────────────────────────────────
    dependencyTaskIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Task',
      default: [],
    },
    dependentTaskIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Task',
      default: [],
    },

    // ── Assignments ──────────────────────────────────────────────────────────
    assignedEmployeeIds: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
      index: true,
    },

    // ── Lifecycle ────────────────────────────────────────────────────────────
    taskStatus: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.Todo,
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: Object.values(TaskStatus),
    },
    taskPriority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.Medium,
      required: true,
      index: true,
    },

    startedAt:   { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    archivedAt:  { type: Date, index: true },

    // ── Operational Dates ────────────────────────────────────────────────────
    dueDate: {
      type: Date,
      index: true,
    },
    expectedCompletionDate: { type: Date },
    lastActivityAt: {
      type: Date,
      default: () => new Date(),
      required: true,
      index: true,
    },

    // ── Workflow Flags ───────────────────────────────────────────────────────
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockReason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
    isStalled: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastStalledAt: { type: Date },

    requiresReview:      { type: Boolean, default: false },
    requiresClientInput: { type: Boolean, default: false, index: true },

    // ── Progress ─────────────────────────────────────────────────────────────
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    loggedHours: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── Delivery Metadata ────────────────────────────────────────────────────
    serviceDeliveryTypes: {
      type: [String],
      enum: Object.values(TaskDeliveryType),
      default: [],
    },
    completionChecklist: {
      type: [ChecklistItemSchema],
      default: [],
    },

    // ── Visibility ───────────────────────────────────────────────────────────
    isInternalOnly: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibleToClient: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── Internal Notes ───────────────────────────────────────────────────────
    internalNotes: {
      type: String,
      trim: true,
      maxlength: 10000,
    },

    // ── Audit ────────────────────────────────────────────────────────────────
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'tasks',
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────

// Primary query pattern: tasks for a project, by status
TaskSchema.index({ projectId: 1, taskStatus: 1 });

// Overdue detector: open tasks with a past due date
TaskSchema.index({ taskStatus: 1, dueDate: 1, isOverdue: 1 });

// Stalled detector: active tasks with old lastActivityAt
TaskSchema.index({ taskStatus: 1, lastActivityAt: 1, isStalled: 1 });

// Employee workload: tasks assigned to an employee, by project
TaskSchema.index({ assignedEmployeeIds: 1, taskStatus: 1 });
TaskSchema.index({ assignedEmployeeIds: 1, projectId: 1 });

// Parent-child hierarchy
TaskSchema.index({ projectId: 1, parentTaskId: 1 });

// Dependency chain lookup
TaskSchema.index({ dependencyTaskIds: 1 });
TaskSchema.index({ dependentTaskIds: 1 });

// Slug uniqueness within a project
TaskSchema.index({ projectId: 1, slug: 1 }, { unique: true });

// Archive filter (exclude soft-deleted in most queries)
TaskSchema.index({ archivedAt: 1, projectId: 1 });

// ─── Instance Methods ─────────────────────────────────────────────────────────

TaskSchema.methods.isTerminal = function (this: ITask): boolean {
  return TASK_TERMINAL_STATUSES.has(this.taskStatus);
};

TaskSchema.methods.checklistProgress = function (
  this: ITask
): { total: number; completed: number; percentage: number } {
  const total = this.completionChecklist.length;
  if (total === 0) return { total: 0, completed: 0, percentage: 0 };

  const completed = this.completionChecklist.filter((item) => item.isCompleted).length;
  const percentage = Math.round((completed / total) * 100);

  return { total, completed, percentage };
};

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────

TaskSchema.pre('save', function (this: ITask, next) {
  // Auto-generate slug from title if not set
  if (!this.slug || this.isNew) {
    this.slug = generateTaskSlug(this.title);
  }

  // Keep lastActivityAt in sync with meaningful changes
  if (
    this.isModified('taskStatus') ||
    this.isModified('progressPercentage') ||
    this.isModified('assignedEmployeeIds') ||
    this.isModified('completionChecklist')
  ) {
    this.lastActivityAt = new Date();
  }

  // Auto-set started timestamp
  if (
    this.isModified('taskStatus') &&
    this.taskStatus === TaskStatus.InProgress &&
    !this.startedAt
  ) {
    this.startedAt = new Date();
  }

  // Auto-set completed timestamp
  if (
    this.isModified('taskStatus') &&
    this.taskStatus === TaskStatus.Completed &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  // Auto-set cancelled timestamp
  if (
    this.isModified('taskStatus') &&
    this.taskStatus === TaskStatus.Cancelled &&
    !this.cancelledAt
  ) {
    this.cancelledAt = new Date();
  }

  // Auto-set archived timestamp
  if (
    this.isModified('taskStatus') &&
    this.taskStatus === TaskStatus.Archived &&
    !this.archivedAt
  ) {
    this.archivedAt = new Date();
  }

  next();
});

// ─── Slug Generator ───────────────────────────────────────────────────────────

/**
 * Generates a URL-safe slug from a task title.
 * Appends a short random suffix to reduce collision probability.
 */
function generateTaskSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

// ─── Model Export ─────────────────────────────────────────────────────────────

export const Task: Model<ITask> = mongoose.models.Task ?? mongoose.model<ITask>('Task', TaskSchema);
export { TaskSchema };
