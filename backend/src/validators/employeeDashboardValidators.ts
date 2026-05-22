/**
 * Employee Dashboard Validators
 * Batch 5.2
 *
 * Validates query parameters for the employee dashboard endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../middlewares/errorHandler';
import { EmployeeDashboardQuery, DashboardWindow } from '../modules/dashboards/employee/employeeDashboardTypes';

const VALID_WINDOWS: DashboardWindow[] = ['today', 'week', 'month', 'custom'];

/**
 * Validates and parses employee dashboard query parameters from req.query.
 * Attaches parsed params to `req.dashboardQuery`.
 */
export function validateEmployeeDashboardQuery(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const { window, dateFrom, dateTo, previewLimit } = req.query as Record<string, string | undefined>;

    const parsed: EmployeeDashboardQuery = {};

    // Validate window
    if (window !== undefined) {
      if (!VALID_WINDOWS.includes(window as DashboardWindow)) {
        throw new ValidationError(
          `Invalid window "${window}". Must be one of: ${VALID_WINDOWS.join(', ')}`
        );
      }
      parsed.window = window as DashboardWindow;
    }

    // Validate custom date range
    if (window === 'custom') {
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (isNaN(from.getTime())) {
          throw new ValidationError('dateFrom must be a valid ISO date string');
        }
        parsed.dateFrom = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (isNaN(to.getTime())) {
          throw new ValidationError('dateTo must be a valid ISO date string');
        }
        parsed.dateTo = to;
      }
      if (parsed.dateFrom && parsed.dateTo && parsed.dateFrom > parsed.dateTo) {
        throw new ValidationError('dateFrom must be before dateTo');
      }
    }

    // Validate previewLimit
    if (previewLimit !== undefined) {
      const limit = parseInt(previewLimit, 10);
      if (isNaN(limit) || limit < 1 || limit > 20) {
        throw new ValidationError('previewLimit must be an integer between 1 and 20');
      }
      parsed.previewLimit = limit;
    }

    (req as Request & { dashboardQuery: EmployeeDashboardQuery }).dashboardQuery = parsed;
    next();
  } catch (err) {
    next(err);
  }
}
