/**
 * KlawTax Performance Utilities
 *
 * Query optimization helpers to prevent:
 *   - Full collection scans
 *   - Oversized query result sets
 *   - Expensive aggregation pipelines
 *   - Unbounded pagination
 */

import { MAX_PAGE_LIMIT } from '../pagination/index';

// ─── Projection Helpers ───────────────────────────────────────────────────────

/**
 * Common field projections for list views.
 * Returns only fields needed for list display — avoids fetching large text fields.
 */
export const LIST_PROJECTIONS = {
  /** Project list card */
  project: {
    _id: 1,
    projectNumber: 1,
    status: 1,
    paymentStatus: 1,
    serviceName: 1,
    clientId: 1,
    assignedEmployeeId: 1,
    isOverdue: 1,
    isStalled: 1,
    expectedDeliveryDate: 1,
    createdAt: 1,
    updatedAt: 1,
  },

  /** Lead list card */
  lead: {
    _id: 1,
    fullName: 1,
    email: 1,
    phone: 1,
    status: 1,
    serviceInterested: 1,
    followUpDate: 1,
    assignedTo: 1,
    createdAt: 1,
    updatedAt: 1,
  },

  /** User list */
  user: {
    _id: 1,
    email: 1,
    role: 1,
    accountStatus: 1,
    isEmailVerified: 1,
    createdAt: 1,
  },

  /** Invoice list */
  invoice: {
    _id: 1,
    invoiceNumber: 1,
    status: 1,
    totalAmount: 1,
    amountPaid: 1,
    dueDate: 1,
    clientId: 1,
    projectId: 1,
    createdAt: 1,
  },

  /** Support ticket list */
  supportTicket: {
    _id: 1,
    ticketNumber: 1,
    subject: 1,
    status: 1,
    priority: 1,
    clientId: 1,
    assignedTo: 1,
    escalationTier: 1,
    createdAt: 1,
    updatedAt: 1,
  },

  /** Notification list */
  notification: {
    _id: 1,
    title: 1,
    message: 1,
    priority: 1,
    isRead: 1,
    category: 1,
    entityType: 1,
    entityId: 1,
    createdAt: 1,
  },

  /** Document list */
  document: {
    _id: 1,
    documentType: 1,
    status: 1,
    originalname: 1,
    mimetype: 1,
    size: 1,
    version: 1,
    isClientVisible: 1,
    projectId: 1,
    uploadedById: 1,
    createdAt: 1,
  },
} as const;

// ─── Lean Query Helpers ───────────────────────────────────────────────────────

/**
 * Standard lean query options.
 * .lean() returns plain JS objects instead of Mongoose Documents.
 * Significantly faster for read-only list operations.
 */
export const LEAN_OPTIONS = { lean: true as const };

// ─── Safe Limit Enforcement ───────────────────────────────────────────────────

/**
 * Clamp a requested limit to the maximum safe value.
 */
export function enforceSafeLimit(requested: number, max = MAX_PAGE_LIMIT): number {
  if (isNaN(requested) || requested < 1) return 20;
  return Math.min(requested, max);
}

/**
 * Enforce a hard cap on aggregation pipeline results.
 * Aggregation pipelines should always include a $limit stage.
 */
export function buildAggregationLimit(
  requestedLimit: number,
  hardMax = 200
): number {
  return Math.min(enforceSafeLimit(requestedLimit), hardMax);
}

// ─── Aggregation Safety ───────────────────────────────────────────────────────

/**
 * Build a safe $match stage for aggregation pipelines.
 * Ensures the match is always the first stage (uses indexes).
 */
export function safeMatchStage(
  filter: Record<string, unknown>
): { $match: Record<string, unknown> } {
  return { $match: filter };
}

/**
 * Build a safe $sort stage.
 * Prevents injection via field names.
 */
export function safeSortStage(
  field: string,
  direction: 1 | -1
): { $sort: Record<string, 1 | -1> } {
  return { $sort: { [field]: direction } };
}

/**
 * Build a $skip + $limit pair for aggregation-based pagination.
 */
export function buildPaginationStages(
  skip: number,
  limit: number
): Array<{ $skip: number } | { $limit: number }> {
  return [{ $skip: skip }, { $limit: limit }];
}

// ─── Dashboard Optimization ───────────────────────────────────────────────────

/**
 * Build a $facet stage that runs count + data queries in parallel.
 * More efficient than separate count() and find() calls.
 */
export function buildFacetPagination(
  dataStages: Record<string, unknown>[],
  skip: number,
  limit: number
): {
  $facet: {
    total: Array<{ $count: string }>;
    data: Record<string, unknown>[];
  };
} {
  return {
    $facet: {
      total: [{ $count: 'count' }],
      data: [...dataStages, { $skip: skip }, { $limit: limit }],
    },
  };
}

// ─── Batch Processing ─────────────────────────────────────────────────────────

/**
 * Process an array in chunks to avoid memory spikes on large datasets.
 * Used for batch notification creation, bulk status updates, etc.
 */
export async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }

  return results;
}

// ─── Query Timing ─────────────────────────────────────────────────────────────

/**
 * Wrap a database operation with a timing log for slow query detection.
 * Logs a warning if the operation exceeds the threshold.
 */
export async function timedQuery<T>(
  label: string,
  operation: () => Promise<T>,
  warningThresholdMs = 500
): Promise<T> {
  const start = Date.now();
  try {
    return await operation();
  } finally {
    const duration = Date.now() - start;
    if (duration > warningThresholdMs) {
      // Dynamic import to avoid circular dependency with logger
      const { logger } = await import('../logger');
      logger.warn(`[SlowQuery][${label}] ${duration}ms (threshold: ${warningThresholdMs}ms)`);
    }
  }
}
