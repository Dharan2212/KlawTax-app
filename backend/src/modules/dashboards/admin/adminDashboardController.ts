/**
 * Admin Dashboard Controller — Batch 5.1
 *
 * Thin HTTP layer: parse query, call service, send response.
 * All aggregation logic lives in adminDashboardService.
 */

import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../../utils/response';
import {
  buildAdminDashboard,
  getAdminRevenueSummary,
  getAdminOverdueSummary,
  getAdminApprovalsSummary,
  getAdminLeadsSummary,
  getAdminWorkloadSummary,
  getAdminRecentActivity,
} from './adminDashboardService';
import type { AdminDashboardQuery, DashboardPeriod } from './adminDashboardTypes';

// ─── Query parser ─────────────────────────────────────────────────────────────

const VALID_PERIODS: ReadonlySet<string> = new Set<DashboardPeriod>([
  'today', 'week', 'month', 'quarter', 'year', 'custom',
]);

function parseDashboardQuery(req: Request): AdminDashboardQuery {
  const raw    = req.query as Record<string, string | undefined>;
  const period = VALID_PERIODS.has(raw.period ?? '') ? raw.period as DashboardPeriod : 'month';
  const limit  = raw.limit ? Math.min(Math.max(1, parseInt(raw.limit, 10) || 5), 20) : 5;

  return {
    period,
    from:  period === 'custom' ? raw.from  : undefined,
    to:    period === 'custom' ? raw.to    : undefined,
    limit,
  };
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/dashboard */
export async function handleGetAdminDashboard(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await buildAdminDashboard(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Admin dashboard loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/revenue */
export async function handleGetRevenueSummary(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminRevenueSummary(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Revenue summary loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/overdue-projects */
export async function handleGetOverdueProjects(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminOverdueSummary(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Overdue projects summary loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/approvals */
export async function handleGetApprovalsSummary(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminApprovalsSummary(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Pending approvals summary loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/leads */
export async function handleGetLeadsSummary(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminLeadsSummary(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Lead metrics summary loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/workload */
export async function handleGetWorkloadSummary(
  _req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminWorkloadSummary();
    sendSuccess(res, data, { message: 'Workload summary loaded' });
  } catch (err) { next(err); }
}

/** GET /api/v1/admin/dashboard/activity */
export async function handleGetRecentActivity(
  req: Request, res: Response, next: NextFunction,
): Promise<void> {
  try {
    const data = await getAdminRecentActivity(parseDashboardQuery(req));
    sendSuccess(res, data, { message: 'Recent activity loaded' });
  } catch (err) { next(err); }
}
