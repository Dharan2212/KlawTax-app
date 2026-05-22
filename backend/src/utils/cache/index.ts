/**
 * KlawTax Cache Infrastructure
 *
 * Extended cache helpers built on top of src/utils/cache.ts.
 * Provides:
 *   - Dashboard-specific cache helpers with role isolation
 *   - Scoped invalidation patterns
 *   - Client-safe cache key helpers (no cross-user leakage)
 *   - List query caching helpers
 */

import { cache, CACHE_TTL, cacheKey } from '../cache';

// ─── Extended TTL Constants ───────────────────────────────────────────────────

export const EXTENDED_CACHE_TTL = {
  ...CACHE_TTL,
  /** Employee dashboard — per-user, 5 minutes */
  EMPLOYEE_DASHBOARD: 5 * 60,
  /** Client dashboard — per-user, 2 minutes (more dynamic) */
  CLIENT_DASHBOARD: 2 * 60,
  /** Notification unread count — 30 seconds (near-realtime) */
  NOTIFICATION_COUNT: 30,
  /** List queries (paginated) — 60 seconds */
  LIST_QUERY: 60,
  /** Support ticket list — 30 seconds */
  SUPPORT_LIST: 30,
  /** Invoice list — 60 seconds */
  INVOICE_LIST: 60,
} as const;

// ─── Extended Cache Keys ──────────────────────────────────────────────────────

export const extendedCacheKey = {
  ...cacheKey,
  clientDashboard: (clientId: string) => `dashboard:client:${clientId}`,
  projectList:     (userId: string, params: string) => `projects:list:${userId}:${params}`,
  leadList:        (params: string) => `leads:list:${params}`,
  supportList:     (userId: string, params: string) => `support:list:${userId}:${params}`,
  invoiceList:     (userId: string, params: string) => `invoices:list:${userId}:${params}`,
  documentList:    (projectId: string) => `documents:list:${projectId}`,
  approvalList:    (params: string) => `approvals:list:${params}`,
  exportStatus:    (jobId: string) => `export:status:${jobId}`,
};

// ─── Dashboard Cache Helpers ──────────────────────────────────────────────────

/**
 * Get or populate the admin dashboard cache.
 * Scoped to a single global key (admin sees aggregated data).
 */
export async function getOrSetAdminDashboard<T>(
  factory: () => Promise<T>
): Promise<T> {
  return cache.getOrSet<T>(
    cacheKey.adminDashboard(),
    factory,
    CACHE_TTL.ADMIN_DASHBOARD
  );
}

/**
 * Invalidate the admin dashboard cache.
 * Called on: project status change, payment receipt, new approval.
 */
export async function invalidateAdminDashboard(): Promise<void> {
  await cache.del(cacheKey.adminDashboard());
}

/**
 * Get or populate the employee dashboard cache.
 * Scoped per employee userId — no cross-user leakage.
 */
export async function getOrSetEmployeeDashboard<T>(
  userId: string,
  factory: () => Promise<T>
): Promise<T> {
  return cache.getOrSet<T>(
    cacheKey.employeeDashboard(userId),
    factory,
    EXTENDED_CACHE_TTL.EMPLOYEE_DASHBOARD
  );
}

/**
 * Invalidate the employee dashboard cache for a specific user.
 */
export async function invalidateEmployeeDashboard(userId: string): Promise<void> {
  await cache.del(cacheKey.employeeDashboard(userId));
}

/**
 * Get or populate the client dashboard cache.
 * Scoped per clientId — critical for security isolation.
 */
export async function getOrSetClientDashboard<T>(
  clientId: string,
  factory: () => Promise<T>
): Promise<T> {
  return cache.getOrSet<T>(
    extendedCacheKey.clientDashboard(clientId),
    factory,
    EXTENDED_CACHE_TTL.CLIENT_DASHBOARD
  );
}

/**
 * Invalidate the client dashboard cache for a specific client.
 */
export async function invalidateClientDashboard(clientId: string): Promise<void> {
  await cache.del(extendedCacheKey.clientDashboard(clientId));
}

// ─── Notification Count Cache ─────────────────────────────────────────────────

export async function getOrSetNotificationCount(
  userId: string,
  factory: () => Promise<number>
): Promise<number> {
  return cache.getOrSet<number>(
    cacheKey.notifCount(userId),
    factory,
    EXTENDED_CACHE_TTL.NOTIFICATION_COUNT
  );
}

export async function invalidateNotificationCount(userId: string): Promise<void> {
  await cache.del(cacheKey.notifCount(userId));
}

// ─── List Query Cache ─────────────────────────────────────────────────────────

/**
 * Generic list query cache helper.
 * Scoped by userId + serialized params to prevent cross-user leakage.
 */
export async function getOrSetListQuery<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds = EXTENDED_CACHE_TTL.LIST_QUERY
): Promise<T> {
  return cache.getOrSet<T>(key, factory, ttlSeconds);
}

// ─── Bulk Invalidation Helpers ────────────────────────────────────────────────

/**
 * Invalidate all project list caches for a user.
 */
export async function invalidateProjectListCache(userId: string): Promise<void> {
  await cache.delByPrefix(`projects:list:${userId}:`);
}

/**
 * Invalidate all lead list caches (admin-wide).
 */
export async function invalidateLeadListCache(): Promise<void> {
  await cache.delByPrefix('leads:list:');
}

/**
 * Invalidate all document caches for a project.
 */
export async function invalidateDocumentCache(projectId: string): Promise<void> {
  await cache.del(extendedCacheKey.documentList(projectId));
}

/**
 * Invalidate all service caches (called on service update).
 */
export async function invalidateServiceCache(): Promise<void> {
  await cache.delByPrefix('services:');
}

/**
 * Invalidate all invoice list caches for a user.
 */
export async function invalidateInvoiceListCache(userId: string): Promise<void> {
  await cache.delByPrefix(`invoices:list:${userId}:`);
}

// ─── System Settings Cache ────────────────────────────────────────────────────

export async function getOrSetSystemSettings<T>(
  factory: () => Promise<T>
): Promise<T> {
  return cache.getOrSet<T>(
    cacheKey.systemSettings(),
    factory,
    CACHE_TTL.SYSTEM_SETTINGS
  );
}

export async function invalidateSystemSettings(): Promise<void> {
  await cache.del(cacheKey.systemSettings());
}
