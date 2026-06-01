import { Schema, model, models, Document, Types, Model } from 'mongoose';
import {
  ActivitySessionStatus,
  SessionTerminationReason,
  UserRole,
} from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IActivitySession {
  userId: Types.ObjectId;
  role: UserRole;

  /**
   * Links to the `refreshTokens.family` UUID.
   * One session maps to one rotation chain.
   */
  refreshTokenFamily: string;

  /** User-agent string at session start. */
  deviceInfo?: string;

  /** Browser name (parsed from user-agent). */
  browserName?: string;

  /** OS / platform name (parsed from user-agent). */
  osName?: string;

  /** IP address at session start. */
  loginIp?: string;

  /**
   * Geo-location country code derived from IP (optional Phase 2 enrichment).
   * Populated by a background job — not blocking.
   */
  countryCode?: string;

  /** Session start timestamp. */
  loginAt: Date;

  /** Session end timestamp. Null for active sessions. */
  logoutAt?: Date;

  /**
   * Updated on authenticated requests (debounced — max once per 5 minutes
   * per session to limit write amplification).
   */
  lastActivityAt: Date;

  sessionStatus: ActivitySessionStatus;

  terminatedReason?: SessionTerminationReason;

  createdAt: Date;
  updatedAt: Date;
}

export type IActivitySessionDocument = IActivitySession & Document;
export type IActivitySessionModel = Model<IActivitySessionDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const activitySessionSchema = new Schema<IActivitySessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },

    refreshTokenFamily: {
      type: String,
      required: true,
      index: true,
    },

    deviceInfo: {
      type: String,
      maxlength: 500,
    },

    browserName: {
      type: String,
      maxlength: 100,
    },

    osName: {
      type: String,
      maxlength: 100,
    },

    loginIp: {
      type: String,
      maxlength: 45,
    },

    countryCode: {
      type: String,
      maxlength: 2, // ISO 3166-1 alpha-2
    },

    loginAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    logoutAt: {
      type: Date,
    },

    lastActivityAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    sessionStatus: {
      type: String,
      enum: Object.values(ActivitySessionStatus),
      default: ActivitySessionStatus.Active,
      index: true,
    },

    terminatedReason: {
      type: String,
      enum: Object.values(SessionTerminationReason),
    },
  },
  {
    timestamps: true,
    collection: 'activitySessions',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin UI: "active sessions for user X" — most common query
activitySessionSchema.index({ userId: 1, sessionStatus: 1 });

// Cleanup job: delete inactive sessions older than 30 days
activitySessionSchema.index({ sessionStatus: 1, updatedAt: 1 });

// Security analytics: sessions by IP
activitySessionSchema.index({ loginIp: 1, loginAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const ActivitySession: IActivitySessionModel =
  (models['ActivitySession'] as IActivitySessionModel | undefined) ??
  model<IActivitySessionDocument>('ActivitySession', activitySessionSchema);
