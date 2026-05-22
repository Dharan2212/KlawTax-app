/**
 * KlawTax Pagination Utilities
 *
 * Standardized pagination helpers used across all list/search endpoints.
 * Ensures consistent response shapes and safe limit enforcement.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Absolute maximum page size — prevents abuse */
export const MAX_PAGE_LIMIT = 100;

/** Default page size for list endpoints */
export const DEFAULT_PAGE_LIMIT = 20;

/** Minimum page number */
export const MIN_PAGE = 1;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse and validate pagination query parameters.
 * Applies safe defaults and enforces maximum limits.
 */
export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  let page = parseInt(String(query['page'] ?? 1), 10);
  let limit = parseInt(String(query['limit'] ?? DEFAULT_PAGE_LIMIT), 10);

  // Clamp values to safe ranges
  if (isNaN(page) || page < MIN_PAGE) page = MIN_PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGE_LIMIT;
  if (limit > MAX_PAGE_LIMIT) limit = MAX_PAGE_LIMIT;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// ─── Metadata Builder ─────────────────────────────────────────────────────────

/**
 * Build pagination metadata for a response.
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
    hasPreviousPage: page > 1,
  };
}

/**
 * Wrap a data array with pagination metadata.
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

// ─── Mongoose Helpers ─────────────────────────────────────────────────────────

/**
 * Convert PaginationParams into Mongoose query options.
 */
export function toMongoosePagination(params: PaginationParams): {
  skip: number;
  limit: number;
} {
  return {
    skip: params.skip,
    limit: params.limit,
  };
}
