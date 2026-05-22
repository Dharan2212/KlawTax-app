/**
 * Timeline Module — Batch 3.2
 *
 * Centralized exports for the timeline engine.
 * Import router and service functions from here for inter-module use.
 *
 * Integration note (Batch 3.1 compatibility):
 *   ProjectService should import `createTimelineEntry`, `recordTaskStatusChanged`,
 *   and the `TimelineActorContext` type from this module to generate project-level
 *   timeline events without coupling to task internals.
 */

export { timelineRouter } from './timelineRoutes';

// Service functions — for use by other modules (Batch 3.1, documents, etc.)
export {
  createTimelineEntry,
  recordTaskCreated,
  recordTaskStatusChanged,
  recordTaskAssigned,
  recordTaskBlocked,
  recordTaskUnblocked,
  recordTaskProgressUpdated,
  recordDependencyAdded,
  getTimelineFeed,
  getGroupedTimelineFeed,
  resolveVisibilityFilter,
} from './timelineService';

// Types — for use by Batch 3.1 and future modules
export type {
  TimelineActorContext,
  CreateTimelineEntryInput,
  TimelineFeedOptions,
  GroupedTimelineEntry,
} from './timelineService';
