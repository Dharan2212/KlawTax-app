/**
 * Lightweight in-memory metrics store.
 * Provider-agnostic — designed to be swapped for Prometheus/OpenTelemetry later.
 *
 * All operations are synchronous and O(1). No external dependencies.
 *
 * Bounded growth protection:
 *  - Counter map is capped at MAX_COUNTERS entries; oldest entries evicted first.
 *  - Timing map is capped at MAX_TIMINGS entries.
 *  - A periodic cleanup removes entries not updated in the last 24 hours.
 */

// ─── Bounds ───────────────────────────────────────────────────────────────────

const MAX_COUNTERS = 500;
const MAX_TIMINGS = 200;
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CounterMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  updatedAt: Date;
}

export interface TimingMetric {
  name: string;
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  updatedAt: Date;
}

export interface MetricsSnapshot {
  counters: CounterMetric[];
  timings: TimingMetric[];
  collectedAt: string;
  uptimeSeconds: number;
}

// ─── Internal Store ───────────────────────────────────────────────────────────

const counters = new Map<string, CounterMetric>();
const timings = new Map<string, TimingMetric>();

function counterKey(name: string, labels: Record<string, string>): string {
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
  return `${name}{${labelStr}}`;
}

function evictOldest<V>(map: Map<string, V>, cap: number): void {
  if (map.size < cap) return;
  // Delete the first (oldest insertion order) entry
  const firstKey = map.keys().next().value;
  if (firstKey !== undefined) map.delete(firstKey);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
// Periodically remove stale entries to prevent memory accumulation over long
// process lifetimes. unref() ensures this never keeps the process alive.

setInterval(() => {
  const staleThreshold = Date.now() - STALE_THRESHOLD_MS;
  for (const [key, entry] of counters) {
    if (entry.updatedAt.getTime() < staleThreshold) counters.delete(key);
  }
  for (const [key, entry] of timings) {
    if (entry.updatedAt.getTime() < staleThreshold) timings.delete(key);
  }
}, 60 * 60 * 1000).unref(); // run every hour

// ─── Counters ─────────────────────────────────────────────────────────────────

/**
 * Increment a named counter by delta (default 1).
 * New counter entries are created if they don't exist.
 * Oldest entry evicted if the store is at capacity.
 */
export function incrementCounter(
  name: string,
  labels: Record<string, string> = {},
  delta = 1
): void {
  const key = counterKey(name, labels);
  const existing = counters.get(key);

  if (existing) {
    existing.value += delta;
    existing.updatedAt = new Date();
  } else {
    evictOldest(counters, MAX_COUNTERS);
    counters.set(key, { name, value: delta, labels, updatedAt: new Date() });
  }
}

/**
 * Read current value of a counter. Returns 0 if not found.
 */
export function getCounter(name: string, labels: Record<string, string> = {}): number {
  return counters.get(counterKey(name, labels))?.value ?? 0;
}

// ─── Timings ──────────────────────────────────────────────────────────────────

/**
 * Record a timing observation (milliseconds).
 * Maintains running min, max, avg, and total without storing raw observations.
 */
export function recordTiming(name: string, ms: number): void {
  const existing = timings.get(name);

  if (existing) {
    existing.count += 1;
    existing.totalMs += ms;
    existing.minMs = Math.min(existing.minMs, ms);
    existing.maxMs = Math.max(existing.maxMs, ms);
    existing.avgMs = existing.totalMs / existing.count;
    existing.updatedAt = new Date();
  } else {
    evictOldest(timings, MAX_TIMINGS);
    timings.set(name, {
      name,
      count: 1,
      totalMs: ms,
      minMs: ms,
      maxMs: ms,
      avgMs: ms,
      updatedAt: new Date(),
    });
  }
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

/**
 * Collect a full snapshot of all recorded metrics.
 * Suitable for the /health/diagnostics endpoint or a future /metrics endpoint.
 */
export function collectMetrics(): MetricsSnapshot {
  return {
    counters: Array.from(counters.values()),
    timings: Array.from(timings.values()),
    collectedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}

/**
 * Reset all metrics. Useful for tests or explicit rolling-window resets.
 */
export function resetMetrics(): void {
  counters.clear();
  timings.clear();
}
