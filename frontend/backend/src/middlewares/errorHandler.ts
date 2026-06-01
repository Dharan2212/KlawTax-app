import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/env';

// ─── AppError Class ───────────────────────────────────────────────────────────

/**
 * Operational errors — known, expected failure cases.
 * These are surfaced to clients with structured responses.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// ─── Standard Error Constructors ─────────────────────────────────────────────

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests — please try again later') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

// ─── Response Shape ───────────────────────────────────────────────────────────

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  requestId?: string;
}

// ─── Mongoose / Known Library Errors ─────────────────────────────────────────

function normalizeLibraryError(err: unknown): AppError | null {
  if (!err || typeof err !== 'object') return null;

  const e = err as Record<string, unknown>;

  // Mongoose validation error
  if (e['name'] === 'ValidationError' && e['errors']) {
    const errors = e['errors'] as Record<string, { message: string }>;
    const details = Object.values(errors).map((ve) => ve.message);
    return new ValidationError('Validation failed', details);
  }

  // Mongoose duplicate key
  if (e['code'] === 11000) {
    const keyValue = e['keyValue'] as Record<string, unknown>;
    const field = Object.keys(keyValue ?? {})[0] ?? 'field';
    return new ConflictError(`A record with this ${field} already exists`);
  }

  // Mongoose cast error (bad ObjectId, etc.)
  if (e['name'] === 'CastError') {
    return new ValidationError(`Invalid value for field: ${e['path']}`);
  }

  // JWT errors (will be added when auth module is built)
  if (e['name'] === 'JsonWebTokenError') {
    return new UnauthorizedError('Invalid authentication token');
  }

  if (e['name'] === 'TokenExpiredError') {
    return new UnauthorizedError('Authentication token has expired');
  }

  return null;
}

// ─── Global Error Handler Middleware ─────────────────────────────────────────

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction // Must declare _next to satisfy Express 4-arg signature
): void {
  const requestId = req.headers['x-request-id'] as string | undefined;
  const isProduction = config.isProduction;

  // Try to normalize known library errors first
  const normalized = normalizeLibraryError(err);
  const appError = normalized ?? (err instanceof AppError ? err : null);

  if (appError) {
    // Known / operational error
    if (appError.statusCode >= 500) {
      logger.error('[ErrorHandler] Operational 5xx error', {
        errorCode: appError.errorCode,
        message: appError.message,
        statusCode: appError.statusCode,
        path: req.path,
        method: req.method,
        requestId,
        stack: appError.stack,
      });
    } else {
      logger.warn('[ErrorHandler] Operational 4xx error', {
        errorCode: appError.errorCode,
        message: appError.message,
        statusCode: appError.statusCode,
        path: req.path,
        method: req.method,
        requestId,
      });
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: appError.errorCode,
        message: appError.message,
        ...(appError.details !== undefined ? { details: appError.details } : {}),
        ...(!isProduction ? { stack: appError.stack } : {}),
      },
      ...(requestId ? { requestId } : {}),
    };

    res.status(appError.statusCode).json(response);
    return;
  }

  // Unknown / unexpected error — do not leak internals
  const unknownMessage = err instanceof Error ? err.message : 'Unknown error';
  const unknownStack = err instanceof Error ? err.stack : undefined;

  logger.error('[ErrorHandler] Unexpected error (non-operational)', {
    message: unknownMessage,
    path: req.path,
    method: req.method,
    requestId,
    stack: unknownStack,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred. Please try again or contact support.'
        : unknownMessage,
      ...(!isProduction && unknownStack ? { stack: unknownStack } : {}),
    },
    ...(requestId ? { requestId } : {}),
  };

  res.status(500).json(response);
}

// ─── Not Found Handler ────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}
