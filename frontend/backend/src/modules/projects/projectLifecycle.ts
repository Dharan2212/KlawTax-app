/**
 * Project Lifecycle Utilities — Batch 3.1
 *
 * Operational utilities for detecting stalled, overdue, and inactive projects.
 * Used by:
 *   - Scheduled BullMQ jobs (future batches)
 *   - Admin dashboard aggregations
 *   - Real-time flag evaluation during status transitions
 *
 * All functions are pure — they accept project data and threshold values,
 * then return flags or filter criteria.  No DB calls here.
 */

import {
  ProjectStatus,
  ACTIVE_WORK_STATUSES,
  DEFAULT_STALL_THRESHOLD_DAYS,
  DEFAULT_OVERDUE_ESCALATION_DAYS,
} from '../../models/projectEnums';
import type { IProject } from '../../models/project';

// ─── Overdue Detection ────────────────────────────────────────────────────────

/**
 * Returns true if the project has passed its expected delivery date
 * and is still in an active (non-closed) status.
 */
export function isProjectOverdue(
  project: Pick<IProject, 'projectStatus' | 'expectedDeliveryDate'>
): boolean {
  if (!project.expectedDeliveryDate) return false;
  if (!ACTIVE_WORK_STATUSES.has(project.projectStatus as ProjectStatus)) return false;
  return project.expectedDeliveryDate < new Date();
}

/**
 * Returns the number of days a project has been overdue.
 * Returns 0 if not overdue or no delivery date is set.
 */
export function getDaysOverdue(
  project: Pick<IProject, 'projectStatus' | 'expectedDeliveryDate'>
): number {
  if (!isProjectOverdue(project)) return 0;
  const ms = Date.now() - project.expectedDeliveryDate!.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if the project has been overdue long enough to escalate
 * (default: 3 days past expected delivery date).
 */
export function requiresOverdueEscalation(
  project: Pick<IProject, 'projectStatus' | 'expectedDeliveryDate'>,
  escalationDays = DEFAULT_OVERDUE_ESCALATION_DAYS
): boolean {
  return getDaysOverdue(project) >= escalationDays;
}

// ─── Stalled Detection ────────────────────────────────────────────────────────

/**
 * Returns true if the project has been inactive for more than `thresholdDays`.
 *
 * "Inactive" means no `lastActivityAt` update (status change, note, doc upload, etc.)
 * in the last N days.
 *
 * Exclusions:
 *   - Projects in WaitingClient status are excluded from stall detection
 *     (waiting on client is expected inactivity from the team's side).
 *   - Non-active-work statuses (Draft, Completed, Delivered, Archived, Cancelled)
 *     are excluded.
 */
export function isProjectStalled(
  project: Pick<IProject, 'projectStatus' | 'lastActivityAt'>,
  thresholdDays = DEFAULT_STALL_THRESHOLD_DAYS
): boolean {
  // Exclude waiting_client — team inactivity is expected while waiting on client
  if (project.projectStatus === ProjectStatus.WaitingClient) return false;

  // Only check active-work statuses
  if (!ACTIVE_WORK_STATUSES.has(project.projectStatus as ProjectStatus)) return false;

  const daysSinceActivity = getDaysSinceDate(project.lastActivityAt);
  return daysSinceActivity >= thresholdDays;
}

/**
 * Returns the number of days since the project last had any activity.
 */
export function getDaysSinceLastActivity(
  project: Pick<IProject, 'lastActivityAt'>
): number {
  return getDaysSinceDate(project.lastActivityAt);
}

// ─── Inactivity Detection ─────────────────────────────────────────────────────

/**
 * Returns true if a project has had no timeline entry in the last N days.
 * More precise than lastActivityAt for certain dashboard queries.
 */
export function hasNoRecentTimelineEntry(
  project: Pick<IProject, 'lastTimelineEntryAt' | 'projectStatus'>,
  thresholdDays = DEFAULT_STALL_THRESHOLD_DAYS
): boolean {
  if (!ACTIVE_WORK_STATUSES.has(project.projectStatus as ProjectStatus)) return false;
  if (!project.lastTimelineEntryAt) return true;
  return getDaysSinceDate(project.lastTimelineEntryAt) >= thresholdDays;
}

// ─── MongoDB Filter Builders ──────────────────────────────────────────────────
//
// These build MongoDB query filter objects suitable for use in
// projectRepository queries.  Used by scheduled jobs and dashboard endpoints.

/**
 * Build a MongoDB filter to find overdue projects.
 *
 * Targets projects where:
 *   - expectedDeliveryDate is in the past
 *   - projectStatus is in the set of active-work statuses
 */
export function buildOverdueProjectFilter(): Record<string, unknown> {
  return {
    expectedDeliveryDate: { $lt: new Date() },
    projectStatus: { $in: Array.from(ACTIVE_WORK_STATUSES) },
  };
}

/**
 * Build a MongoDB filter to find stalled projects (no activity for N days).
 *
 * Excludes WaitingClient status by design.
 */
export function buildStalledProjectFilter(
  thresholdDays = DEFAULT_STALL_THRESHOLD_DAYS
): Record<string, unknown> {
  const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
  const activeStatusesExcludingWaiting = Array.from(ACTIVE_WORK_STATUSES).filter(
    (s) => s !== ProjectStatus.WaitingClient
  );

  return {
    lastActivityAt: { $lt: cutoff },
    projectStatus: { $in: activeStatusesExcludingWaiting },
  };
}

/**
 * Build a MongoDB filter to find projects requiring client input.
 */
export function buildRequiresClientInputFilter(): Record<string, unknown> {
  return {
    requiresClientInput: true,
    projectStatus: { $nin: [ProjectStatus.Archived, ProjectStatus.Cancelled] },
  };
}

// ─── Flag Evaluation (for post-transition hooks) ──────────────────────────────

/**
 * Re-evaluate and return updated lifecycle flags for a project after
 * any status change or activity.
 *
 * Returns an object suitable for $set in a MongoDB update.
 */
export function evaluateLifecycleFlags(
  project: Pick<
    IProject,
    'projectStatus' | 'expectedDeliveryDate' | 'lastActivityAt'
  >,
  config: { stallThresholdDays?: number } = {}
): {
  isOverdue: boolean;
  isStalled: boolean;
} {
  return {
    isOverdue: isProjectOverdue(project),
    isStalled: isProjectStalled(project, config.stallThresholdDays),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysSinceDate(date: Date): number {
  const ms = Date.now() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
