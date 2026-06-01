import { Types, FilterQuery } from 'mongoose';
import { Notification, INotificationDocument } from '../../models/notification';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryChannel,
} from '../../models/notificationEnums';
import { parsePagination, buildPaginationMeta, PaginationMeta } from '../../utils/response';
import { logger } from '../../utils/logger';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateNotificationDTO {
  recipientId: Types.ObjectId | string;
  actorId?: Types.ObjectId | string;
  notificationType: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  shortMessage?: string;
  actionUrl?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
  deliveryChannel?: NotificationDeliveryChannel;
  visibleToClient?: boolean;
  internalOnly?: boolean;
  projectId?: Types.ObjectId | string;
  taskId?: Types.ObjectId | string;
  documentId?: Types.ObjectId | string;
  supportTicketId?: Types.ObjectId | string;
  /** Batch 4.1 compatible — pass as string to remain loosely coupled. */
  invoiceId?: string;
  paymentId?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdBy?: Types.ObjectId | string;
}

export interface NotificationFeedQuery {
  recipientId: string;
  isRead?: boolean;
  isDismissed?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  /** When true, exclude internalOnly notifications (enforced for client role). */
  excludeInternal?: boolean;
  /** When true, only return visibleToClient notifications (enforced for client role). */
  clientSafeOnly?: boolean;
  page?: unknown;
  limit?: unknown;
}

export interface NotificationFeedResult {
  notifications: INotificationDocument[];
  meta: PaginationMeta;
  unreadCount: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class NotificationService {
  /**
   * Create a single notification.
   * The primary entry point for all other modules to emit notifications.
   */
  static async create(dto: CreateNotificationDTO): Promise<INotificationDocument> {
    const toObjectId = (id?: Types.ObjectId | string) =>
      id ? new Types.ObjectId(id.toString()) : undefined;

    const doc = await Notification.create({
      recipientId: toObjectId(dto.recipientId)!,
      actorId: toObjectId(dto.actorId),
      notificationType: dto.notificationType,
      category: dto.category,
      title: dto.title,
      message: dto.message,
      shortMessage: dto.shortMessage,
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      priority: dto.priority ?? NotificationPriority.Medium,
      deliveryChannel: dto.deliveryChannel ?? NotificationDeliveryChannel.InApp,
      visibleToClient: dto.visibleToClient ?? false,
      internalOnly: dto.internalOnly ?? false,
      projectId: toObjectId(dto.projectId),
      taskId: toObjectId(dto.taskId),
      documentId: toObjectId(dto.documentId),
      supportTicketId: toObjectId(dto.supportTicketId),
      invoiceId: dto.invoiceId ? new Types.ObjectId(dto.invoiceId) : undefined,
      paymentId: dto.paymentId ? new Types.ObjectId(dto.paymentId) : undefined,
      metadata: dto.metadata,
      tags: dto.tags,
      createdBy: toObjectId(dto.createdBy),
    });

    logger.debug('[NotificationService] Notification created', {
      id: doc._id,
      recipientId: dto.recipientId,
      type: dto.notificationType,
    });

    return doc;
  }

  /**
   * Bulk-create notifications (e.g. notify multiple recipients at once).
   */
  static async bulkCreate(dtos: CreateNotificationDTO[]): Promise<number> {
    if (dtos.length === 0) return 0;

    const toObjectId = (id?: Types.ObjectId | string) =>
      id ? new Types.ObjectId(id.toString()) : undefined;

    const docs = dtos.map((dto) => ({
      recipientId: toObjectId(dto.recipientId)!,
      actorId: toObjectId(dto.actorId),
      notificationType: dto.notificationType,
      category: dto.category,
      title: dto.title,
      message: dto.message,
      shortMessage: dto.shortMessage,
      actionUrl: dto.actionUrl,
      actionLabel: dto.actionLabel,
      priority: dto.priority ?? NotificationPriority.Medium,
      deliveryChannel: dto.deliveryChannel ?? NotificationDeliveryChannel.InApp,
      visibleToClient: dto.visibleToClient ?? false,
      internalOnly: dto.internalOnly ?? false,
      projectId: toObjectId(dto.projectId),
      taskId: toObjectId(dto.taskId),
      documentId: toObjectId(dto.documentId),
      supportTicketId: toObjectId(dto.supportTicketId),
      metadata: dto.metadata,
      tags: dto.tags,
      createdBy: toObjectId(dto.createdBy),
    }));

    const result = await Notification.insertMany(docs, { ordered: false });
    return result.length;
  }

  // ── Read/Unread Lifecycle ──────────────────────────────────────────────────

  /** Get the unread notification count for a user. */
  static async getUnreadCount(
    recipientId: string,
    options: { clientSafeOnly?: boolean } = {}
  ): Promise<number> {
    const filter: FilterQuery<INotificationDocument> = {
      recipientId: new Types.ObjectId(recipientId),
      isRead: false,
      isDismissed: false,
    };

    if (options.clientSafeOnly) {
      filter.internalOnly = false;
      filter.visibleToClient = true;
    }

    return Notification.countDocuments(filter);
  }

  /** Mark a single notification as read. */
  static async markRead(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(recipientId),
        isRead: false,
      },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  /** Mark all unread notifications for a user as read. */
  static async markAllRead(
    recipientId: string,
    options: { category?: NotificationCategory } = {}
  ): Promise<number> {
    const filter: FilterQuery<INotificationDocument> = {
      recipientId: new Types.ObjectId(recipientId),
      isRead: false,
      isDismissed: false,
    };

    if (options.category) filter.category = options.category;

    const result = await Notification.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });

    return result.modifiedCount;
  }

  /** Dismiss (soft-delete from feed) a single notification. */
  static async dismiss(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await Notification.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(recipientId),
      },
      { $set: { isDismissed: true, dismissedAt: new Date(), isRead: true, readAt: new Date() } }
    );

    return result.modifiedCount > 0;
  }

  /** Dismiss all notifications for a user (clear all). */
  static async dismissAll(recipientId: string): Promise<number> {
    const result = await Notification.updateMany(
      {
        recipientId: new Types.ObjectId(recipientId),
        isDismissed: false,
      },
      { $set: { isDismissed: true, dismissedAt: new Date() } }
    );

    return result.modifiedCount;
  }

  // ── Feed ──────────────────────────────────────────────────────────────────

  /** Paginated notification feed for a user. */
  static async getFeed(query: NotificationFeedQuery): Promise<NotificationFeedResult> {
    const { page, limit, skip } = parsePagination(query.page, query.limit, 50);

    const filter: FilterQuery<INotificationDocument> = {
      recipientId: new Types.ObjectId(query.recipientId),
    };

    // Dismissed filter — default: exclude dismissed
    if (query.isDismissed !== undefined) {
      filter.isDismissed = query.isDismissed;
    } else {
      filter.isDismissed = false;
    }

    // Read filter (optional)
    if (query.isRead !== undefined) filter.isRead = query.isRead;

    // Category filter
    if (query.category) filter.category = query.category;

    // Priority filter
    if (query.priority) filter.priority = query.priority;

    // Client-safe enforcement: never leak internal-only to clients
    if (query.clientSafeOnly) {
      filter.internalOnly = false;
      filter.visibleToClient = true;
    } else if (query.excludeInternal) {
      filter.internalOnly = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipientId: new Types.ObjectId(query.recipientId),
        isRead: false,
        isDismissed: false,
        ...(query.clientSafeOnly ? { internalOnly: false, visibleToClient: true } : {}),
      }),
    ]);

    return {
      notifications: notifications as unknown as INotificationDocument[],
      meta: buildPaginationMeta(page, limit, total),
      unreadCount,
    };
  }
}
