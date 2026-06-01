/**
 * Auth-domain constants.
 * Single source of truth for token types, expiry windows, and auth error codes.
 */

// ─── Token Types ──────────────────────────────────────────────────────────────

export const TOKEN_TYPE = {
  ACCESS:               'access',
  REFRESH:              'refresh',
  PASSWORD_RESET:       'password_reset',
  EMAIL_VERIFICATION:   'email_verification',
} as const;

export type TokenType = (typeof TOKEN_TYPE)[keyof typeof TOKEN_TYPE];

// ─── Token TTL Defaults (seconds) ────────────────────────────────────────────

export const TOKEN_TTL = {
  ACCESS_TOKEN_SECONDS:             15 * 60,           // 15 minutes
  REFRESH_TOKEN_SECONDS:            30 * 24 * 60 * 60, // 30 days
  PASSWORD_RESET_SECONDS:           60 * 60,           // 1 hour
  EMAIL_VERIFICATION_SECONDS:       48 * 60 * 60,      // 48 hours
} as const;

// ─── Brute-Force / Lock Config ────────────────────────────────────────────────

/** Rolling window for counting failed login attempts (milliseconds). */
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** Failed attempts within window before soft-lock is applied. */
export const MAX_FAILED_ATTEMPTS = 5;

/** Soft-lock duration (milliseconds). */
export const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ─── Auth Error Codes ─────────────────────────────────────────────────────────
// Used in AppError errorCode so frontend can map to localised messages.

export const AUTH_ERROR = {
  INVALID_CREDENTIALS:      'INVALID_CREDENTIALS',
  ACCOUNT_NOT_FOUND:        'ACCOUNT_NOT_FOUND',
  EMAIL_NOT_VERIFIED:       'EMAIL_NOT_VERIFIED',
  ACCOUNT_INACTIVE:         'ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED:           'ACCOUNT_LOCKED',
  ACCOUNT_ARCHIVED:         'ACCOUNT_ARCHIVED',
  TOKEN_INVALID:            'TOKEN_INVALID',
  TOKEN_EXPIRED:            'TOKEN_EXPIRED',
  TOKEN_REVOKED:            'TOKEN_REVOKED',
  TOKEN_REUSE_DETECTED:     'TOKEN_REUSE_DETECTED',
  REFRESH_TOKEN_MISSING:    'REFRESH_TOKEN_MISSING',
  RESET_TOKEN_INVALID:      'RESET_TOKEN_INVALID',
  RESET_TOKEN_USED:         'RESET_TOKEN_USED',
  VERIFICATION_TOKEN_INVALID: 'VERIFICATION_TOKEN_INVALID',
  RESEND_RATE_LIMITED:      'RESEND_RATE_LIMITED',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR];

// ─── Cookie Names (for future HttpOnly cookie support) ────────────────────────

export const COOKIE_NAME = {
  REFRESH_TOKEN: 'klawtax_rt',
} as const;

// ─── Password Policy ──────────────────────────────────────────────────────────

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 72,    // bcrypt hard max
  SALT_ROUNDS: 12,   // Overridden by env BCRYPT_SALT_ROUNDS
} as const;
