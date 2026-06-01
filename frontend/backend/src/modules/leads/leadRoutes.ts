/**
 * Lead routes — Batch 2.2
 *
 * CRM routes (auth-protected):
 *   GET    /api/v1/leads              — list leads (Admin + Employee)
 *   GET    /api/v1/leads/:id          — get lead (Admin + Employee)
 *   POST   /api/v1/leads              — create lead manually (Admin)
 *   PATCH  /api/v1/leads/:id          — update lead fields (Admin + Employee)
 *   PATCH  /api/v1/leads/:id/status   — transition lead status (Admin + Employee)
 *   PATCH  /api/v1/leads/:id/assign   — assign lead to employee (Admin)
 *   POST   /api/v1/leads/:id/notes    — add internal note (Admin + Employee)
 *   DELETE /api/v1/leads/:id          — hard-delete lead (Admin)
 *
 * Public routes (no auth):
 *   POST   /api/v1/contact            — public inquiry / lead capture
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin, requireEmployee } from '../../middlewares/rbac';
import { logger } from '../../utils/logger';
import { publicContactRateLimiter } from '../../middlewares/rateLimit';
import { sendSuccess, parsePagination } from '../../utils/response';
import { leadService } from './leadService';
import {
  validatePublicLeadPayload,
  validateCreateLeadPayload,
  validateUpdateLeadPayload,
  validateLeadStatusTransition,
  validateAssignLeadPayload,
  validateAddNotePayload,
} from '../../validators/leadValidators';
import { LeadStatus } from '../../models/leadEnums';
import type { LeadFilter } from './leadRepository';

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Extract the caller's IP, honouring proxy forwarding headers.
 * Used only on the public contact endpoint.
 */
function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress;
}

// ─── CRM Routes (auth-protected) ─────────────────────────────────────────────

export const leadRouter = Router();

// ─── List leads ───────────────────────────────────────────────────────────────

leadRouter.get(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(req.query.page, req.query.limit, 100);
      const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined;
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';

      const filter: LeadFilter = {};

      if (typeof req.query.status === 'string') {
        filter.status = req.query.status as LeadStatus;
      }
      if (typeof req.query.priority === 'string') {
        filter.priority = req.query.priority as LeadFilter['priority'];
      }
      if (typeof req.query.assignedTo === 'string') {
        filter.assignedTo = req.query.assignedTo;
      }
      if (typeof req.query.leadSource === 'string') {
        filter.leadSource = req.query.leadSource as LeadFilter['leadSource'];
      }
      if (typeof req.query.serviceInterestSlug === 'string') {
        filter.serviceInterestSlug = req.query.serviceInterestSlug;
      }
      if (typeof req.query.search === 'string') {
        filter.search = req.query.search;
      }
      if (req.query.unassigned === 'true') {
        filter.unassigned = true;
      }
      if (typeof req.query.createdAfter === 'string') {
        filter.createdAfter = new Date(req.query.createdAfter);
      }
      if (typeof req.query.createdBefore === 'string') {
        filter.createdBefore = new Date(req.query.createdBefore);
      }

      const result = await leadService.listLeads(filter, page, limit, sortBy, sortOrder);
      sendSuccess(res, result.leads, { meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get single lead ──────────────────────────────────────────────────────────

leadRouter.get(
  '/:id',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const lead = await leadService.getLeadById(req.params.id);
      sendSuccess(res, lead);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Create lead (admin CRM) ──────────────────────────────────────────────────

leadRouter.post(
  '/',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = validateCreateLeadPayload(req.body);
      const { userId } = getAuthContext(req);
      const lead = await leadService.createAdminLead(payload, userId);
      sendSuccess(res, lead, { statusCode: 201, message: 'Lead created successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Update lead fields (non-status) ─────────────────────────────────────────

leadRouter.patch(
  '/:id',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = validateUpdateLeadPayload(req.body);
      const lead = await leadService.updateLead(req.params.id, payload);
      sendSuccess(res, lead, { message: 'Lead updated successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Transition lead status ───────────────────────────────────────────────────

leadRouter.patch(
  '/:id/status',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const existing = await leadService.getLeadById(req.params.id);
      const body = req.body as Record<string, unknown>;
      const payload = validateLeadStatusTransition(
        existing.status as LeadStatus,
        body.status,
        req.body
      );
      const { userId } = getAuthContext(req);
      const lead = await leadService.updateLeadStatus(req.params.id, payload, userId);
      sendSuccess(res, lead, { message: 'Lead status updated.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Assign lead to employee ──────────────────────────────────────────────────

leadRouter.patch(
  '/:id/assign',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = validateAssignLeadPayload(req.body);
      const { userId } = getAuthContext(req);
      const lead = await leadService.assignLead(req.params.id, payload, userId);
      sendSuccess(res, lead, { message: 'Lead assigned successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Add internal note ────────────────────────────────────────────────────────

leadRouter.post(
  '/:id/notes',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { note } = validateAddNotePayload(req.body);
      const { userId } = getAuthContext(req);
      const lead = await leadService.addInternalNote(req.params.id, note, userId);
      sendSuccess(res, lead, { message: 'Note added successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Hard-delete lead (GDPR / duplicate) ─────────────────────────────────────

leadRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await leadService.deleteLead(req.params.id);
      sendSuccess(res, null, { message: 'Lead deleted permanently.' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Public Contact Router ────────────────────────────────────────────────────

export const contactRouter = Router();

/**
 * POST /api/v1/contact
 *
 * Public contact / service inquiry form — no authentication required.
 * Creates a lead with status: new and fires admin notification trigger.
 *
 * Security:
 *   - Rate limiting MUST be applied at reverse-proxy / CDN layer.
 *   - The caller's IP is captured and stored for spam/abuse detection.
 *   - Response intentionally omits all internal lead data and IDs.
 *   - Input is fully validated before any DB write.
 */
contactRouter.post(
  '/',
  publicContactRateLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = validatePublicLeadPayload(req.body);
      const ipAddress = getClientIp(req);
      const lead = await leadService.createPublicLead(payload, ipAddress);

      logger.info('[Contact] Public inquiry received', {
        leadId: String(lead._id),
        source: lead.leadSource,
      });

      // Never expose internal lead ID or metadata to anonymous callers.
      sendSuccess(
        res,
        {
          submitted: true,
          message: 'Thank you for reaching out. Our team will contact you shortly.',
        },
        { statusCode: 201 }
      );
    } catch (err) {
      next(err);
    }
  }
);
