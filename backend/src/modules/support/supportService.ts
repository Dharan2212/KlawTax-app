import { Types, FilterQuery } from 'mongoose';
import { SupportTicket, ISupportTicketDocument } from '../../models/supportTicket';
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportMessageSenderRole,
} from '../../models/supportTicketEnums';
import { NotificationService } from '../notifications/notificationService';
import { NotificationType, NotificationCategory, NotificationPriority } from '../../models/notificationEnums';
import { AuditService } from '../audit/auditService';
import { AuditCategory, AuditSource, AuditAction } from '../../models/auditLogEnums';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';
import { CreateTicketDTO, AddMessageDTO, UpdateTicketDTO, TicketListQuery } from './supportValidators';

let _ticketCounter = 0;

async function generateTicketNumber(): Promise<string> {
  const count = await SupportTicket.countDocuments();
  const seq = (count + 1 + _ticketCounter++).toString().padStart(4, '0');
  return `TKT-${seq}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SupportService {
  /**
   * Create a new support ticket (client or admin).
   */
  static async createTicket(
    dto: CreateTicketDTO,
    creatorId: string,
    creatorRole: string,
    options: { clientId?: string } = {}
  ): Promise<ISupportTicketDocument> {
    const clientId = options.clientId ?? creatorId;

    const ticketNumber = await generateTicketNumber();

    const ticket = await SupportTicket.create({
      ticketNumber,
      clientId: new Types.ObjectId(clientId),
      category: dto.category,
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority ?? SupportTicketPriority.Medium,
      tags: dto.tags,
      relatedProjectId: dto.relatedProjectId ? new Types.ObjectId(dto.relatedProjectId) : undefined,
      relatedTaskId: dto.relatedTaskId ? new Types.ObjectId(dto.relatedTaskId) : undefined,
      relatedDocumentId: dto.relatedDocumentId ? new Types.ObjectId(dto.relatedDocumentId) : undefined,
      ticketStatus: SupportTicketStatus.Open,
      escalationLevel: 0,
      messages: [
        {
          senderId: new Types.ObjectId(creatorId),
          senderRole: creatorRole as SupportMessageSenderRole,
          message: dto.description,
          visibleToClient: true,
          internalOnly: false,
          sentAt: new Date(),
        },
      ],
      createdBy: new Types.ObjectId(creatorId),
    });

    // Audit
    await AuditService.log({
      actorUserId: creatorId,
      actorRole: creatorRole,
      entityType: 'support_ticket',
      entityId: ticket._id as Types.ObjectId,
      entityName: ticketNumber,
      action: AuditAction.SupportTicketCreated,
      category: AuditCategory.Support,
      source: AuditSource.Api,
      metadata: { category: dto.category, priority: dto.priority },
    });

    logger.info('[SupportService] Ticket created', { ticketNumber, clientId });

    return ticket;
  }

  /**
   * Get a ticket by ID — enforces ownership for clients.
   */
  static async getTicketById(
    ticketId: string,
    requestorId: string,
    requestorRole: string
  ): Promise<ISupportTicketDocument> {
    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      throw new AppError('Support ticket not found', 404);
    }

    // Client can only access their own tickets
    if (requestorRole === 'client' && ticket.clientId.toString() !== requestorId) {
      throw new AppError('Access denied', 403);
    }

    return ticket;
  }

  /**
   * List tickets — scoped by role.
   */
  static async listTickets(
    query: TicketListQuery,
    requestorId: string,
    requestorRole: string
  ): Promise<{ tickets: ISupportTicketDocument[]; meta: PaginationMeta }> {
    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const filter: FilterQuery<ISupportTicketDocument> = {};

    // Clients only see their own tickets
    if (requestorRole === 'client') {
      filter.clientId = new Types.ObjectId(requestorId);
    }

    if (query.status) filter.ticketStatus = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.category) filter.category = query.category;
    if (query.assignedToId) filter.assignedToId = new Types.ObjectId(query.assignedToId);

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets: tickets as unknown as ISupportTicketDocument[],
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /**
   * Update ticket metadata / status.
   */
  static async updateTicket(
    ticketId: string,
    dto: UpdateTicketDTO,
    updaterId: string,
    updaterRole: string
  ): Promise<ISupportTicketDocument> {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new AppError('Support ticket not found', 404);

    const prevStatus = ticket.ticketStatus;

    if (dto.ticketStatus && dto.ticketStatus !== prevStatus) {
      if (!ticket.canTransitionTo(dto.ticketStatus)) {
        throw new AppError(
          `Invalid status transition: ${prevStatus} → ${dto.ticketStatus}`,
          422
        );
      }

      // Set escalation timestamps
      if (dto.ticketStatus === SupportTicketStatus.Escalated && !ticket.escalatedAt) {
        ticket.escalatedAt = new Date();
        ticket.escalationLevel = Math.min(ticket.escalationLevel + 1, 2);
      }

      ticket.ticketStatus = dto.ticketStatus;
    }

    if (dto.priority) ticket.priority = dto.priority;
    if (dto.assignedToId !== undefined) {
      ticket.assignedToId = dto.assignedToId
        ? new Types.ObjectId(dto.assignedToId)
        : undefined;
      if (dto.assignedToId && ticket.ticketStatus === SupportTicketStatus.Open) {
        ticket.ticketStatus = SupportTicketStatus.Assigned;
      }
    }
    if (dto.internalNotes !== undefined) ticket.internalNotes = dto.internalNotes;
    if (dto.slaDeadline) ticket.slaDeadline = new Date(dto.slaDeadline);

    ticket.updatedBy = new Types.ObjectId(updaterId);
    await ticket.save();

    // Audit
    await AuditService.log({
      actorUserId: updaterId,
      actorRole: updaterRole,
      entityType: 'support_ticket',
      entityId: ticket._id as Types.ObjectId,
      entityName: ticket.ticketNumber,
      action: dto.ticketStatus === SupportTicketStatus.Resolved
        ? AuditAction.SupportTicketResolved
        : 'support.ticket_updated',
      category: AuditCategory.Support,
      source: AuditSource.Api,
      previousState: { status: prevStatus },
      nextState: { status: ticket.ticketStatus },
    });

    return ticket;
  }

  /**
   * Add a message to the ticket thread.
   */
  static async addMessage(
    ticketId: string,
    dto: AddMessageDTO,
    senderId: string,
    senderRole: string
  ): Promise<ISupportTicketDocument> {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new AppError('Support ticket not found', 404);

    // Clients can only message their own ticket
    if (senderRole === 'client' && ticket.clientId.toString() !== senderId) {
      throw new AppError('Access denied', 403);
    }

    // Clients can't send internal-only messages
    const internalOnly = senderRole !== 'client'
      ? (dto.visibleToClient === false)
      : false;
    const visibleToClient = !internalOnly;

    ticket.messages.push({
      senderId: new Types.ObjectId(senderId),
      senderRole: senderRole as SupportMessageSenderRole,
      message: dto.message,
      attachments: dto.attachments,
      visibleToClient,
      internalOnly,
      sentAt: new Date(),
    });

    // Track response times
    const now = new Date();
    if (!ticket.firstResponseAt && senderRole !== 'client') {
      ticket.firstResponseAt = now;
    }
    ticket.lastResponseAt = now;

    // If client replies to a waiting_client ticket, move to in_progress
    if (senderRole === 'client' && ticket.ticketStatus === SupportTicketStatus.WaitingClient) {
      ticket.ticketStatus = SupportTicketStatus.InProgress;
    }

    ticket.updatedBy = new Types.ObjectId(senderId);
    await ticket.save();

    // Notify the other party
    const recipientId =
      senderRole === 'client'
        ? ticket.assignedToId?.toString()
        : ticket.clientId.toString();

    if (recipientId && recipientId !== senderId) {
      await NotificationService.create({
        recipientId,
        actorId: senderId,
        notificationType: NotificationType.SupportMessageReceived,
        category: NotificationCategory.Support,
        title: `New message on ticket ${ticket.ticketNumber}`,
        message: dto.message.substring(0, 200),
        shortMessage: `Reply on ${ticket.subject.substring(0, 60)}`,
        actionUrl: `/portal/support/${ticketId}`,
        actionLabel: 'View Ticket',
        priority: NotificationPriority.Medium,
        supportTicketId: ticket._id as Types.ObjectId,
        visibleToClient: senderRole !== 'client',
        internalOnly: false,
      });
    }

    // Audit
    await AuditService.log({
      actorUserId: senderId,
      actorRole: senderRole,
      entityType: 'support_ticket',
      entityId: ticket._id as Types.ObjectId,
      entityName: ticket.ticketNumber,
      action: AuditAction.SupportMessageAdded,
      category: AuditCategory.Support,
      source: AuditSource.Api,
      metadata: { internalOnly, messageLength: dto.message.length },
    });

    return ticket;
  }

  /**
   * Escalate a ticket to the next tier (called by scheduler or admin).
   */
  static async escalateTier(ticketId: string, tier: 1 | 2): Promise<void> {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return;

    ticket.escalationLevel = tier;
    ticket.escalatedAt = new Date();
    ticket.priority = tier === 2 ? SupportTicketPriority.Urgent : SupportTicketPriority.High;
    ticket.ticketStatus = SupportTicketStatus.Escalated;
    await ticket.save();

    const action =
      tier === 1 ? AuditAction.SupportTicketEscalatedTier1 : AuditAction.SupportTicketEscalatedTier2;

    await AuditService.log({
      entityType: 'support_ticket',
      entityId: ticket._id as Types.ObjectId,
      entityName: ticket.ticketNumber,
      action,
      category: AuditCategory.Support,
      source: AuditSource.System,
      metadata: { escalationLevel: tier },
    });
  }
}
