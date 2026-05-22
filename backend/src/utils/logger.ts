import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// ─── Log Directory ────────────────────────────────────────────────────────────

const LOG_DIR = path.resolve(process.cwd(), 'logs');

// Ensure logs directory exists at module load time
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ─── Log Level ────────────────────────────────────────────────────────────────

const logLevel = (process.env['LOG_LEVEL'] ?? 'info') as string;

// ─── Formats ──────────────────────────────────────────────────────────────────

const { combine, timestamp, printf, colorize, errors, json, splat } = winston.format;

// Human-readable format for development console
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${ts} [${level}] ${message}${metaStr}${stackStr}`;
  })
);

// Structured JSON format for production
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  json()
);

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [];

const isProduction = process.env['NODE_ENV'] === 'production';
const isTest = process.env['NODE_ENV'] === 'test';

// Console transport
if (!isTest) {
  transports.push(
    new winston.transports.Console({
      format: isProduction ? prodFormat : devFormat,
      handleExceptions: true,
    })
  );
}

// File transports (always active — even in development)
// Combined log (all levels)
transports.push(
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',      // retain 14 days
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), json()),
  })
);

// Error-only log
transports.push(
  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '30d',      // retain 30 days for errors
    zippedArchive: true,
    format: combine(timestamp(), errors({ stack: true }), json()),
  })
);

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: logLevel,
  transports,
  exitOnError: false,  // Do not exit on handled exceptions
});

// ─── Convenience Stream for Morgan HTTP logging ───────────────────────────────

export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trimEnd());
  },
};
