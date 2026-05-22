/**
 * Structured logger — production-grade, provider-agnostic.
 * Wraps Winston with correlation-ID support, module tagging, and safe
 * serialization. Exports the same `logger` and `httpLogStream` surface as
 * the original utils/logger.ts so existing imports keep working once
 * app.ts switches to this path.
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { sanitizeLogPayload } from '../observability/logSanitizer';

// ─── Log Directory ────────────────────────────────────────────────────────────

const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── Log Level ────────────────────────────────────────────────────────────────

const logLevel = (process.env['LOG_LEVEL'] ?? 'info') as string;

// ─── Formats ──────────────────────────────────────────────────────────────────

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const cleanMeta = sanitizeLogPayload(meta);
    const metaStr = Object.keys(cleanMeta).length ? ` ${JSON.stringify(cleanMeta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts as string} [${level}] ${message as string}${metaStr}${stackStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  // Sanitize before JSON serialization
  winston.format((info) => {
    const { level, message, timestamp: ts, stack, ...meta } = info;
    const clean = sanitizeLogPayload(meta as Record<string, unknown>);
    return { level, message, timestamp: ts, ...(stack ? { stack } : {}), ...clean };
  })(),
  json()
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [];
const isProduction = process.env['NODE_ENV'] === 'production';
const isTest = process.env['NODE_ENV'] === 'test';

if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: isProduction ? prodFormat : devFormat,
      handleExceptions: true,
    })
  );
}

transports.push(
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), json()),
  }),
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), json()),
  })
);

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,
});

// ─── Contextual Child Logger ──────────────────────────────────────────────────

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  role?: string;
  module?: string;
  [key: string]: unknown;
}

/**
 * Returns a child logger that always emits the provided context fields.
 * Use this inside request handlers for per-request tracing.
 */
export function createContextLogger(ctx: LogContext): winston.Logger {
  return logger.child(sanitizeLogPayload(ctx as Record<string, unknown>));
}

// ─── HTTP Stream for Morgan ───────────────────────────────────────────────────

export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trimEnd());
  },
};
