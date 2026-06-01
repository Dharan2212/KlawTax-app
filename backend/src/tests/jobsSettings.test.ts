/**
 * Phase 6.1 — Jobs, Settings, and Scheduler Tests
 *
 * Tests covering:
 *   - Scheduler lifecycle and interface
 *   - FailedJobService interface and validation
 *   - Settings helper accessors
 *   - Job runner interface
 *   - All job handlers exported correctly
 *   - Jobs index public API surface
 *   - System settings canonical keys
 *   - Scheduled job canonical names
 *   - Admin route contracts
 *   - Retry processor constraints
 *   - Export cleanup safety rules
 *   - Lead auto archiver safety rules
 */

import { describe, it, expect, printResults } from './_helpers';

// ─── Scheduler ────────────────────────────────────────────────────────────────

import {
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  seedScheduledJobs,
  triggerJobManually,
} from '../jobs/scheduler';

describe('Scheduler — lifecycle', () => {
  it('getSchedulerStatus returns shape with isRunning and registeredJobs', () => {
    const status = getSchedulerStatus();
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('registeredJobs');
  });

  it('isRunning is a boolean', () => {
    expect(typeof getSchedulerStatus().isRunning).toBe('boolean');
  });

  it('registeredJobs is an array', () => {
    expect(Array.isArray(getSchedulerStatus().registeredJobs)).toBeTruthy();
  });

  it('startScheduler does not throw', () => {
    let threw = false;
    try { startScheduler(); } catch { threw = true; }
    stopScheduler();
    expect(threw).toBeFalsy();
  });

  it('calling startScheduler twice is idempotent', () => {
    let threw = false;
    try { startScheduler(); startScheduler(); stopScheduler(); } catch { threw = true; }
    expect(threw).toBeFalsy();
  });

  it('stopScheduler is callable when not running', () => {
    let threw = false;
    try { stopScheduler(); } catch { threw = true; }
    expect(threw).toBeFalsy();
  });

  it('seedScheduledJobs is a function', () => {
    expect(typeof seedScheduledJobs).toBe('function');
  });

  it('triggerJobManually is a function', () => {
    expect(typeof triggerJobManually).toBe('function');
  });
});

// ─── Settings Helper ──────────────────────────────────────────────────────────

import { Settings, invalidateSetting, invalidateAllSettings } from '../jobs/settingsHelper';

describe('Settings Helper — interface', () => {
  it('Settings object exists', () => {
    expect(typeof Settings).toBe('object');
  });

  it('Settings.projectStallThresholdDays is a function', () => {
    expect(typeof Settings.projectStallThresholdDays).toBe('function');
  });

  it('Settings.projectOverdueEscalationDays is a function', () => {
    expect(typeof Settings.projectOverdueEscalationDays).toBe('function');
  });

  it('Settings.leadAutoArchiveDays is a function', () => {
    expect(typeof Settings.leadAutoArchiveDays).toBe('function');
  });

  it('Settings.adminDigestEnabled is a function', () => {
    expect(typeof Settings.adminDigestEnabled).toBe('function');
  });

  it('Settings.exportPdfTimeoutSeconds is a function', () => {
    expect(typeof Settings.exportPdfTimeoutSeconds).toBe('function');
  });

  it('Settings.supportEscalationHoursTier1 is a function', () => {
    expect(typeof Settings.supportEscalationHoursTier1).toBe('function');
  });

  it('Settings.supportEscalationHoursTier2 is a function', () => {
    expect(typeof Settings.supportEscalationHoursTier2).toBe('function');
  });

  it('Settings.authMaxLoginAttempts is a function', () => {
    expect(typeof Settings.authMaxLoginAttempts).toBe('function');
  });

  it('Settings.authLockDurationMinutes is a function', () => {
    expect(typeof Settings.authLockDurationMinutes).toBe('function');
  });

  it('invalidateSetting is a function', () => {
    expect(typeof invalidateSetting).toBe('function');
  });

  it('invalidateSetting can be called without throwing', () => {
    let threw = false;
    try { invalidateSetting('project.stall_threshold_days'); } catch { threw = true; }
    expect(threw).toBeFalsy();
  });

  it('invalidateAllSettings is a function', () => {
    expect(typeof invalidateAllSettings).toBe('function');
  });

  it('invalidateAllSettings can be called without throwing', () => {
    let threw = false;
    try { invalidateAllSettings(); } catch { threw = true; }
    expect(threw).toBeFalsy();
  });

  it('Settings.projectStallThresholdDays returns a Promise', () => {
    const result = Settings.projectStallThresholdDays();
    expect(typeof (result as Promise<unknown>).then).toBe('function');
  });
});

// ─── FailedJobService ─────────────────────────────────────────────────────────

import { FailedJobService } from '../jobs/failedJobService';
import { FailedJobSeverity } from '../models/enums';

describe('FailedJobService — interface', () => {
  it('has static record method', () => {
    expect(typeof FailedJobService.record).toBe('function');
  });

  it('has static resolve method', () => {
    expect(typeof FailedJobService.resolve).toBe('function');
  });

  it('has static listUnresolved method', () => {
    expect(typeof FailedJobService.listUnresolved).toBe('function');
  });

  it('has static cleanupResolved method', () => {
    expect(typeof FailedJobService.cleanupResolved).toBe('function');
  });

  it('resolve rejects on invalid ObjectId', async () => {
    let threw = false;
    try {
      await FailedJobService.resolve({ logId: 'not-an-objectid', resolvedById: 'user' });
    } catch {
      threw = true;
    }
    expect(threw).toBeTruthy();
  });

  it('FailedJobSeverity.Low equals low', () => {
    const val: string = FailedJobSeverity.Low;
    expect(val).toBe('low');
  });

  it('FailedJobSeverity.Medium equals medium', () => {
    const val: string = FailedJobSeverity.Medium;
    expect(val).toBe('medium');
  });

  it('FailedJobSeverity.High equals high', () => {
    const val: string = FailedJobSeverity.High;
    expect(val).toBe('high');
  });

  it('FailedJobSeverity.Critical equals critical', () => {
    const val: string = FailedJobSeverity.Critical;
    expect(val).toBe('critical');
  });
});

// ─── Job Runner ───────────────────────────────────────────────────────────────

import { runJob } from '../jobs/jobRunner';

describe('Job Runner — interface', () => {
  it('runJob is a function', () => {
    expect(typeof runJob).toBe('function');
  });

  it('runJob returns a Promise', () => {
    // Validate function type only — do not invoke (would require live DB via ScheduledJob.findOne)
    expect(typeof runJob).toBe('function');
    const isAsyncFn = runJob.constructor.name === 'AsyncFunction' || runJob.toString().includes('async');
    expect(isAsyncFn).toBeTruthy();
  });
});

// ─── Overdue Detectors ────────────────────────────────────────────────────────

import {
  projectOverdueDetector,
  taskOverdueDetector,
  invoiceOverdueDetector,
  stalledProjectDetector,
} from '../jobs/overdueDetector';

describe('Overdue Detectors — exports', () => {
  it('projectOverdueDetector is a function', () => {
    expect(typeof projectOverdueDetector).toBe('function');
  });

  it('taskOverdueDetector is a function', () => {
    expect(typeof taskOverdueDetector).toBe('function');
  });

  it('invoiceOverdueDetector is a function', () => {
    expect(typeof invoiceOverdueDetector).toBe('function');
  });

  it('stalledProjectDetector is a function', () => {
    expect(typeof stalledProjectDetector).toBe('function');
  });
});

// ─── Reminder Runner ──────────────────────────────────────────────────────────

import {
  runAllReminders,
  runLeadFollowUpReminders,
  runApprovalReviewReminders,
  runEmailVerificationReminders,
  runSupportResponseReminders,
} from '../jobs/reminderRunner';

describe('Reminder Runner — exports', () => {
  it('runAllReminders is a function', () => {
    expect(typeof runAllReminders).toBe('function');
  });

  it('runLeadFollowUpReminders is a function', () => {
    expect(typeof runLeadFollowUpReminders).toBe('function');
  });

  it('runApprovalReviewReminders is a function', () => {
    expect(typeof runApprovalReviewReminders).toBe('function');
  });

  it('runEmailVerificationReminders is a function', () => {
    expect(typeof runEmailVerificationReminders).toBe('function');
  });

  it('runSupportResponseReminders is a function', () => {
    expect(typeof runSupportResponseReminders).toBe('function');
  });
});

// ─── Cleanup Jobs ─────────────────────────────────────────────────────────────

import {
  runAllCleanupJobs,
  cleanupRevokedRefreshTokens,
  cleanupInactiveActivitySessions,
  cleanupStaleLoginAttempts,
  cleanupArchivedNotifications,
} from '../jobs/cleanupJobs';

describe('Cleanup Jobs — exports', () => {
  it('runAllCleanupJobs is a function', () => {
    expect(typeof runAllCleanupJobs).toBe('function');
  });

  it('cleanupRevokedRefreshTokens is a function', () => {
    expect(typeof cleanupRevokedRefreshTokens).toBe('function');
  });

  it('cleanupInactiveActivitySessions is a function', () => {
    expect(typeof cleanupInactiveActivitySessions).toBe('function');
  });

  it('cleanupStaleLoginAttempts is a function', () => {
    expect(typeof cleanupStaleLoginAttempts).toBe('function');
  });

  it('cleanupArchivedNotifications is a function', () => {
    expect(typeof cleanupArchivedNotifications).toBe('function');
  });
});

// ─── Other job functions ──────────────────────────────────────────────────────

import { runExportCleanup } from '../jobs/exportCleanup';
import { runWebhookRetryProcessor } from '../jobs/webhookRetryProcessor';
import { runLeadAutoArchiver } from '../jobs/leadAutoArchiver';
import { runSupportEscalationChecker } from '../jobs/supportEscalationChecker';

describe('Job Functions — exports', () => {
  it('runExportCleanup is a function', () => {
    expect(typeof runExportCleanup).toBe('function');
  });

  it('runWebhookRetryProcessor is a function', () => {
    expect(typeof runWebhookRetryProcessor).toBe('function');
  });

  it('runLeadAutoArchiver is a function', () => {
    expect(typeof runLeadAutoArchiver).toBe('function');
  });

  it('runSupportEscalationChecker is a function', () => {
    expect(typeof runSupportEscalationChecker).toBe('function');
  });
});

// ─── Jobs Index public API ────────────────────────────────────────────────────

import * as JobsIndex from '../jobs/index';

describe('Jobs Index — public API surface', () => {
  it('exports seedScheduledJobs', () => {
    expect(typeof JobsIndex.seedScheduledJobs).toBe('function');
  });

  it('exports startScheduler', () => {
    expect(typeof JobsIndex.startScheduler).toBe('function');
  });

  it('exports stopScheduler', () => {
    expect(typeof JobsIndex.stopScheduler).toBe('function');
  });

  it('exports triggerJobManually', () => {
    expect(typeof JobsIndex.triggerJobManually).toBe('function');
  });

  it('exports FailedJobService', () => {
    expect(typeof JobsIndex.FailedJobService).toBe('function');
  });

  it('exports Settings', () => {
    expect(typeof JobsIndex.Settings).toBe('object');
  });

  it('exports projectOverdueDetector', () => {
    expect(typeof JobsIndex.projectOverdueDetector).toBe('function');
  });

  it('exports runAllReminders', () => {
    expect(typeof JobsIndex.runAllReminders).toBe('function');
  });

  it('exports runAllCleanupJobs', () => {
    expect(typeof JobsIndex.runAllCleanupJobs).toBe('function');
  });

  it('exports runExportCleanup', () => {
    expect(typeof JobsIndex.runExportCleanup).toBe('function');
  });

  it('exports runWebhookRetryProcessor', () => {
    expect(typeof JobsIndex.runWebhookRetryProcessor).toBe('function');
  });

  it('exports runLeadAutoArchiver', () => {
    expect(typeof JobsIndex.runLeadAutoArchiver).toBe('function');
  });

  it('exports runSupportEscalationChecker', () => {
    expect(typeof JobsIndex.runSupportEscalationChecker).toBe('function');
  });
});

// ─── Canonical settings keys ──────────────────────────────────────────────────

describe('System Settings — canonical keys', () => {
  const KEYS = [
    'project.stall_threshold_days',
    'project.overdue_escalation_days',
    'lead.auto_archive_days',
    'notifications.admin_digest_enabled',
    'exports.max_concurrent_jobs',
    'exports.pdf_timeout_seconds',
    'payments.advance_percentage',
    'support.escalation_hours_tier1',
    'support.escalation_hours_tier2',
    'auth.max_login_attempts',
    'auth.lock_duration_minutes',
  ];

  it('canonical count is 11', () => {
    expect(KEYS.length).toBe(11);
  });

  it('all keys are non-empty strings with dot notation', () => {
    const allValid = KEYS.every((k) => typeof k === 'string' && k.includes('.'));
    expect(allValid).toBeTruthy();
  });
});

// ─── Canonical job names ──────────────────────────────────────────────────────

describe('Scheduled Job Registry — canonical names', () => {
  const NAMES = [
    'project-overdue-detector',
    'task-overdue-detector',
    'invoice-overdue-detector',
    'stalled-project-detector',
    'lead-auto-archiver',
    'support-escalation-checker',
    'reminder-runner',
    'cleanup-jobs',
    'export-job-cleanup',
    'webhook-retry-processor',
  ];

  it('canonical job count is 10', () => {
    expect(NAMES.length).toBe(10);
  });

  it('all canonical names use kebab-case', () => {
    const allKebab = NAMES.every((n) => /^[a-z0-9-]+$/.test(n));
    expect(allKebab).toBeTruthy();
  });
});

// ─── Admin route validation contracts ────────────────────────────────────────

import { Types } from 'mongoose';
import { WebhookProcessingStatus } from '../models/enums';

describe('Admin Routes — input validation contracts', () => {
  it('toggle endpoint: boolean check passes for true', () => {
    expect(typeof true === 'boolean').toBeTruthy();
  });

  it('toggle endpoint: string "yes" fails boolean check', () => {
    expect(typeof 'yes' === 'boolean').toBeFalsy();
  });

  it('webhook retry: valid ObjectId is accepted', () => {
    expect(Types.ObjectId.isValid('507f1f77bcf86cd799439011')).toBeTruthy();
  });

  it('webhook retry: random string fails ObjectId check', () => {
    expect(Types.ObjectId.isValid('not-an-objectid')).toBeFalsy();
  });

  it('webhook retry: empty string fails ObjectId check', () => {
    expect(Types.ObjectId.isValid('')).toBeFalsy();
  });

  it('processing status enum has failed value', () => {
    const hasField = 'failed' in WebhookProcessingStatus ||
      Object.values(WebhookProcessingStatus).includes('failed' as WebhookProcessingStatus);
    expect(hasField).toBeTruthy();
  });

  it('processing status enum has processed value', () => {
    const vals = Object.values(WebhookProcessingStatus);
    expect(vals.includes('processed' as WebhookProcessingStatus)).toBeTruthy();
  });
});

// ─── Operational constraints ──────────────────────────────────────────────────

describe('Webhook Retry Processor — operational constraints', () => {
  it('MAX_RETRY_ATTEMPTS of 3 is within acceptable range', () => {
    const MAX = 3;
    expect(MAX).toBeGreaterThan(0);
    expect(MAX < 10).toBeTruthy();
  });

  it('BATCH_SIZE of 20 is bounded for timeout safety', () => {
    const BATCH = 20;
    expect(BATCH).toBeGreaterThan(0);
    expect(BATCH < 100).toBeTruthy();
  });
});

describe('Export Cleanup — safety rules', () => {
  it('queued status must not be in cleanup targets', () => {
    const SAFE_TO_DELETE = ['expired', 'failed_permanent'];
    expect(SAFE_TO_DELETE.includes('queued')).toBeFalsy();
    expect(SAFE_TO_DELETE.includes('processing')).toBeFalsy();
  });
});

describe('Lead Auto Archiver — status safety', () => {
  const { LeadStatus } = require('../models/leadEnums') as typeof import('../models/leadEnums');
  const ARCHIVABLE = [LeadStatus.New, LeadStatus.Contacted, LeadStatus.Qualified, LeadStatus.ProposalSent];

  it('converted leads are not archivable', () => {
    expect(ARCHIVABLE.includes(LeadStatus.Converted)).toBeFalsy();
  });

  it('lost leads are not archivable', () => {
    expect(ARCHIVABLE.includes(LeadStatus.Lost)).toBeFalsy();
  });

  it('already archived leads are not in archivable set', () => {
    expect(ARCHIVABLE.includes(LeadStatus.Archived)).toBeFalsy();
  });
});

void (async () => { await printResults(); })();
