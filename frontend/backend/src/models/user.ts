import { Schema, model, models, Document, Types, Model } from 'mongoose';
import { Role, type PermissionValue } from '../utils/permissions';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum AccountStatus {
  Active      = 'active',
  Inactive    = 'inactive',    // Manually deactivated by admin
  Locked      = 'locked',      // Soft-locked due to brute-force
  Pending     = 'pending',     // Registered but email not yet verified
  Archived    = 'archived',    // Soft-archived — read-only historical record
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUser {
  // ── Identity ────────────────────────────────────────────────────────────────
  firstName:    string;
  lastName:     string;

  /** Computed or manually set display name. Defaults to `firstName lastName`. */
  displayName?: string;

  email:  string;
  phone?: string;

  // ── Security ────────────────────────────────────────────────────────────────
  /**
   * bcrypt hash of the user's password.
   * Raw password is NEVER stored.
   */
  passwordHash: string;

  role: Role;

  /**
   * Additional per-user permissions granted beyond the base role set.
   * Merged with `ROLE_PERMISSIONS[role]` at runtime via `resolvePermissions()`.
   */
  additionalPermissions: PermissionValue[];

  accountStatus: AccountStatus;

  isEmailVerified: boolean;

  /** Timestamp of the last password change. Used to invalidate older JWTs. */
  passwordChangedAt?: Date;

  /** Timestamp of the most recent successful login. */
  lastLoginAt?: Date;

  /**
   * Soft-lock expiry — set to a future Date when brute-force threshold is hit.
   * Null / undefined means the account is not locked.
   */
  accountLockedUntil?: Date;

  // ── Activity ─────────────────────────────────────────────────────────────────
  /** Updated on authenticated requests (debounced per-session). */
  lastSeenAt?: Date;

  /** ObjectId of the most recent active `activitySessions` record. */
  lastActiveSessionId?: Types.ObjectId;

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  /**
   * ObjectId of the admin who created this account.
   * Null for self-registered clients (checkout flow).
   */
  createdBy?: Types.ObjectId;

  /** Timestamp set when account is deactivated. Null for active accounts. */
  deactivatedAt?: Date;

  /** ObjectId of admin who performed the deactivation. */
  deactivatedBy?: Types.ObjectId;

  /** Timestamp set when account is archived. Archives are read-only records. */
  archivedAt?: Date;

  // ── Optional Metadata ─────────────────────────────────────────────────────────
  avatarUrl?: string;

  /** IANA timezone string (e.g. `Asia/Kolkata`). Used for notification scheduling. */
  timezone?: string;

  /** ISO 639-1 locale code (e.g. `en`, `hi`). */
  locale?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = IUser & Document;
export type IUserModel = Model<IUserDocument>;

// ─── Virtuals Interface ────────────────────────────────────────────────────────

export interface IUserVirtuals {
  fullName: string;
  isActive: boolean;
  isLocked: boolean;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUserDocument>(
  {
    // Identity
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },

    // Security
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never returned in queries unless explicitly requested
    },

    role: {
      type: String,
      enum: Object.values(Role),
      required: true,
      index: true,
    },

    additionalPermissions: {
      type: [String],
      default: [],
    },

    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.Pending,
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    passwordChangedAt: {
      type: Date,
    },

    lastLoginAt: {
      type: Date,
    },

    accountLockedUntil: {
      type: Date,
    },

    // Activity
    lastSeenAt: {
      type: Date,
    },

    lastActiveSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'ActivitySession',
    },

    // Lifecycle
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    deactivatedAt: {
      type: Date,
    },

    deactivatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    archivedAt: {
      type: Date,
    },

    // Metadata
    avatarUrl: {
      type: String,
      maxlength: 500,
    },

    timezone: {
      type: String,
      maxlength: 50,
      default: 'Asia/Kolkata',
    },

    locale: {
      type: String,
      maxlength: 10,
      default: 'en',
    },
  },
  {
    timestamps: true,
    collection: 'users',
    versionKey: false,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────

userSchema.virtual('fullName').get(function (this: IUserDocument): string {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.virtual('isActive').get(function (this: IUserDocument): boolean {
  return this.accountStatus === AccountStatus.Active;
});

userSchema.virtual('isLocked').get(function (this: IUserDocument): boolean {
  if (this.accountStatus === AccountStatus.Locked) return true;
  if (this.accountLockedUntil && this.accountLockedUntil > new Date()) return true;
  return false;
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin user-search and listing
userSchema.index({ role: 1, accountStatus: 1 });

// Quick lookup for email-based auth
userSchema.index({ email: 1, accountStatus: 1 });

// Operational: employees by status (assignment engine, dashboards)
userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });

// Cleanup: find archived/deactivated users
userSchema.index({ archivedAt: 1 }, { sparse: true });
userSchema.index({ deactivatedAt: 1 }, { sparse: true });

// Lock expiry check
userSchema.index({ accountLockedUntil: 1 }, { sparse: true });

// ─── Model ────────────────────────────────────────────────────────────────────

export const User: IUserModel =
  (models['User'] as IUserModel | undefined) ??
  model<IUserDocument>('User', userSchema);
