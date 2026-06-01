import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { RefreshTokenRevocationReason } from './enums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IRefreshToken {
  userId: Types.ObjectId;

  /**
   * SHA-256 hash of the raw refresh token string.
   * The raw token is NEVER persisted — only the hash.
   */
  tokenHash: string;

  /**
   * UUID identifying a rotation chain.
   * All tokens issued from the same login share a family.
   * Used for reuse-attack detection: if a consumed token from
   * a known family is re-presented, the entire family is revoked.
   */
  family: string;

  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: RefreshTokenRevocationReason;

  /** Hash of the token that replaced this one on rotation. */
  replacedByTokenHash?: string;

  /** User-agent string captured at issuance. */
  deviceInfo?: string;

  /** Browser name parsed from user-agent (optional enrichment). */
  browserName?: string;

  /** OS name parsed from user-agent (optional enrichment). */
  osName?: string;

  /** IP address at issuance. */
  createdByIp?: string;

  /** TTL — Mongoose/MongoDB will auto-delete the document after this date. */
  expiresAt: Date;

  /** Updated each time this token is used to issue a new access token. */
  lastUsedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type IRefreshTokenDocument = IRefreshToken & Document;
export type IRefreshTokenModel = Model<IRefreshTokenDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
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

    family: {
      type: String,
      required: true,
      index: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    revokedAt: {
      type: Date,
    },

    revokedReason: {
      type: String,
      enum: Object.values(RefreshTokenRevocationReason),
    },

    replacedByTokenHash: {
      type: String,
      trim: true,
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

    createdByIp: {
      type: String,
      maxlength: 45, // IPv6 max length
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'refreshTokens',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// TTL index — MongoDB auto-deletes expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Fast revocation lookup — "revoke all active tokens for a user"
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

// Family-based reuse-attack detection
refreshTokenSchema.index({ family: 1, isRevoked: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const RefreshToken: IRefreshTokenModel =
  (models['RefreshToken'] as IRefreshTokenModel | undefined) ??
  model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
