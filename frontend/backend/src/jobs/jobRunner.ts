/**
 * Job Runner
 *
 * Wraps any scheduled job handler with:
 *  - isEnabled gate (reads from ScheduledJob registry)
 *  - execution timing
 *  - success/failure tracking (updates ScheduledJob document)
 *  - failed job log creation on failure
 *  - structured logging
 */

import { ScheduledJob } from '../models/scheduledJob';
import { ScheduledJobStatus, FailedJobSeverity } from '../models/enums';
import { FailedJobService } from './failedJobService';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobRunResult {
  jobName: string;
  status: 'success' | 'skipped' | 'disabled' | 'failed';
  durationMs: number;
  error?: string;
}

// ─── Runner ──────────────────────────────────────────────────────────────────

export async function runJob(
  jobName: string,
  handler: () => Promise<void>,
  severity: FailedJobSeverity = FailedJobSeverity.Medium
): Promise<JobRunResult> {
  const startedAt = Date.now();

  // Load the job registry entry
  const jobDoc = await ScheduledJob.findOne({ jobName }).lean();

  if (!jobDoc) {
    logger.warn('[JobRunner] Job not found in registry — skipping', { jobName });
    return { jobName, status: 'skipped', durationMs: 0 };
  }

  if (!jobDoc.isEnabled) {
    logger.info('[JobRunner] Job is disabled — skipping', { jobName });
    await ScheduledJob.updateOne(
      { jobName },
      { $set: { lastRunAt: new Date(), lastRunStatus: ScheduledJobStatus.Skipped } }
    );
    return { jobName, status: 'disabled', durationMs: 0 };
  }

  logger.info('[JobRunner] Starting job', { jobName });

  try {
    await handler();

    const durationMs = Date.now() - startedAt;

    await ScheduledJob.updateOne(
      { jobName },
      {
        $set: {
          lastRunAt: new Date(),
          lastRunStatus: ScheduledJobStatus.Success,
          lastRunDurationMs: durationMs,
          lastRunError: undefined,
        },
        $inc: { totalRunCount: 1 },
      }
    );

    logger.info('[JobRunner] Job completed successfully', { jobName, durationMs });
    return { jobName, status: 'success', durationMs };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack  = err instanceof Error ? err.stack : undefined;

    await ScheduledJob.updateOne(
      { jobName },
      {
        $set: {
          lastRunAt: new Date(),
          lastRunStatus: ScheduledJobStatus.Failed,
          lastRunDurationMs: durationMs,
          lastRunError: errorMessage.substring(0, 2000),
        },
        $inc: { totalRunCount: 1, totalFailureCount: 1 },
      }
    );

    await FailedJobService.record({
      bullmqJobId: `${jobName}-${Date.now()}`,
      queueName: 'scheduled',
      jobName,
      jobPayload: { scheduledAt: new Date().toISOString() },
      errorMessage,
      errorStack,
      attemptNumber: 1,
      retryCount: 0,
      severity,
    });

    logger.error('[JobRunner] Job failed', { jobName, durationMs, errorMessage });
    return { jobName, status: 'failed', durationMs, error: errorMessage };
  }
}
