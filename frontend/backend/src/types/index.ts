import { Types } from 'mongoose';

// ─── ObjectId alias ───────────────────────────────────────────────────────────

export type ObjectId = Types.ObjectId;

// ─── Common Enums ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'employee' | 'client';

export type NodeEnv = 'development' | 'production' | 'test';

// ─── Authenticated Request Extension ─────────────────────────────────────────
// Populated by the authenticate middleware in middlewares/auth.ts.

export interface AuthPayload {
  userId: string;
  role: UserRole;
  email: string;
  clientProfileId?: string;
  employeeProfileId?: string;
  iat?: number;
  exp?: number;
}

// Augment Express Request to carry the auth payload and observability metadata
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      /**
       * High-resolution start timestamp (Date.now()) set by requestTracingMiddleware.
       * Used by requestLoggerMiddleware to compute request duration without a
       * second Date.now() call.
       */
      _startedAt?: number;
    }
  }
}

// ─── Common Service Response Types ───────────────────────────────────────────

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Sort Direction ───────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

// ─── Generic ID Param ─────────────────────────────────────────────────────────

export interface IdParam {
  id: string;
}
