import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique request ID to every inbound request.
 * Honours any pre-existing X-Request-Id header (e.g. from a proxy or load balancer).
 * The ID is propagated in the response header so the client can reference it.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'] as string | undefined;
  const requestId = existingId && existingId.length > 0 ? existingId : randomUUID();

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
