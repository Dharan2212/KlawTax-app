/**
 * Request tracing middleware.
 * Attaches a high-resolution start timestamp to every request and records
 * end-of-request HTTP metrics + performance classification.
 *
 * Must run AFTER requestIdMiddleware.
 * The _startedAt field is declared in src/types/index.ts global augmentation.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { recordHttpRequest } from '../utils/metrics/appMetrics';
import { classifyResponseTime } from '../utils/observability/timing';

// Ensure the global _startedAt augmentation is loaded (declared in types/index.ts)
import '../types/index';

/**
 * Stamps a high-resolution start time on each request and records end-of-request
 * HTTP metrics and performance classification.
 */
export function requestTracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req._startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - (req._startedAt ?? Date.now());
    const bucket = classifyResponseTime(durationMs);
    const route = req.route?.path as string | undefined;

    // Record in-memory metrics (always — used by /diagnostics)
    recordHttpRequest(req.method, route ?? req.path, res.statusCode, durationMs);

    // In production: only log slow or error responses to keep log volume manageable.
    // In development: log everything at debug level for visibility.
    const isProduction = process.env['NODE_ENV'] === 'production';

    if (
      !isProduction ||
      bucket === 'slow' ||
      bucket === 'critical' ||
      res.statusCode >= 400
    ) {
      const logMethod =
        res.statusCode >= 500 ? 'error' :
        res.statusCode >= 400 ? 'warn' :
        'debug';

      const requestId = req.headers['x-request-id'] as string | undefined;

      logger[logMethod]('[RequestTrace]', {
        requestId,
        method: req.method,
        path: req.path,
        ...(route ? { route } : {}),
        status: res.statusCode,
        durationMs,
        performanceBucket: bucket,
      });
    }
  });

  next();
}
