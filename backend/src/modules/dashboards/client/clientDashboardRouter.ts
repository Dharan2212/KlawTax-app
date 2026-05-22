/**
 * Client Portal Dashboard Routes
 *
 * Base path: /api/v1/dashboard/client
 *
 * RBAC: Client role only (enforced on every route via guardChain).
 *       Admin can access for support purposes via allowRoles(Admin, Client).
 *       Employee has NO access to client portal routes.
 *
 * Route map:
 *   GET /                    — full dashboard snapshot (totals + previews)
 *   GET /projects            — paginated project list
 *   GET /projects/:id        — single project detail (client-visible)
 *   GET /payments            — payment & invoice summary
 *   GET /timeline            — paginated client-visible timeline
 *   GET /documents           — paginated client-visible documents
 *   GET /support             — support ticket summary
 *   GET /notifications       — notification feed
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext }    from '../../../middlewares/auth';
import { requireClient, requireActiveAccount } from '../../../middlewares/rbac';
import { ForbiddenError, NotFoundError }   from '../../../middlewares/errorHandler';
import { sendSuccess }                     from '../../../utils/response';
import {
  parsePreviewLimit,
  parsePaginationQuery,
  validateObjectIdParam,
  parseOptionalProjectFilter,
} from '../../../validators/clientDashboardValidators';
import {
  getClientDashboard,
  getClientProjectList,
  getClientProjectDetail,
  getClientPaymentSummary,
  getClientTimelineFeed,
  getClientDocuments,
  getClientSupportSummary,
  getClientNotifications,
} from './clientDashboardService';

export const clientDashboardRouter = Router();

// ─── Guard chain ───────────────────────────────────────────────────────────────
// authenticate  — validates JWT, populates req.auth
// requireActiveAccount — rejects inactive/archived accounts
// requireClient        — restricts to Client (and Admin) roles; blocks Employee

const guardChain = [authenticate, requireActiveAccount, requireClient];

// ─── Client context resolver ───────────────────────────────────────────────────

function resolveClientProfileId(req: Request): string {
  const auth = getAuthContext(req);
  if (!auth.clientProfileId) {
    throw new ForbiddenError(
      'Client profile required. This endpoint is only accessible to clients.'
    );
  }
  return auth.clientProfileId;
}

// ─── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/dashboard/client
 *
 * Full portal snapshot: totals + active project previews + recent timeline +
 * pending invoices.
 *
 * Query params:
 *   limit — preview list size 1–20 (default: 5)
 */
clientDashboardRouter.get(
  '/',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const limit           = parsePreviewLimit(req.query);
      const data            = await getClientDashboard(clientProfileId, limit);
      sendSuccess(res, data, { message: 'Client dashboard loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/projects
 *
 * Paginated list of the authenticated client's projects.
 *
 * Query params:
 *   page     — default: 1
 *   limit    — default: 10, max: 50
 *   status   — filter: 'active' | 'completed' | 'overdue' (optional)
 */
clientDashboardRouter.get(
  '/projects',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const { page, limit } = parsePaginationQuery(req.query, 50);
      const statusFilter    = typeof req.query.status === 'string' ? req.query.status : undefined;
      const data            = await getClientProjectList(clientProfileId, page, limit, statusFilter);
      sendSuccess(res, data, { message: 'Projects loaded', meta: data.meta });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/projects/:id
 *
 * Full client-safe detail for a single project.
 * Returns only client-visible timeline, document stats, and name-only employee info.
 */
clientDashboardRouter.get(
  '/projects/:id',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const projectId       = validateObjectIdParam(req.params.id);
      if (!projectId) throw new NotFoundError('Project not found');
      const data = await getClientProjectDetail(projectId, clientProfileId);
      sendSuccess(res, data, { message: 'Project detail loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/payments
 *
 * Payment & invoice summary for the authenticated client.
 * Shows totals, invoice list, and recent captured payments.
 */
clientDashboardRouter.get(
  '/payments',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const data            = await getClientPaymentSummary(clientProfileId);
      sendSuccess(res, data, { message: 'Payment summary loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/timeline
 *
 * Paginated client-visible timeline feed across all of the client's projects.
 * Internal and admin-only entries are excluded.
 *
 * Query params:
 *   page  — default: 1
 *   limit — default: 10, max: 50
 */
clientDashboardRouter.get(
  '/timeline',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const { page, limit } = parsePaginationQuery(req.query, 50);
      const data            = await getClientTimelineFeed(clientProfileId, page, limit);
      sendSuccess(res, data, { message: 'Timeline loaded', meta: data.meta });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/documents
 *
 * Paginated list of client-visible, approved documents.
 * Only returns the latest version of each document.
 *
 * Query params:
 *   page      — default: 1
 *   limit     — default: 10, max: 50
 *   projectId — optional ObjectId filter to scope to one project
 */
clientDashboardRouter.get(
  '/documents',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const { page, limit } = parsePaginationQuery(req.query, 50);
      const projectId       = parseOptionalProjectFilter(req.query);
      const data            = await getClientDocuments(clientProfileId, page, limit, projectId);
      sendSuccess(res, data, { message: 'Documents loaded', meta: data.meta });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/support
 *
 * Support ticket summary — counts and paginated list.
 * Only client-visible messages are included in ticket previews.
 *
 * Query params:
 *   page  — default: 1
 *   limit — default: 10, max: 20
 */
clientDashboardRouter.get(
  '/support',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const { page, limit } = parsePaginationQuery(req.query, 20);
      const data            = await getClientSupportSummary(clientProfileId, page, limit);
      sendSuccess(res, data, { message: 'Support summary loaded', meta: data.meta });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/dashboard/client/notifications
 *
 * Client notification feed — excludes internal-only and dismissed entries.
 *
 * Query params:
 *   page  — default: 1
 *   limit — default: 10, max: 30
 */
clientDashboardRouter.get(
  '/notifications',
  ...guardChain,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientProfileId = resolveClientProfileId(req);
      const { page, limit } = parsePaginationQuery(req.query, 30);
      const data            = await getClientNotifications(clientProfileId, page, limit);
      sendSuccess(res, data, { message: 'Notifications loaded', meta: data.meta });
    } catch (err) {
      next(err);
    }
  }
);
