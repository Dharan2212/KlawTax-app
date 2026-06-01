/**
 * Client Dashboard / Portal Validators
 *
 * Zod-free, lightweight validation helpers for client-portal query parameters.
 * Keeps validation consistent and prevents bad input from reaching service layers.
 */

import { Request } from 'express';
import { Types }   from 'mongoose';

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page:  number;
  limit: number;
}

/**
 * Parse and clamp pagination params from query string.
 * Defaults: page=1, limit=10. Max limit: 50.
 */
export function parsePaginationQuery(query: Request['query'], maxLimit = 50): PaginationQuery {
  const page  = Math.max(1, parseInt(String(query.page  ?? '1'),  10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(query.limit ?? '10'), 10) || 10));
  return { page, limit };
}

// ─── Preview Limit ────────────────────────────────────────────────────────────

/**
 * Parse a preview list limit (used for dashboard snapshot).
 * Range: 1–20. Default: 5.
 */
export function parsePreviewLimit(query: Request['query']): number {
  return Math.min(20, Math.max(1, parseInt(String(query.limit ?? '5'), 10) || 5));
}

// ─── ObjectId Param ───────────────────────────────────────────────────────────

/**
 * Validate a route param is a valid MongoDB ObjectId string.
 * Returns the validated string or null if invalid.
 */
export function validateObjectIdParam(value: string | undefined): string | null {
  if (!value || !Types.ObjectId.isValid(value)) return null;
  return value;
}

/**
 * Parse optional projectId from query string for document filtering.
 */
export function parseOptionalProjectFilter(query: Request['query']): string | undefined {
  const val = query.projectId;
  if (typeof val !== 'string' || !Types.ObjectId.isValid(val)) return undefined;
  return val;
}
