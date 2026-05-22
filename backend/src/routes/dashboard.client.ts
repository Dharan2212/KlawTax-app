/**
 * Client Portal Dashboard Route Entry Point
 *
 * Canonical route file for the client portal dashboard.
 * Re-exports clientDashboardRouter for consistent import patterns.
 * app.ts imports directly from the module, but this file provides
 * a standard route-layer entry point consistent with other dashboards. following the same pattern as
 * dashboard.admin.ts and dashboard.employee.ts.
 *
 * All route logic lives in:
 *   src/modules/dashboards/client/clientDashboardRouter.ts
 *
 * All service logic lives in:
 *   src/modules/dashboards/client/clientDashboardService.ts
 *
 * Portal helpers live in:
 *   src/modules/portal/
 */

export { clientDashboardRouter } from '../modules/dashboards/client/clientDashboardRouter';
