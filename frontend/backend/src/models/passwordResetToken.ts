import { Schema, model, models, Document, Types, Model } from 'mongoose';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IPasswordResetToken {
  userId: Types.ObjectId;

  /**
   * SHA-256 hash of the raw reset token sent in the email link.
   * Raw token is never stored.
   */
  tokenHash: string;

  /** Whether this token has already been consumed. */
  isUsed: boolean;

  /** Timestamp when the token was consumed. */
  usedAt?: Date;

  /** TTL — auto-deleted by MongoDB after expiry (default: 1 hour). */
  expiresAt: Date;

  /** IP address that initiated the password reset request. */
  requestedIp?: string;

  /** User-agent of the browser that initiated the request. */
  requestedUserAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type IPasswordResetTokenDocument = IPasswordResetToken & Document;
export type IPasswordResetTokenModel = Model<IPasswordResetTokenDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },

    usedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    requestedIp: {
      type: String,
      maxlength: 45,
    },

    requestedUserAgent: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'passwordResetTokens',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL — auto-expire after expiresAt
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast lookup: find the active (unused, unexpired) token for a user
passwordResetTokenSchema.index({ userId: 1, isUsed: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const PasswordResetToken: IPasswordResetTokenModel =
  (models['PasswordResetToken'] as IPasswordResetTokenModel | undefined) ??
  model<IPasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
