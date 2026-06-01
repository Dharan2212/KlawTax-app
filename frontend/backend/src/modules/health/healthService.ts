/**
 * KlawTax Health Service
 *
 * Provides structured health check data for all health endpoints.
 * Designed for use by load balancers, uptime monitors, and CI/CD pipelines.
 */

import { getDatabaseHealthStatus } from '../../config/db';
import { getConfig } from '../../config/env';
import { getRateLimitStoreSize } from '../../middlewares/rateLimit';


// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceStatus = 'ok' | 'degraded' | 'not_configured' | 'error';
export type OverallStatus = 'ok' | 'degraded' | 'error';

export interface SystemChecks {
  database: 'ok' | 'error';
  cache: ServiceStatus;
  rateLimitStore: 'ok';
}

export interface HealthResponse {
  status: OverallStatus;
  uptime: number;
  version: string;
  environment: string;
  checks: SystemChecks;
  timestamp: string;
}

export interface ReadinessResponse {
  ready: boolean;
  checks: {
    database: 'ok' | 'error';
  };
  timestamp: string;
}

export interface LivenessResponse {
  alive: boolean;
  uptime: number;
  timestamp: string;
}

export interface DiagnosticsResponse {
  status: OverallStatus;
  uptime: number;
  version: string;
  environment: string;
  nodeVersion: string;
  memoryUsage: {
    rss: string;
    heapUsed: string;
    heapTotal: string;
    external: string;
  };
  checks: SystemChecks;
  rateLimitStoreSize: number;
  timestamp: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function bytesToMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function deriveOverallStatus(checks: SystemChecks): OverallStatus {
  if (checks.database === 'error') return 'error';
  if (checks.cache === 'degraded' || checks.cache === 'error') return 'degraded';
  return 'ok';
}

// ─── Health Builders ──────────────────────────────────────────────────────────

export function buildSystemChecks(): SystemChecks {
  const cfg = getConfig();
  const dbStatus = getDatabaseHealthStatus();
  const cacheStatus: ServiceStatus = cfg.REDIS_URL ? 'ok' : 'not_configured';

  return {
    database: dbStatus,
    cache: cacheStatus,
    rateLimitStore: 'ok',
  };
}

export function buildHealthResponse(): {
  body: HealthResponse;
  httpStatus: 200 | 207 | 503;
} {
  const checks = buildSystemChecks();
  const status = deriveOverallStatus(checks);
  const cfg = getConfig();

  const body: HealthResponse = {
    status,
    uptime: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: cfg.NODE_ENV,
    checks,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = status === 'ok' ? 200 : status === 'degraded' ? 207 : 503;

  return { body, httpStatus };
}

export function buildReadinessResponse(): {
  body: ReadinessResponse;
  httpStatus: 200 | 503;
} {
  const dbStatus = getDatabaseHealthStatus();
  const ready = dbStatus === 'ok';

  const body: ReadinessResponse = {
    ready,
    checks: { database: dbStatus },
    timestamp: new Date().toISOString(),
  };

  return { body, httpStatus: ready ? 200 : 503 };
}

export function buildLivenessResponse(): LivenessResponse {
  return {
    alive: true,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

export function buildDiagnosticsResponse(): {
  body: DiagnosticsResponse;
  httpStatus: 200 | 207 | 503;
} {
  const checks = buildSystemChecks();
  const status = deriveOverallStatus(checks);
  const cfg = getConfig();
  const mem = process.memoryUsage();

  const body: DiagnosticsResponse = {
    status,
    uptime: Math.floor(process.uptime()),
    version: process.env['npm_package_version'] ?? '1.0.0',
    environment: cfg.NODE_ENV,
    nodeVersion: process.version,
    memoryUsage: {
      rss: bytesToMb(mem.rss),
      heapUsed: bytesToMb(mem.heapUsed),
      heapTotal: bytesToMb(mem.heapTotal),
      external: bytesToMb(mem.external),
    },
    checks,
    rateLimitStoreSize: getRateLimitStoreSize(),
    timestamp: new Date().toISOString(),
  };

  const httpStatus = status === 'ok' ? 200 : status === 'degraded' ? 207 : 503;

  return { body, httpStatus };
}
