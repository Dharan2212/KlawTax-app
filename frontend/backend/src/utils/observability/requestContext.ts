/**
 * Request context helpers.
 * Extracts, builds, and propagates typed request metadata for use across
 * middleware, services, and logging layers.
 */

import { Request } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RequestMetadata {
  requestId: string;
  method: string;
  path: string;
  route?: string;
  ip: string;
  userAgent: string;
  userId?: string;
  role?: string;
  clientProfileId?: string;
  employeeProfileId?: string;
  startedAt: number; // Date.now()
}

// ─── Extraction ───────────────────────────────────────────────────────────────

/**
 * Extract standard metadata from any Express request.
 * Works for both authenticated and public requests.
 */
export function extractRequestMetadata(req: Request): RequestMetadata {
  const authReq = req as AuthenticatedRequest;

  const requestId =
    (req.headers['x-request-id'] as string | undefined) ?? 'unknown';

  const ip =
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket?.remoteAddress ??
    'unknown';

  const userAgent = req.headers['user-agent'] ?? 'unknown';

  const meta: RequestMetadata = {
    requestId,
    method: req.method,
    path: req.path,
    route: req.route?.path as string | undefined,
    ip,
    userAgent,
    startedAt: Date.now(),
  };

  // Attach auth context if authenticated
  if (authReq.auth) {
    meta.userId = authReq.auth.userId;
    meta.role = authReq.auth.role;
    meta.clientProfileId = authReq.auth.clientProfileId;
    meta.employeeProfileId = authReq.auth.employeeProfileId;
  }

  return meta;
}

/**
 * Compute elapsed milliseconds from a captured startedAt timestamp.
 */
export function elapsedMs(startedAt: number): number {
  return Date.now() - startedAt;
}

/**
 * Build a safe loggable summary from request metadata.
 * Excludes full user-agent to keep log payloads compact.
 */
export function buildRequestLogFields(meta: RequestMetadata): Record<string, unknown> {
  return {
    requestId: meta.requestId,
    method: meta.method,
    path: meta.path,
    ...(meta.route ? { route: meta.route } : {}),
    ip: meta.ip,
    ...(meta.userId ? { userId: meta.userId } : {}),
    ...(meta.role ? { role: meta.role } : {}),
  };
}
