/**
 * Admin Dashboard Routes — Batch 5.1
 *
 * Base path: /api/v1/admin/dashboard  (mounted in app.ts)
 *
 * All routes are admin-only.  Auth + RBAC are applied as router-level
 * middleware so every sub-route inherits protection automatically.
 *
 * Route map:
 *   GET /                  — full dashboard (all sections)
 *   GET /revenue           — revenue & invoice summary
 *   GET /overdue-projects  — overdue project metrics + preview list
 *   GET /approvals         — pending approval queue summary
 *   GET /leads             — lead funnel metrics
 *   GET /workload          — employee workload & task distribution
 *   GET /activity          — recent activity feed
 *
 * Shared query parameters (all optional):
 *   period   — today | week | month | quarter | year | custom  (default: month)
 *   from     — ISO date (only used when period=custom)
 *   to       — ISO date (only used when period=custom)
 *   limit    — preview list size: 1–20  (default: 5)
 */

import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { requireAdmin }  from '../middlewares/rbac';
import {
  handleGetAdminDashboard,
  handleGetRevenueSummary,
  handleGetOverdueProjects,
  handleGetApprovalsSummary,
  handleGetLeadsSummary,
  handleGetWorkloadSummary,
  handleGetRecentActivity,
} from '../modules/dashboards/admin/adminDashboardController';

export const adminDashboardRouter = Router();

// Apply auth + RBAC to every route in this router
adminDashboardRouter.use(authenticate, requireAdmin);

// Full snapshot
adminDashboardRouter.get('/',                 handleGetAdminDashboard);

// Section-specific endpoints
adminDashboardRouter.get('/revenue',          handleGetRevenueSummary);
adminDashboardRouter.get('/overdue-projects', handleGetOverdueProjects);
adminDashboardRouter.get('/approvals',        handleGetApprovalsSummary);
adminDashboardRouter.get('/leads',            handleGetLeadsSummary);
adminDashboardRouter.get('/workload',         handleGetWorkloadSummary);
adminDashboardRouter.get('/activity',         handleGetRecentActivity);
