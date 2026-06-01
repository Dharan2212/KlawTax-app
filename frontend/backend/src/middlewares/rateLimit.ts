/**
 * Rate limiting middleware.
 * In-memory token-bucket implementation — no external dependencies.
 * Provider-agnostic: designed to be backed by Redis in the Redis phase.
 *
 * Features:
 * - Route-specific windows and limits
 * - Role-aware throttling (admin/employee bypass for internal tooling)
 * - Abuse spike detection
 * - Webhook-safe (never blocks inbound webhooks)
 * - Upload-safe (separate generous limit for file endpoints)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { reportRateLimitViolation } from '../utils/securityMonitoring/securityMonitor';
import { recordRateLimitHit } from '../utils/metrics/appMetrics';

// ─── In-Memory Store ──────────────────────────────────────────────────────────

interface BucketEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, BucketEntry>();

function getClientKey(req: Request, keyPrefix: string): string {
  const auth = (req as AuthenticatedRequest).auth;
  // Authenticated: key by userId (more stable than IP)
  if (auth?.userId) return `${keyPrefix}:user:${auth.userId}`;
  // Unauthenticated: key by IP
  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown';
  return `${keyPrefix}:ip:${ip}`;
}

function check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    // Fresh window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/** Returns the current number of rate-limit bucket entries in memory. */
export function getRateLimitStoreSize(): number {
  return store.size;
}

// Cleanup stale entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

// ─── Middleware Factory ───────────────────────────────────────────────────────

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
  /** Unique prefix for the bucket key */
  keyPrefix: string;
  /** Human-readable message returned in 429 response */
  message?: string;
  /**
   * Roles that bypass this limit entirely.
   * Use for admin/employee tooling that should never be blocked.
   */
  bypassRoles?: string[];
  /**
   * Whether to emit security monitoring events on violation.
   * Default: true for auth routes, false for general API.
   */
  reportViolation?: boolean;
}

export function createRateLimiter(opts: RateLimitOptions) {
  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const auth = (req as AuthenticatedRequest).auth;

    // Webhook path bypass — Razorpay inbound must never be rate-limited
    if (req.path.startsWith('/api/v1/webhooks')) {
      return next();
    }

    // Role bypass — admin/configured roles skip the limiter
    if (opts.bypassRoles && auth?.role && opts.bypassRoles.includes(auth.role)) {
      return next();
    }

    const key = getClientKey(req, opts.keyPrefix);
    const result = check(key, opts.limit, opts.windowMs);

    res.setHeader('X-RateLimit-Limit', String(opts.limit));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

    if (!result.allowed) {
      const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));

      // Metrics + security monitoring
      recordRateLimitHit(req.path);

      if (opts.reportViolation !== false) {
        const ip =
          (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
          req.socket?.remoteAddress ??
          'unknown';

        reportRateLimitViolation({
          route: req.path,
          ip,
          userId: auth?.userId,
          requestId: req.headers['x-request-id'] as string | undefined,
        });
      }

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: opts.message ?? 'Too many requests — please try again later.',
          retryAfterSeconds: retryAfterSec,
        },
      });
      return;
    }

    next();
  };
}

// ─── Preset Rate Limiters ─────────────────────────────────────────────────────

/** Auth endpoints: login, forgot-password, resend-verification */
export const authRateLimiter = createRateLimiter({
  keyPrefix: 'rl:auth',
  limit: 10,
  windowMs: 15 * 60 * 1000,   // 15 minutes
  message: 'Too many authentication attempts — please wait before trying again.',
  reportViolation: true,
});

/** Forgot-password specifically — 3 per hour per IP (per v1.5 spec) */
export const forgotPasswordRateLimiter = createRateLimiter({
  keyPrefix: 'rl:forgot',
  limit: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many password reset requests — please wait 1 hour.',
  reportViolation: true,
});

/** Email verification resend — 2 per hour per user */
export const resendVerificationRateLimiter = createRateLimiter({
  keyPrefix: 'rl:resend-verify',
  limit: 2,
  windowMs: 60 * 60 * 1000,
  message: 'Too many verification emails sent — please wait.',
  reportViolation: false,
});

/** Public lead/contact form — 3 per hour per IP */
export const publicContactRateLimiter = createRateLimiter({
  keyPrefix: 'rl:contact',
  limit: 3,
  windowMs: 60 * 60 * 1000,
  message: 'Too many contact submissions — please wait before submitting again.',
  reportViolation: true,
});

/** General API — generous limit for authenticated users */
export const generalApiRateLimiter = createRateLimiter({
  keyPrefix: 'rl:api',
  limit: 300,
  windowMs: 15 * 60 * 1000,
  bypassRoles: ['admin'],
  reportViolation: false,
});

/** File upload endpoints — separate limit to avoid blocking normal API traffic */
export const uploadRateLimiter = createRateLimiter({
  keyPrefix: 'rl:upload',
  limit: 30,
  windowMs: 15 * 60 * 1000,
  bypassRoles: ['admin', 'employee'],
  reportViolation: false,
});

/** Payment create-order — prevent rapid order creation */
export const paymentCreateRateLimiter = createRateLimiter({
  keyPrefix: 'rl:payment-create',
  limit: 10,
  windowMs: 60 * 60 * 1000,
  message: 'Too many payment requests — please contact support if this is unexpected.',
  reportViolation: true,
});
