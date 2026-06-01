import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { FailedJobSeverity } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IFailedJobLog {
  /** BullMQ's internal job ID for cross-referencing the failed queue entry. */
  bullmqJobId: string;

  /** BullMQ queue name (e.g. 'payments', 'exports', 'notifications'). */
  queueName: string;

  /** Job handler name (e.g. 'processPaymentWebhook', 'generateInvoicePdf'). */
  jobName: string;

  /**
   * Full job data payload at the time of failure.
   * Stored for debugging and potential replay.
   */
  jobPayload: Record<string, unknown>;

  /** Error message from the exception. */
  errorMessage: string;

  /** Full stack trace from the exception. */
  errorStack?: string;

  /** Which attempt number failed (1-based). */
  attemptNumber: number;

  /** Total retry count before this log entry was created. */
  retryCount: number;

  severity: FailedJobSeverity;

  /** Timestamp of the failure event. */
  failedAt: Date;

  /** Whether an admin has reviewed and resolved this failure entry. */
  isResolved: boolean;

  /** Timestamp when an admin marked this as resolved. */
  resolvedAt?: Date;

  /** ObjectId of the admin who resolved this entry. */
  resolvedById?: Types.ObjectId;

  /** Admin note explaining the resolution or root cause. */
  resolutionNote?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type IFailedJobLogDocument = IFailedJobLog & Document;
export type IFailedJobLogModel = Model<IFailedJobLogDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const failedJobLogSchema = new Schema<IFailedJobLogDocument>(
  {
    bullmqJobId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    queueName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    jobName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },

    jobPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },

    errorMessage: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    errorStack: {
      type: String,
      maxlength: 10000,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    retryCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    severity: {
      type: String,
      enum: Object.values(FailedJobSeverity),
      default: FailedJobSeverity.Medium,
      index: true,
    },

    failedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },

    resolvedAt: {
      type: Date,
    },

    resolvedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    resolutionNote: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    collection: 'failedJobLogs',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin monitoring: unresolved failures sorted by severity and recency
failedJobLogSchema.index({ isResolved: 1, severity: 1, failedAt: -1 });

// Queue-specific failure investigation
failedJobLogSchema.index({ queueName: 1, isResolved: 1, failedAt: -1 });

// Cleanup: resolved records older than 30 days
failedJobLogSchema.index({ isResolved: 1, resolvedAt: 1 });

// Deduplication guard: same BullMQ job should not produce multiple unresolved entries
failedJobLogSchema.index({ bullmqJobId: 1, queueName: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const FailedJobLog: IFailedJobLogModel =
  (models['FailedJobLog'] as IFailedJobLogModel | undefined) ??
  model<IFailedJobLogDocument>('FailedJobLog', failedJobLogSchema);
