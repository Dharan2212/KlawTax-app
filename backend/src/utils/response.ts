import { Response } from 'express';

// ─── Response Envelope ────────────────────────────────────────────────────────

interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

/**
 * Send a successful JSON response with a consistent envelope.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: {
    message?: string;
    statusCode?: number;
    meta?: PaginationMeta;
  }
): void {
  const { message, statusCode = 200, meta } = options ?? {};

  const body: SuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };

  res.status(statusCode).json(body);
}

/**
 * Build a PaginationMeta object from query parameters and total count.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Parse and clamp pagination query parameters.
 */
export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(rawPage ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(rawLimit ?? '20'), 10) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}
