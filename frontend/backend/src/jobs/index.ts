/**
 * Jobs Module — Public API
 *
 * Entry point for the background jobs system.
 * Re-exports only what external modules (server, admin routes) need.
 */

// ─── Scheduler lifecycle ──────────────────────────────────────────────────────
export {
  seedScheduledJobs,
  startScheduler,
  stopScheduler,
  triggerJobManually,
  getSchedulerStatus,
} from './scheduler';

// ─── Failed job management ────────────────────────────────────────────────────
export { FailedJobService } from './failedJobService';
export type { RecordFailedJobDTO, ResolveFailedJobDTO } from './failedJobService';

// ─── Settings helper ──────────────────────────────────────────────────────────
export { Settings, invalidateSetting, invalidateAllSettings } from './settingsHelper';

// ─── Individual job runners (for admin manual trigger + testing) ──────────────
export {
  projectOverdueDetector,
  taskOverdueDetector,
  invoiceOverdueDetector,
  stalledProjectDetector,
} from './overdueDetector';

export { runAllReminders } from './reminderRunner';
export { runAllCleanupJobs } from './cleanupJobs';
export { runExportCleanup } from './exportCleanup';
export { runWebhookRetryProcessor } from './webhookRetryProcessor';
export { runLeadAutoArchiver } from './leadAutoArchiver';
export { runSupportEscalationChecker } from './supportEscalationChecker';
