import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { ExportJobStatus, ExportJobType, ExportRequestorRole } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IExportJob {
  requestedById: Types.ObjectId;
  requestedByRole: ExportRequestorRole;

  exportType: ExportJobType;

  /** The entity type being exported (e.g. 'project', 'client', 'invoice'). */
  entityType?: string;

  /** Reference to the specific entity being exported. */
  entityId?: Types.ObjectId;

  /**
   * Snapshot of any filters/parameters applied at request time.
   * Stored for audit and potential re-run support.
   */
  filterSnapshot?: Record<string, unknown>;

  status: ExportJobStatus;

  /** S3 object key for the generated file. Set on completion. */
  outputStoragePath?: string;

  /** User-facing filename for the download. */
  outputFileName?: string;

  /** File size in bytes. Set on completion. */
  fileSizeBytes?: number;

  /** Error message if the job failed. */
  errorMessage?: string;

  /** Number of processing attempts (for retry logic). */
  retryCount: number;

  /** Timestamp when the BullMQ job was enqueued. */
  queuedAt?: Date;

  /** Timestamp when a worker began processing. */
  startedAt?: Date;

  /** Timestamp when the output file was successfully written to S3. */
  completedAt?: Date;

  /**
   * TTL — both the DB record and the S3 object are eligible for cleanup after this date.
   * Default: 7 days after `completedAt`.
   */
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type IExportJobDocument = IExportJob & Document;
export type IExportJobModel = Model<IExportJobDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const exportJobSchema = new Schema<IExportJobDocument>(
  {
    requestedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    requestedByRole: {
      type: String,
      enum: Object.values(ExportRequestorRole),
      required: true,
    },

    exportType: {
      type: String,
      enum: Object.values(ExportJobType),
      required: true,
      index: true,
    },

    entityType: {
      type: String,
      maxlength: 50,
    },

    entityId: {
      type: Schema.Types.ObjectId,
    },

    filterSnapshot: {
      type: Schema.Types.Mixed,
    },

    status: {
      type: String,
      enum: Object.values(ExportJobStatus),
      default: ExportJobStatus.Queued,
      index: true,
    },

    outputStoragePath: {
      type: String,
      maxlength: 1000,
    },

    outputFileName: {
      type: String,
      maxlength: 255,
    },

    fileSizeBytes: {
      type: Number,
      min: 0,
    },

    errorMessage: {
      type: String,
      maxlength: 2000,
    },

    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    queuedAt: {
      type: Date,
    },

    startedAt: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'exportJobs',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL — auto-delete expired export records
exportJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// User export history
exportJobSchema.index({ requestedById: 1, status: 1, createdAt: -1 });

// Admin monitoring: all jobs by status
exportJobSchema.index({ status: 1, createdAt: -1 });

// Cleanup job: find completed jobs whose expiresAt has passed (belt-and-suspenders)
exportJobSchema.index({ status: 1, expiresAt: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const ExportJob: IExportJobModel =
  (models['ExportJob'] as IExportJobModel | undefined) ??
  model<IExportJobDocument>('ExportJob', exportJobSchema);
