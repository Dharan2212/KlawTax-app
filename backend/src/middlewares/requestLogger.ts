/**
 * Request logging middleware.
 * Emits one structured access-log entry per request (on response finish).
 *
 * Safety guarantees:
 *  - Never logs Authorization, Cookie, Razorpay signatures, or API keys.
 *  - Truncates user-agent to 120 chars to prevent log flooding.
 *  - Skips health-probe endpoints in production to reduce noise.
 *  - Query params are only included in non-production environments.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Sensitive headers — their values are replaced with [REDACTED]
const REDACTED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-razorpay-signature',
  'x-webhook-secret',
  'proxy-authorization',
]);

// Paths skipped entirely in production (probes — polled every 60s)
const PROBE_PATHS = new Set([
  '/api/v1/health',
  '/api/v1/health/live',
  '/api/v1/health/ready',
]);

/**
 * Build a safe header map — redacts sensitive values in-place.
 */
function safeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = REDACTED_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }
  return result;
}

/**
 * Structured request logger.
 * Attaches to res.finish so status code and duration are captured together.
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip health-probe paths in production
  if (process.env['NODE_ENV'] === 'production' && PROBE_PATHS.has(req.path)) {
    return next();
  }

  // Capture start time — use the one set by requestTracingMiddleware if available
  const startedAt = req._startedAt ?? Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const requestId = req.headers['x-request-id'] as string | undefined;

    // IP: prefer X-Forwarded-For (set by reverse proxy), fall back to socket
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket?.remoteAddress ??
      'unknown';

    const logLevel =
      res.statusCode >= 500 ? 'error' :
      res.statusCode >= 400 ? 'warn' :
      'info';

    const entry: Record<string, unknown> = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip,
      // Truncated to avoid bloating logs with long browser UA strings
      userAgent: (req.headers['user-agent'] ?? 'unknown').slice(0, 120),
    };

    // Development-only extras
    if (process.env['NODE_ENV'] !== 'production') {
      const query = req.query as Record<string, unknown>;
      if (Object.keys(query).length > 0) {
        entry['query'] = query;
      }
      // Include sanitized headers only on server errors (useful for debugging)
      if (res.statusCode >= 500) {
        entry['headers'] = safeHeaders(req.headers as Record<string, unknown>);
      }
    }

    logger[logLevel]('[AccessLog]', entry);
  });

  next();
}
