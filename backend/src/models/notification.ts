import { Schema, model, models, Document, Types, Model } from 'mongoose';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
  NotificationDeliveryChannel,
  NotificationDeliveryStatus,
} from './notificationEnums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface INotification {
  /** The user who receives this notification. */
  recipientId: Types.ObjectId;

  /** The user/system that triggered the notification (optional). */
  actorId?: Types.ObjectId;

  // ── Entity References ──────────────────────────────────────────────────────
  projectId?: Types.ObjectId;
  taskId?: Types.ObjectId;
  documentId?: Types.ObjectId;
  supportTicketId?: Types.ObjectId;
  /** Future-compatible: set by Batch 4.1 payment module. */
  invoiceId?: Types.ObjectId;
  /** Future-compatible: set by Batch 4.1 payment module. */
  paymentId?: Types.ObjectId;

  // ── Notification Content ───────────────────────────────────────────────────
  notificationType: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;

  title: string;
  message: string;
  /** Short version for notification bell dropdowns (max ~80 chars). */
  shortMessage?: string;

  /** Deep-link URL the user should be taken to on click. */
  actionUrl?: string;
  /** Label for the action link, e.g. "View Project". */
  actionLabel?: string;

  // ── Delivery ───────────────────────────────────────────────────────────────
  deliveryChannel: NotificationDeliveryChannel;
  deliveryStatus: NotificationDeliveryStatus;

  // ── Read / Dismiss Lifecycle ───────────────────────────────────────────────
  isRead: boolean;
  readAt?: Date;
  isDismissed: boolean;
  dismissedAt?: Date;

  // ── Visibility / Access Control ───────────────────────────────────────────
  /** When true, this notification is visible in the client portal. */
  visibleToClient: boolean;
  /** When true, this notification must NEVER be returned to client-role queries. */
  internalOnly: boolean;

  // ── Extensible Metadata ───────────────────────────────────────────────────
  /** Additional key-value context (e.g. invoice amount, old status, new status). */
  metadata?: Record<string, unknown>;
  tags?: string[];

  // ── Audit ─────────────────────────────────────────────────────────────────
  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export type INotificationDocument = INotification & Document;
export type INotificationModel = Model<INotificationDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // Entity refs — all optional for loose coupling
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document' },
    supportTicketId: { type: Schema.Types.ObjectId, ref: 'SupportTicket' },
    invoiceId: { type: Schema.Types.ObjectId }, // Intentionally unrefed (Batch 4.1)
    paymentId: { type: Schema.Types.ObjectId }, // Intentionally unrefed (Batch 4.1)

    notificationType: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },

    category: {
      type: String,
      enum: Object.values(NotificationCategory),
      required: true,
    },

    priority: {
      type: String,
      enum: Object.values(NotificationPriority),
      default: NotificationPriority.Medium,
    },

    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    shortMessage: {
      type: String,
      maxlength: 120,
      trim: true,
    },

    actionUrl: {
      type: String,
      maxlength: 500,
    },

    actionLabel: {
      type: String,
      maxlength: 80,
    },

    deliveryChannel: {
      type: String,
      enum: Object.values(NotificationDeliveryChannel),
      default: NotificationDeliveryChannel.InApp,
    },

    deliveryStatus: {
      type: String,
      enum: Object.values(NotificationDeliveryStatus),
      default: NotificationDeliveryStatus.Delivered, // In-app always delivered on creation
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: { type: Date },

    isDismissed: {
      type: Boolean,
      default: false,
    },

    dismissedAt: { type: Date },

    visibleToClient: {
      type: Boolean,
      default: false,
    },

    internalOnly: {
      type: Boolean,
      default: false,
    },

    metadata: {
      type: Schema.Types.Mixed,
    },

    tags: {
      type: [String],
      default: [],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Primary unread-count query — the most frequent operation
notificationSchema.index({ recipientId: 1, isRead: 1, isDismissed: 1 });

// Notification feed with filters — paginated list
notificationSchema.index({ recipientId: 1, isDismissed: 1, createdAt: -1 });

// Category + priority filtering within a user's feed
notificationSchema.index({ recipientId: 1, category: 1, createdAt: -1 });

// Client-safe filtering — ensure internalOnly never leaks
notificationSchema.index({ recipientId: 1, internalOnly: 1, createdAt: -1 });

// Priority-based escalation queries (admin views)
notificationSchema.index({ priority: 1, isRead: 1, createdAt: -1 });

// Entity-linked lookups (e.g. "all notifications for project X")
notificationSchema.index({ projectId: 1, createdAt: -1 });
notificationSchema.index({ supportTicketId: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const Notification: INotificationModel =
  (models['Notification'] as INotificationModel | undefined) ??
  model<INotificationDocument>('Notification', notificationSchema);
