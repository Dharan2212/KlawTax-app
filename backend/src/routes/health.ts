/**
 * KlawTax Health Base Route
 *
 * Handles: GET /api/v1/health
 * Returns the full health summary response (status, uptime, service checks).
 *
 * Sub-routes (/live, /ready, /diagnostics) are mounted from the health module
 * directly in app.ts via extendedHealthRouter.
 */

import { Router, Request, Response } from 'express';
import { getDatabaseHealthStatus } from '../config/db';
import { getConfig } from '../config/env';

const router = Router();

type ServiceStatus = 'ok' | 'not_configured' | 'error';
type OverallStatus = 'ok' | 'degraded' | 'error';

interface HealthResponse {
  status: OverallStatus;
  uptime: number;
  version: string;
  environment: string;
  timestamp: string;
  checks: {
    database: { status: ServiceStatus };
    cache: { status: ServiceStatus; detail?: string };
    storage: { status: ServiceStatus; detail?: string };
  };
}

/**
 * GET /api/v1/health
 * Primary health summary.
 * Returns 200 (ok), 207 (degraded), or 503 (error).
 */
router.get('/', (_req: Request, res: Response): void => {
  const cfg = getConfig();

  const dbStatus = getDatabaseHealthStatus();

  // Cast to ServiceStatus so TS does not narrow to literal-only types
  const cacheStatus = (cfg.REDIS_URL ? 'ok' : 'not_configured') as ServiceStatus;
  const storageStatus = (cfg.AWS_S3_BUCKET ? 'ok' : 'not_configured') as ServiceStatus;

  let overallStatus: OverallStatus = 'ok';
  if (dbStatus === 'error') {
    overallStatus = 'error';
  } else if (cacheStatus === 'error' || storageStatus === 'error') {
    overallStatus = 'degraded';
  }

  const body: HealthResponse = {
    status: overallStatus,
    uptime: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: cfg.NODE_ENV,
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: dbStatus },
      cache: {
        status: cacheStatus,
        ...(cacheStatus === 'not_configured'
          ? { detail: 'REDIS_URL not set — in-memory cache active' }
          : {}),
      },
      storage: {
        status: storageStatus,
        ...(storageStatus === 'not_configured'
          ? { detail: 'AWS_S3_BUCKET not configured' }
          : {}),
      },
    },
  };

  const httpStatus =
    overallStatus === 'error' ? 503 : overallStatus === 'degraded' ? 207 : 200;
  res.status(httpStatus).json(body);
});

export { router as healthRouter };
