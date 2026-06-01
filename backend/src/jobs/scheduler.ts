/**
 * Scheduler
 *
 * Central orchestrator for all KlawTax background jobs.
 * Uses node-cron for scheduled execution.
 *
 * All jobs run through jobRunner.ts which provides:
 *   - isEnabled gate (reads from ScheduledJob registry in DB)
 *   - Execution timing and ScheduledJob document updates
 *   - FailedJobLog creation on failure
 *   - Structured logging
 *
 * Job registry entries are seeded by seedScheduledJobs() below.
 * Admins can toggle jobs on/off via the ScheduledJob collection.
 */

import cron, { ScheduledTask } from 'node-cron';
import { ScheduledJob } from '../models/scheduledJob';
import { ScheduledJobStatus, FailedJobSeverity } from '../models/enums';
import { runJob } from './jobRunner';

// ─── Job Handlers ──────────────────────────────────────────────────────────────

import {
  projectOverdueDetector,
  taskOverdueDetector,
  invoiceOverdueDetector,
  stalledProjectDetector,
} from './overdueDetector';

import {
  runAllReminders,
} from './reminderRunner';

import { runAllCleanupJobs } from './cleanupJobs';
import { runExportCleanup } from './exportCleanup';
import { runWebhookRetryProcessor } from './webhookRetryProcessor';
import { runLeadAutoArchiver } from './leadAutoArchiver';
import { runSupportEscalationChecker } from './supportEscalationChecker';

import { logger } from '../utils/logger';

// ─── Registry Entry Type ──────────────────────────────────────────────────────

interface JobDefinition {
  jobName: string;
  description: string;
  cronExpression: string;
  handler: () => Promise<unknown>;
  severity: FailedJobSeverity;
}

// ─── Canonical Job Registry ───────────────────────────────────────────────────

const JOB_DEFINITIONS: JobDefinition[] = [
  {
    jobName: 'project-overdue-detector',
    description: 'Flags projects past their expectedDeliveryDate and sends notifications',
    cronExpression: '0 1 * * *', // Daily 1:00 AM UTC
    handler: projectOverdueDetector,
    severity: FailedJobSeverity.High,
  },
  {
    jobName: 'task-overdue-detector',
    description: 'Flags tasks past their dueDate and notifies assignees',
    cronExpression: '0 1 * * *', // Daily 1:00 AM UTC
    handler: taskOverdueDetector,
    severity: FailedJobSeverity.Medium,
  },
  {
    jobName: 'invoice-overdue-detector',
    description: 'Marks issued/partial invoices past their dueDate as overdue',
    cronExpression: '0 2 * * *', // Daily 2:00 AM UTC
    handler: invoiceOverdueDetector,
    severity: FailedJobSeverity.High,
  },
  {
    jobName: 'stalled-project-detector',
    description: 'Flags projects with no timeline activity for N days (configurable)',
    cronExpression: '0 4 * * *', // Daily 4:00 AM UTC
    handler: stalledProjectDetector,
    severity: FailedJobSeverity.Medium,
  },
  {
    jobName: 'lead-auto-archiver',
    description: 'Auto-archives inactive leads past the configured inactivity threshold',
    cronExpression: '0 3 * * 0', // Weekly Sunday 3:00 AM UTC
    handler: runLeadAutoArchiver,
    severity: FailedJobSeverity.Low,
  },
  {
    jobName: 'support-escalation-checker',
    description: 'SLA escalation checks for unresponded support tickets (tier-1/tier-2)',
    cronExpression: '0 */6 * * *', // Every 6 hours
    handler: runSupportEscalationChecker,
    severity: FailedJobSeverity.High,
  },
  {
    jobName: 'reminder-runner',
    description: 'Sends operational reminders for leads, approvals, support tickets, email verification',
    cronExpression: '0 9 * * 1', // Weekly Monday 9:00 AM UTC
    handler: runAllReminders,
    severity: FailedJobSeverity.Low,
  },
  {
    jobName: 'cleanup-jobs',
    description: 'Cleans up expired tokens, sessions, login attempts, and archived notifications',
    cronExpression: '0 6 * * 0', // Weekly Sunday 6:00 AM UTC
    handler: runAllCleanupJobs,
    severity: FailedJobSeverity.Medium,
  },
  {
    jobName: 'export-job-cleanup',
    description: 'Removes expired export job records and marks completed jobs as expired',
    cronExpression: '0 7 * * *', // Daily 7:00 AM UTC
    handler: runExportCleanup,
    severity: FailedJobSeverity.Low,
  },
  {
    jobName: 'webhook-retry-processor',
    description: 'Retries failed inbound webhook events (up to 3 attempts)',
    cronExpression: '*/15 * * * *', // Every 15 minutes
    handler: runWebhookRetryProcessor,
    severity: FailedJobSeverity.High,
  },
];

// ─── Scheduler State ─────────────────────────────────────────────────────────

const activeTasks: Map<string, ScheduledTask> = new Map();
let isRunning = false;

// ─── Seed DB Registry ─────────────────────────────────────────────────────────

/**
 * Ensures all job definitions have a corresponding ScheduledJob document.
 * Uses upsert — safe to call on every startup.
 */
export async function seedScheduledJobs(): Promise<void> {
  // Fix: $setOnInsert and $set must NOT share any field paths.
  // description/cronExpression belong in $set (update always).
  // jobName/counters/status belong in $setOnInsert (insert only).
  const ops = JOB_DEFINITIONS.map((def) => ({
    updateOne: {
      filter: { jobName: def.jobName },
      update: {
        $setOnInsert: {
          jobName:           def.jobName,
          isEnabled:         true,
          lastRunStatus:     ScheduledJobStatus.Skipped,
          totalRunCount:     0,
          totalFailureCount: 0,
        },
        $set: {
          description:    def.description,
          cronExpression: def.cronExpression,
        },
      },
      upsert: true,
    },
  }));

  await ScheduledJob.bulkWrite(ops);
  logger.info('[Scheduler] Scheduled job registry seeded', { count: JOB_DEFINITIONS.length });
}

// ─── Start ────────────────────────────────────────────────────────────────────

export function startScheduler(): void {
  if (isRunning) {
    logger.warn('[Scheduler] Scheduler already running — skipping duplicate start');
    return;
  }

  isRunning = true;

  for (const def of JOB_DEFINITIONS) {
    if (!cron.validate(def.cronExpression)) {
      logger.error('[Scheduler] Invalid cron expression — job skipped', {
        jobName: def.jobName,
        cronExpression: def.cronExpression,
      });
      continue;
    }

    const task = cron.schedule(
      def.cronExpression,
      async () => {
        await runJob(def.jobName, () => def.handler().then(() => undefined), def.severity);
      },
      { timezone: 'UTC' }
    );

    activeTasks.set(def.jobName, task);
    logger.info('[Scheduler] Job registered', {
      jobName: def.jobName,
      cron: def.cronExpression,
    });
  }

  logger.info('[Scheduler] All jobs registered and running', {
    totalJobs: activeTasks.size,
  });
}

// ─── Stop (Graceful Shutdown) ─────────────────────────────────────────────────

export function stopScheduler(): void {
  if (!isRunning) return;

  for (const [jobName, task] of activeTasks.entries()) {
    task.stop();
    logger.info('[Scheduler] Job stopped', { jobName });
  }

  activeTasks.clear();
  isRunning = false;
  logger.info('[Scheduler] All scheduled jobs stopped');
}

// ─── Manual Trigger (Admin Use) ───────────────────────────────────────────────

/**
 * Manually trigger a registered job by name.
 * Used by admin API routes for on-demand execution.
 */
export async function triggerJobManually(jobName: string): Promise<{
  triggered: boolean;
  jobName: string;
  error?: string;
}> {
  const def = JOB_DEFINITIONS.find((d) => d.jobName === jobName);

  if (!def) {
    return { triggered: false, jobName, error: `Job "${jobName}" not found in registry` };
  }

  try {
    await runJob(def.jobName, () => def.handler().then(() => undefined), def.severity);
    return { triggered: true, jobName };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { triggered: false, jobName, error: message };
  }
}

// ─── Status Query ──────────────────────────────────────────────────────────────

export function getSchedulerStatus(): {
  isRunning: boolean;
  registeredJobs: string[];
} {
  return {
    isRunning,
    registeredJobs: Array.from(activeTasks.keys()),
  };
}
