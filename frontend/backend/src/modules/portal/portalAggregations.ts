/**
 * Portal Aggregation Helpers
 *
 * Shared query builders and result mappers used across the client portal.
 * Kept small and composable — no business logic lives here, only data-shaping.
 */

import { Types } from 'mongoose';
import { Payment }       from '../../models/payment';
import { Invoice }       from '../../models/invoice';
import { DocumentModel } from '../../models/document';
import { TimelineEntry } from '../../models/timelineEntry';
import { Notification }  from '../../models/notification';
import { SupportTicket } from '../../models/supportTicket';
import { ProjectModel }  from '../../models/project';
import { InvoiceStatus, PaymentStatus } from '../../models/invoiceEnums';
import {
  CLIENT_TIMELINE_FILTER,
  CLIENT_DOCUMENT_FILTER,
  buildClientNotificationFilter,
  filterClientMessages,
  toClientObjectId,
} from './portalVisibility';
import { buildPaginationMeta, parsePagination } from '../../utils/response';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortalPaymentSummary {
  totalInvoiced:    number;
  totalPaid:        number;
  totalOutstanding: number;
  invoices: Array<{
    invoiceId:     string;
    invoiceNumber: string;
    invoiceStatus: string;
    totalAmount:   number;
    amountPaid:    number;
    amountDue:     number;
    dueDate?:      string;
    projectTitle?: string;
  }>;
  recentPayments: Array<{
    paymentId:     string;
    amount:        number; // in rupees (converted from paise)
    paymentStatus: string;
    paymentMethod: string;
    capturedAt?:   string;
    invoiceNumber: string;
  }>;
}

export interface PortalTimelinePage {
  entries: Array<{
    entryId:     string;
    eventType:   string;
    title:       string;
    description?: string;
    projectCode: string;
    projectTitle: string;
    createdAt:   string;
  }>;
  meta: ReturnType<typeof buildPaginationMeta>;
}

export interface PortalDocumentItem {
  documentId:      string;
  title:           string;
  fileName:        string;
  mimeType:        string;
  fileSizeBytes:   number;
  documentCategory: string;
  documentStatus:  string;
  versionNumber:   number;
  projectCode:     string;
  projectTitle:    string;
  uploadedAt:      string;
}

export interface PortalSupportSummary {
  openCount:      number;
  resolvedCount:  number;
  escalatedCount: number;
  tickets: Array<{
    ticketId:      string;
    ticketNumber:  string;
    subject:       string;
    category:      string;
    ticketStatus:  string;
    priority:      string;
    escalationLevel: number;
    lastResponseAt?: string;
    createdAt:     string;
    unreadReplies: number;
    relatedProjectCode?: string;
  }>;
  meta: ReturnType<typeof buildPaginationMeta>;
}

export interface PortalNotificationSummary {
  unreadCount:    number;
  notifications: Array<{
    notificationId: string;
    title:          string;
    message:        string;
    notificationType: string;
    priority:       string;
    isRead:         boolean;
    actionUrl?:     string;
    createdAt:      string;
  }>;
  meta: ReturnType<typeof buildPaginationMeta>;
}

// ─── Payment Summary ──────────────────────────────────────────────────────────

export async function buildPortalPaymentSummary(
  clientProfileId: string,
  invoiceLimit = 10,
  paymentLimit = 5
): Promise<PortalPaymentSummary> {
  const cpid = toClientObjectId(clientProfileId);

  // All non-cancelled invoices for aggregation totals
  const invoices = await Invoice.find({
    clientId:      cpid,
    invoiceStatus: { $nin: [InvoiceStatus.Cancelled] },
  })
    .sort({ createdAt: -1 })
    .limit(invoiceLimit)
    .populate<{ projectId: { projectCode: string; title: string } | null }>('projectId', 'projectCode title')
    .lean();

  // Financial totals
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid     = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + Math.max(0, inv.amountDue), 0);

  // Recent captured payments
  const recentPayments = await Payment.find({
    clientId:      cpid,
    paymentStatus: PaymentStatus.Captured,
  })
    .sort({ verifiedAt: -1 })
    .limit(paymentLimit)
    .populate<{ invoiceId: { invoiceNumber: string } | null }>('invoiceId', 'invoiceNumber')
    .lean();

  return {
    totalInvoiced,
    totalPaid,
    totalOutstanding,
    invoices: invoices.map((inv) => ({
      invoiceId:     (inv._id as Types.ObjectId).toString(),
      invoiceNumber: inv.invoiceNumber,
      invoiceStatus: inv.invoiceStatus,
      totalAmount:   inv.totalAmount,
      amountPaid:    inv.amountPaid,
      amountDue:     inv.amountDue,
      dueDate:       inv.dueDate?.toISOString(),
      projectTitle:  (inv.projectId as { projectCode: string; title: string } | null)?.title,
    })),
    recentPayments: recentPayments.map((pay) => ({
      paymentId:     (pay._id as Types.ObjectId).toString(),
      amount:        Math.round(pay.amount / 100), // paise → rupees
      paymentStatus: pay.paymentStatus,
      paymentMethod: pay.paymentMethod,
      capturedAt:    pay.verifiedAt?.toISOString(),
      invoiceNumber: (pay.invoiceId as { invoiceNumber: string } | null)?.invoiceNumber ?? '',
    })),
  };
}

// ─── Timeline Page ────────────────────────────────────────────────────────────

export async function buildPortalTimelinePage(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
): Promise<PortalTimelinePage> {
  const cpid = toClientObjectId(clientProfileId);
  const { page, limit, skip } = parsePagination(rawPage, rawLimit, 50);

  // Scope to client's projects
  const projectIds = await ProjectModel.distinct('_id', { clientId: cpid });
  if (!projectIds.length) {
    return { entries: [], meta: buildPaginationMeta(page, limit, 0) };
  }

  const [entries, total] = await Promise.all([
    TimelineEntry.find({ projectId: { $in: projectIds }, ...CLIENT_TIMELINE_FILTER })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ projectId: { projectCode: string; title: string } | null }>(
        'projectId',
        'projectCode title'
      )
      .lean(),
    TimelineEntry.countDocuments({
      projectId: { $in: projectIds },
      ...CLIENT_TIMELINE_FILTER,
    }),
  ]);

  return {
    entries: entries.map((e) => ({
      entryId:      (e._id as Types.ObjectId).toString(),
      eventType:    e.eventType,
      title:        e.title,
      description:  e.description,
      projectCode:  (e.projectId as { projectCode: string; title: string } | null)?.projectCode ?? '',
      projectTitle: (e.projectId as { projectCode: string; title: string } | null)?.title ?? '',
      createdAt:    (e.createdAt as Date).toISOString(),
    })),
    meta: buildPaginationMeta(page, limit, total),
  };
}

// ─── Documents Page ───────────────────────────────────────────────────────────

export async function buildPortalDocumentsPage(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown,
  projectId?: string
): Promise<{ documents: PortalDocumentItem[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const cpid = toClientObjectId(clientProfileId);
  const { page, limit, skip } = parsePagination(rawPage, rawLimit, 50);

  const filter: Record<string, unknown> = {
    clientId: cpid,
    ...CLIENT_DOCUMENT_FILTER,
    isLatestVersion: true,
  };

  if (projectId && Types.ObjectId.isValid(projectId)) {
    filter.projectId = new Types.ObjectId(projectId);
  }

  const [docs, total] = await Promise.all([
    DocumentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ projectId: { projectCode: string; title: string } | null }>(
        'projectId',
        'projectCode title'
      )
      .lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return {
    documents: docs.map((d) => ({
      documentId:       (d._id as Types.ObjectId).toString(),
      title:            d.title,
      fileName:         d.fileName,
      mimeType:         d.mimeType,
      fileSizeBytes:    d.fileSizeBytes,
      documentCategory: d.documentCategory,
      documentStatus:   d.documentStatus,
      versionNumber:    d.versionNumber,
      projectCode:      (d.projectId as { projectCode: string; title: string } | null)?.projectCode ?? '',
      projectTitle:     (d.projectId as { projectCode: string; title: string } | null)?.title ?? '',
      uploadedAt:       (d.createdAt as Date).toISOString(),
    })),
    meta: buildPaginationMeta(page, limit, total),
  };
}

// ─── Support Summary ──────────────────────────────────────────────────────────

export async function buildPortalSupportSummary(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
): Promise<PortalSupportSummary> {
  const cpid = toClientObjectId(clientProfileId);
  const { page, limit, skip } = parsePagination(rawPage, rawLimit, 20);

  const OPEN_STATUSES   = ['open', 'assigned', 'in_progress', 'waiting_client', 'reopened'];
  const ESCALATED_STATUS = 'escalated';
  const RESOLVED_STATUSES = ['resolved', 'closed'];

  const [openCount, resolvedCount, escalatedCount, tickets, total] = await Promise.all([
    SupportTicket.countDocuments({ clientId: cpid, ticketStatus: { $in: OPEN_STATUSES } }),
    SupportTicket.countDocuments({ clientId: cpid, ticketStatus: { $in: RESOLVED_STATUSES } }),
    SupportTicket.countDocuments({ clientId: cpid, ticketStatus: ESCALATED_STATUS }),
    SupportTicket.find({ clientId: cpid })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ relatedProjectId: { projectCode: string } | null }>(
        'relatedProjectId',
        'projectCode'
      )
      .lean(),
    SupportTicket.countDocuments({ clientId: cpid }),
  ]);

  return {
    openCount,
    resolvedCount,
    escalatedCount,
    tickets: tickets.map((t) => {
      const clientMessages = filterClientMessages(t.messages ?? []);
      const unreadReplies  = clientMessages.filter(
        (m) => m.senderRole !== 'client' && m.sentAt > (t.firstResponseAt ?? t.createdAt as Date)
      ).length;
      return {
        ticketId:      (t._id as Types.ObjectId).toString(),
        ticketNumber:  t.ticketNumber,
        subject:       t.subject,
        category:      t.category,
        ticketStatus:  t.ticketStatus,
        priority:      t.priority,
        escalationLevel: t.escalationLevel,
        lastResponseAt:  t.lastResponseAt?.toISOString(),
        createdAt:     (t.createdAt as Date).toISOString(),
        unreadReplies,
        relatedProjectCode: (t.relatedProjectId as { projectCode: string } | null)?.projectCode,
      };
    }),
    meta: buildPaginationMeta(page, limit, total),
  };
}

// ─── Notification Summary ─────────────────────────────────────────────────────

export async function buildPortalNotificationSummary(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
): Promise<PortalNotificationSummary> {
  const cpid = toClientObjectId(clientProfileId);
  const { page, limit, skip } = parsePagination(rawPage, rawLimit, 30);

  const baseFilter = buildClientNotificationFilter(cpid);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(baseFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(baseFilter),
    Notification.countDocuments({ ...baseFilter, isRead: false }),
  ]);

  return {
    unreadCount,
    notifications: notifications.map((n) => ({
      notificationId:   (n._id as Types.ObjectId).toString(),
      title:            n.title,
      message:          n.message,
      notificationType: n.notificationType,
      priority:         n.priority,
      isRead:           n.isRead,
      actionUrl:        n.actionUrl,
      createdAt:        (n.createdAt as Date).toISOString(),
    })),
    meta: buildPaginationMeta(page, limit, total),
  };
}
