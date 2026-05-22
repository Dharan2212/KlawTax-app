/**
 * Failed Job Log Service
 *
 * Records job failures to the `failedJobLogs` collection.
 * Used by all background jobs to create persistent, admin-visible failure entries.
 */

import { Types } from 'mongoose';
import { FailedJobLog } from '../models/failedJobLog';
import { FailedJobSeverity } from '../models/enums';
import { logger } from '../utils/logger';

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface RecordFailedJobDTO {
  bullmqJobId: string;
  queueName: string;
  jobName: string;
  jobPayload: Record<string, unknown>;
  errorMessage: string;
  errorStack?: string;
  attemptNumber: number;
  retryCount: number;
  severity?: FailedJobSeverity;
}

export interface ResolveFailedJobDTO {
  logId: string;
  resolvedById: string;
  resolutionNote?: string;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class FailedJobService {
  /**
   * Record a job failure. Safe to call without throwing — logs internally on error.
   */
  static async record(dto: RecordFailedJobDTO): Promise<void> {
    try {
      await FailedJobLog.create({
        bullmqJobId: dto.bullmqJobId,
        queueName: dto.queueName,
        jobName: dto.jobName,
        jobPayload: dto.jobPayload,
        errorMessage: dto.errorMessage.substring(0, 2000),
        errorStack: dto.errorStack?.substring(0, 10000),
        attemptNumber: dto.attemptNumber,
        retryCount: dto.retryCount,
        severity: dto.severity ?? FailedJobSeverity.Medium,
        failedAt: new Date(),
        isResolved: false,
      });

      logger.warn('[FailedJobService] Job failure recorded', {
        jobName: dto.jobName,
        queueName: dto.queueName,
        attempt: dto.attemptNumber,
        error: dto.errorMessage.substring(0, 200),
      });
    } catch (err) {
      // Never throw from a failure recorder — just log
      logger.error('[FailedJobService] Failed to persist failure log', {
        jobName: dto.jobName,
        err,
      });
    }
  }

  /**
   * Mark a failed job log as resolved by an admin.
   */
  static async resolve(dto: ResolveFailedJobDTO): Promise<void> {
    if (!Types.ObjectId.isValid(dto.logId)) {
      throw new Error('Invalid log ID');
    }

    const log = await FailedJobLog.findByIdAndUpdate(
      dto.logId,
      {
        $set: {
          isResolved: true,
          resolvedAt: new Date(),
          resolvedById: new Types.ObjectId(dto.resolvedById),
          resolutionNote: dto.resolutionNote?.trim(),
        },
      },
      { new: true }
    );

    if (!log) throw new Error(`Failed job log ${dto.logId} not found`);

    logger.info('[FailedJobService] Failed job log resolved', {
      logId: dto.logId,
      resolvedBy: dto.resolvedById,
    });
  }

  /**
   * List unresolved failed job logs with optional filters.
   */
  static async listUnresolved(opts: {
    queueName?: string;
    jobName?: string;
    severity?: FailedJobSeverity;
    page?: number;
    limit?: number;
  } = {}) {
    const filter: Record<string, unknown> = { isResolved: false };
    if (opts.queueName) filter.queueName = opts.queueName;
    if (opts.jobName) filter.jobName = opts.jobName;
    if (opts.severity) filter.severity = opts.severity;

    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      FailedJobLog.find(filter).sort({ severity: 1, failedAt: -1 }).skip(skip).limit(limit).lean(),
      FailedJobLog.countDocuments(filter),
    ]);

    return { logs, total, page, limit };
  }

  /**
   * Clean up resolved logs older than N days.
   */
  static async cleanupResolved(olderThanDays = 30): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await FailedJobLog.deleteMany({
      isResolved: true,
      resolvedAt: { $lt: cutoff },
    });
    return result.deletedCount;
  }
}
