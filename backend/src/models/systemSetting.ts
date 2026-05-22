import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { SystemSettingCategory, SystemSettingValueType } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ISystemSetting {
  /** Unique setting key — e.g. `project.stall_threshold_days`. */
  key: string;

  /**
   * The setting value. Type depends on `valueType`.
   * Stored as Mixed to support string, number, boolean, and JSON objects.
   */
  value: string | number | boolean | Record<string, unknown>;

  /** Declares the runtime type of `value` for safe casting on read. */
  valueType: SystemSettingValueType;

  /** Human-readable explanation of what this setting controls. */
  description: string;

  category: SystemSettingCategory;

  /**
   * Whether this setting is safe to expose to non-admin authenticated users.
   * Defaults to false — admin-only.
   */
  isPublic: boolean;

  /** ObjectId of the admin who last modified this setting. */
  lastUpdatedById?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type ISystemSettingDocument = ISystemSetting & Document;
export type ISystemSettingModel = Model<ISystemSettingDocument>;

// ─── Canonical Seed Data Constant ─────────────────────────────────────────────
// Used by the database seed script. Kept here for colocation with the schema.

export const SYSTEM_SETTING_SEEDS: Omit<ISystemSetting, 'lastUpdatedById' | 'createdAt' | 'updatedAt'>[] = [
  {
    key: 'project.stall_threshold_days',
    value: 7,
    valueType: SystemSettingValueType.Number,
    description: 'Days without activity before a project is flagged as stalled',
    category: SystemSettingCategory.Operations,
    isPublic: false,
  },
  {
    key: 'project.overdue_escalation_days',
    value: 3,
    valueType: SystemSettingValueType.Number,
    description: 'Days overdue before escalating to admin with urgent priority',
    category: SystemSettingCategory.Operations,
    isPublic: false,
  },
  {
    key: 'lead.auto_archive_days',
    value: 90,
    valueType: SystemSettingValueType.Number,
    description: 'Days inactive before a lead is auto-archived',
    category: SystemSettingCategory.Operations,
    isPublic: false,
  },
  {
    key: 'notifications.admin_digest_enabled',
    value: true,
    valueType: SystemSettingValueType.Boolean,
    description: 'Whether daily admin digest notifications are active',
    category: SystemSettingCategory.Notifications,
    isPublic: false,
  },
  {
    key: 'exports.max_concurrent_jobs',
    value: 3,
    valueType: SystemSettingValueType.Number,
    description: 'Maximum simultaneous export jobs in the queue',
    category: SystemSettingCategory.Exports,
    isPublic: false,
  },
  {
    key: 'exports.pdf_timeout_seconds',
    value: 120,
    valueType: SystemSettingValueType.Number,
    description: 'Timeout for individual PDF generation jobs',
    category: SystemSettingCategory.Exports,
    isPublic: false,
  },
  {
    key: 'payments.advance_percentage',
    value: 50,
    valueType: SystemSettingValueType.Number,
    description: 'Default advance percentage for the 50% payment option',
    category: SystemSettingCategory.Payments,
    isPublic: false,
  },
  {
    key: 'support.escalation_hours_tier1',
    value: 24,
    valueType: SystemSettingValueType.Number,
    description: 'Hours before an open ticket is escalated to medium priority',
    category: SystemSettingCategory.Operations,
    isPublic: false,
  },
  {
    key: 'support.escalation_hours_tier2',
    value: 72,
    valueType: SystemSettingValueType.Number,
    description: 'Hours before an unresolved ticket is escalated to high priority',
    category: SystemSettingCategory.Operations,
    isPublic: false,
  },
  {
    key: 'auth.max_login_attempts',
    value: 5,
    valueType: SystemSettingValueType.Number,
    description: 'Failed login attempts before account soft-lock',
    category: SystemSettingCategory.Security,
    isPublic: false,
  },
  {
    key: 'auth.lock_duration_minutes',
    value: 30,
    valueType: SystemSettingValueType.Number,
    description: 'Duration of soft-lock after max failed login attempts',
    category: SystemSettingCategory.Security,
    isPublic: false,
  },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const systemSettingSchema = new Schema<ISystemSettingDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 200,
    },

    value: {
      type: Schema.Types.Mixed,
      required: true,
    },

    valueType: {
      type: String,
      enum: Object.values(SystemSettingValueType),
      required: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 500,
    },

    category: {
      type: String,
      enum: Object.values(SystemSettingCategory),
      required: true,
      index: true,
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    lastUpdatedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'systemSettings',
    versionKey: false,
  }
);

// ─── Model ────────────────────────────────────────────────────────────────────

export const SystemSetting: ISystemSettingModel =
  (models['SystemSetting'] as ISystemSettingModel | undefined) ??
  model<ISystemSettingDocument>('SystemSetting', systemSettingSchema);
