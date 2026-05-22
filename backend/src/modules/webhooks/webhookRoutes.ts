import { Router, Request, Response, NextFunction } from 'express';
import { authenticate }      from '../../middlewares/auth';
import { allowRoles }      from '../../middlewares/rbac';
import { Role }             from '../../utils/permissions';
import { sendSuccess, buildPaginationMeta, parsePagination } from '../../utils/response';
import { NotFoundError, AppError } from '../../middlewares/errorHandler';
import { processRazorpayWebhook, retryWebhookEvent } from './webhookProcessor';
import { WebhookEvent }      from '../../models/webhookEvent';
import { WebhookProcessingStatus } from '../../models/enums';
import { logger }            from '../../utils/logger';

// ─── Router ───────────────────────────────────────────────────────────────────

export const webhookRouter = Router();

// ─── Razorpay Inbound Webhook ─────────────────────────────────────────────────

/**
 * POST /api/v1/webhooks/razorpay
 *
 * No auth — Razorpay cannot send a JWT.
 * Authorization is via HMAC-SHA256 signature verification.
 *
 * ALWAYS returns HTTP 200 — non-200 responses cause Razorpay retry storms.
 */
webhookRouter.post(
  '/razorpay',
  // Raw body capture middleware (applied in app.ts before JSON parsing for this route)
  async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;

    if (!signature) {
      logger.warn('[WebhookRoute] Missing X-Razorpay-Signature header');
      // Still return 200 to avoid retry loops
      res.status(200).json({ received: true, status: 'skipped', reason: 'missing_signature' });
      return;
    }

    // express.raw() stores the raw Buffer directly in req.body for this route.
    // We use it directly for HMAC-SHA256 signature verification.
    const rawBody: Buffer | string = Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body);

    try {
      const result = await processRazorpayWebhook({
        rawBody,
        signature,
        parsedBody: Buffer.isBuffer(req.body)
          ? (JSON.parse(req.body.toString('utf8')) as Record<string, unknown>)
          : (req.body as Record<string, unknown>),
      });

      logger.info('[WebhookRoute] Razorpay webhook processed', result);
      res.status(200).json({ received: true, ...result });
    } catch (err) {
      // Even on unexpected errors, return 200 to prevent Razorpay from retrying
      logger.error('[WebhookRoute] Unexpected error processing webhook', { err });
      res.status(200).json({ received: true, status: 'failed', reason: 'processing_error' });
    }
  }
);

// ─── Admin: List Webhook Events ───────────────────────────────────────────────

webhookRouter.get(
  '/',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, skip } = parsePagination(req.query['page'], req.query['limit'], 50);

      const filter: Record<string, unknown> = { provider: 'razorpay' };

      if (req.query['eventType'])        filter['eventType']        = req.query['eventType'];
      if (req.query['processingStatus']) filter['processingStatus'] = req.query['processingStatus'];

      if (req.query['dateFrom'] || req.query['dateTo']) {
        const dateFilter: Record<string, Date> = {};
        if (req.query['dateFrom']) dateFilter['$gte'] = new Date(req.query['dateFrom'] as string);
        if (req.query['dateTo'])   dateFilter['$lte'] = new Date(req.query['dateTo'] as string);
        filter['createdAt'] = dateFilter;
      }

      const [events, total] = await Promise.all([
        WebhookEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        WebhookEvent.countDocuments(filter),
      ]);

      sendSuccess(res, events, { meta: buildPaginationMeta(page, limit, total) });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Admin: Get Single Webhook Event ─────────────────────────────────────────

webhookRouter.get(
  '/:eventId',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await WebhookEvent.findById(req.params['eventId']);
      if (!event) throw new NotFoundError('Webhook event');
      sendSuccess(res, { event });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Admin: Retry Failed Webhook ──────────────────────────────────────────────

webhookRouter.post(
  '/:eventId/retry',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await WebhookEvent.findById(req.params['eventId']);
      if (!event) throw new NotFoundError('Webhook event');

      if (
        event.processingStatus !== WebhookProcessingStatus.Failed &&
        event.processingStatus !== WebhookProcessingStatus.FailedPermanent
      ) {
        throw new AppError(
          'Only failed webhook events can be retried',
          422,
          'INVALID_RETRY_STATE'
        );
      }

      const result = await retryWebhookEvent(req.params['eventId']!);
      sendSuccess(res, result, { message: 'Webhook retry queued' });
    } catch (err) {
      next(err);
    }
  }
);
