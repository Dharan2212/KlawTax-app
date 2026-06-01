import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { mailer } from '../../services/mailer';
import { getConfig } from '../../config/env';

import { User, AccountStatus } from '../../models/user';
import { RefreshToken } from '../../models/refreshToken';
import { ActivitySession } from '../../models/activitySession';
import { LoginAttempt } from '../../models/loginAttempt';
import { PasswordResetToken } from '../../models/passwordResetToken';
import { EmailVerificationToken } from '../../models/emailVerificationToken';
import { ActivitySessionStatus, SessionTerminationReason, LoginFailureReason, UserRole, RefreshTokenRevocationReason } from '../../models/enums';

import { Role } from '../../utils/permissions';
import { comparePassword, hashPassword, validatePasswordPolicy } from '../../utils/password';
import { hashToken, generateSecureToken } from '../../utils/tokenHash';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  expiryDate,
} from '../../utils/jwt';
import { findClientProfileByUserId, findEmployeeProfileByUserId } from '../users/userRepository';
import { AppError } from '../../middlewares/errorHandler';
import { buildAuthPayload, registerTokenVerifier, AuthPayload } from '../../middlewares/auth';
import { logger } from '../../utils/logger';
import {
  TOKEN_TTL,
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  LOGIN_ATTEMPT_WINDOW_MS,
  AUTH_ERROR,
} from '../../constants/auth';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

async function recordLoginAttempt(params: {
  email:         string;
  ipAddress:     string;
  userAgent?:    string;
  success:       boolean;
  failureReason?: LoginFailureReason;
}): Promise<void> {
  try {
    await LoginAttempt.create({
      email:         params.email,
      ipAddress:     params.ipAddress,
      userAgent:     params.userAgent,
      success:       params.success,
      failureReason: params.failureReason,
      attemptedAt:   new Date(),
      expiresAt:     expiryDate(24 * 60 * 60), // 24-hour TTL
    });
  } catch {
    // Never let audit logging block the auth flow
  }
}

async function checkBruteForce(email: string): Promise<void> {
  const windowStart = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS);
  const recentFails = await LoginAttempt.countDocuments({
    email,
    success:     false,
    attemptedAt: { $gte: windowStart },
  });
  if (recentFails >= MAX_FAILED_ATTEMPTS) {
    throw new AppError(
      'Too many failed login attempts. Please try again in 30 minutes.',
      429,
      AUTH_ERROR.ACCOUNT_LOCKED
    );
  }
}

async function buildTokenPair(user: InstanceType<typeof User>, meta: { ip?: string; userAgent?: string }) {
  // Resolve profile IDs
  const [clientProfile, employeeProfile] = await Promise.all([
    user.role === Role.Client   ? findClientProfileByUserId(user._id as Types.ObjectId) : null,
    user.role === Role.Employee ? findEmployeeProfileByUserId(user._id as Types.ObjectId) : null,
  ]);

  const authPayload = buildAuthPayload({
    userId:             (user._id as Types.ObjectId).toString(),
    role:               user.role as Role,
    email:              user.email,
    accountStatus:      user.accountStatus,
    additionalPermissions: user.additionalPermissions,
    clientProfileId:    clientProfile ? (clientProfile._id as Types.ObjectId).toString() : undefined,
    employeeProfileId:  employeeProfile ? (employeeProfile._id as Types.ObjectId).toString() : undefined,
  });

  // Sign tokens
  const family = uuidv4();
  const { token: accessToken, expiresIn: accessExpiresIn } = signAccessToken(authPayload);
  const { token: rawRefresh, expiresIn: refreshExpiresIn } = signRefreshToken(
    (user._id as Types.ObjectId).toString(),
    family
  );

  // Persist hashed refresh token
  await RefreshToken.create({
    userId:     user._id,
    tokenHash:  hashToken(rawRefresh),
    family,
    isRevoked:  false,
    deviceInfo: meta.userAgent,
    createdByIp: meta.ip,
    expiresAt:  expiryDate(refreshExpiresIn),
    lastUsedAt: new Date(),
  });

  // Create activity session — map Role string to UserRole enum value
  await ActivitySession.create({
    userId:              user._id,
    role:                user.role as string as UserRole,
    refreshTokenFamily:  family,
    loginIp:             meta.ip,
    deviceInfo:          meta.userAgent,
    loginAt:             new Date(),
    lastActivityAt:      new Date(),
    sessionStatus:       ActivitySessionStatus.Active,
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    accessExpiresIn,
  };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  accessToken:     string;
  refreshToken:    string;
  accessExpiresIn: number;
  user: {
    id:          string;
    email:       string;
    firstName:   string;
    lastName:    string;
    role:        Role;
    isEmailVerified: boolean;
  };
}

export async function login(params: {
  email:      string;
  password:   string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<LoginResult> {
  const { email, password, ipAddress = '', userAgent } = params;

  // Brute-force guard
  await checkBruteForce(email);

  // Find user (include passwordHash for comparison)
  const user = await User.findOne({ email }).select('+passwordHash').exec();

  if (!user) {
    await recordLoginAttempt({ email, ipAddress, userAgent, success: false, failureReason: LoginFailureReason.EmailNotFound });
    throw new AppError('Invalid email or password', 401, AUTH_ERROR.INVALID_CREDENTIALS);
  }

  // Account status checks BEFORE password verification (avoids timing leak on wrong email)
  if (user.accountStatus === AccountStatus.Archived) {
    await recordLoginAttempt({ email, ipAddress, userAgent, success: false, failureReason: LoginFailureReason.AccountInactive });
    throw new AppError('This account has been archived', 401, AUTH_ERROR.ACCOUNT_ARCHIVED);
  }

  if (user.accountStatus === AccountStatus.Inactive) {
    await recordLoginAttempt({ email, ipAddress, userAgent, success: false, failureReason: LoginFailureReason.AccountInactive });
    throw new AppError('This account has been deactivated. Contact support.', 401, AUTH_ERROR.ACCOUNT_INACTIVE);
  }

  // Check time-based soft-lock
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
    throw new AppError(
      `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
      429,
      AUTH_ERROR.ACCOUNT_LOCKED
    );
  }

  // Password check
  const passwordMatch = await comparePassword(password, user.passwordHash);
  if (!passwordMatch) {
    await recordLoginAttempt({ email, ipAddress, userAgent, success: false, failureReason: LoginFailureReason.InvalidPassword });

    // Apply rolling soft-lock check
    const windowStart = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS);
    const recentFails = await LoginAttempt.countDocuments({
      email, success: false, attemptedAt: { $gte: windowStart },
    });
    if (recentFails >= MAX_FAILED_ATTEMPTS - 1) {
      await User.findByIdAndUpdate(user._id, {
        $set: { accountLockedUntil: new Date(Date.now() + LOCK_DURATION_MS) },
      });
    }

    throw new AppError('Invalid email or password', 401, AUTH_ERROR.INVALID_CREDENTIALS);
  }

  // Email verification check (only for client accounts — employees verified by admin)
  if (user.role === Role.Client && !user.isEmailVerified) {
    await recordLoginAttempt({ email, ipAddress, userAgent, success: false, failureReason: LoginFailureReason.EmailNotVerified });
    throw new AppError(
      'Please verify your email address before logging in.',
      401,
      AUTH_ERROR.EMAIL_NOT_VERIFIED
    );
  }

  // Activate pending accounts on first login
  if (user.accountStatus === AccountStatus.Pending && user.role !== Role.Client) {
    await User.findByIdAndUpdate(user._id, { $set: { accountStatus: AccountStatus.Active } });
    user.accountStatus = AccountStatus.Active;
  }

  // Clear lock on successful login
  if (user.accountLockedUntil) {
    await User.findByIdAndUpdate(user._id, { $unset: { accountLockedUntil: '' } });
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { $set: { lastLoginAt: new Date() } });

  const tokens = await buildTokenPair(user, { ip: ipAddress, userAgent });

  await recordLoginAttempt({ email, ipAddress, userAgent, success: true });

  logger.info('[AuthService] Login successful', { userId: user._id, role: user.role });

  return {
    ...tokens,
    user: {
      id:              (user._id as Types.ObjectId).toString(),
      email:           user.email,
      firstName:       user.firstName,
      lastName:        user.lastName,
      role:            user.role as Role,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

// ─── Refresh Token Rotation ───────────────────────────────────────────────────

export interface RefreshResult {
  accessToken:     string;
  refreshToken:    string;
  accessExpiresIn: number;
}

export async function refreshTokens(params: {
  rawRefreshToken: string;
  ipAddress?:      string;
  userAgent?:      string;
}): Promise<RefreshResult> {
  const { rawRefreshToken, ipAddress, userAgent } = params;

  // Verify JWT signature and expiry
  const payload = verifyRefreshToken(rawRefreshToken);
  const incomingHash = hashToken(rawRefreshToken);

  // Find the persisted token record
  const stored = await RefreshToken.findOne({ tokenHash: incomingHash }).exec();

  if (!stored) {
    // Token not found — possible reuse attack: revoke entire family
    await RefreshToken.updateMany(
      { family: payload.family },
      { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: RefreshTokenRevocationReason.SuspectedReuse } }
    );
    await ActivitySession.updateMany(
      { refreshTokenFamily: payload.family },
      { $set: { sessionStatus: ActivitySessionStatus.Terminated, terminatedReason: SessionTerminationReason.TokenReuse, logoutAt: new Date() } }
    );
    logger.warn('[AuthService] Refresh token reuse detected — family revoked', { family: payload.family });
    throw new AppError('Security alert: token reuse detected. Please log in again.', 401, AUTH_ERROR.TOKEN_REUSE_DETECTED);
  }

  if (stored.isRevoked) {
    throw new AppError('Refresh token has been revoked', 401, AUTH_ERROR.TOKEN_REVOKED);
  }

  // Fetch user
  const user = await User.findById(payload.sub).select('+passwordHash').exec();
  if (!user || user.accountStatus === AccountStatus.Inactive || user.accountStatus === AccountStatus.Archived) {
    throw new AppError('Account is not accessible', 401, AUTH_ERROR.ACCOUNT_INACTIVE);
  }

  // Revoke old token (rotation)
  await RefreshToken.findByIdAndUpdate(stored._id, {
    $set: { isRevoked: true, revokedAt: new Date(), revokedReason: RefreshTokenRevocationReason.Rotation },
  });

  // Issue new token pair (same family)
  const { token: rawNewRefresh, expiresIn: refreshExpiresIn } = signRefreshToken(
    (user._id as Types.ObjectId).toString(),
    stored.family
  );
  const newRefreshHash = hashToken(rawNewRefresh);

  // Update stored token with replacement hash
  await RefreshToken.findByIdAndUpdate(stored._id, {
    $set: { replacedByTokenHash: newRefreshHash },
  });

  // Persist new token
  await RefreshToken.create({
    userId:             user._id,
    tokenHash:          newRefreshHash,
    family:             stored.family,
    isRevoked:          false,
    deviceInfo:         userAgent ?? stored.deviceInfo,
    createdByIp:        ipAddress ?? stored.createdByIp,
    expiresAt:          expiryDate(refreshExpiresIn),
    lastUsedAt:         new Date(),
  });

  // Update session lastActivityAt
  await ActivitySession.updateOne(
    { refreshTokenFamily: stored.family, sessionStatus: ActivitySessionStatus.Active },
    { $set: { lastActivityAt: new Date() } }
  );

  // Resolve profiles for access token
  const [clientProfile, employeeProfile] = await Promise.all([
    user.role === Role.Client   ? findClientProfileByUserId(user._id as Types.ObjectId) : null,
    user.role === Role.Employee ? findEmployeeProfileByUserId(user._id as Types.ObjectId) : null,
  ]);

  const authPayload = buildAuthPayload({
    userId:             (user._id as Types.ObjectId).toString(),
    role:               user.role as Role,
    email:              user.email,
    accountStatus:      user.accountStatus,
    additionalPermissions: user.additionalPermissions,
    clientProfileId:    clientProfile ? (clientProfile._id as Types.ObjectId).toString() : undefined,
    employeeProfileId:  employeeProfile ? (employeeProfile._id as Types.ObjectId).toString() : undefined,
  });

  const { token: newAccessToken, expiresIn: accessExpiresIn } = signAccessToken(authPayload);

  return { accessToken: newAccessToken, refreshToken: rawNewRefresh, accessExpiresIn };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(rawRefreshToken: string): Promise<void> {
  const hash = hashToken(rawRefreshToken);
  const stored = await RefreshToken.findOne({ tokenHash: hash }).exec();
  if (!stored || stored.isRevoked) return; // Idempotent

  await RefreshToken.findByIdAndUpdate(stored._id, {
    $set: { isRevoked: true, revokedAt: new Date(), revokedReason: RefreshTokenRevocationReason.Logout },
  });

  await ActivitySession.updateOne(
    { refreshTokenFamily: stored.family, sessionStatus: ActivitySessionStatus.Active },
    { $set: { sessionStatus: ActivitySessionStatus.LoggedOut, terminatedReason: SessionTerminationReason.Logout, logoutAt: new Date() } }
  );
}

export async function logoutAll(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { userId: new Types.ObjectId(userId), isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date(), revokedReason: RefreshTokenRevocationReason.Logout } }
  );
  await ActivitySession.updateMany(
    { userId: new Types.ObjectId(userId), sessionStatus: ActivitySessionStatus.Active },
    { $set: { sessionStatus: ActivitySessionStatus.LoggedOut, terminatedReason: SessionTerminationReason.Logout, logoutAt: new Date() } }
  );
  logger.info('[AuthService] All sessions revoked', { userId });
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email }).exec();
  // Always return success (don't leak existence)
  if (!user || user.accountStatus === AccountStatus.Archived) return;

  // Invalidate any existing unexpired tokens
  await PasswordResetToken.deleteMany({ userId: user._id, isUsed: false });

  const rawToken = generateSecureToken(32);
  await PasswordResetToken.create({
    userId:     user._id,
    tokenHash:  hashToken(rawToken),
    isUsed:     false,
    expiresAt:  expiryDate(TOKEN_TTL.PASSWORD_RESET_SECONDS),
    requestedIp: '',
  });

  const cfg = getConfig();
  const resetLink = `${cfg.CLIENT_URL}/reset-password?token=${rawToken}`;
  await mailer.sendPasswordReset({
    to:        user.email,
    fullName:  `${user.firstName} ${user.lastName}`.trim() || user.email,
    resetLink,
  });

  logger.info('[AuthService] Password reset email dispatched', { userId: user._id });
}

export async function resetPassword(params: { token: string; newPassword: string }): Promise<void> {
  const { token, newPassword } = params;

  const policy = validatePasswordPolicy(newPassword);
  if (!policy.valid) {
    throw new AppError(policy.errors[0] ?? 'Password does not meet requirements', 422, 'VALIDATION_ERROR');
  }

  const tokenRecord = await PasswordResetToken.findOne({
    tokenHash: hashToken(token),
    isUsed:    false,
    expiresAt: { $gt: new Date() },
  }).exec();

  if (!tokenRecord) {
    throw new AppError('Password reset token is invalid or has expired', 400, AUTH_ERROR.RESET_TOKEN_INVALID);
  }

  const newHash = await hashPassword(newPassword);

  await User.findByIdAndUpdate(tokenRecord.userId, {
    $set: {
      passwordHash:      newHash,
      passwordChangedAt: new Date(),
      accountLockedUntil: null,
    },
  });

  await PasswordResetToken.findByIdAndUpdate(tokenRecord._id, {
    $set: { isUsed: true, usedAt: new Date() },
  });

  // Revoke all refresh tokens (force re-login everywhere)
  await logoutAll(tokenRecord.userId.toString());

  logger.info('[AuthService] Password reset completed', { userId: tokenRecord.userId });
}

// ─── Email Verification ───────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<void> {
  const record = await EmailVerificationToken.findOne({
    tokenHash:  hashToken(token),
    isVerified: false,
    expiresAt:  { $gt: new Date() },
  }).exec();

  if (!record) {
    throw new AppError('Email verification token is invalid or has expired', 400, AUTH_ERROR.VERIFICATION_TOKEN_INVALID);
  }

  await User.findByIdAndUpdate(record.userId, {
    $set: {
      isEmailVerified: true,
      accountStatus:   AccountStatus.Active,
    },
  });

  await EmailVerificationToken.findByIdAndUpdate(record._id, {
    $set: { isVerified: true, verifiedAt: new Date() },
  });

  logger.info('[AuthService] Email verified', { userId: record.userId });
}

export async function resendVerification(email: string): Promise<void> {
  const user = await User.findOne({ email }).exec();
  if (!user || user.isEmailVerified) return; // Idempotent — don't leak existence

  // Rate-limit: check existing token's resendCount
  const existing = await EmailVerificationToken.findOne({ userId: user._id }).exec();
  if (existing && existing.resendCount >= 5) {
    throw new AppError('Too many verification emails sent. Please wait or contact support.', 429, AUTH_ERROR.RESEND_RATE_LIMITED);
  }

  // Invalidate old token and issue a new one
  if (existing) {
    await EmailVerificationToken.findByIdAndDelete(existing._id);
  }

  const rawToken = generateSecureToken(32);
  await EmailVerificationToken.create({
    userId:      user._id,
    tokenHash:   hashToken(rawToken),
    isVerified:  false,
    expiresAt:   expiryDate(TOKEN_TTL.EMAIL_VERIFICATION_SECONDS),
    resendCount: (existing?.resendCount ?? 0) + 1,
    lastSentAt:  new Date(),
  });

  const cfg = getConfig();
  const verifyLink = `${cfg.CLIENT_URL}/verify-email?token=${rawToken}`;
  await mailer.sendEmailVerification({
    to:         user.email,
    fullName:  `${user.firstName} ${user.lastName}`.trim() || user.email,
    verifyLink,
  });

  logger.info('[AuthService] Verification email dispatched', { userId: user._id });
}

// ─── Token Verifier (wired into auth middleware) ──────────────────────────────

/**
 * Concrete implementation of the TokenVerifier interface.
 * Call `initAuthMiddleware()` once on server startup after DB is connected.
 */
export function initAuthMiddleware(): void {
  registerTokenVerifier({
    async verify(token: string): Promise<AuthPayload> {
      const payload = verifyAccessToken(token);
      return {
        userId:            payload.sub,
        role:              payload.role,
        email:             payload.email,
        accountStatus:     payload.acctStatus,
        permissions:       payload.perms,
        clientProfileId:   payload.cpid,
        employeeProfileId: payload.epid,
        jti:               payload.jti,
        iat:               payload.iat,
        exp:               payload.exp,
      };
    },
  });
}
