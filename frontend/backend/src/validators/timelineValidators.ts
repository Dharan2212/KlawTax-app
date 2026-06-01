/**
 * Timeline Validators — Batch 3.2
 */

import { z } from 'zod';
import { Types } from 'mongoose';
import {
  TimelineEventType,
  TimelineEventCategory,
  TimelineVisibility,
} from '../models/taskEnums';
import { ValidationError } from '../middlewares/errorHandler';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

const objectIdSchema = z
  .string()
  .min(1)
  .refine((val) => Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

const optionalObjectId = objectIdSchema.optional();

// ─── Manual Timeline Entry ────────────────────────────────────────────────────

export const createManualTimelineEntrySchema = z.object({
  projectId:  objectIdSchema,
  taskId:     optionalObjectId,

  eventType:     z.nativeEnum(TimelineEventType).default(TimelineEventType.ProjectNoteAdded),
  eventCategory: z.nativeEnum(TimelineEventCategory).default(TimelineEventCategory.Communication),

  title:       z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).optional(),

  visibility: z.nativeEnum(TimelineVisibility).default(TimelineVisibility.Internal),

  tags: z.array(z.string().trim().max(50)).max(20).default([]),
});

export type CreateManualTimelineEntryDTO = z.infer<typeof createManualTimelineEntrySchema>;

// ─── Timeline Query ───────────────────────────────────────────────────────────

export const timelineQuerySchema = z.object({
  projectId:     optionalObjectId,
  taskId:        optionalObjectId,
  eventCategory: z.nativeEnum(TimelineEventCategory).optional(),
  eventType:     z.nativeEnum(TimelineEventType).optional(),

  /** For client-facing queries — only returns client-visible entries. */
  clientView: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  /**
   * For grouped feed queries — returns one representative entry per group key.
   */
  grouped: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  page:  z.string().optional().transform((v) => parseInt(v ?? '1', 10) || 1),
  limit: z.string().optional().transform((v) => Math.min(100, parseInt(v ?? '20', 10) || 20)),

  /** ISO datetime — returns entries created after this timestamp. */
  since: z.string().datetime().optional(),
  /** ISO datetime — returns entries created before this timestamp. */
  until: z.string().datetime().optional(),
});

export type TimelineQueryDTO = z.infer<typeof timelineQuerySchema>;

// ─── Validator Functions ──────────────────────────────────────────────────────

export function validateCreateManualTimelineEntry(
  body: unknown
): CreateManualTimelineEntryDTO {
  const result = createManualTimelineEntrySchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Invalid timeline entry payload', result.error.flatten());
  }
  return result.data;
}

export function validateTimelineQuery(query: unknown): TimelineQueryDTO {
  const result = timelineQuerySchema.safeParse(query);
  if (!result.success) {
    throw new ValidationError('Invalid timeline query parameters', result.error.flatten());
  }
  return result.data;
}
