import { Schema, model, models, Document, Types, Model } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IEmailVerificationToken {
  userId: Types.ObjectId;

  /**
   * SHA-256 hash of the raw verification token sent in the email link.
   * Raw token is never stored.
   */
  tokenHash: string;

  /** Whether the email has been verified. */
  isVerified: boolean;

  /** Timestamp of successful verification. */
  verifiedAt?: Date;

  /** TTL — auto-deleted after expiry (default: 48 hours). */
  expiresAt: Date;

  /**
   * Number of times the verification email has been resent.
   * Rate-limited: max 2 resends per hour per user.
   */
  resendCount: number;

  /** Timestamp of the most recent resend. Used for rate-limiting. */
  lastSentAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type IEmailVerificationTokenDocument = IEmailVerificationToken & Document;
export type IEmailVerificationTokenModel = Model<IEmailVerificationTokenDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const emailVerificationTokenSchema = new Schema<IEmailVerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Unique per user — only one active verification token per account
      unique: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verifiedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    resendCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastSentAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'emailVerificationTokens',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL — auto-expire unverified tokens
emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Weekly reminder job query: find accounts < 14 days old, not yet verified
emailVerificationTokenSchema.index({ isVerified: 1, createdAt: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const EmailVerificationToken: IEmailVerificationTokenModel =
  (models['EmailVerificationToken'] as IEmailVerificationTokenModel | undefined) ??
  model<IEmailVerificationTokenDocument>('EmailVerificationToken', emailVerificationTokenSchema);
