import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/env';
import { Role, PermissionValue } from '../utils/permissions';
import { TOKEN_TTL } from '../constants/auth';
import { AppError } from '../middlewares/errorHandler';

// ─── Payload Types ────────────────────────────────────────────────────────────

/**
 * Claims embedded in an access token.
 * Kept minimal — only what middleware needs to authorise a request.
 */
export interface AccessTokenPayload {
  sub:           string;          // userId
  role:          Role;
  email:         string;
  perms:         PermissionValue[];
  acctStatus:    string;          // accountStatus — compact claim name
  cpid?:         string;          // clientProfileId
  epid?:         string;          // employeeProfileId
  jti:           string;
  type:          'access';
  iat?:          number;
  exp?:          number;
}

/**
 * Claims embedded in a refresh token.
 * Contains the token family for rotation / reuse-attack detection.
 */
export interface RefreshTokenPayload {
  sub:    string;   // userId
  family: string;   // rotation family UUID
  jti:    string;   // JWT ID
  type:   'refresh';
}

// ─── Signing Helpers ──────────────────────────────────────────────────────────

function getSecrets(): { access: string; refresh: string } {
  const cfg = getConfig();
  return { access: cfg.JWT_SECRET, refresh: cfg.JWT_REFRESH_SECRET };
}

function parseExpiry(value: string): number {
  // Convert "15m" / "30d" to seconds for jwt.sign expiresIn
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return TOKEN_TTL.ACCESS_TOKEN_SECONDS;
  const [, n, unit] = match;
  const mul: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(n!, 10) * (mul[unit!] ?? 60);
}

// ─── Access Token ─────────────────────────────────────────────────────────────

export interface SignAccessTokenInput {
  userId:             string;
  role:               Role;
  email:              string;
  accountStatus:      string;
  permissions:        PermissionValue[];
  clientProfileId?:   string;
  employeeProfileId?: string;
}

export function signAccessToken(input: SignAccessTokenInput): { token: string; jti: string; expiresIn: number } {
  const { access } = getSecrets();
  const cfg = getConfig();
  const expiresIn = parseExpiry(cfg.JWT_ACCESS_EXPIRES_IN);
  const jti = uuidv4();

  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub:        input.userId,
    role:       input.role,
    email:      input.email,
    perms:      input.permissions,
    acctStatus: input.accountStatus,
    jti,
    type:       'access',
    ...(input.clientProfileId   ? { cpid: input.clientProfileId }   : {}),
    ...(input.employeeProfileId ? { epid: input.employeeProfileId } : {}),
  };

  const token = jwt.sign(payload, access, { expiresIn });
  return { token, jti, expiresIn };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const { access } = getSecrets();
  try {
    const decoded = jwt.verify(token, access) as AccessTokenPayload;
    if (decoded.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'TOKEN_INVALID');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid access token', 401, 'TOKEN_INVALID');
  }
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export function signRefreshToken(userId: string, family: string): { token: string; jti: string; expiresIn: number } {
  const { refresh } = getSecrets();
  const cfg = getConfig();
  const expiresIn = parseExpiry(cfg.JWT_REFRESH_EXPIRES_IN);
  const jti = uuidv4();

  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub:    userId,
    family,
    jti,
    type:   'refresh',
  };

  const token = jwt.sign(payload, refresh, { expiresIn });
  return { token, jti, expiresIn };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const { refresh } = getSecrets();
  try {
    const decoded = jwt.verify(token, refresh) as RefreshTokenPayload;
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'TOKEN_INVALID');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token has expired', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid refresh token', 401, 'TOKEN_INVALID');
  }
}

// ─── Expiry Date Helper ───────────────────────────────────────────────────────

/** Returns a Date that is `seconds` from now. */
export function expiryDate(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
