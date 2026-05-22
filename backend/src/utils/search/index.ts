/**
 * KlawTax Search Utilities
 *
 * Reusable search and filter helpers for all list endpoints.
 * Mongo-compatible. Does not require Elasticsearch.
 */

import { FilterQuery, Types } from 'mongoose';
import { buildSafeRegex, sanitizeString, validateSortField, validateSortDirection } from '../validation/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BaseSearchOptions {
  /** Free-text keyword search */
  keyword?: string;
  /** Pagination */
  page?: number;
  limit?: number;
  /** Sorting */
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export interface SortOptions {
  [field: string]: 1 | -1;
}

// ─── Keyword Search ───────────────────────────────────────────────────────────

/**
 * Build a MongoDB $or query for keyword search across multiple string fields.
 * Returns null if the keyword is empty or unsafe.
 */
export function buildKeywordFilter<T>(
  keyword: unknown,
  fields: (keyof T & string)[]
): FilterQuery<T> | null {
  const regex = buildSafeRegex(keyword, { caseInsensitive: true });
  if (!regex || fields.length === 0) return null;

  return {
    $or: fields.map((field) => ({ [field]: regex })),
  } as FilterQuery<T>;
}

// ─── Date Range Filter ────────────────────────────────────────────────────────

/**
 * Build a MongoDB date range condition for a given field.
 */
export function buildDateRangeFilter(
  field: string,
  range: DateRangeFilter
): Record<string, unknown> | null {
  const condition: Record<string, Date> = {};
  if (range.from) condition['$gte'] = range.from;
  if (range.to) condition['$lte'] = range.to;
  if (Object.keys(condition).length === 0) return null;
  return { [field]: condition };
}

// ─── Status Filter ────────────────────────────────────────────────────────────

/**
 * Build a status filter from a string or array of statuses.
 * Returns null if input is empty or invalid.
 */
export function buildStatusFilter<T extends string>(
  status: unknown,
  allowedStatuses: ReadonlyArray<T>
): { status: T | { $in: T[] } } | null {
  if (Array.isArray(status)) {
    const valid = (status as unknown[]).filter(
      (s): s is T => typeof s === 'string' && (allowedStatuses as ReadonlyArray<string>).includes(s)
    );
    if (valid.length === 0) return null;
    return { status: { $in: valid } };
  }

  if (typeof status === 'string' && (allowedStatuses as ReadonlyArray<string>).includes(status)) {
    return { status: status as T };
  }

  return null;
}

// ─── ObjectId Filter ─────────────────────────────────────────────────────────

/**
 * Build an ObjectId equality filter if the value is a valid ObjectId.
 * Returns null if invalid — allows callers to skip the filter safely.
 */
export function buildObjectIdFilter(
  field: string,
  value: unknown
): Record<string, Types.ObjectId> | null {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) return null;
  return { [field]: new Types.ObjectId(value) };
}

// ─── Sort Builder ─────────────────────────────────────────────────────────────

/**
 * Build a safe Mongoose sort object from query parameters.
 */
export function buildSortOptions<T extends string>(
  sortBy: unknown,
  sortDir: unknown,
  allowedFields: ReadonlyArray<T>,
  defaultField: T
): SortOptions {
  const field = validateSortField(sortBy, allowedFields, defaultField);
  const dir = validateSortDirection(sortDir);
  return { [field]: dir === 'asc' ? 1 : -1 };
}

// ─── Project Search ───────────────────────────────────────────────────────────

export interface ProjectSearchOptions extends BaseSearchOptions {
  status?: string | string[];
  clientId?: string;
  assignedEmployeeId?: string;
  isOverdue?: boolean;
  isStalled?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export const PROJECT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'expectedDeliveryDate',
  'projectNumber',
  'status',
] as const;

export type ProjectSortField = typeof PROJECT_SORT_FIELDS[number];

export function buildProjectSearchFilter(
  opts: ProjectSearchOptions
): FilterQuery<unknown> {
  const filter: Record<string, unknown> = {};

  const keyword = buildKeywordFilter(opts.keyword, [
    'projectNumber',
    'serviceName',
    'internalNotes',
  ]);
  if (keyword) Object.assign(filter, keyword);

  const statusFilter = buildStatusFilter(opts.status, [] as string[]);
  if (statusFilter) Object.assign(filter, statusFilter);

  const clientFilter = buildObjectIdFilter('clientId', opts.clientId);
  if (clientFilter) Object.assign(filter, clientFilter);

  const employeeFilter = buildObjectIdFilter(
    'assignedEmployeeId',
    opts.assignedEmployeeId
  );
  if (employeeFilter) Object.assign(filter, employeeFilter);

  if (opts.isOverdue === true) filter['isOverdue'] = true;
  if (opts.isStalled === true) filter['isStalled'] = true;

  const dateFilter = buildDateRangeFilter('createdAt', {
    from: opts.dateFrom,
    to: opts.dateTo,
  });
  if (dateFilter) Object.assign(filter, dateFilter);

  return filter as FilterQuery<unknown>;
}

// ─── Lead Search ──────────────────────────────────────────────────────────────

export interface LeadSearchOptions extends BaseSearchOptions {
  status?: string;
  assignedTo?: string;
}

export const LEAD_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'fullName',
  'status',
] as const;

export function buildLeadSearchFilter(
  opts: LeadSearchOptions
): FilterQuery<unknown> {
  const filter: Record<string, unknown> = {};

  const keyword = buildKeywordFilter(opts.keyword, [
    'fullName',
    'email',
    'phone',
    'message',
  ]);
  if (keyword) Object.assign(filter, keyword);

  const statusFilter = buildStatusFilter(opts.status, [] as string[]);
  if (statusFilter) Object.assign(filter, statusFilter);

  const assignedFilter = buildObjectIdFilter('assignedTo', opts.assignedTo);
  if (assignedFilter) Object.assign(filter, assignedFilter);

  return filter as FilterQuery<unknown>;
}

// ─── Support Ticket Search ────────────────────────────────────────────────────

export interface SupportSearchOptions extends BaseSearchOptions {
  status?: string;
  priority?: string;
  clientId?: string;
}

export const SUPPORT_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'priority',
  'status',
] as const;

export function buildSupportSearchFilter(
  opts: SupportSearchOptions
): FilterQuery<unknown> {
  const filter: Record<string, unknown> = {};

  const keyword = buildKeywordFilter(opts.keyword, ['subject', 'description']);
  if (keyword) Object.assign(filter, keyword);

  if (typeof opts.status === 'string' && opts.status) {
    filter['status'] = sanitizeString(opts.status, 50);
  }
  if (typeof opts.priority === 'string' && opts.priority) {
    filter['priority'] = sanitizeString(opts.priority, 50);
  }

  const clientFilter = buildObjectIdFilter('clientId', opts.clientId);
  if (clientFilter) Object.assign(filter, clientFilter);

  return filter as FilterQuery<unknown>;
}

// ─── Invoice Search ───────────────────────────────────────────────────────────

export interface InvoiceSearchOptions extends BaseSearchOptions {
  status?: string;
  clientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export const INVOICE_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'dueDate',
  'invoiceNumber',
  'totalAmount',
  'status',
] as const;

export function buildInvoiceSearchFilter(
  opts: InvoiceSearchOptions
): FilterQuery<unknown> {
  const filter: Record<string, unknown> = {};

  const keyword = buildKeywordFilter(opts.keyword, ['invoiceNumber']);
  if (keyword) Object.assign(filter, keyword);

  if (typeof opts.status === 'string' && opts.status) {
    filter['status'] = opts.status;
  }

  const clientFilter = buildObjectIdFilter('clientId', opts.clientId);
  if (clientFilter) Object.assign(filter, clientFilter);

  const dateFilter = buildDateRangeFilter('createdAt', {
    from: opts.dateFrom,
    to: opts.dateTo,
  });
  if (dateFilter) Object.assign(filter, dateFilter);

  return filter as FilterQuery<unknown>;
}
