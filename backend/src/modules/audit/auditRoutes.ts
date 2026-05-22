import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { sendSuccess } from '../../utils/response';
import { AuditService } from './auditService';
import { AuditCategory, AuditSeverity } from '../../models/auditLogEnums';

export const auditRouter = Router();

auditRouter.use(authenticate, requireAdmin);

// ─── GET /admin/audit-logs ────────────────────────────────────────────────────

auditRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        entityType,
        entityId,
        actorUserId,
        action,
        category,
        severity,
        projectId,
        supportTicketId,
        dateFrom,
        dateTo,
        page,
        limit,
      } = req.query;

      const { logs, meta } = await AuditService.list(
        {
          entityType: entityType as string,
          entityId: entityId as string,
          actorUserId: actorUserId as string,
          action: action as string,
          category: category as AuditCategory,
          severity: severity as AuditSeverity,
          projectId: projectId as string,
          supportTicketId: supportTicketId as string,
          dateFrom: dateFrom as string,
          dateTo: dateTo as string,
          page: page ? Number(page) : undefined,
          limit: limit ? Number(limit) : undefined,
        },
        { includeInternal: true }
      );

      sendSuccess(res, logs, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /admin/audit-logs/entity/:type/:id ────────────────────────────────

auditRouter.get(
  '/entity/:entityType/:entityId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await AuditService.getEntityTrail(entityType, entityId);
      sendSuccess(res, logs);
    } catch (err) {
      next(err);
    }
  }
);
