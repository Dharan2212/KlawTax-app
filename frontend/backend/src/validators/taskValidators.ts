/**
 * Task Validators — Batch 3.2
 *
 * Zod schemas for all task-related API payloads.
 * Follows the existing validation pattern in the codebase.
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import { TaskStatus, TaskPriority, TaskDeliveryType } from '../models/taskEnums';
import { ValidationError } from '../middlewares/errorHandler';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

/** Validates a MongoDB ObjectId string. */
const objectIdSchema = z
  .string()
  .min(1)
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

const optionalObjectId = objectIdSchema.optional();

/** Non-empty trimmed string. */
const requiredString = (max = 500) =>
  z.string().trim().min(1).max(max);

const optionalString = (max = 500) =>
  z.string().trim().max(max).optional();

// ─── Create Task ──────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: requiredString(300),
  description: optionalString(5000),

  projectId: objectIdSchema,
  parentTaskId: optionalObjectId,

  taskPriority: z.nativeEnum(TaskPriority).default(TaskPriority.Medium),

  dueDate: z
    .string()
    .datetime({ message: 'dueDate must be an ISO 8601 datetime string' })
    .optional(),

  expectedCompletionDate: z
    .string()
    .datetime()
    .optional(),

  assignedEmployeeIds: z.array(objectIdSchema).max(10).default([]),

  estimatedHours: z.number().min(0).max(9999).optional(),

  serviceDeliveryTypes: z
    .array(z.nativeEnum(TaskDeliveryType))
    .default([]),

  requiresReview:      z.boolean().default(false),
  requiresClientInput: z.boolean().default(false),
  isInternalOnly:      z.boolean().default(false),
  visibleToClient:     z.boolean().default(false),

  internalNotes: optionalString(10000),

  completionChecklist: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(500),
      })
    )
    .max(50)
    .default([]),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;

// ─── Update Task ──────────────────────────────────────────────────────────────

export const updateTaskSchema = z.object({
  title:       optionalString(300),
  description: optionalString(5000),

  taskPriority: z.nativeEnum(TaskPriority).optional(),

  dueDate:               z.string().datetime().optional().nullable(),
  expectedCompletionDate: z.string().datetime().optional().nullable(),

  assignedEmployeeIds: z.array(objectIdSchema).max(10).optional(),

  estimatedHours: z.number().min(0).max(9999).optional(),
  loggedHours:    z.number().min(0).max(9999).optional(),

  progressPercentage: z.number().min(0).max(100).optional(),

  serviceDeliveryTypes: z.array(z.nativeEnum(TaskDeliveryType)).optional(),

  requiresReview:      z.boolean().optional(),
  requiresClientInput: z.boolean().optional(),
  isInternalOnly:      z.boolean().optional(),
  visibleToClient:     z.boolean().optional(),

  internalNotes: optionalString(10000),
});

export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;

// ─── Status Transition ────────────────────────────────────────────────────────

export const taskStatusTransitionSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  reason: optionalString(1000),
});

export type TaskStatusTransitionDTO = z.infer<typeof taskStatusTransitionSchema>;

// ─── Add Dependency ───────────────────────────────────────────────────────────

export const addDependencySchema = z.object({
  dependencyTaskId: objectIdSchema,
});

export type AddDependencyDTO = z.infer<typeof addDependencySchema>;

// ─── Remove Dependency ────────────────────────────────────────────────────────

export const removeDependencySchema = z.object({
  dependencyTaskId: objectIdSchema,
});

export type RemoveDependencyDTO = z.infer<typeof removeDependencySchema>;

// ─── Checklist Update ─────────────────────────────────────────────────────────

export const updateChecklistItemSchema = z.object({
  checklistItemId: objectIdSchema,
  isCompleted: z.boolean(),
});

export type UpdateChecklistItemDTO = z.infer<typeof updateChecklistItemSchema>;

// ─── Task List Query ──────────────────────────────────────────────────────────

export const taskQuerySchema = z.object({
  projectId:  optionalObjectId,
  taskStatus: z.nativeEnum(TaskStatus).optional(),
  assignedEmployeeId: optionalObjectId,
  isOverdue:  z
    .string()
    .optional()
    .transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isBlocked:  z
    .string()
    .optional()
    .transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  isStalled:  z
    .string()
    .optional()
    .transform((v) => v === 'true' ? true : v === 'false' ? false : undefined),
  page:  z.string().optional().transform((v) => parseInt(v ?? '1', 10) || 1),
  limit: z.string().optional().transform((v) => Math.min(100, parseInt(v ?? '20', 10) || 20)),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'taskPriority', 'lastActivityAt', 'progressPercentage'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TaskQueryDTO = z.infer<typeof taskQuerySchema>;

// ─── Validator Functions ──────────────────────────────────────────────────────

export function validateCreateTask(body: unknown): CreateTaskDTO {
  const result = createTaskSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid task payload', result.error.flatten());
  }
  return result.data;
}

export function validateUpdateTask(body: unknown): UpdateTaskDTO {
  const result = updateTaskSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid task update payload', result.error.flatten());
  }
  return result.data;
}

export function validateTaskStatusTransition(body: unknown): TaskStatusTransitionDTO {
  const result = taskStatusTransitionSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid status transition payload', result.error.flatten());
  }
  return result.data;
}

export function validateAddDependency(body: unknown): AddDependencyDTO {
  const result = addDependencySchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid dependency payload', result.error.flatten());
  }
  return result.data;
}

export function validateUpdateChecklistItem(body: unknown): UpdateChecklistItemDTO {
  const result = updateChecklistItemSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid checklist update payload', result.error.flatten());
  }
  return result.data;
}

export function validateTaskQuery(query: unknown): TaskQueryDTO {
  const result = taskQuerySchema.safeParse(query);
  if (!result.success) {
    throw new ValidationError('Invalid task query parameters', result.error.flatten());
  }
  return result.data;
}
