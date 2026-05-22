/**
 * Telemetry hook infrastructure.
 * Provider-agnostic error and event capture. Designed to be backed by
 * Sentry / DataDog / NewRelic by registering a provider via registerProvider().
 *
 * In production without a provider registered, events are logged to the
 * structured logger. Swap the provider at startup without touching call sites.
 */

import { logger } from '../logger';
import { sanitizeError } from '../observability/logSanitizer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TelemetryContext {
  requestId?: string;
  correlationId?: string;
  userId?: string;
  role?: string;
  route?: string;
  method?: string;
  [key: string]: unknown;
}

export interface TelemetryProvider {
  captureError(err: Error, context: TelemetryContext): void;
  captureMessage(message: string, level: 'info' | 'warning' | 'error', context: TelemetryContext): void;
  captureEvent(name: string, data: Record<string, unknown>, context: TelemetryContext): void;
}

// ─── Default (logger-backed) Provider ────────────────────────────────────────

const defaultProvider: TelemetryProvider = {
  captureError(err, ctx) {
    logger.error('[Telemetry] Error captured', {
      ...ctx,
      ...sanitizeError(err),
    });
  },
  captureMessage(message, level, ctx) {
    if (level === 'error') {
      logger.error(`[Telemetry] ${message}`, ctx);
    } else if (level === 'warning') {
      logger.warn(`[Telemetry] ${message}`, ctx);
    } else {
      logger.info(`[Telemetry] ${message}`, ctx);
    }
  },
  captureEvent(name, data, ctx) {
    logger.info(`[Telemetry] Event: ${name}`, { ...ctx, ...data });
  },
};

// ─── Provider Registry ────────────────────────────────────────────────────────

let _provider: TelemetryProvider = defaultProvider;

/**
 * Register an external telemetry provider (e.g. Sentry).
 * Call this once at application startup before the first request is served.
 */
export function registerTelemetryProvider(provider: TelemetryProvider): void {
  _provider = provider;
  logger.info('[Telemetry] External provider registered');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Capture an unhandled or unexpected error with request context attached.
 */
export function captureError(err: unknown, context: TelemetryContext = {}): void {
  const error = err instanceof Error ? err : new Error(String(err));
  try {
    _provider.captureError(error, context);
  } catch {
    // Telemetry must never crash the application
    logger.warn('[Telemetry] Provider threw during captureError — falling back to logger');
    logger.error('[Telemetry] Fallback error capture', sanitizeError(error));
  }
}

/**
 * Capture a diagnostic message at a given severity.
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context: TelemetryContext = {}
): void {
  try {
    _provider.captureMessage(message, level, context);
  } catch {
    logger.warn('[Telemetry] Provider threw during captureMessage');
  }
}

/**
 * Capture a named application event (e.g. payment.captured, export.failed).
 */
export function captureEvent(
  name: string,
  data: Record<string, unknown> = {},
  context: TelemetryContext = {}
): void {
  try {
    _provider.captureEvent(name, data, context);
  } catch {
    logger.warn('[Telemetry] Provider threw during captureEvent');
  }
}
