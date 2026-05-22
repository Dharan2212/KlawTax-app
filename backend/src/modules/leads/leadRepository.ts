import { Types, FilterQuery } from 'mongoose';
import { Lead, ILead } from '../../models/lead';
import { LeadStatus, LeadPriority, LeadSource, LeadArchiveReason } from '../../models/leadEnums';
import { SortOrder } from '../../types/index';

// ─── Filter / Pagination Types ────────────────────────────────────────────────

export interface LeadFilter {
  status?: LeadStatus | LeadStatus[];
  priority?: LeadPriority;
  assignedTo?: string;
  leadSource?: LeadSource;
  serviceInterestSlug?: string;
  search?: string;           // fullName / phone / email / orgName
  followUpBefore?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  unassigned?: boolean;
}

export interface LeadListOptions {
  filter: LeadFilter;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface LeadListResult {
  leads: ILead[];
  total: number;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class LeadRepository {
  /**
   * Create a new lead document.
   */
  async create(data: Partial<ILead>): Promise<ILead> {
    const lead = new Lead(data);
    return lead.save();
  }

  /**
   * Find a lead by its MongoDB ObjectId.
   */
  async findById(id: string): Promise<ILead | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Lead.findById(id).exec();
  }

  /**
   * Find a lead by email (case-insensitive).
   */
  async findByEmail(email: string): Promise<ILead | null> {
    return Lead.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /**
   * Find a lead by phone.
   */
  async findByPhone(phone: string): Promise<ILead | null> {
    return Lead.findOne({ phone: phone.trim() }).exec();
  }

  /**
   * Paginated + filtered lead list.
   */
  async findMany(options: LeadListOptions): Promise<LeadListResult> {
    const query = this.buildFilter(options.filter);
    const sortField = this.sanitiseSortField(options.sortBy ?? 'createdAt');
    const sortDir = options.sortOrder === 'asc' ? 1 : -1;
    const skip = (options.page - 1) * options.limit;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      Lead.countDocuments(query).exec(),
    ]);

    return { leads, total };
  }

  /**
   * Update a lead by id. Returns the updated document.
   */
  async updateById(id: string, update: Partial<ILead>): Promise<ILead | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Lead.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Soft-delete is not used for leads — archival is the soft equivalent.
   * Hard delete is available for admin use only (GDPR erasure scenario).
   */
  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Lead.findByIdAndDelete(id).exec();
    return result !== null;
  }

  /**
   * Count leads matching a filter — used for dashboards.
   */
  async count(filter: LeadFilter): Promise<number> {
    const query = this.buildFilter(filter);
    return Lead.countDocuments(query).exec();
  }

  /**
   * Find leads that have not been updated in `thresholdDays` days and are in
   * active non-converted statuses. Used by the auto-archival scheduled job.
   */
  async findInactiveLeads(
    thresholdDays: number,
    activeStatuses: LeadStatus[]
  ): Promise<ILead[]> {
    const cutoff = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
    return Lead.find({
      status: { $in: activeStatuses },
      updatedAt: { $lt: cutoff },
    }).exec();
  }

  /**
   * Find leads with follow-up dates that have passed and are still in active statuses.
   * Used by the follow-up reminder scheduled job.
   */
  async findOverdueFollowUps(activeStatuses: LeadStatus[]): Promise<ILead[]> {
    return Lead.find({
      status: { $in: activeStatuses },
      followUpDate: { $lt: new Date() },
    }).exec();
  }

  /**
   * Bulk-archive leads (used by the auto-archival job).
   */
  async bulkArchive(
    ids: string[],
    archiveReason: LeadArchiveReason
  ): Promise<number> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const result = await Lead.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          status: LeadStatus.Archived,
          archiveReason,
          archivedAt: new Date(),
        },
      }
    ).exec();

    return result.modifiedCount;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildFilter(filter: LeadFilter): FilterQuery<ILead> {
    const query: FilterQuery<ILead> = {};

    if (filter.status) {
      query.status = Array.isArray(filter.status)
        ? { $in: filter.status }
        : filter.status;
    }

    if (filter.priority) {
      query.priority = filter.priority;
    }

    if (filter.assignedTo) {
      if (Types.ObjectId.isValid(filter.assignedTo)) {
        query.assignedTo = new Types.ObjectId(filter.assignedTo);
      }
    }

    if (filter.unassigned === true) {
      query.assignedTo = { $exists: false };
    }

    if (filter.leadSource) {
      query.leadSource = filter.leadSource;
    }

    if (filter.serviceInterestSlug) {
      query.serviceInterestSlugs = filter.serviceInterestSlug;
    }

    if (filter.followUpBefore) {
      query.followUpDate = { $lte: filter.followUpBefore };
    }

    if (filter.createdAfter || filter.createdBefore) {
      query.createdAt = {};
      if (filter.createdAfter) query.createdAt.$gte = filter.createdAfter;
      if (filter.createdBefore) query.createdAt.$lte = filter.createdBefore;
    }

    if (filter.search) {
      const escaped = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: escaped, $options: 'i' };
      query.$or = [
        { fullName: regex },
        { phone: regex },
        { email: regex },
        { organisationName: regex },
      ];
    }

    return query;
  }

  private sanitiseSortField(field: string): string {
    const allowed = [
      'createdAt', 'updatedAt', 'fullName', 'status',
      'priority', 'followUpDate', 'lastContactedAt',
    ];
    return allowed.includes(field) ? field : 'createdAt';
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

export const leadRepository = new LeadRepository();
