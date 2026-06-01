import { Schema, model, models, Document, Model } from 'mongoose';
import { LoginFailureReason } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface ILoginAttempt {
  /** Email address used in the attempt (stored lowercase). */
  email: string;

  /** IP address of the request. */
  ipAddress: string;

  /** Whether the login ultimately succeeded. */
  success: boolean;

  /** Populated only on failed attempts. */
  failureReason?: LoginFailureReason;

  /** User-agent string of the client. */
  userAgent?: string;

  /** Browser name parsed from user-agent. */
  browserName?: string;

  /** OS name parsed from user-agent. */
  osName?: string;

  /**
   * TTL field — documents auto-deleted after 24 hours.
   * Aligns with the rolling brute-force window.
   */
  expiresAt: Date;

  attemptedAt: Date;
  createdAt: Date;
}

export type ILoginAttemptDocument = ILoginAttempt & Document;
export type ILoginAttemptModel = Model<ILoginAttemptDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginAttemptSchema = new Schema<ILoginAttemptDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },

    ipAddress: {
      type: String,
      required: true,
      maxlength: 45,
    },

    success: {
      type: Boolean,
      required: true,
      default: false,
    },

    failureReason: {
      type: String,
      enum: Object.values(LoginFailureReason),
    },

    userAgent: {
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

    expiresAt: {
      type: Date,
      required: true,
    },

    attemptedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // append-only — no updatedAt needed
    collection: 'loginAttempts',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL — auto-expire after 24-hour window
loginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Soft-lock query: count failed attempts per email in rolling 15-minute window
loginAttemptSchema.index({ email: 1, attemptedAt: -1 });

// Security analytics: suspicious IPs
loginAttemptSchema.index({ ipAddress: 1, attemptedAt: -1 });

// Compound: failed attempts from one IP for one email (tightest brute-force signal)
loginAttemptSchema.index({ email: 1, ipAddress: 1, success: 1, attemptedAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const LoginAttempt: ILoginAttemptModel =
  (models['LoginAttempt'] as ILoginAttemptModel | undefined) ??
  model<ILoginAttemptDocument>('LoginAttempt', loginAttemptSchema);
