/**
 * Extended health module.
 * Provides sub-routes mounted alongside the base /health endpoint.
 *
 * Route map (all mounted under /api/v1/health):
 *   GET /live          — Kubernetes liveness probe (process alive?)
 *   GET /ready         — Kubernetes readiness probe (DB connected?)
 *   GET /diagnostics   — Full operational diagnostic view (Admin only)
 *
 * The base GET /health is handled by src/routes/health.ts (existing).
 * This router ONLY adds /live, /ready, and /diagnostics to avoid conflicts.
 */

import { Router, Request, Response } from 'express';
import { getDatabaseHealthStatus } from '../../config/db';
import { getConfig } from '../../config/env';
import { collectMetrics } from '../../utils/metrics/metricsStore';
import { getSecurityEventSummary } from '../../utils/securityMonitoring/securityMonitor';
import { authenticate } from '../../middlewares/auth';
import { allowRoles } from '../../middlewares/rbac';
import { Role } from '../../utils/permissions';

// ─── Types ────────────────────────────────────────────────────────────────────

type ServiceStatus = 'ok' | 'degraded' | 'not_configured' | 'error';
type OverallStatus = 'ok' | 'degraded' | 'error';

interface ServiceCheck {
  status: ServiceStatus;
  detail?: string;
}

interface DiagnosticsResponse {
  status: OverallStatus;
  uptime: number;
  version: string;
  nodeVersion: string;
  environment: string;
  timestamp: string;
  checks: {
    database: ServiceCheck;
    cache: ServiceCheck;
    storage: ServiceCheck;
    email: ServiceCheck;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
  };
  security: ReturnType<typeof getSecurityEventSummary>;
  metrics: ReturnType<typeof collectMetrics>;
}

// ─── Service Checks ───────────────────────────────────────────────────────────

function getDatabaseCheck(): ServiceCheck {
  return { status: getDatabaseHealthStatus() };
}

function getCacheCheck(): ServiceCheck {
  if (!getConfig().REDIS_URL) {
    return { status: 'not_configured', detail: 'REDIS_URL not set — using in-memory cache' };
  }
  return { status: 'ok' };
}

function getStorageCheck(): ServiceCheck {
  if (!getConfig().AWS_S3_BUCKET) {
    return { status: 'not_configured', detail: 'AWS_S3_BUCKET not configured' };
  }
  return { status: 'ok' };
}

function getEmailCheck(): ServiceCheck {
  if (!process.env['EMAIL_SMTP_HOST']) {
    return { status: 'not_configured', detail: 'EMAIL_SMTP_HOST not configured' };
  }
  return { status: 'ok' };
}

function computeOverallStatus(checks: DiagnosticsResponse['checks']): OverallStatus {
  if (checks.database.status === 'error') return 'error';
  if (checks.database.status === 'degraded' || checks.cache.status === 'error') return 'degraded';
  return 'ok';
}

function getMemoryUsage(): DiagnosticsResponse['memory'] {
  const mem = process.memoryUsage();
  const toMb = (b: number) => Math.round((b / 1024 / 1024) * 10) / 10;
  return {
    heapUsedMb: toMb(mem.heapUsed),
    heapTotalMb: toMb(mem.heapTotal),
    rssMb: toMb(mem.rss),
    externalMb: toMb(mem.external),
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router = Router();

/**
 * GET /health/live
 * Kubernetes-style liveness probe.
 * Returns 200 as long as the Node.js process is running.
 * Never checks external dependencies — if the process is alive, it's alive.
 */
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({ alive: true, timestamp: new Date().toISOString() });
});

/**
 * GET /health/ready
 * Kubernetes-style readiness probe.
 * Returns 200 only when the primary database is connected and queries can be served.
 * Load balancers stop routing traffic to instances that return 503 here.
 */
router.get('/ready', (_req: Request, res: Response): void => {
  const dbStatus = getDatabaseHealthStatus();

  if (dbStatus === 'ok') {
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
    return;
  }

  res.status(503).json({
    ready: false,
    reason: 'Primary database not connected',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/diagnostics
 * Full operational diagnostic view.
 * Admin only — contains internal system state, memory usage, security counters.
 */
router.get(
  '/diagnostics',
  authenticate,
  allowRoles(Role.Admin),
  (_req: Request, res: Response): void => {
    const checks: DiagnosticsResponse['checks'] = {
      database: getDatabaseCheck(),
      cache: getCacheCheck(),
      storage: getStorageCheck(),
      email: getEmailCheck(),
    };

    const body: DiagnosticsResponse = {
      status: computeOverallStatus(checks),
      uptime: Math.floor(process.uptime()),
      version: process.env['npm_package_version'] ?? '1.0.0',
      nodeVersion: process.version,
      environment: getConfig().NODE_ENV,
      timestamp: new Date().toISOString(),
      checks,
      memory: getMemoryUsage(),
      security: getSecurityEventSummary(),
      metrics: collectMetrics(),
    };

    res.status(200).json(body);
  }
);

export { router as extendedHealthRouter };
