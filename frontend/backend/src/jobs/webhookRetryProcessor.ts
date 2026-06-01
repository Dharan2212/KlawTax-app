/**
 * Webhook Retry Processor
 *
 * Scans for `webhookEvent` records with `processingStatus: failed` and
 * retries them using the existing `retryWebhookEvent()` function from
 * the webhook processor module.
 *
 * Safety guarantees:
 *   - Idempotent: each event is locked to `processing` before retry
 *   - Max retry cap: 3 attempts; beyond that status → failed_permanent
 *   - No duplicate payment reconciliation (handled inside retryWebhookEvent)
 *   - Never retries events with invalid signatures (signatureValid: false)
 *   - Never retries events already in failed_permanent state
 *
 * Runs every 15 minutes (configured in scheduler.ts).
 */

import { WebhookEvent } from '../models/webhookEvent';
import { WebhookProcessingStatus, FailedJobSeverity } from '../models/enums';
import { retryWebhookEvent } from '../modules/webhooks/webhookProcessor';
import { FailedJobService } from './failedJobService';
import { logger } from '../utils/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RETRY_ATTEMPTS = 3;
/** Process at most this many failed events per run to avoid timeout. */
const BATCH_SIZE = 20;

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface WebhookRetryResult {
  attempted: number;
  succeeded: number;
  failedPermanent: number;
  skipped: number;
}

// ─── Processor ───────────────────────────────────────────────────────────────

export async function runWebhookRetryProcessor(): Promise<WebhookRetryResult> {
  // Find failed webhook events that are retryable
  const failedEvents = await WebhookEvent.find({
    processingStatus: WebhookProcessingStatus.Failed,
    signatureValid: true, // never retry invalid-signature events
    retryCount: { $lt: MAX_RETRY_ATTEMPTS },
  })
    .sort({ createdAt: 1 }) // oldest first
    .limit(BATCH_SIZE)
    .select('_id eventId retryCount processingStatus')
    .lean();

  if (failedEvents.length === 0) {
    logger.debug('[WebhookRetry] No failed webhook events to retry');
    return { attempted: 0, succeeded: 0, failedPermanent: 0, skipped: 0 };
  }

  logger.info('[WebhookRetry] Starting retry batch', { count: failedEvents.length });

  let succeeded = 0;
  let failedPermanent = 0;
  let skipped = 0;

  for (const event of failedEvents) {
    const eventIdStr = (event._id as { toString(): string }).toString();

    try {
      // Delegate entirely to the existing retry function which handles
      // idempotency, payment reconciliation safety, and status updates
      const result = await retryWebhookEvent(eventIdStr);

      if (result.status === 'processed') {
        succeeded++;
        logger.info('[WebhookRetry] Event retried successfully', {
          webhookEventId: eventIdStr,
          eventId: event.eventId,
        });
      } else {
        // Check if now at permanent failure threshold
        const retryCount = event.retryCount + 1;
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          failedPermanent++;
          logger.warn('[WebhookRetry] Event permanently failed after max retries', {
            webhookEventId: eventIdStr,
            retryCount,
          });

          await FailedJobService.record({
            bullmqJobId: `webhook-retry-${eventIdStr}`,
            queueName: 'webhook-retry',
            jobName: 'webhookRetryProcessor',
            jobPayload: { webhookEventId: eventIdStr, eventId: event.eventId },
            errorMessage: result.message ?? 'Webhook retry failed permanently',
            attemptNumber: retryCount,
            retryCount,
            severity: FailedJobSeverity.High,
          });
        }
      }
    } catch (err) {
      skipped++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('[WebhookRetry] Unexpected error retrying event', {
        webhookEventId: eventIdStr,
        error: errorMessage,
      });
    }
  }

  const result: WebhookRetryResult = {
    attempted: failedEvents.length,
    succeeded,
    failedPermanent,
    skipped,
  };

  logger.info('[WebhookRetry] Retry batch complete', result);
  return result;
}
