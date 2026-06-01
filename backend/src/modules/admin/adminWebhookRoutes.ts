/**
 * Admin Webhook History Routes
 *
 * Base path: /api/v1/admin/webhooks
 *
 * All routes are admin-only.
 *
 * Route map:
 *   GET   /                   — list webhook events (paginated, filterable)
 *   GET   /:eventId           — get full detail of a single webhook event
 *   POST  /:eventId/retry     — manually retry a failed webhook event
 *
 * Per v1.5 Part 8 specification.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../utils/response';
import { NotFoundError, ValidationError } from '../../middlewares/errorHandler';
import { WebhookEvent } from '../../models/webhookEvent';
import { WebhookProcessingStatus } from '../../models/enums';
import { retryWebhookEvent } from '../webhooks/webhookProcessor';
import { AuditService } from '../audit/auditService';
import { AuditAction, AuditCategory, AuditSource } from '../../models/auditLogEnums';
import { getAuthContext } from '../../middlewares/auth';
import { logger } from '../../utils/logger';

export const adminWebhookRouter = Router();

adminWebhookRouter.use(authenticate, requireAdmin);

// ─── List webhook events ──────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/webhooks
 *
 * Query params:
 *   provider           — filter by provider (default: razorpay)
 *   eventType          — filter by event type
 *   processingStatus   — filter by processing status
 *   dateFrom, dateTo   — ISO date range on createdAt
 *   page, limit        — pagination (default limit 20)
 */
adminWebhookRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);

      const filter: Record<string, unknown> = {};

      if (req.query.provider) filter.provider = req.query.provider;
      if (req.query.eventType) filter.eventType = req.query.eventType;
      if (req.query.processingStatus) filter.processingStatus = req.query.processingStatus;

      // Date range on createdAt
      if (req.query.dateFrom || req.query.dateTo) {
        const dateFilter: Record<string, Date> = {};
        if (req.query.dateFrom) {
          const d = new Date(req.query.dateFrom as string);
          if (!isNaN(d.getTime())) dateFilter.$gte = d;
        }
        if (req.query.dateTo) {
          const d = new Date(req.query.dateTo as string);
          if (!isNaN(d.getTime())) dateFilter.$lte = d;
        }
        if (Object.keys(dateFilter).length > 0) {
          filter.createdAt = dateFilter;
        }
      }

      const [events, total] = await Promise.all([
        WebhookEvent.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        WebhookEvent.countDocuments(filter),
      ]);

      sendSuccess(
        res,
        {
          events,
          meta: buildPaginationMeta(page, limit, total),
        },
        { message: 'Webhook events loaded' }
      );
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get single webhook event ─────────────────────────────────────────────────

/**
 * GET /api/v1/admin/webhooks/:eventId
 * Returns full detail including rawPayload for debugging.
 */
adminWebhookRouter.get(
  '/:eventId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId } = req.params;

      // Support both MongoDB ObjectId and provider event ID
      let event;
      if (Types.ObjectId.isValid(eventId)) {
        event = await WebhookEvent.findById(eventId).lean();
      } else {
        event = await WebhookEvent.findOne({ eventId }).lean();
      }

      if (!event) {
        throw new NotFoundError(`Webhook event '${eventId}'`);
      }

      sendSuccess(res, { event }, { message: 'Webhook event loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Manual retry ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/webhooks/:eventId/retry
 *
 * Manually retry a failed webhook event.
 *
 * Pre-conditions (per v1.5 Part 8.5):
 *   - processingStatus must be `failed` or `failed_permanent`
 *   - signatureValid must be true
 *
 * Returns HTTP 202 Accepted on successful queueing.
 */
adminWebhookRouter.post(
  '/:eventId/retry',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId } = req.params;

      if (!Types.ObjectId.isValid(eventId)) {
        throw new ValidationError('Invalid event ID — must be a valid ObjectId.');
      }

      const event = await WebhookEvent.findById(eventId).lean();

      if (!event) {
        throw new NotFoundError(`Webhook event '${eventId}'`);
      }

      // Validate retryable state
      const retryableStatuses: WebhookProcessingStatus[] = [
        WebhookProcessingStatus.Failed,
        WebhookProcessingStatus.FailedPermanent,
      ];

      if (!retryableStatuses.includes(event.processingStatus)) {
        throw new ValidationError(
          `Cannot retry webhook event with status '${event.processingStatus}'. ` +
          `Only 'failed' or 'failed_permanent' events can be retried.`
        );
      }

      if (!event.signatureValid) {
        throw new ValidationError(
          'Cannot retry webhook event with invalid signature. ' +
          'Retrying events with failed signature verification is not permitted.'
        );
      }

      // Reset status to received so the retry processor can pick it up,
      // and increment retryCount
      await WebhookEvent.findByIdAndUpdate(eventId, {
        $set: {
          processingStatus: WebhookProcessingStatus.Received,
          processingError: undefined,
        },
        $inc: { retryCount: 1 },
      });

      // Attempt immediate retry (synchronous for admin manual trigger)
      const result = await retryWebhookEvent(eventId).catch((err: unknown) => ({
        status: 'failed' as const,
        message: err instanceof Error ? err.message : String(err),
      }));

      const auth = getAuthContext(req);

      // Audit log
      await AuditService.log({
        actorUserId: auth.userId,
        actorRole: auth.role,
        entityType: 'webhook_event',
        entityId: event._id as Types.ObjectId,
        action: AuditAction.WebhookManualRetry,
        category: AuditCategory.System,
        source: AuditSource.Api,
        metadata: {
          eventId: event.eventId,
          eventType: event.eventType,
          provider: event.provider,
          retryResult: result.status,
        },
      }).catch(() => {});

      logger.info('[AdminWebhooks] Manual retry triggered', {
        webhookDocId: eventId,
        eventId: event.eventId,
        result: result.status,
        triggeredBy: auth.userId,
      });

      // Return 202 — retry has been processed (immediate for admin trigger)
      res.status(202).json({
        success: true,
        message: 'Webhook retry processed',
        data: {
          webhookEventId: eventId,
          eventId: event.eventId,
          retryStatus: result.status,
          message: result.message ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
