// ─── API ──────────────────────────────────────────────────────────────────────

export const API_PREFIX = '/api/v1';

export const API_VERSION = '1.0.0';

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ─── JWT ──────────────────────────────────────────────────────────────────────

export const JWT_ACCESS_TOKEN_EXPIRES = '15m';
export const JWT_REFRESH_TOKEN_EXPIRES = '30d';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;             // per window

// Auth-specific tighter limits
export const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;  // 1 hour
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 10;

// ─── File Upload ──────────────────────────────────────────────────────────────

export const MAX_UPLOAD_SIZE_MB = 5;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

// ─── Roles ────────────────────────────────────────────────────────────────────

export const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
} as const;

// ─── Status Codes ─────────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
