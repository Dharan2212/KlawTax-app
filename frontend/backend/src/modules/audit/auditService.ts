import { Types, FilterQuery } from 'mongoose';
import { AuditLog, IAuditLogDocument } from '../../models/auditLog';
import { AuditCategory, AuditSeverity, AuditSource, AuditActionValue } from '../../models/auditLogEnums';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { logger } from '../../utils/logger';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface CreateAuditLogDTO {
  actorUserId?: string | Types.ObjectId;
  actorRole?: string;
  actorIp?: string;
  userAgent?: string;

  entityType: string;
  entityId?: string | Types.ObjectId;
  entityName?: string;

  action: string | AuditActionValue;
  category: AuditCategory;
  severity?: AuditSeverity;

  previousState?: Record<string, unknown>;
  nextState?: Record<string, unknown>;
  changedFields?: string[];

  projectId?: string | Types.ObjectId;
  taskId?: string | Types.ObjectId;
  documentId?: string | Types.ObjectId;
  supportTicketId?: string | Types.ObjectId;
  invoiceId?: string;
  paymentId?: string;

  requestId?: string;
  correlationId?: string;
  source?: AuditSource;
  internalOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AuditListQuery {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  action?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  projectId?: string;
  supportTicketId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AuditService {
  /**
   * Create a single audit log entry.
   * Never throws — audit logging must not break business operations.
   */
  static async log(dto: CreateAuditLogDTO): Promise<void> {
    try {
      const toOid = (id?: string | Types.ObjectId) =>
        id ? new Types.ObjectId(id.toString()) : undefined;

      await AuditLog.create({
        actorUserId: toOid(dto.actorUserId),
        actorRole: dto.actorRole,
        actorIp: dto.actorIp,
        userAgent: dto.userAgent,

        entityType: dto.entityType,
        entityId: toOid(dto.entityId),
        entityName: dto.entityName,

        action: dto.action,
        category: dto.category,
        severity: dto.severity ?? AuditSeverity.Info,

        previousState: dto.previousState,
        nextState: dto.nextState,
        changedFields: dto.changedFields,

        projectId: toOid(dto.projectId),
        taskId: toOid(dto.taskId),
        documentId: toOid(dto.documentId),
        supportTicketId: toOid(dto.supportTicketId),
        invoiceId: dto.invoiceId ? new Types.ObjectId(dto.invoiceId) : undefined,
        paymentId: dto.paymentId ? new Types.ObjectId(dto.paymentId) : undefined,

        requestId: dto.requestId,
        correlationId: dto.correlationId,
        source: dto.source ?? AuditSource.Api,
        internalOnly: dto.internalOnly ?? false,
        metadata: dto.metadata,
      });
    } catch (err) {
      // Never propagate — audit must not block business logic
      logger.error('[AuditService] Failed to write audit log', {
        action: dto.action,
        entityType: dto.entityType,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Paginated audit log listing for admin views.
   */
  static async list(
    query: AuditListQuery,
    options: { includeInternal?: boolean } = {}
  ): Promise<{ logs: IAuditLogDocument[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query.page, query.limit, 100);

    const filter: FilterQuery<IAuditLogDocument> = {};

    if (!options.includeInternal) filter.internalOnly = false;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = new Types.ObjectId(query.entityId);
    if (query.actorUserId) filter.actorUserId = new Types.ObjectId(query.actorUserId);
    if (query.action) filter.action = query.action;
    if (query.category) filter.category = query.category;
    if (query.severity) filter.severity = query.severity;
    if (query.projectId) filter.projectId = new Types.ObjectId(query.projectId);
    if (query.supportTicketId) filter.supportTicketId = new Types.ObjectId(query.supportTicketId);

    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs: logs as unknown as IAuditLogDocument[],
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Get audit trail for a specific entity (e.g. project history).
   */
  static async getEntityTrail(
    entityType: string,
    entityId: string
  ): Promise<IAuditLogDocument[]> {
    const logs = await AuditLog.find({
      entityType,
      entityId: new Types.ObjectId(entityId),
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return logs as unknown as IAuditLogDocument[];
  }
}
