/**
 * Timing helpers for observability.
 * Lightweight wrappers around performance/date APIs.
 */

/**
 * High-resolution timer. Returns a stop function that returns elapsed ms.
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * Format milliseconds into a human-readable string.
 * e.g. 1500 → "1.50s" | 250 → "250ms"
 */
export function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

/**
 * Return true if the elapsed duration exceeds the given threshold.
 */
export function isSlowRequest(durationMs: number, thresholdMs = 500): boolean {
  return durationMs > thresholdMs;
}

/**
 * Classify a response time into a performance bucket.
 */
export type PerformanceBucket = 'fast' | 'normal' | 'slow' | 'critical';

export function classifyResponseTime(ms: number): PerformanceBucket {
  if (ms < 100) return 'fast';
  if (ms < 500) return 'normal';
  if (ms < 2000) return 'slow';
  return 'critical';
}
