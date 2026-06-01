/**
 * Employee Dashboard & Workspace Routes
 * Batch 5.2
 *
 * All routes require:
 *  - Authentication (authenticate middleware)
 *  - Active account (requireActiveAccount)
 *  - Employee role (requireEmployee — permits Employee + Admin roles)
 *
 * Security: every service call passes auth.userId (User._id) as the scope key.
 * Tasks store assignedEmployeeIds as User refs; projects store assignedEmployees.userId
 * as User refs; approvals store requestedBy as a User ref. All use User._id.
 *
 * The employeeProfileId is validated to exist (proving the user is an employee)
 * but is only passed to the service for inclusion in the response payload.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../middlewares/auth';
import { requireEmployee, requireActiveAccount } from '../middlewares/rbac';
import { sendSuccess } from '../utils/response';
import { ForbiddenError } from '../middlewares/errorHandler';
import { validateEmployeeDashboardQuery } from '../validators/employeeDashboardValidators';
import { type EmployeeDashboardQuery } from '../modules/dashboards/employee/employeeDashboardTypes';
import {
  getEmployeeDashboard,
  getEmployeeTaskSummary,
  getEmployeeDueTodaySummary,
  getEmployeePendingReviews,
  getEmployeeActiveProjects,
  getEmployeeWorkload,
} from '../modules/dashboards/employee/employeeDashboardService';
import { cache, cacheKey } from '../utils/cache';
import { EXTENDED_CACHE_TTL } from '../utils/cache/index';

export const employeeDashboardRouter = Router();

// ─── Request extension type ───────────────────────────────────────────────────

type DashboardRequest = Request & { dashboardQuery?: EmployeeDashboardQuery };

// ─── Guard helper ─────────────────────────────────────────────────────────────

/**
 * Validates that the authenticated user has an associated EmployeeProfile.
 * Returns { userId, employeeProfileId } for use in service calls.
 *
 * - userId          → passed to service as the scope key for all DB filters
 * - employeeProfileId → included in the response payload for client reference
 */
function resolveEmployeeContext(req: Request): { userId: string; employeeProfileId: string } {
  const auth = getAuthContext(req);
  if (!auth.employeeProfileId) {
    throw new ForbiddenError(
      'Employee profile required. This endpoint is only available to employees.'
    );
  }
  return { userId: auth.userId, employeeProfileId: auth.employeeProfileId };
}

// ─── Common Middleware Chain ──────────────────────────────────────────────────

const guardChain = [authenticate, requireActiveAccount, requireEmployee];

// ─── Full Dashboard ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee
 *
 * Full aggregated employee dashboard — all workspace sections in one call.
 *
 * Query params:
 *   window       — 'today' | 'week' | 'month' | 'custom'  (default: 'today')
 *   dateFrom     — ISO date (required if window=custom)
 *   dateTo       — ISO date (required if window=custom)
 *   previewLimit — integer 1–20  (default: 5)
 */
employeeDashboardRouter.get(
  '/',
  ...guardChain,
  validateEmployeeDashboardQuery,
  async (req: DashboardRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, employeeProfileId } = resolveEmployeeContext(req);
      const query = req.dashboardQuery ?? {};

      // Cache the full dashboard snapshot, keyed by userId + window + previewLimit.
      // Different query parameter combinations produce isolated cache entries,
      // preventing stale data when a user switches time windows.
      //
      // Sub-endpoints (tasks, workload, due-today, pending-reviews, active-projects)
      // are intentionally NOT cached: they are lightweight targeted queries
      // used for live badge counts and workspace widgets where freshness matters.
      const window = query.window ?? 'today';
      const previewLimit = query.previewLimit ?? 5;
      const key = `${cacheKey.employeeDashboard(userId)}:${window}:${previewLimit}`;

      const dashboard = await cache.getOrSet(
        key,
        () => getEmployeeDashboard(userId, employeeProfileId, query),
        EXTENDED_CACHE_TTL.EMPLOYEE_DASHBOARD
      );

      sendSuccess(res, dashboard, { message: 'Employee dashboard loaded successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Workload Overview ────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee/workload
 *
 * Lightweight workload counter summary.
 * Suitable for navbar badge counts and quick-glance widgets.
 */
employeeDashboardRouter.get(
  '/workload',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = resolveEmployeeContext(req);
      const workload = await getEmployeeWorkload(userId);
      sendSuccess(res, workload, { message: 'Workload summary loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Tasks ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee/tasks
 *
 * Assigned task counts and preview lists for the employee workspace.
 *
 * Query params:
 *   previewLimit — integer 1–20  (default: 5)
 */
employeeDashboardRouter.get(
  '/tasks',
  ...guardChain,
  validateEmployeeDashboardQuery,
  async (req: DashboardRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = resolveEmployeeContext(req);
      const query = req.dashboardQuery ?? {};
      const tasks = await getEmployeeTaskSummary(userId, query.previewLimit);
      sendSuccess(res, tasks, { message: 'Task summary loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Due Today ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee/due-today
 *
 * Tasks and projects due today (including already-overdue work).
 * Overdue items are surfaced first.
 */
employeeDashboardRouter.get(
  '/due-today',
  ...guardChain,
  validateEmployeeDashboardQuery,
  async (req: DashboardRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = resolveEmployeeContext(req);
      const query = req.dashboardQuery ?? {};
      const dueToday = await getEmployeeDueTodaySummary(userId, query.previewLimit);
      sendSuccess(res, dueToday, { message: 'Due-today summary loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Pending Reviews ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee/reviews
 *
 * Approvals submitted by the employee that are pending or require action.
 * Employees only see their own submissions — never other employees' reviews.
 */
employeeDashboardRouter.get(
  '/reviews',
  ...guardChain,
  validateEmployeeDashboardQuery,
  async (req: DashboardRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = resolveEmployeeContext(req);
      const query = req.dashboardQuery ?? {};
      const reviews = await getEmployeePendingReviews(userId, query.previewLimit);
      sendSuccess(res, reviews, { message: 'Pending reviews loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Active Projects ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/employee/projects
 *
 * Active projects assigned to the employee, with task progress and stall/overdue flags.
 * Employees only see projects where they appear in assignedEmployees.
 */
employeeDashboardRouter.get(
  '/projects',
  ...guardChain,
  validateEmployeeDashboardQuery,
  async (req: DashboardRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = resolveEmployeeContext(req);
      const query = req.dashboardQuery ?? {};
      const projects = await getEmployeeActiveProjects(userId, query.previewLimit);
      sendSuccess(res, projects, { message: 'Active project summary loaded' });
    } catch (err) {
      next(err);
    }
  }
);
