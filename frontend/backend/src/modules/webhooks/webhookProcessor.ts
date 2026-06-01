import { WebhookEvent }         from '../../models/webhookEvent';
import { WebhookProvider, WebhookProcessingStatus } from '../../models/enums';
import { verifyWebhookSignature }   from '../payments/razorpayHelper';
import { processWebhookPaymentEvent } from '../payments/paymentService';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InboundWebhookPayload {
  rawBody:    Buffer | string;
  signature:  string;
  parsedBody: Record<string, unknown>;
}

export interface WebhookProcessResult {
  status:    'processed' | 'skipped' | 'duplicate' | 'failed';
  message:   string;
  eventId?:  string;
}

// ─── Supported Event Types ────────────────────────────────────────────────────

const SUPPORTED_PAYMENT_EVENTS = new Set([
  'payment.captured',
  'payment.failed',
  'order.paid',
  'refund.processed',
  'payment.dispute.created',
]);

// ─── Main Webhook Processor ───────────────────────────────────────────────────

/**
 * Process an inbound Razorpay webhook.
 *
 * Processing order:
 * 1. Verify HMAC signature
 * 2. Check idempotency (duplicate detection)
 * 3. Insert webhook event record
 * 4. Route to appropriate handler
 * 5. Update processing status
 *
 * Always returns a result — never throws (callers always send HTTP 200 to Razorpay).
 */
export async function processRazorpayWebhook(
  payload: InboundWebhookPayload
): Promise<WebhookProcessResult> {
  const provider  = WebhookProvider.Razorpay;
  const payloadObj = payload.parsedBody['payload'] as Record<string, unknown> | undefined;
  const paymentEntity = (payloadObj?.['payment'] as Record<string, unknown> | undefined)?.['entity'] as string | undefined;
  const eventId   = (payload.parsedBody['event'] as string) + '_' + (paymentEntity ?? Date.now().toString());
  const eventType = payload.parsedBody['event'] as string;

  // ── 1. Signature Verification ─────────────────────────────────────────────
  const signatureValid = verifyWebhookSignature({
    rawBody:   payload.rawBody,
    signature: payload.signature,
  });

  if (!signatureValid) {
    logger.warn('[WebhookProcessor] Invalid signature', { eventType });

    // Record the invalid attempt but do not process
    await safeInsertWebhookEvent({
      provider,
      eventId:          eventId + '_invalid_' + Date.now(),
      eventType:        eventType ?? 'unknown',
      rawPayload:       payload.parsedBody,
      signatureValid:   false,
      processingStatus: WebhookProcessingStatus.Skipped,
    });

    return { status: 'skipped', message: 'Invalid webhook signature' };
  }

  // Use the Razorpay event_id from the payload for proper idempotency
  const razorpayEventId = (payload.parsedBody['event_id'] as string) ?? paymentEntity ?? Date.now().toString();

  // ── 2. Idempotency Check ──────────────────────────────────────────────────
  const existingEvent = await WebhookEvent.findOne({
    provider,
    eventId: razorpayEventId,
  });

  if (existingEvent) {
    logger.info('[WebhookProcessor] Duplicate webhook event (idempotent skip)', {
      razorpayEventId,
      eventType,
      existingStatus: existingEvent.processingStatus,
    });
    return { status: 'duplicate', message: 'Duplicate event (already processed)', eventId: razorpayEventId };
  }

  // ── 3. Insert Webhook Event Record ───────────────────────────────────────
  let webhookEvent = await safeInsertWebhookEvent({
    provider,
    eventId:          razorpayEventId,
    eventType,
    rawPayload:       payload.parsedBody,
    signatureValid:   true,
    processingStatus: WebhookProcessingStatus.Received,
  });

  if (!webhookEvent) {
    // Insert failed due to race condition duplicate — idempotent
    return { status: 'duplicate', message: 'Concurrent duplicate event', eventId: razorpayEventId };
  }

  // ── 4. Skip unsupported event types ──────────────────────────────────────
  if (!SUPPORTED_PAYMENT_EVENTS.has(eventType)) {
    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      processingStatus: WebhookProcessingStatus.Skipped,
      processedAt:      new Date(),
    });
    logger.info('[WebhookProcessor] Unsupported event type (skipped)', { eventType });
    return { status: 'skipped', message: `Event type "${eventType}" is not handled` };
  }

  // ── 5. Mark as Processing ─────────────────────────────────────────────────
  await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
    processingStatus: WebhookProcessingStatus.Processing,
  });

  // ── 6. Route to Handler ───────────────────────────────────────────────────
  try {
    await processWebhookPaymentEvent(eventType, payload.parsedBody, webhookEvent);

    // ── 7. Mark as Processed ────────────────────────────────────────────────
    webhookEvent = await WebhookEvent.findByIdAndUpdate(
      webhookEvent._id,
      {
        processingStatus: WebhookProcessingStatus.Processed,
        processedAt:      new Date(),
      },
      { new: true }
    ) ?? webhookEvent;

    logger.info('[WebhookProcessor] Event processed successfully', {
      razorpayEventId,
      eventType,
    });

    return { status: 'processed', message: 'Webhook processed', eventId: razorpayEventId };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    // ── 8. Mark as Failed ───────────────────────────────────────────────────
    const retryCount = (webhookEvent.retryCount ?? 0) + 1;
    const isPermanent = retryCount >= 3;

    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      processingStatus: isPermanent
        ? WebhookProcessingStatus.FailedPermanent
        : WebhookProcessingStatus.Failed,
      processingError: errorMessage,
      retryCount,
    });

    logger.error('[WebhookProcessor] Event processing failed', {
      razorpayEventId,
      eventType,
      error: errorMessage,
      retryCount,
    });

    return { status: 'failed', message: errorMessage, eventId: razorpayEventId };
  }
}

// ─── Retry Failed Webhooks ────────────────────────────────────────────────────

/**
 * Retry a specific failed webhook event by ID.
 * Used by the admin manual retry endpoint.
 */
export async function retryWebhookEvent(eventId: string): Promise<WebhookProcessResult> {
  const event = await WebhookEvent.findById(eventId);
  if (!event) return { status: 'failed', message: 'Webhook event not found' };

  if (!event.signatureValid) {
    return { status: 'skipped', message: 'Cannot retry events with invalid signatures' };
  }

  if (
    event.processingStatus !== WebhookProcessingStatus.Failed &&
    event.processingStatus !== WebhookProcessingStatus.FailedPermanent
  ) {
    return { status: 'skipped', message: 'Only failed events can be retried' };
  }

  // Reset for reprocessing
  await WebhookEvent.findByIdAndUpdate(eventId, {
    processingStatus: WebhookProcessingStatus.Received,
    processingError:  undefined,
  });

  const eventType = event.eventType;

  if (!SUPPORTED_PAYMENT_EVENTS.has(eventType)) {
    await WebhookEvent.findByIdAndUpdate(eventId, {
      processingStatus: WebhookProcessingStatus.Skipped,
    });
    return { status: 'skipped', message: 'Unsupported event type' };
  }

  try {
    await processWebhookPaymentEvent(eventType, event.rawPayload, event);

    await WebhookEvent.findByIdAndUpdate(eventId, {
      processingStatus: WebhookProcessingStatus.Processed,
      processedAt:      new Date(),
    });

    return { status: 'processed', message: 'Webhook retried and processed' };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const retryCount   = (event.retryCount ?? 0) + 1;

    await WebhookEvent.findByIdAndUpdate(eventId, {
      processingStatus: retryCount >= 3
        ? WebhookProcessingStatus.FailedPermanent
        : WebhookProcessingStatus.Failed,
      processingError:  errorMessage,
      retryCount,
    });

    return { status: 'failed', message: errorMessage };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface InsertWebhookEventInput {
  provider:         WebhookProvider;
  eventId:          string;
  eventType:        string;
  rawPayload:       Record<string, unknown>;
  signatureValid:   boolean;
  processingStatus: WebhookProcessingStatus;
}

async function safeInsertWebhookEvent(
  input: InsertWebhookEventInput
): Promise<InstanceType<typeof WebhookEvent> | null> {
  try {
    const event = await WebhookEvent.create({
      provider:         input.provider,
      eventId:          input.eventId,
      eventType:        input.eventType,
      rawPayload:       input.rawPayload,
      signatureValid:   input.signatureValid,
      processingStatus: input.processingStatus,
      retryCount:       0,
    });
    return event;
  } catch (err: unknown) {
    // Duplicate key = race condition duplicate (idempotent)
    if ((err as { code?: number }).code === 11000) return null;
    throw err;
  }
}
