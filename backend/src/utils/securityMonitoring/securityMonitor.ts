/**
 * Security monitoring helpers.
 * Lightweight operational visibility into auth anomalies, brute-force patterns,
 * and suspicious request activity.
 *
 * This is NOT a SIEM. It provides logging hooks and bounded in-memory spike
 * detection for the operations team. Full audit trails live in AuditLog.
 *
 * Design constraints:
 *  - No unbounded Map growth: IP violation counters use a fixed-size sliding window
 *  - No sensitive data in logs: emails are masked before any log call
 *  - No user enumeration: error messages are always generic to callers
 */

import { logger } from '../logger';
import { incrementCounter, getCounter } from '../metrics/metricsStore';
import { captureMessage } from '../telemetry/telemetry';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthAnomalyEvent {
  type:
    | 'repeated_login_failure'
    | 'account_locked'
    | 'token_reuse_detected'
    | 'suspicious_role_access'
    | 'forbidden_access'
    | 'invalid_token';
  email?: string;
  userId?: string;
  ip: string;
  userAgent?: string;
  requestId?: string;
  detail?: string;
}

export interface RateLimitViolationEvent {
  route: string;
  ip: string;
  userId?: string;
  requestId?: string;
}

export interface UploadAnomalyEvent {
  reason: 'invalid_mime' | 'oversized' | 'corrupt_file' | 'blocked_extension';
  filename?: string;
  mimeType?: string;
  ip: string;
  userId?: string;
  requestId?: string;
}

export interface SecurityEventSummary {
  loginFailures24h: number;
  accountLockouts24h: number;
  tokenReuseDetected24h: number;
  rateLimitViolations24h: number;
  forbiddenAccess24h: number;
  uploadAnomalies24h: number;
}

// ─── Bounded IP Violation Tracker ────────────────────────────────────────────
// Tracks rate-limit violations per IP with a fixed-size window (max 1000 IPs).
// Prevents unbounded Map growth from high-cardinality IP labels.

const MAX_TRACKED_IPS = 1000;
const IP_WINDOW_MS = 60 * 60 * 1000; // 1 hour rolling window

interface IpEntry {
  count: number;
  windowStart: number;
}

const ipViolations = new Map<string, IpEntry>();

function trackIpViolation(ip: string): number {
  const now = Date.now();
  const existing = ipViolations.get(ip);

  if (existing && now - existing.windowStart < IP_WINDOW_MS) {
    existing.count += 1;
    return existing.count;
  }

  // Evict oldest entries if at capacity
  if (ipViolations.size >= MAX_TRACKED_IPS) {
    const firstKey = ipViolations.keys().next().value;
    if (firstKey !== undefined) ipViolations.delete(firstKey);
  }

  ipViolations.set(ip, { count: 1, windowStart: now });
  return 1;
}

// ─── Auth Anomaly Reporting ───────────────────────────────────────────────────

export function reportAuthAnomaly(event: AuthAnomalyEvent): void {
  const { type, email, userId, ip, userAgent, requestId, detail } = event;

  incrementCounter('security_auth_anomaly_total', { type });

  const logFields: Record<string, unknown> = {
    securityEvent: type,
    ip,
  };

  // Mask email — never log plaintext email in security events
  if (email) logFields['email'] = maskEmail(email);
  if (userId) logFields['userId'] = userId;
  if (userAgent) logFields['userAgent'] = userAgent.slice(0, 120);
  if (requestId) logFields['requestId'] = requestId;
  if (detail) logFields['detail'] = detail;

  const isHighSeverity = type === 'token_reuse_detected' || type === 'account_locked';

  if (isHighSeverity) {
    logger.warn(`[SecurityMonitor] HIGH: ${type}`, logFields);
    captureMessage(`Security anomaly: ${type}`, 'warning', logFields);
  } else {
    logger.info(`[SecurityMonitor] ${type}`, logFields);
  }
}

// ─── Rate Limit Violations ────────────────────────────────────────────────────

export function reportRateLimitViolation(event: RateLimitViolationEvent): void {
  const { route, ip, userId, requestId } = event;

  incrementCounter('security_rate_limit_violation_total', { route });

  // Track per-IP violations with the bounded tracker
  const ipCount = trackIpViolation(ip);

  const fields: Record<string, unknown> = {
    route,
    ip,
    ipViolationCountThisHour: ipCount,
  };

  if (userId) fields['userId'] = userId;
  if (requestId) fields['requestId'] = requestId;

  // Escalate to warning if the same IP is hammering repeatedly
  if (ipCount >= 10) {
    logger.warn('[SecurityMonitor] Rate limit spike detected from IP', fields);
    captureMessage('Rate limit spike detected', 'warning', fields);
  } else {
    logger.info('[SecurityMonitor] Rate limit violation', fields);
  }
}

// ─── Upload Anomalies ─────────────────────────────────────────────────────────

export function reportUploadAnomaly(event: UploadAnomalyEvent): void {
  const { reason, filename, mimeType, ip, userId, requestId } = event;

  incrementCounter('security_upload_anomaly_total', { reason });

  const fields: Record<string, unknown> = { reason, ip };
  // Only log filename if it doesn't look like a path traversal attempt
  if (filename && !filename.includes('..')) fields['filename'] = filename;
  if (mimeType) fields['mimeType'] = mimeType;
  if (userId) fields['userId'] = userId;
  if (requestId) fields['requestId'] = requestId;

  logger.warn('[SecurityMonitor] Upload anomaly detected', fields);
}

// ─── Security Event Summary ───────────────────────────────────────────────────

/**
 * Returns an in-memory security event summary for the admin diagnostics endpoint.
 * Counts reset on process restart — the persistent audit trail is in MongoDB.
 */
export function getSecurityEventSummary(): SecurityEventSummary {
  return {
    loginFailures24h: getCounter('security_auth_anomaly_total', {
      type: 'repeated_login_failure',
    }),
    accountLockouts24h: getCounter('security_auth_anomaly_total', {
      type: 'account_locked',
    }),
    tokenReuseDetected24h: getCounter('security_auth_anomaly_total', {
      type: 'token_reuse_detected',
    }),
    rateLimitViolations24h: getCounter('security_rate_limit_violation_total', {}),
    forbiddenAccess24h: getCounter('security_auth_anomaly_total', {
      type: 'forbidden_access',
    }),
    uploadAnomalies24h: getCounter('security_upload_anomaly_total', {}),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mask email address for safe logging.
 * user@example.com → u***@example.com
 * Prevents user enumeration from log aggregation systems.
 */
function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '[invalid-email]';
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return `${local[0] ?? 'x'}***@${domain}`;
}
