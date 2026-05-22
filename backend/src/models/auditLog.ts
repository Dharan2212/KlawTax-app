import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { AuditCategory, AuditSeverity, AuditSource } from './auditLogEnums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IAuditLog {
  // Actor context
  actorUserId?: Types.ObjectId;
  actorRole?: string;
  actorIp?: string;
  userAgent?: string;

  // Entity being acted upon
  entityType: string;  // e.g. 'project', 'user', 'invoice'
  entityId?: Types.ObjectId;
  entityName?: string; // Human-readable identifier (e.g. project number)

  // Action
  action: string; // e.g. 'project.status_updated'
  category: AuditCategory;
  severity: AuditSeverity;

  // Change tracking
  previousState?: Record<string, unknown>;
  nextState?: Record<string, unknown>;
  changedFields?: string[];

  // Optional context links
  projectId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  documentId?: Types.ObjectId;
  supportTicketId?: Types.ObjectId;
  /** Future-compatible: set by Batch 4.1 payment module. */
  invoiceId?: Types.ObjectId;
  /** Future-compatible: set by Batch 4.1 payment module. */
  paymentId?: Types.ObjectId;

  // Operational metadata
  requestId?: string;
  correlationId?: string;
  source: AuditSource;

  /** When true, this log entry is never returned to non-admin queries. */
  internalOnly: boolean;

  /** Additional free-form context for debugging. */
  metadata?: Record<string, unknown>;

  createdAt: Date;
}

export type IAuditLogDocument = IAuditLog & Document;
export type IAuditLogModel = Model<IAuditLogDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    // Actor
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    actorRole: {
      type: String,
      maxlength: 50,
    },

    actorIp: {
      type: String,
      maxlength: 45,
    },

    userAgent: {
      type: String,
      maxlength: 500,
    },

    // Entity
    entityType: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
    },

    entityName: {
      type: String,
      maxlength: 200,
    },

    // Action
    action: {
      type: String,
      required: true,
      maxlength: 200,
      index: true,
    },

    category: {
      type: String,
      enum: Object.values(AuditCategory),
      required: true,
    },

    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      default: AuditSeverity.Info,
    },

    // Change tracking (stored as Mixed to support arbitrary document shapes)
    previousState: {
      type: Schema.Types.Mixed,
    },

    nextState: {
      type: Schema.Types.Mixed,
    },

    changedFields: {
      type: [String],
      default: undefined,
    },

    // Context links
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    supportTicketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    invoiceId: { type: Schema.Types.ObjectId }, // Intentionally unrefed (Batch 4.1)
    paymentId: { type: Schema.Types.ObjectId }, // Intentionally unrefed (Batch 4.1)

    // Operational
    requestId: {
      type: String,
      maxlength: 100,
    },

    correlationId: {
      type: String,
      maxlength: 100,
    },

    source: {
      type: String,
      enum: Object.values(AuditSource),
      default: AuditSource.Api,
    },

    internalOnly: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Audit logs are immutable
    collection: 'auditLogs',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Entity-level audit trail (most common query: "show history for this project")
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

// Action-based queries (e.g. "all login_failed events")
auditLogSchema.index({ action: 1, createdAt: -1 });

// Category + severity filtering for admin monitoring
auditLogSchema.index({ category: 1, severity: 1, createdAt: -1 });

// Actor history (what did this user do?)
auditLogSchema.index({ actorUserId: 1, createdAt: -1 });

// Project-scoped audit trail
auditLogSchema.index({ projectId: 1, createdAt: -1 });

// Support ticket audit trail
auditLogSchema.index({ supportTicketId: 1, createdAt: -1 });

// IP-based security monitoring
auditLogSchema.index({ actorIp: 1, createdAt: -1 });

// Admin export / compliance queries (date range scans)
auditLogSchema.index({ createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const AuditLog: IAuditLogModel =
  (models['AuditLog'] as IAuditLogModel | undefined) ??
  model<IAuditLogDocument>('AuditLog', auditLogSchema);
