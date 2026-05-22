/**
 * Projects module — Batch 3.1
 *
 * Barrel export for external consumers (routes, jobs, other modules).
 * Internal module files import directly from their respective files.
 */

export { projectRouter } from './projectRoutes';

// Service-layer exports (for dashboard / future modules)
export {
  createProjectRecord,
  getProjectById,
  getProjectByCode,
  getProjectWithSubProjects,
  listProjectsWithMeta,
  updateProjectFields,
  transitionProjectStatus,
  assignEmployee,
  removeEmployee,
  setPrimaryManager,
  updateChecklistItem,
  recordProjectActivity,
  runOverdueDetector,
  runStalledDetector,
  buildProjectSummary,
} from './projectService';

// Lifecycle utilities (for scheduled jobs)
export {
  isProjectOverdue,
  isProjectStalled,
  getDaysOverdue,
  requiresOverdueEscalation,
  buildOverdueProjectFilter,
  buildStalledProjectFilter,
  buildRequiresClientInputFilter,
} from './projectLifecycle';

// Workflow utilities (for future task / document modules)
export {
  validateProjectTransition,
  getAllowedTransitions,
  evaluateCompletionGate,
  buildDefaultChecklist,
  guardNotTerminal,
  guardEmployeeAssigned,
} from './projectWorkflow';

// Assignment utilities (for future workload / dashboard modules)
export {
  getActiveAssignees,
  getPrimaryManager,
  isEmployeeAssigned,
} from './assignmentEngine';

// Types
export type { ProjectFilter, ProjectSortOptions, PaginationOptions } from './projectRepository';
