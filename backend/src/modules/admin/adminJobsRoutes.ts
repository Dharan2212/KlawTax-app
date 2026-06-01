/**
 * Admin Jobs & Failed Jobs Routes
 *
 * Base path: /api/v1/admin/jobs
 *
 * All routes are admin-only.
 *
 * Route map:
 *   GET    /                   — list all scheduled jobs
 *   PATCH  /:jobName/toggle    — enable/disable a scheduled job
 *   GET    /failed             — list failed job logs (unresolved)
 *   PATCH  /failed/:id/resolve — mark a failed job log as resolved
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Types }         from 'mongoose';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin }  from '../../middlewares/rbac';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../middlewares/errorHandler';
import { ScheduledJob }  from '../../models/scheduledJob';
import { FailedJobLog }  from '../../models/failedJobLog';
import { triggerJobManually } from '../../jobs/scheduler';
import { logger }        from '../../utils/logger';

export const adminJobsRouter = Router();

adminJobsRouter.use(authenticate, requireAdmin);

// ─── Scheduled Job Registry ───────────────────────────────────────────────────

/**
 * GET /api/v1/admin/jobs
 * List all registered scheduled jobs with their last-run status.
 */
adminJobsRouter.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await ScheduledJob.find().sort({ jobName: 1 }).lean();
      sendSuccess(res, { jobs }, { message: 'Scheduled jobs loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/jobs/:jobName/toggle
 * Enable or disable a scheduled job.
 * Body: { enabled: boolean }
 */
adminJobsRouter.patch(
  '/:jobName/toggle',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { enabled } = req.body as { enabled?: unknown };

      if (typeof enabled !== 'boolean') {
        throw new ValidationError('Body must include `enabled` (boolean).');
      }

      const job = await ScheduledJob.findOneAndUpdate(
        { jobName: req.params.jobName },
        { $set: { isEnabled: enabled } },
        { new: true }
      );

      if (!job) throw new NotFoundError(`Scheduled job '${req.params.jobName}'`);

      logger.info('[AdminJobs] Scheduled job toggled', {
        jobName: req.params.jobName,
        isEnabled: enabled,
      });

      sendSuccess(res, { job }, { message: `Job '${job.jobName}' ${enabled ? 'enabled' : 'disabled'}` });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/admin/jobs/:jobName/trigger
 * Manually trigger a registered scheduled job immediately.
 * Useful for on-demand execution and operational testing.
 */
adminJobsRouter.post(
  '/:jobName/trigger',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { jobName } = req.params;
      const auth = getAuthContext(req);

      logger.info('[AdminJobs] Manual job trigger requested', {
        jobName,
        triggeredBy: auth.userId,
      });

      const result = await triggerJobManually(jobName);

      if (!result.triggered) {
        // Job not found in registry — return 404-like
        throw new NotFoundError(result.error ?? `Scheduled job '${jobName}'`);
      }

      sendSuccess(
        res,
        { jobName, triggered: true },
        { message: `Job '${jobName}' triggered successfully` }
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── Failed Job Logs ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/jobs/failed
 * List unresolved failed job logs.
 */
adminJobsRouter.get(
  '/failed',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

      const filter: Record<string, unknown> = { isResolved: false };
      if (req.query.queueName) filter.queueName = req.query.queueName;
      if (req.query.jobName)   filter.jobName   = req.query.jobName;

      const [logs, total] = await Promise.all([
        FailedJobLog.find(filter).sort({ failedAt: -1 }).skip(skip).limit(limit).lean(),
        FailedJobLog.countDocuments(filter),
      ]);

      sendSuccess(
        res,
        { logs, meta: buildPaginationMeta(page, limit, total) },
        { message: 'Failed job logs loaded' }
      );
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/admin/jobs/failed/:id/resolve
 * Mark a failed job log as manually resolved.
 * Body: { note?: string }
 */
adminJobsRouter.patch(
  '/failed/:id/resolve',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!Types.ObjectId.isValid(req.params.id)) {
        throw new ValidationError('Invalid log ID.');
      }

      const auth = getAuthContext(req);
      const { note } = req.body as { note?: unknown };

      const log = await FailedJobLog.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            isResolved: true,
            resolvedAt: new Date(),
            resolvedById: new Types.ObjectId(auth.userId),
            resolutionNote: typeof note === 'string' ? note.trim() : undefined,
          },
        },
        { new: true }
      );

      if (!log) throw new NotFoundError('Failed job log');

      logger.info('[AdminJobs] Failed job log resolved', {
        logId: req.params.id,
        resolvedBy: auth.userId,
      });

      sendSuccess(res, { log }, { message: 'Failed job log resolved' });
    } catch (err) {
      next(err);
    }
  }
);
