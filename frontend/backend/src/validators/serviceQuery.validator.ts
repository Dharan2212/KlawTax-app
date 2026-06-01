/**
 * Service Query Validator
 *
 * Manual validation middleware for public service API query parameters.
 * No external validation library — keeps dependencies minimal and the
 * build fast.
 *
 * Usage:
 *   router.get('/', validateServiceListQuery, handler)
 *   router.get('/:slug', validateServiceSlugParam, handler)
 */

import { Request, Response, NextFunction } from 'express';
import { ServiceDisplayCategory, ServiceDeliveryType } from '../models/serviceEnums';
import { AppError } from '../middlewares/errorHandler';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_DISPLAY_CATEGORIES = new Set<string>(Object.values(ServiceDisplayCategory));
const VALID_DELIVERY_TYPES = new Set<string>(Object.values(ServiceDeliveryType));

const VALID_SORT_FIELDS = ['displayOrder', 'popularityScore', 'basePrice', 'name'] as const;
type ServiceSortField = (typeof VALID_SORT_FIELDS)[number];

const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

/** Lowercase hyphen-separated slug: e.g. section-8-registration */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ─── Validated Query Shape ────────────────────────────────────────────────────

export interface ValidatedServiceListQuery {
  displayCategory?: ServiceDisplayCategory;
  deliveryType?: ServiceDeliveryType;
  featured?: boolean;
  isBundle?: boolean;
  search?: string;
  page: number;
  limit: number;
  sortBy: ServiceSortField;
  sortOrder: 'asc' | 'desc';
}

// ─── Express Request Augmentation ────────────────────────────────────────────
// Extends the global Express Request type so req.validatedQuery is typed
// wherever this module is imported.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      validatedQuery?: ValidatedServiceListQuery;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBooleanParam(
  value: string,
  name: string,
  errors: string[]
): boolean | undefined {
  if (value !== 'true' && value !== 'false') {
    errors.push(`"${name}" must be "true" or "false"`);
    return undefined;
  }
  return value === 'true';
}

function parsePositiveInt(
  value: string,
  name: string,
  min: number,
  max: number,
  errors: string[]
): number | undefined {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    errors.push(`"${name}" must be an integer between ${min} and ${max}`);
    return undefined;
  }
  return parsed;
}

// ─── Middleware: List Query ────────────────────────────────────────────────────

/**
 * Validates and parses query parameters for GET /api/v1/services.
 * Attaches the parsed result to req.validatedQuery on success.
 * Calls next(AppError) on validation failure.
 */
export function validateServiceListQuery(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const errors: string[] = [];
  const q = req.query as Record<string, string | undefined>;

  // ── displayCategory ───────────────────────────────────────────────────────
  let displayCategory: ServiceDisplayCategory | undefined;
  const rawCategory = q['displayCategory'];
  if (rawCategory !== undefined) {
    if (!VALID_DISPLAY_CATEGORIES.has(rawCategory)) {
      errors.push(
        `"displayCategory" must be one of: ${[...VALID_DISPLAY_CATEGORIES].join(', ')}`
      );
    } else {
      displayCategory = rawCategory as ServiceDisplayCategory;
    }
  }

  // ── deliveryType ──────────────────────────────────────────────────────────
  let deliveryType: ServiceDeliveryType | undefined;
  const rawDeliveryType = q['deliveryType'];
  if (rawDeliveryType !== undefined) {
    if (!VALID_DELIVERY_TYPES.has(rawDeliveryType)) {
      errors.push(
        `"deliveryType" must be one of: ${[...VALID_DELIVERY_TYPES].join(', ')}`
      );
    } else {
      deliveryType = rawDeliveryType as ServiceDeliveryType;
    }
  }

  // ── featured ──────────────────────────────────────────────────────────────
  let featured: boolean | undefined;
  const rawFeatured = q['featured'];
  if (rawFeatured !== undefined) {
    featured = parseBooleanParam(rawFeatured, 'featured', errors);
  }

  // ── isBundle ──────────────────────────────────────────────────────────────
  let isBundle: boolean | undefined;
  const rawIsBundle = q['isBundle'];
  if (rawIsBundle !== undefined) {
    isBundle = parseBooleanParam(rawIsBundle, 'isBundle', errors);
  }

  // ── search ────────────────────────────────────────────────────────────────
  let search: string | undefined;
  const rawSearch = q['search'];
  if (rawSearch !== undefined) {
    const trimmed = rawSearch.trim();
    if (trimmed.length > MAX_SEARCH_LENGTH) {
      errors.push(`"search" must be at most ${MAX_SEARCH_LENGTH} characters`);
    } else if (trimmed.length > 0) {
      search = trimmed;
    }
  }

  // ── page ──────────────────────────────────────────────────────────────────
  let page = 1;
  const rawPage = q['page'];
  if (rawPage !== undefined) {
    const parsed = parsePositiveInt(rawPage, 'page', 1, 10_000, errors);
    if (parsed !== undefined) page = parsed;
  }

  // ── limit ─────────────────────────────────────────────────────────────────
  let limit = 20;
  const rawLimit = q['limit'];
  if (rawLimit !== undefined) {
    const parsed = parsePositiveInt(rawLimit, 'limit', 1, MAX_LIMIT, errors);
    if (parsed !== undefined) limit = parsed;
  }

  // ── sortBy ────────────────────────────────────────────────────────────────
  let sortBy: ServiceSortField = 'displayOrder';
  const rawSortBy = q['sortBy'];
  if (rawSortBy !== undefined) {
    if (!VALID_SORT_FIELDS.includes(rawSortBy as ServiceSortField)) {
      errors.push(`"sortBy" must be one of: ${VALID_SORT_FIELDS.join(', ')}`);
    } else {
      sortBy = rawSortBy as ServiceSortField;
    }
  }

  // ── sortOrder ─────────────────────────────────────────────────────────────
  let sortOrder: 'asc' | 'desc' = 'asc';
  const rawSortOrder = q['sortOrder'];
  if (rawSortOrder !== undefined) {
    if (rawSortOrder !== 'asc' && rawSortOrder !== 'desc') {
      errors.push('"sortOrder" must be "asc" or "desc"');
    } else {
      sortOrder = rawSortOrder;
    }
  }

  // ── Respond on error ──────────────────────────────────────────────────────
  if (errors.length > 0) {
    next(new AppError('Invalid query parameters', 400, 'INVALID_QUERY_PARAMS', { errors }));
    return;
  }

  // ── Attach validated query to request ─────────────────────────────────────
  req.validatedQuery = {
    displayCategory,
    deliveryType,
    featured,
    isBundle,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  };

  next();
}

// ─── Middleware: Slug Param ────────────────────────────────────────────────────

/**
 * Validates the :slug route parameter.
 * Rejects anything that is not a valid lowercase hyphenated slug.
 */
export function validateServiceSlugParam(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { slug } = req.params;

  if (!slug || !SLUG_RE.test(slug)) {
    next(
      new AppError(
        'Service slug must be lowercase and hyphen-separated (e.g. section-8-registration)',
        400,
        'INVALID_SLUG'
      )
    );
    return;
  }

  next();
}
