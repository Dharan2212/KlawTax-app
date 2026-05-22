/**
 * System Settings Seed
 *
 * Seeds all 11 canonical systemSettings entries per v1.5 Part 6.1.5.
 * Uses upsert — safe to re-run without duplicating records.
 */

import { SystemSetting } from '../models/systemSetting';
import { logger } from '../utils/logger';

interface SettingSeedEntry {
  key: string;
  value: unknown;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  category: 'operations' | 'notifications' | 'payments' | 'security' | 'exports';
}

const SETTINGS: SettingSeedEntry[] = [
  {
    key:         'project.stall_threshold_days',
    value:       7,
    valueType:   'number',
    description: 'Days without activity before a project is flagged as stalled',
    category:    'operations',
  },
  {
    key:         'project.overdue_escalation_days',
    value:       3,
    valueType:   'number',
    description: 'Days overdue before escalating to admin with urgent priority',
    category:    'operations',
  },
  {
    key:         'lead.auto_archive_days',
    value:       90,
    valueType:   'number',
    description: 'Days inactive before a lead is auto-archived',
    category:    'operations',
  },
  {
    key:         'notifications.admin_digest_enabled',
    value:       true,
    valueType:   'boolean',
    description: 'Whether daily admin digest notifications are active',
    category:    'notifications',
  },
  {
    key:         'exports.max_concurrent_jobs',
    value:       3,
    valueType:   'number',
    description: 'Maximum simultaneous export jobs in the queue',
    category:    'exports',
  },
  {
    key:         'exports.pdf_timeout_seconds',
    value:       120,
    valueType:   'number',
    description: 'Timeout for individual PDF generation in seconds',
    category:    'exports',
  },
  {
    key:         'payments.advance_percentage',
    value:       50,
    valueType:   'number',
    description: 'Default advance percentage for 50% payment option',
    category:    'payments',
  },
  {
    key:         'support.escalation_hours_tier1',
    value:       24,
    valueType:   'number',
    description: 'Hours before an open ticket is escalated to medium priority',
    category:    'operations',
  },
  {
    key:         'support.escalation_hours_tier2',
    value:       72,
    valueType:   'number',
    description: 'Hours before an unresolved ticket is escalated to high priority',
    category:    'operations',
  },
  {
    key:         'auth.max_login_attempts',
    value:       5,
    valueType:   'number',
    description: 'Failed login attempts before account soft-lock',
    category:    'security',
  },
  {
    key:         'auth.lock_duration_minutes',
    value:       30,
    valueType:   'number',
    description: 'Duration of soft-lock after max failed login attempts',
    category:    'security',
  },
];

export async function runSystemSettingsSeed(): Promise<void> {
  let upserted = 0;
  let errors   = 0;

  for (const setting of SETTINGS) {
    try {
      await SystemSetting.findOneAndUpdate(
        { key: setting.key },
        { $setOnInsert: { ...setting, createdAt: new Date() }, $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
      );
      upserted++;
    } catch (err) {
      errors++;
      logger.error('[seed:settings] Failed to upsert setting', { key: setting.key, err });
    }
  }

  logger.info('[seed:settings] System settings seed complete', {
    total: SETTINGS.length,
    upserted,
    errors,
  });
}
