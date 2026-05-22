/**
 * Export Cleanup Job
 *
 * Manages the lifecycle of ExportJob records after they expire.
 * MongoDB's TTL index handles auto-deletion, but this job provides:
 *   - Belt-and-suspenders cleanup for completed jobs past their expiresAt
 *   - Status transitions: completed → expired (for frontend visibility)
 *   - Failed permanent job cleanup
 *   - Operational logging
 *
 * Safety rules:
 *   - NEVER deletes queued or processing jobs
 *   - Only affects records past their expiresAt timestamp
 *   - Marks as expired before deletion for observability
 */

import { ExportJob } from '../models/exportJob';
import { ExportJobStatus } from '../models/enums';
import { logger } from '../utils/logger';

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface ExportCleanupResult {
  markedExpired: number;
  deletedExpired: number;
  deletedFailedPermanent: number;
}

// ─── Retention window ────────────────────────────────────────────────────────

/** Completed exports expire after 7 days by default (set on job creation). */
const FAILED_PERMANENT_RETENTION_DAYS = 14;

// ─── Job Implementation ───────────────────────────────────────────────────────

export async function runExportCleanup(): Promise<ExportCleanupResult> {
  const now = new Date();

  // 1. Mark completed jobs as expired if their expiresAt has passed
  //    (belt-and-suspenders for MongoDB TTL index which handles actual deletion)
  const expiredMark = await ExportJob.updateMany(
    {
      status: ExportJobStatus.Completed,
      expiresAt: { $lt: now, $exists: true },
    },
    { $set: { status: ExportJobStatus.Expired } }
  );

  // 2. Delete records already in Expired state
  const expiredDelete = await ExportJob.deleteMany({
    status: ExportJobStatus.Expired,
    expiresAt: { $lt: now },
  });

  // 3. Clean up permanently failed jobs older than retention window
  const failedPermanentCutoff = new Date(
    now.getTime() - FAILED_PERMANENT_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const failedDelete = await ExportJob.deleteMany({
    status: ExportJobStatus.FailedPermanent,
    createdAt: { $lt: failedPermanentCutoff },
  });

  const result: ExportCleanupResult = {
    markedExpired: expiredMark.modifiedCount,
    deletedExpired: expiredDelete.deletedCount,
    deletedFailedPermanent: failedDelete.deletedCount,
  };

  const total = result.markedExpired + result.deletedExpired + result.deletedFailedPermanent;

  if (total > 0) {
    logger.info('[ExportCleanup] Export cleanup complete', result);
  } else {
    logger.debug('[ExportCleanup] No expired exports to clean up');
  }

  return result;
}
