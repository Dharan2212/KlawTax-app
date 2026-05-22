import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { sendSuccess } from '../../utils/response';
import { ExportService } from './exportService';
import { ExportJobType, ExportJobStatus } from '../../models/enums';
import { AppError } from '../../middlewares/errorHandler';
import { z } from 'zod';

export const exportRouter = Router();

exportRouter.use(authenticate);

const createExportSchema = z.object({
  exportType: z.nativeEnum(ExportJobType),
  entityType: z.string().max(50).optional(),
  entityId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

// ─── POST /exports ────────────────────────────────────────────────────────────

exportRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const parsed = createExportSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Validation error', 400);
      }

      const job = await ExportService.requestExport(parsed.data, auth.userId, auth.role);

      sendSuccess(res, job, { statusCode: 202, message: 'Export job queued' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /exports ─────────────────────────────────────────────────────────────

exportRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const { status, page, limit } = req.query;

      const { jobs, meta } = await ExportService.listJobs(
        auth.userId,
        auth.role,
        {
          status: status as ExportJobStatus | undefined,
          page,
          limit,
        }
      );

      sendSuccess(res, jobs, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /exports/:id ─────────────────────────────────────────────────────────

exportRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const job = await ExportService.getJobById(req.params.id, auth.userId, auth.role);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /exports/:id/download ────────────────────────────────────────────────

exportRouter.get(
  '/:id/download',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const result = await ExportService.getDownloadUrl(req.params.id, auth.userId, auth.role);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);
