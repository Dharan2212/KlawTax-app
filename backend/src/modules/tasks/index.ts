/**
 * Tasks Module — Batch 3.2
 *
 * Exports the task router and key service functions for inter-module use.
 * TaskService functions are re-exported for use by future modules (e.g. Batch 3.1 projects).
 */

export { taskRouter } from './taskRoutes';
export * from './taskService';
export * from './taskDependencyEngine';
export * from './taskOverdueUtils';
