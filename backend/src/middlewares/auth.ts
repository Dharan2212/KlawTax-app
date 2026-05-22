import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Role, PermissionValue, resolvePermissions } from '../utils/permissions';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';

// ─── Auth Context Types ───────────────────────────────────────────────────────

export interface AuthPayload {
  userId:        string;
  role:          Role;
  email:         string;
  permissions:   PermissionValue[];
  accountStatus: string;
  clientProfileId?:   string;
  employeeProfileId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthPayload;
}

export interface TokenVerifier {
  verify(token: string): Promise<AuthPayload>;
}

let _tokenVerifier: TokenVerifier | null = null;

export function registerTokenVerifier(verifier: TokenVerifier): void {
  _tokenVerifier = verifier;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!_tokenVerifier) {
      logger.warn('[Auth] Token verifier not registered');
      throw new UnauthorizedError('Authentication service not initialised');
    }
    const token = extractBearerToken(req);
    if (!token) throw new UnauthorizedError('No authentication token provided');
    const payload = await _tokenVerifier.verify(token);
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch (err) { next(err); }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (_tokenVerifier) {
      const token = extractBearerToken(req);
      if (token) {
        const payload = await _tokenVerifier.verify(token);
        (req as AuthenticatedRequest).auth = payload;
      }
    }
  } catch { /* silent */ }
  next();
}

export function getAuthContext(req: Request): AuthPayload {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth) throw new UnauthorizedError('Request is not authenticated');
  return auth;
}

export function getAuthUserId(req: Request): Types.ObjectId {
  return new Types.ObjectId(getAuthContext(req).userId);
}

export function getClientProfileId(req: Request): Types.ObjectId {
  const auth = getAuthContext(req);
  if (!auth.clientProfileId) throw new ForbiddenError('This operation requires a client account');
  return new Types.ObjectId(auth.clientProfileId);
}

export function getEmployeeProfileId(req: Request): Types.ObjectId {
  const auth = getAuthContext(req);
  if (!auth.employeeProfileId) throw new ForbiddenError('This operation requires an employee account');
  return new Types.ObjectId(auth.employeeProfileId);
}

export function buildAuthPayload(params: {
  userId:             string;
  role:               Role;
  email:              string;
  accountStatus:      string;
  additionalPermissions?: PermissionValue[];
  clientProfileId?:   string;
  employeeProfileId?: string;
}): Omit<AuthPayload, 'iat' | 'exp' | 'jti'> {
  return {
    userId:            params.userId,
    role:              params.role,
    email:             params.email,
    accountStatus:     params.accountStatus,
    permissions:       resolvePermissions(params.role, params.additionalPermissions),
    clientProfileId:   params.clientProfileId,
    employeeProfileId: params.employeeProfileId,
  };
}
