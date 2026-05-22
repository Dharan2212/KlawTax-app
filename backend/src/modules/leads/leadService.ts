import { Types } from 'mongoose';
import { ILead } from '../../models/lead';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  LeadArchiveReason,
  ACTIVE_LEAD_STATUSES,
  LEAD_STATUS_TRANSITIONS,
} from '../../models/leadEnums';
import { leadRepository, LeadFilter, LeadListOptions } from './leadRepository';
import {
  PublicLeadPayload,
  CreateLeadPayload,
  UpdateLeadPayload,
  UpdateLeadStatusPayload,
  AssignLeadPayload,
} from '../../validators/leadValidators';
import {
  triggerLeadCreatedNotification,
  triggerLeadAssignedNotification,
  triggerLeadStatusChangedNotification,
  triggerLeadConvertedNotification,
  triggerLeadAutoArchivedNotification,
} from './leadNotifications';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';
import { buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { SortOrder } from '../../types/index';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface LeadListResponse {
  leads: ILead[];
  meta: PaginationMeta;
}

// ─── LeadService ──────────────────────────────────────────────────────────────

export class LeadService {
  /**
   * Create a lead from a public contact/inquiry form.
   * No auth required. Rate limiting is enforced at the route level.
   */
  async createPublicLead(
    payload: PublicLeadPayload,
    ipAddress?: string
  ): Promise<ILead> {
    const leadData: Partial<ILead> = {
      fullName: payload.fullName,
      phone: payload.phone,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
      ...(payload.serviceInterestSlugs ? { serviceInterestSlugs: payload.serviceInterestSlugs } : {}),
      leadSource: payload.leadSource ?? LeadSource.Website,
      ...(payload.organisationName ? { organisationName: payload.organisationName } : {}),
      ...(payload.organisationType ? { organisationType: payload.organisationType } : {}),
      ...(payload.preferredContactMethod ? { preferredContactMethod: payload.preferredContactMethod } : {}),
      ...(payload.urgencyLevel ? { urgencyLevel: payload.urgencyLevel } : {}),
      ...(payload.landingPage ? { landingPage: payload.landingPage } : {}),
      ...(payload.campaignSource ? { campaignSource: payload.campaignSource } : {}),
      status: LeadStatus.New,
      priority: LeadPriority.Medium,
      createdBySystem: true,
      ...(ipAddress ? { ipAddress } : {}),
    };

    const lead = await leadRepository.create(leadData);

    logger.info('[LeadService] Public lead created', {
      leadId: String(lead._id),
      phone: lead.phone,
      source: lead.leadSource,
    });

    triggerLeadCreatedNotification({
      leadId: String(lead._id),
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      serviceInterestSlugs: lead.serviceInterestSlugs,
      leadSource: lead.leadSource,
    });

    return lead;
  }

  /**
   * Create a lead from the admin CRM (manual entry).
   * Supports all fields including internal notes and priority.
   */
  async createAdminLead(
    payload: CreateLeadPayload,
    createdByUserId: string
  ): Promise<ILead> {
    const leadData: Partial<ILead> = {
      fullName: payload.fullName,
      phone: payload.phone,
      ...(payload.email ? { email: payload.email } : {}),
      ...(payload.notes ? { notes: payload.notes } : {}),
      ...(payload.serviceInterestSlugs ? { serviceInterestSlugs: payload.serviceInterestSlugs } : {}),
      leadSource: payload.leadSource ?? LeadSource.Website,
      ...(payload.organisationName ? { organisationName: payload.organisationName } : {}),
      ...(payload.organisationType ? { organisationType: payload.organisationType } : {}),
      ...(payload.preferredContactMethod ? { preferredContactMethod: payload.preferredContactMethod } : {}),
      ...(payload.urgencyLevel ? { urgencyLevel: payload.urgencyLevel } : {}),
      ...(payload.landingPage ? { landingPage: payload.landingPage } : {}),
      ...(payload.campaignSource ? { campaignSource: payload.campaignSource } : {}),
      priority: payload.priority ?? LeadPriority.Medium,
      ...(payload.internalNotes ? { internalNotes: payload.internalNotes } : {}),
      ...(payload.estimatedBudget !== undefined ? { estimatedBudget: payload.estimatedBudget } : {}),
      ...(payload.qualificationScore !== undefined ? { qualificationScore: payload.qualificationScore } : {}),
      ...(payload.tags ? { tags: payload.tags } : {}),
      ...(payload.followUpDate ? { followUpDate: new Date(payload.followUpDate) } : {}),
      status: LeadStatus.New,
      createdBySystem: false,
    };

    const lead = await leadRepository.create(leadData);

    logger.info('[LeadService] Admin lead created', {
      leadId: String(lead._id),
      createdByUserId,
    });

    triggerLeadCreatedNotification({
      leadId: String(lead._id),
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
      serviceInterestSlugs: lead.serviceInterestSlugs,
      leadSource: lead.leadSource,
    });

    return lead;
  }

  /**
   * Get a paginated, filtered list of leads.
   */
  async listLeads(
    filter: LeadFilter,
    page: number,
    limit: number,
    sortBy?: string,
    sortOrder?: SortOrder
  ): Promise<LeadListResponse> {
    const options: LeadListOptions = {
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    };

    const { leads, total } = await leadRepository.findMany(options);
    const meta = buildPaginationMeta(page, limit, total);

    return { leads, meta };
  }

  /**
   * Get a single lead by ID.
   */
  async getLeadById(id: string): Promise<ILead> {
    const lead = await leadRepository.findById(id);
    if (!lead) throw new NotFoundError('Lead');
    return lead;
  }

  /**
   * Update lead details (non-status fields).
   */
  async updateLead(id: string, payload: UpdateLeadPayload): Promise<ILead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    const update: Partial<ILead> = {};
    if (payload.fullName) update.fullName = payload.fullName;
    if (payload.phone) update.phone = payload.phone;
    if (payload.email !== undefined) update.email = payload.email;
    if (payload.notes !== undefined) update.notes = payload.notes;
    if (payload.internalNotes !== undefined) update.internalNotes = payload.internalNotes;
    if (payload.serviceInterestSlugs) update.serviceInterestSlugs = payload.serviceInterestSlugs;
    if (payload.organisationName !== undefined) update.organisationName = payload.organisationName;
    if (payload.organisationType) update.organisationType = payload.organisationType;
    if (payload.preferredContactMethod) update.preferredContactMethod = payload.preferredContactMethod;
    if (payload.urgencyLevel) update.urgencyLevel = payload.urgencyLevel;
    if (payload.priority) update.priority = payload.priority;
    if (payload.estimatedBudget !== undefined) update.estimatedBudget = payload.estimatedBudget;
    if (payload.qualificationScore !== undefined) update.qualificationScore = payload.qualificationScore;
    if (payload.tags) update.tags = payload.tags;
    if (payload.followUpDate) update.followUpDate = new Date(payload.followUpDate);

    const updated = await leadRepository.updateById(id, update);
    if (!updated) throw new NotFoundError('Lead');
    return updated;
  }

  /**
   * Transition lead to a new status. Enforces the transition matrix.
   */
  async updateLeadStatus(
    id: string,
    payload: UpdateLeadStatusPayload,
    changedByUserId?: string
  ): Promise<ILead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    const currentStatus = existing.status as LeadStatus;
    const targetStatus = payload.status;

    // Guard: transition matrix already validated in the validator,
    // but re-check at service layer for defence-in-depth.
    const allowed = LEAD_STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(targetStatus)) {
      throw new AppError(
        `Cannot transition lead from "${currentStatus}" to "${targetStatus}".`,
        422,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const update: Partial<ILead> = { status: targetStatus };

    if (targetStatus === LeadStatus.Archived) {
      update.archivedAt = new Date();
      update.archiveReason = payload.archiveReason;
    }
    if (targetStatus === LeadStatus.Lost) {
      update.lossReason = payload.lossReason;
      update.lossNote = payload.lossNote;
    }

    const updated = await leadRepository.updateById(id, update);
    if (!updated) throw new NotFoundError('Lead');

    triggerLeadStatusChangedNotification({
      leadId: id,
      fullName: existing.fullName,
      previousStatus: currentStatus,
      newStatus: targetStatus,
      changedByUserId,
    });

    return updated;
  }

  /**
   * Assign a lead to an employee.
   */
  async assignLead(
    id: string,
    payload: AssignLeadPayload,
    assignedByUserId?: string
  ): Promise<ILead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    if (existing.status === LeadStatus.Converted || existing.status === LeadStatus.Archived) {
      throw new AppError(
        'Cannot assign a lead that is converted or archived.',
        422,
        'LEAD_NOT_ASSIGNABLE'
      );
    }

    const update: Partial<ILead> = {
      assignedTo: new Types.ObjectId(payload.assignedTo),
      assignedAt: new Date(),
    };

    const updated = await leadRepository.updateById(id, update);
    if (!updated) throw new NotFoundError('Lead');

    triggerLeadAssignedNotification({
      leadId: id,
      fullName: existing.fullName,
      assignedToUserId: payload.assignedTo,
      assignedByUserId,
    });

    return updated;
  }

  /**
   * Append an internal note to a lead's internalNotes field.
   * Notes are appended with a timestamp — not overwritten.
   */
  async addInternalNote(
    id: string,
    note: string,
    authorUserId: string
  ): Promise<ILead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    const timestamp = new Date().toISOString();
    const noteEntry = `[${timestamp}] [${authorUserId}]: ${note}`;
    const previousNotes = existing.internalNotes ?? '';
    const updatedNotes = previousNotes
      ? `${previousNotes}\n\n${noteEntry}`
      : noteEntry;

    const updated = await leadRepository.updateById(id, { internalNotes: updatedNotes });
    if (!updated) throw new NotFoundError('Lead');
    return updated;
  }

  /**
   * Mark lead as converted and link the resulting client profile.
   * Full conversion logic (client creation, project init) is implemented
   * in the conversion module (future batch). This method handles only the
   * lead-side state transition.
   */
  async markConverted(
    id: string,
    clientProfileId: string,
    convertedByUserId?: string
  ): Promise<ILead> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    if (existing.status === LeadStatus.Converted) {
      throw new AppError('Lead is already converted.', 409, 'LEAD_ALREADY_CONVERTED');
    }

    if (!Types.ObjectId.isValid(clientProfileId)) {
      throw new AppError('Invalid clientProfileId.', 422, 'VALIDATION_ERROR');
    }

    const update: Partial<ILead> = {
      status: LeadStatus.Converted,
      convertedAt: new Date(),
      convertedClientId: new Types.ObjectId(clientProfileId),
    };

    const updated = await leadRepository.updateById(id, update);
    if (!updated) throw new NotFoundError('Lead');

    triggerLeadConvertedNotification({
      leadId: id,
      fullName: existing.fullName,
      clientProfileId,
      convertedByUserId,
    });

    return updated;
  }

  /**
   * Auto-archive inactive leads. Called by the BullMQ scheduled job.
   * Returns the count of archived leads.
   */
  async autoArchiveInactiveLeads(thresholdDays: number): Promise<number> {
    const staleLeads = await leadRepository.findInactiveLeads(
      thresholdDays,
      ACTIVE_LEAD_STATUSES
    );

    if (staleLeads.length === 0) return 0;

    const ids = staleLeads.map((l) => String(l._id));
    const archived = await leadRepository.bulkArchive(ids, LeadArchiveReason.AutoInactivity);

    staleLeads.forEach((lead) => {
      triggerLeadAutoArchivedNotification(String(lead._id), lead.fullName);
    });

    logger.info('[LeadService] Auto-archive complete', { count: archived, thresholdDays });
    return archived;
  }

  /**
   * Delete a lead permanently. Admin-only. For GDPR erasure or duplicate cleanup.
   */
  async deleteLead(id: string): Promise<void> {
    const existing = await leadRepository.findById(id);
    if (!existing) throw new NotFoundError('Lead');

    if (existing.status === LeadStatus.Converted) {
      throw new AppError(
        'Cannot delete a converted lead — it is linked to a client account.',
        422,
        'LEAD_NOT_DELETABLE'
      );
    }

    const deleted = await leadRepository.deleteById(id);
    if (!deleted) throw new NotFoundError('Lead');

    logger.info('[LeadService] Lead permanently deleted', { leadId: id });
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const leadService = new LeadService();
