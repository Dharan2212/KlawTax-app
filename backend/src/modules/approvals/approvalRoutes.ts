import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate, getAuthContext, getAuthUserId } from '../../middlewares/auth';
import { requireAdmin, requireEmployee } from '../../middlewares/rbac';
import { Role } from '../../utils/permissions';
import { sendSuccess } from '../../utils/response';
import {
  validateSubmitForReview,
  validateApprove,
  validateReject,
  validateRequestRevision,
  validateAssignReviewer,
  parseListApprovalsQuery,
} from '../../validators/approvalValidators';
import {
  submitForReview,
  approveApproval,
  rejectApproval,
  requestRevision,
  assignReviewer,
  getApprovalById,
  listApprovals,
  getPendingQueue,
  cancelApproval,
} from './approvalService';
import { isObjectId } from '../../validators/documentValidators';

export const approvalRouter = Router();

// ─── POST /approvals ─ Submit document for review ─────────────────────────────
approvalRouter.post(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestedBy = getAuthUserId(req);
      const dto         = validateSubmitForReview(req.body);
      const approval    = await submitForReview(dto, requestedBy);
      sendSuccess(res, { approval }, { statusCode: 201, message: 'Submitted for review' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /approvals/queue ─ Pending approval queue (admin) ────────────────────
approvalRouter.get(
  '/queue',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q         = req.query as Record<string, unknown>;
      const page      = Math.max(1, parseInt(String(q.page  ?? '1'),  10) || 1);
      const limit     = Math.min(100, Math.max(1, parseInt(String(q.limit ?? '20'), 10) || 20));
      const projectId = isObjectId(q.projectId) ? new Types.ObjectId(q.projectId as string) : undefined;

      const { approvals, meta } = await getPendingQueue(page, limit, projectId);
      sendSuccess(res, { approvals }, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /approvals ─ List approvals ──────────────────────────────────────────
approvalRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth      = getAuthContext(req);
      const role      = auth.role as Role;
      const userId    = new Types.ObjectId(auth.userId);
      const query     = parseListApprovalsQuery(req.query as Record<string, unknown>);

      const { approvals, meta } = await listApprovals(query, role, userId);
      sendSuccess(res, { approvals }, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /approvals/:id ─ Get approval detail ─────────────────────────────────
approvalRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const role       = auth.role as Role;
      const userId     = new Types.ObjectId(auth.userId);
      const approvalId = new Types.ObjectId(req.params.id);

      const approval = await getApprovalById(approvalId, role, userId);
      sendSuccess(res, { approval });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /approvals/:id/approve ─────────────────────────────────────────────
approvalRouter.patch(
  '/:id/approve',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = getAuthUserId(req);
      const approvalId = new Types.ObjectId(req.params.id);
      const dto        = validateApprove(req.body);

      const approval = await approveApproval(approvalId, dto, reviewerId);
      sendSuccess(res, { approval }, { message: 'Approval approved' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /approvals/:id/reject ──────────────────────────────────────────────
approvalRouter.patch(
  '/:id/reject',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = getAuthUserId(req);
      const approvalId = new Types.ObjectId(req.params.id);
      const dto        = validateReject(req.body);

      const approval = await rejectApproval(approvalId, dto, reviewerId);
      sendSuccess(res, { approval }, { message: 'Approval rejected' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /approvals/:id/request-revision ────────────────────────────────────
approvalRouter.patch(
  '/:id/request-revision',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = getAuthUserId(req);
      const approvalId = new Types.ObjectId(req.params.id);
      const dto        = validateRequestRevision(req.body);

      const approval = await requestRevision(approvalId, dto, reviewerId);
      sendSuccess(res, { approval }, { message: 'Revision requested' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /approvals/:id/assign-reviewer ────────────────────────────────────
approvalRouter.patch(
  '/:id/assign-reviewer',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignedBy = getAuthUserId(req);
      const approvalId = new Types.ObjectId(req.params.id);
      const dto        = validateAssignReviewer(req.body);

      const approval = await assignReviewer(approvalId, dto, assignedBy);
      sendSuccess(res, { approval }, { message: 'Reviewer assigned' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /approvals/:id/cancel ──────────────────────────────────────────────
approvalRouter.patch(
  '/:id/cancel',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth       = getAuthContext(req);
      const cancelledBy = new Types.ObjectId(auth.userId);
      const approvalId = new Types.ObjectId(req.params.id);

      const approval = await cancelApproval(approvalId, cancelledBy, auth.role as Role);
      sendSuccess(res, { approval }, { message: 'Approval cancelled' });
    } catch (err) {
      next(err);
    }
  }
);
