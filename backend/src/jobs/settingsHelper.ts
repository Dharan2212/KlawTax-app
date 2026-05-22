/**
 * Settings Helper
 *
 * Provides typed, cached reads of SystemSetting values for background jobs.
 * Falls back to safe defaults if a setting is missing or unreadable.
 */

import { SystemSetting } from '../models/systemSetting';
import { logger } from '../utils/logger';

// ─── In-Memory Cache (short TTL for job use) ──────────────────────────────────

const cache = new Map<string, { value: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  try {
    const setting = await SystemSetting.findOne({ key }).lean();
    const value = setting ? (setting.value as T) : defaultValue;
    cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  } catch (err) {
    logger.warn('[SettingsHelper] Failed to read setting — using default', { key, err });
    return defaultValue;
  }
}

/** Invalidate a cached setting by key. */
export function invalidateSetting(key: string): void {
  cache.delete(key);
}

/** Invalidate all cached settings. */
export function invalidateAllSettings(): void {
  cache.clear();
}

// ─── Typed Accessors ──────────────────────────────────────────────────────────

export const Settings = {
  /** Days without timeline activity before a project is flagged as stalled. Default: 7 */
  projectStallThresholdDays: () => getSetting<number>('project.stall_threshold_days', 7),

  /** Days overdue before escalating with urgent priority. Default: 3 */
  projectOverdueEscalationDays: () => getSetting<number>('project.overdue_escalation_days', 3),

  /** Days inactive before a lead is auto-archived. Default: 90 */
  leadAutoArchiveDays: () => getSetting<number>('lead.auto_archive_days', 90),

  /** Whether admin digest notifications are enabled. Default: true */
  adminDigestEnabled: () => getSetting<boolean>('notifications.admin_digest_enabled', true),

  /** Timeout in seconds for PDF generation. Default: 120 */
  exportPdfTimeoutSeconds: () => getSetting<number>('exports.pdf_timeout_seconds', 120),

  /** Hours before open ticket is escalated to tier 1. Default: 24 */
  supportEscalationHoursTier1: () => getSetting<number>('support.escalation_hours_tier1', 24),

  /** Hours before unresolved ticket escalates to tier 2. Default: 72 */
  supportEscalationHoursTier2: () => getSetting<number>('support.escalation_hours_tier2', 72),

  /** Max failed login attempts before soft-lock. Default: 5 */
  authMaxLoginAttempts: () => getSetting<number>('auth.max_login_attempts', 5),

  /** Duration in minutes of the account soft-lock. Default: 30 */
  authLockDurationMinutes: () => getSetting<number>('auth.lock_duration_minutes', 30),
};
