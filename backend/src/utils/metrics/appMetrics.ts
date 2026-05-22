/**
 * Application-specific metrics helpers.
 * Named wrappers around the generic metricsStore for common KlawTax events.
 */

import { incrementCounter, recordTiming } from './metricsStore';

// ─── HTTP Metrics ─────────────────────────────────────────────────────────────

export function recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number): void {
  incrementCounter('http_requests_total', {
    method,
    route: normalizeRoute(route),
    status: String(statusCode),
  });
  recordTiming('http_request_duration_ms', durationMs);

  if (statusCode >= 500) {
    incrementCounter('http_errors_5xx_total', { route: normalizeRoute(route) });
  } else if (statusCode >= 400) {
    incrementCounter('http_errors_4xx_total', { route: normalizeRoute(route) });
  }
}

// ─── Auth Metrics ─────────────────────────────────────────────────────────────

export function recordAuthSuccess(role: string): void {
  incrementCounter('auth_success_total', { role });
}

export function recordAuthFailure(reason: string): void {
  incrementCounter('auth_failure_total', { reason });
}

export function recordTokenRefresh(): void {
  incrementCounter('auth_token_refresh_total', {});
}

export function recordAccountLockout(): void {
  incrementCounter('auth_account_lockout_total', {});
}

// ─── Rate Limit Metrics ───────────────────────────────────────────────────────

export function recordRateLimitHit(route: string): void {
  incrementCounter('rate_limit_hit_total', { route: normalizeRoute(route) });
}

// ─── Webhook Metrics ──────────────────────────────────────────────────────────

export function recordWebhookReceived(eventType: string): void {
  incrementCounter('webhook_received_total', { event_type: eventType });
}

export function recordWebhookProcessed(eventType: string, success: boolean): void {
  incrementCounter('webhook_processed_total', {
    event_type: eventType,
    status: success ? 'success' : 'failure',
  });
}

export function recordWebhookRetry(): void {
  incrementCounter('webhook_retry_total', {});
}

// ─── Job Metrics ──────────────────────────────────────────────────────────────

export function recordJobExecution(jobName: string, success: boolean, durationMs: number): void {
  incrementCounter('job_execution_total', {
    job: jobName,
    status: success ? 'success' : 'failure',
  });
  recordTiming(`job_duration_ms.${jobName}`, durationMs);
}

// ─── Export Metrics ───────────────────────────────────────────────────────────

export function recordExportJob(exportType: string, success: boolean): void {
  incrementCounter('export_job_total', {
    export_type: exportType,
    status: success ? 'success' : 'failure',
  });
}

// ─── Cache Metrics ────────────────────────────────────────────────────────────

export function recordCacheHit(cacheKey: string): void {
  incrementCounter('cache_hit_total', { key_prefix: extractKeyPrefix(cacheKey) });
}

export function recordCacheMiss(cacheKey: string): void {
  incrementCounter('cache_miss_total', { key_prefix: extractKeyPrefix(cacheKey) });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeRoute(route: string): string {
  // Replace ObjectId-like segments to avoid high-cardinality labels
  return route
    .replace(/\/[0-9a-f]{24}/gi, '/:id')
    .replace(/\/\d+/g, '/:num');
}

function extractKeyPrefix(key: string): string {
  return key.split(':')[0] ?? key;
}
