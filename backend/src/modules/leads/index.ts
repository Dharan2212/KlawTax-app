/**
 * Leads module — barrel export.
 * Import from here in routes, services, and other modules.
 */

export { leadRepository } from './leadRepository';
export type { LeadRepository, LeadFilter, LeadListOptions, LeadListResult } from './leadRepository';

export { leadService } from './leadService';
export type { LeadService, LeadListResponse } from './leadService';

export { leadRouter, contactRouter } from './leadRoutes';

export * from './leadNotifications';
