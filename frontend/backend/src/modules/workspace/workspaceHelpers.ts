/**
 * Workspace Helpers
 * Batch 5.2
 *
 * Reusable utilities for workspace aggregation, date filtering,
 * and employee-scoped queries. Designed for loose coupling — no
 * business logic lives here, only query helpers and date utilities.
 */

import { Types } from 'mongoose';
import { DashboardWindow } from '../dashboards/employee/employeeDashboardTypes';

// ─── Date Range Helpers ───────────────────────────────────────────────────────

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Returns a UTC-safe start-of-day for a given date.
 * Hours, minutes, seconds, and milliseconds are set to 0.
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a UTC-safe end-of-day for a given date.
 * Hours, minutes, seconds, and milliseconds are set to 23:59:59.999.
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Resolves a DashboardWindow (or custom range) to a concrete DateRange.
 * Falls back to "today" if the window is unknown.
 */
export function resolveDateRange(
  window: DashboardWindow = 'today',
  customFrom?: Date,
  customTo?: Date
): DateRange {
  const now = new Date();

  switch (window) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };

    case 'week': {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 6);
      return { from: startOfDay(from), to: endOfDay(now) };
    }

    case 'month': {
      const from = new Date(now);
      from.setUTCDate(from.getUTCDate() - 29);
      return { from: startOfDay(from), to: endOfDay(now) };
    }

    case 'custom':
      return {
        from: customFrom ? startOfDay(customFrom) : startOfDay(now),
        to: customTo ? endOfDay(customTo) : endOfDay(now),
      };

    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

// ─── Employee Scope Helpers ───────────────────────────────────────────────────

/**
 * Builds the MongoDB match filter to restrict tasks to those assigned
 * to the requesting employee. Uses the `assignedEmployeeIds` array field.
 *
 * Security: every employee-facing task query MUST include this filter.
 * @param userId - The User._id (not EmployeeProfile._id). Tasks store User refs.
 */
export function buildTaskEmployeeFilter(userId: string): Record<string, unknown> {
  return {
    assignedEmployeeIds: new Types.ObjectId(userId),
  };
}

/**
 * Builds the MongoDB match filter to restrict projects to those where the
 * employee appears in the `assignedEmployees` array.
 *
 * Security: every employee-facing project query MUST include this filter.
 * @param userId - The User._id (not EmployeeProfile._id). Projects store User refs.
 */
export function buildProjectEmployeeFilter(userId: string): Record<string, unknown> {
  return {
    'assignedEmployees.userId': new Types.ObjectId(userId),
  };
}

/**
 * Due-today filter for a date field — matches documents whose date field
 * falls within today's UTC boundaries.
 */
export function buildDueTodayFilter(dateField: string): Record<string, unknown> {
  const now = new Date();
  return {
    [dateField]: {
      $gte: startOfDay(now),
      $lte: endOfDay(now),
    },
  };
}

/**
 * Overdue filter for a date field — matches documents whose date field
 * is in the past (before today's start).
 */
export function buildOverdueFilter(dateField: string): Record<string, unknown> {
  return {
    [dateField]: { $lt: startOfDay(new Date()) },
  };
}

/**
 * Converts a MongoDB ObjectId (or string) to a string safely.
 */
export function toStr(id: Types.ObjectId | string | undefined): string {
  if (!id) return '';
  return id.toString();
}

/**
 * Safely formats a Date to ISO string, returning undefined if null/undefined.
 */
export function toISOStr(date: Date | undefined | null): string | undefined {
  return date ? date.toISOString() : undefined;
}
