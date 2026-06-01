/**
 * KlawTax Cache Abstraction
 *
 * A minimal key-value cache interface that:
 *   • Uses an in-memory Map in development / when Redis is unavailable
 *   • Is designed for zero-friction swap to a Redis client in Phase 2
 *
 * The interface is intentionally thin — only the methods the application
 * actually needs exist here. No unused methods are exported.
 *
 * Phase 2 upgrade path:
 *   Replace the `store` Map with an ioredis client and mirror the same
 *   async method signatures. No call-site changes required.
 */

import { logger } from './logger';

// ─── Internal Store ───────────────────────────────────────────────────────────

interface CacheEntry {
  value: unknown;
  expiresAt: number; // unix ms timestamp
}

const store = new Map<string, CacheEntry>();

function hasExpired(entry: CacheEntry): boolean {
  return Date.now() > entry.expiresAt;
}

// ─── Public Cache API ─────────────────────────────────────────────────────────

export const cache = {
  /**
   * Retrieve a cached value.
   * Returns null on cache miss or if the entry has expired.
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (hasExpired(entry)) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  },

  /**
   * Store a value with a TTL (time-to-live) in seconds.
   * Default TTL: 300 seconds (5 minutes).
   */
  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1_000,
    });
  },

  /**
   * Delete a specific cache key.
   */
  async del(key: string): Promise<void> {
    store.delete(key);
  },

  /**
   * Delete all keys that start with the given prefix.
   * Used for bulk invalidation (e.g. all service cache entries).
   */
  async delByPrefix(prefix: string): Promise<void> {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  },

  /**
   * Get-or-set: returns the cached value if present and not expired,
   * otherwise calls the factory, caches the result, and returns it.
   *
   * This is the primary cache pattern used throughout the application.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await cache.set<T>(key, value, ttlSeconds);
    return value;
  },

  /**
   * Flush the entire cache store.
   * Intended for use in tests only.
   */
  async flush(): Promise<void> {
    store.clear();
    logger.debug('[cache] Store flushed');
  },

  /**
   * Liveness ping for health checks.
   * For the in-memory implementation this always succeeds.
   * When replaced with Redis, this calls `client.ping()`.
   */
  async ping(): Promise<boolean> {
    try {
      const testKey = '__health_ping__';
      await cache.set(testKey, 1, 5);
      const result = await cache.get<number>(testKey);
      await cache.del(testKey);
      return result === 1;
    } catch {
      return false;
    }
  },
};

// ─── TTL Constants ────────────────────────────────────────────────────────────

/** Named TTL constants for consistent cache duration management. */
export const CACHE_TTL = {
  /** Public service list — changes rarely; 1 hour is safe */
  SERVICE_LIST: 60 * 60,
  /** Service detail — same lifecycle as list */
  SERVICE_DETAIL: 60 * 60,
  /** Featured services — hero card; updated infrequently */
  FEATURED_SERVICES: 60 * 60,
  /** Admin dashboard aggregations — needs to be fresh */
  ADMIN_DASHBOARD: 5 * 60,
  /** System settings — balance between freshness and query cost */
  SYSTEM_SETTINGS: 5 * 60,
} as const;

// ─── Cache Key Builders ────────────────────────────────────────────────────────

/**
 * Centralised key construction.
 * Prevents typos and makes cache invalidation patterns obvious.
 */
export const cacheKey = {
  serviceList:       (params: string)  => `services:list:${params}`,
  serviceDetail:     (slug: string)    => `services:detail:${slug}`,
  featuredServices:  ()                => 'services:featured',
  systemSettings:    ()                => 'system:settings',
  adminDashboard:    ()                => 'dashboard:admin',
  employeeDashboard: (userId: string)  => `dashboard:employee:${userId}`,
  notifCount:        (userId: string)  => `notif:count:${userId}`,
};
