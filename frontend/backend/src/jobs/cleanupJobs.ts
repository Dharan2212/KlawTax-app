/**
 * Cleanup Jobs
 *
 * Safe batch cleanup of expired and stale operational data.
 * MongoDB TTL indexes handle auto-expiry for most token collections —
 * these jobs provide belt-and-suspenders cleanup with operational logging.
 *
 * Jobs:
 *   1. Expired refresh tokens (revoked + older than 30 days)
 *   2. Inactive activity sessions (older than 30 days)
 *   3. Stale login attempts (older than 24 hours — belt-and-suspenders for TTL)
 *   4. Archived notifications (dismissed + older than 90 days)
 *   5. Expired password reset tokens (belt-and-suspenders for TTL)
 *   6. Expired email verification tokens (belt-and-suspenders for TTL)
 */

import { RefreshToken } from '../models/refreshToken';
import { ActivitySession } from '../models/activitySession';
import { LoginAttempt } from '../models/loginAttempt';
import { Notification } from '../models/notification';
import { PasswordResetToken } from '../models/passwordResetToken';
import { EmailVerificationToken } from '../models/emailVerificationToken';
import { FailedJobService } from './failedJobService';
import { logger } from '../utils/logger';

// ─── Result type ──────────────────────────────────────────────────────────────

export interface CleanupResult {
  revokedRefreshTokens: number;
  inactiveActivitySessions: number;
  staleLoginAttempts: number;
  archivedNotifications: number;
  expiredPasswordResetTokens: number;
  expiredEmailVerificationTokens: number;
  resolvedFailedJobLogs: number;
}

// ─── 1. Revoked Refresh Tokens ────────────────────────────────────────────────

async function cleanupRevokedRefreshTokens(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await RefreshToken.deleteMany({
    isRevoked: true,
    updatedAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

// ─── 2. Inactive Activity Sessions ───────────────────────────────────────────

async function cleanupInactiveActivitySessions(): Promise<number> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await ActivitySession.deleteMany({
    isActive: false,
    terminatedAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

// ─── 3. Stale Login Attempts ──────────────────────────────────────────────────

async function cleanupStaleLoginAttempts(): Promise<number> {
  // MongoDB TTL index handles this automatically, but belt-and-suspenders
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const result = await LoginAttempt.deleteMany({
    attemptedAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

// ─── 4. Archived / Dismissed Notifications ───────────────────────────────────

async function cleanupArchivedNotifications(): Promise<number> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const result = await Notification.deleteMany({
    isDismissed: true,
    isRead: true,
    createdAt: { $lt: cutoff },
  });
  return result.deletedCount;
}

// ─── 5. Expired Password Reset Tokens ────────────────────────────────────────

async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  const result = await PasswordResetToken.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
}

// ─── 6. Expired Email Verification Tokens ────────────────────────────────────

async function cleanupExpiredEmailVerificationTokens(): Promise<number> {
  const result = await EmailVerificationToken.deleteMany({
    expiresAt: { $lt: new Date() },
    isVerified: false,
  });
  return result.deletedCount;
}

// ─── 7. Resolved Failed Job Logs ─────────────────────────────────────────────

async function cleanupResolvedFailedJobLogs(): Promise<number> {
  return FailedJobService.cleanupResolved(30);
}

// ─── Composite: run all cleanup jobs ─────────────────────────────────────────

export async function runAllCleanupJobs(): Promise<CleanupResult> {
  const results = await Promise.allSettled([
    cleanupRevokedRefreshTokens(),
    cleanupInactiveActivitySessions(),
    cleanupStaleLoginAttempts(),
    cleanupArchivedNotifications(),
    cleanupExpiredPasswordResetTokens(),
    cleanupExpiredEmailVerificationTokens(),
    cleanupResolvedFailedJobLogs(),
  ]);

  const get = (r: PromiseSettledResult<number>, label: string): number => {
    if (r.status === 'fulfilled') return r.value;
    logger.warn(`[CleanupJobs] ${label} cleanup failed`, { reason: r.reason });
    return 0;
  };

  const result: CleanupResult = {
    revokedRefreshTokens:           get(results[0], 'RefreshToken'),
    inactiveActivitySessions:       get(results[1], 'ActivitySession'),
    staleLoginAttempts:             get(results[2], 'LoginAttempt'),
    archivedNotifications:          get(results[3], 'Notification'),
    expiredPasswordResetTokens:     get(results[4], 'PasswordResetToken'),
    expiredEmailVerificationTokens: get(results[5], 'EmailVerificationToken'),
    resolvedFailedJobLogs:          get(results[6], 'FailedJobLog'),
  };

  const total = Object.values(result).reduce((s, v) => s + v, 0);
  logger.info('[CleanupJobs] Cleanup pass complete', { ...result, total });

  return result;
}

// ─── Individual exports for scheduler fine-tuning ────────────────────────────

export {
  cleanupRevokedRefreshTokens,
  cleanupInactiveActivitySessions,
  cleanupStaleLoginAttempts,
  cleanupArchivedNotifications,
  cleanupExpiredPasswordResetTokens,
  cleanupExpiredEmailVerificationTokens,
  cleanupResolvedFailedJobLogs,
};
