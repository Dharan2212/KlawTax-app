import { Schema, model, models, Document, Model } from 'mongoose';
import { ScheduledJobStatus } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IScheduledJob {
  /** Unique job identifier — matches the BullMQ job name. */
  jobName: string;

  /** Human-readable description of what this job does. */
  description: string;

  /** Cron expression string (e.g. `0 1 * * *`). */
  cronExpression: string;

  /**
   * Admin-toggleable enable/disable switch.
   * When false, the BullMQ worker skips execution and sets status to `skipped`.
   */
  isEnabled: boolean;

  /** Timestamp when the job last started executing. */
  lastRunAt?: Date;

  lastRunStatus?: ScheduledJobStatus;

  /** Duration of the last run in milliseconds. */
  lastRunDurationMs?: number;

  /** Error message from the last failed run. */
  lastRunError?: string;

  /**
   * Computed next scheduled run.
   * Updated by the scheduler after each execution.
   */
  nextRunAt?: Date;

  /** Lifetime total execution count. */
  totalRunCount: number;

  /** Lifetime total failure count. */
  totalFailureCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export type IScheduledJobDocument = IScheduledJob & Document;
export type IScheduledJobModel = Model<IScheduledJobDocument>;

// ─── Seed Data ────────────────────────────────────────────────────────────────
// Initial job registry — seeded on first deployment.

export const SCHEDULED_JOB_SEEDS: Omit<
  IScheduledJob,
  'lastRunAt' | 'lastRunStatus' | 'lastRunDurationMs' | 'lastRunError' | 'nextRunAt' | 'createdAt' | 'updatedAt'
>[] = [
  {
    jobName: 'project-overdue-detector',
    description: 'Flags projects that have passed their expected delivery date',
    cronExpression: '0 1 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'task-overdue-detector',
    description: 'Flags tasks that have passed their due date',
    cronExpression: '0 1 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'invoice-overdue-detector',
    description: 'Flags invoices that are past their payment due date',
    cronExpression: '0 2 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'lead-auto-archiver',
    description: 'Archives leads that have been inactive beyond the configured threshold',
    cronExpression: '0 3 * * 0',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'stalled-project-detector',
    description: 'Flags projects with no timeline activity for N days (configurable)',
    cronExpression: '0 4 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'notification-archiver',
    description: 'Archives old read notifications to prevent collection bloat',
    cronExpression: '0 5 * * 0',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'refresh-token-cleanup',
    description: 'Hard-deletes revoked refresh tokens older than 30 days',
    cronExpression: '0 6 * * 0',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'export-job-cleanup',
    description: 'Deletes expired export records and their S3 objects',
    cronExpression: '0 7 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'email-verification-reminder',
    description: 'Sends reminder emails to accounts < 14 days old with unverified email',
    cronExpression: '0 9 * * 1',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'webhook-retry-processor',
    description: 'Retries failed webhook events (runs every 15 minutes)',
    cronExpression: '*/15 * * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'activity-session-cleanup',
    description: 'Hard-deletes inactive sessions older than 30 days',
    cronExpression: '0 6 * * 0',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
  {
    jobName: 'support-escalation-checker',
    description: 'Escalates support tickets that breach tier-1 and tier-2 SLA thresholds',
    cronExpression: '0 */6 * * *',
    isEnabled: true,
    totalRunCount: 0,
    totalFailureCount: 0,
  },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const scheduledJobSchema = new Schema<IScheduledJobDocument>(
  {
    jobName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    cronExpression: {
      type: String,
      required: true,
      maxlength: 50,
    },

    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastRunAt: {
      type: Date,
    },

    lastRunStatus: {
      type: String,
      enum: Object.values(ScheduledJobStatus),
    },

    lastRunDurationMs: {
      type: Number,
      min: 0,
    },

    lastRunError: {
      type: String,
      maxlength: 2000,
    },

    nextRunAt: {
      type: Date,
    },

    totalRunCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalFailureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: 'scheduledJobs',
    versionKey: false,
  }
);

// ─── Model ────────────────────────────────────────────────────────────────────

export const ScheduledJob: IScheduledJobModel =
  (models['ScheduledJob'] as IScheduledJobModel | undefined) ??
  model<IScheduledJobDocument>('ScheduledJob', scheduledJobSchema);
