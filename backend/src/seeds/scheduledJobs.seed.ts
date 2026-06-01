/**
 * Scheduled Jobs Registry Seed
 *
 * Seeds all canonical scheduledJobs entries per v1.5 Part 6.1.9.
 * Uses updateOne with $set only — safe to re-run idempotently.
 *
 * Fix (v7.4.1): Removed $setOnInsert to eliminate MongoDB path-conflict error
 * that occurred when Mongoose timestamps + $setOnInsert both tried to write createdAt.
 */

import { ScheduledJob } from '../models/scheduledJob';
import { logger } from '../utils/logger';

interface JobSeedEntry {
  jobName: string;
  description: string;
  cronExpression: string;
  isEnabled: boolean;
}

const SCHEDULED_JOBS: JobSeedEntry[] = [
  {
    jobName:        'project-overdue-detector',
    description:    'Daily — flag overdue projects and notify assigned employees and admin',
    cronExpression: '0 1 * * *',
    isEnabled:      true,
  },
  {
    jobName:        'task-overdue-detector',
    description:    'Daily — flag overdue tasks and notify assigned employees',
    cronExpression: '0 1 * * *',
    isEnabled:      true,
  },
  {
    jobName:        'invoice-overdue-detector',
    description:    'Daily — flag overdue invoices and send payment reminders',
    cronExpression: '0 2 * * *',
    isEnabled:      true,
  },
  {
    jobName:        'lead-auto-archiver',
    description:    'Weekly Sunday — auto-archive leads inactive for 90+ days',
    cronExpression: '0 3 * * 0',
    isEnabled:      true,
  },
  {
    jobName:        'stalled-project-detector',
    description:    'Daily — flag projects with no timeline activity for 7+ days',
    cronExpression: '0 4 * * *',
    isEnabled:      true,
  },
  {
    jobName:        'notification-archiver',
    description:    'Weekly Sunday — archive old read notifications',
    cronExpression: '0 5 * * 0',
    isEnabled:      true,
  },
  {
    jobName:        'refresh-token-cleanup',
    description:    'Weekly Sunday — hard-delete revoked refresh tokens older than 30 days',
    cronExpression: '0 6 * * 0',
    isEnabled:      true,
  },
  {
    jobName:        'export-job-cleanup',
    description:    'Daily — delete expired export job records and associated S3 objects',
    cronExpression: '0 7 * * *',
    isEnabled:      true,
  },
  {
    jobName:        'email-verification-reminder',
    description:    'Weekly Monday — remind users with unverified email under 14 days old',
    cronExpression: '0 9 * * 1',
    isEnabled:      true,
  },
  {
    jobName:        'webhook-retry-processor',
    description:    'Every 15 minutes — retry failed webhook events (up to 3 attempts)',
    cronExpression: '*/15 * * * *',
    isEnabled:      true,
  },
  {
    jobName:        'activity-session-cleanup',
    description:    'Weekly Sunday — hard-delete inactive sessions older than 30 days',
    cronExpression: '0 6 * * 0',
    isEnabled:      true,
  },
  {
    jobName:        'support-escalation-checker',
    description:    'Every 6 hours — escalate tickets breaching SLA tier-1/tier-2 thresholds',
    cronExpression: '0 */6 * * *',
    isEnabled:      true,
  },
];

export async function runScheduledJobsSeed(): Promise<void> {
  let upserted = 0;
  let errors   = 0;

  for (const job of SCHEDULED_JOBS) {
    try {
      await ScheduledJob.updateOne(
        { jobName: job.jobName },
        {
          $set: {
            description:    job.description,
            cronExpression: job.cronExpression,
            isEnabled:      job.isEnabled,
          },
          $setOnInsert: {
            totalRunCount:     0,
            totalFailureCount: 0,
          },
        },
        { upsert: true }
      );
      upserted++;
    } catch (err) {
      errors++;
      logger.error('[seed:jobs] Failed to upsert scheduled job', { jobName: job.jobName, err });
    }
  }

  logger.info('[seed:jobs] Scheduled jobs seed complete', {
    total: SCHEDULED_JOBS.length,
    upserted,
    errors,
  });
}
