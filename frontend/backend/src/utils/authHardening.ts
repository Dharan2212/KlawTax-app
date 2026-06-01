/**
 * KlawTax Auth Hardening Utilities
 *
 * Supplementary security helpers for the authentication system.
 * These complement the existing auth service lockout logic.
 *
 * Key principles:
 *   - No user enumeration: error messages never reveal whether an email exists
 *   - Timing safety: use constant-time comparisons where possible
 *   - Audit completeness: every auth event is observable
 */

import crypto from 'crypto';

// ─── Timing-Safe Comparisons ──────────────────────────────────────────────────

/**
 * Compare two strings in constant time.
 * Prevents timing attacks that could reveal valid emails/tokens.
 *
 * Returns false immediately if lengths differ to avoid padding the shorter
 * buffer — the length difference is still observable, but this is acceptable
 * for our threat model where all tokens are fixed-length.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── Generic Auth Error Messages ─────────────────────────────────────────────

/**
 * Generic messages that do not reveal whether an email/username exists.
 * Use these instead of specific "user not found" or "wrong password" messages.
 */
export const SAFE_AUTH_MESSAGES = {
  LOGIN_FAILED: 'Invalid credentials. Please check your email and password.',
  RESET_EMAIL_SENT:
    'If an account with that email exists, a password reset link has been sent.',
  ACCOUNT_LOCKED:
    'Your account has been temporarily locked due to too many failed attempts. Please try again later.',
  TOKEN_INVALID: 'This link is invalid or has expired. Please request a new one.',
} as const;

// ─── Lockout Status ───────────────────────────────────────────────────────────

export interface LockoutStatus {
  isLocked: boolean;
  /** Unix timestamp (ms) when the lock expires. 0 if not locked. */
  lockedUntil: number;
  /** Remaining lock time in seconds. 0 if not locked. */
  remainingSeconds: number;
}

/**
 * Compute lockout status from the user's `accountLockedUntil` field.
 */
export function computeLockoutStatus(accountLockedUntil: Date | null | undefined): LockoutStatus {
  if (!accountLockedUntil) {
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0 };
  }

  const lockedUntilMs = accountLockedUntil.getTime();
  const now = Date.now();

  if (now >= lockedUntilMs) {
    return { isLocked: false, lockedUntil: 0, remainingSeconds: 0 };
  }

  return {
    isLocked: true,
    lockedUntil: lockedUntilMs,
    remainingSeconds: Math.ceil((lockedUntilMs - now) / 1_000),
  };
}

// ─── Token Entropy Validation ─────────────────────────────────────────────────

/** Minimum acceptable byte length for secure tokens */
const MIN_TOKEN_BYTES = 20;

/**
 * Validate that a token string has sufficient entropy.
 * Rejects tokens that are suspiciously short or obviously low-entropy.
 */
export function isHighEntropyToken(token: string): boolean {
  if (!token || token.length < MIN_TOKEN_BYTES * 2) return false; // hex = 2 chars/byte
  // Should be hex or base64url only
  return /^[a-zA-Z0-9_\-+/=]+$/.test(token);
}

// ─── Rate Limit Key Builders ──────────────────────────────────────────────────

/**
 * Build a per-email rate limit key.
 * Used to limit failed attempts per email regardless of IP.
 */
export function buildEmailRateLimitKey(email: string): string {
  // Hash the email to avoid storing PII in rate limit keys
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

// ─── Suspicious Activity Detection ───────────────────────────────────────────

export interface SuspiciousLoginSignal {
  type: 'ip_change' | 'device_change' | 'unusual_hour' | 'rapid_succession';
  detail: string;
}

/**
 * Detect suspicious login signals for audit logging.
 * Does NOT block login — only generates audit signals.
 */
export function detectSuspiciousSignals(params: {
  currentIp: string;
  lastKnownIp?: string;
  currentUserAgent: string;
  lastKnownUserAgent?: string;
  attemptedAt: Date;
}): SuspiciousLoginSignal[] {
  const signals: SuspiciousLoginSignal[] = [];

  if (params.lastKnownIp && params.currentIp !== params.lastKnownIp) {
    signals.push({
      type: 'ip_change',
      detail: `IP changed from ${params.lastKnownIp} to ${params.currentIp}`,
    });
  }

  if (params.lastKnownUserAgent && params.currentUserAgent !== params.lastKnownUserAgent) {
    signals.push({
      type: 'device_change',
      detail: 'User agent changed since last login',
    });
  }

  // Unusual hour: logins between 1:00–5:00 AM local UTC
  const hour = params.attemptedAt.getUTCHours();
  if (hour >= 1 && hour < 5) {
    signals.push({
      type: 'unusual_hour',
      detail: `Login attempt at ${hour}:00 UTC (unusual hours)`,
    });
  }

  return signals;
}
