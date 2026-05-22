import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { WebhookProvider, WebhookProcessingStatus } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IWebhookEvent {
  /** Payment / integration provider that sent this webhook. */
  provider: WebhookProvider;

  /**
   * Unique event ID supplied by the provider (e.g. Razorpay `event.id`).
   * Combined with `provider` this forms the idempotency key.
   */
  eventId: string;

  /** Provider-defined event type string (e.g. `payment.captured`). */
  eventType: string;

  /**
   * Full JSON payload as received — preserved for debugging and replay.
   * Stored as a generic object (avoid re-parsing).
   */
  rawPayload: Record<string, unknown>;

  /**
   * Whether the HMAC-SHA256 signature verification passed.
   * Events with `signatureValid: false` are skipped immediately.
   */
  signatureValid: boolean;

  processingStatus: WebhookProcessingStatus;

  /** Error message if `processingStatus` is `failed` or `failed_permanent`. */
  processingError?: string;

  /** Timestamp when processing completed successfully. */
  processedAt?: Date;

  /** Number of processing attempts (incremented on each retry). */
  retryCount: number;

  /** Reference to the resulting payment record (set on success). */
  relatedPaymentId?: Types.ObjectId;

  /** Reference to the resulting invoice record (set on success). */
  relatedInvoiceId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type IWebhookEventDocument = IWebhookEvent & Document;
export type IWebhookEventModel = Model<IWebhookEventDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const webhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    provider: {
      type: String,
      enum: Object.values(WebhookProvider),
      required: true,
    },

    eventId: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    rawPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },

    signatureValid: {
      type: Boolean,
      required: true,
      default: false,
    },

    processingStatus: {
      type: String,
      enum: Object.values(WebhookProcessingStatus),
      default: WebhookProcessingStatus.Received,
      index: true,
    },

    processingError: {
      type: String,
      maxlength: 2000,
    },

    processedAt: {
      type: Date,
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    relatedPaymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },

    relatedInvoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    timestamps: true,
    collection: 'webhookEvents',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// PRIMARY idempotency key — must be unique to prevent duplicate processing
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

// Retry job query: find failed events to re-process
webhookEventSchema.index({ processingStatus: 1, createdAt: 1 });

// Admin webhook history: filter by type and date range
webhookEventSchema.index({ eventType: 1, createdAt: -1 });

// Cleanup: processed events older than 90 days
webhookEventSchema.index({ processingStatus: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const WebhookEvent: IWebhookEventModel =
  (models['WebhookEvent'] as IWebhookEventModel | undefined) ??
  model<IWebhookEventDocument>('WebhookEvent', webhookEventSchema);
