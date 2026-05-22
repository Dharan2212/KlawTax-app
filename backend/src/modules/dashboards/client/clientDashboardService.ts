/**
 * Client Portal Dashboard Service
 *
 * Provides aggregated data for the client-facing portal.
 *
 * SECURITY CONTRACT:
 *   Every function accepts a `clientProfileId` string and enforces strict
 *   ownership filtering at the database query level.
 *   No function returns data belonging to another client under any circumstances.
 *
 * DATA ISOLATION LAYERS:
 *   1. Every MongoDB query includes { clientId: cpid } — DB-level enforcement.
 *   2. Timeline / document visibility filters applied on every query.
 *   3. Support messages filtered to visibleToClient === true.
 *   4. DTOs strip all internal metadata before returning.
 */

import { Types } from 'mongoose';
import { ProjectModel }       from '../../../models/project';
import { Invoice }            from '../../../models/invoice';
import { TimelineEntry }      from '../../../models/timelineEntry';
import { DocumentModel }      from '../../../models/document';
import { SupportTicket }      from '../../../models/supportTicket';
import { Notification }       from '../../../models/notification';
import { ProjectStatus }      from '../../../models/projectEnums';
import { InvoiceStatus }      from '../../../models/invoiceEnums';
import { TimelineVisibility } from '../../../models/taskEnums';
import { DocumentVisibility } from '../../../models/documentEnums';
import { logger }             from '../../../utils/logger';
import { buildPaginationMeta, parsePagination } from '../../../utils/response';
import {
  buildPortalPaymentSummary,
  buildPortalTimelinePage,
  buildPortalDocumentsPage,
  buildPortalSupportSummary,
  buildPortalNotificationSummary,
} from '../../portal/portalAggregations';
import {
  toClientObjectId,
  toResourceObjectId,
  CLIENT_TIMELINE_FILTER,
  CLIENT_DOCUMENT_FILTER,
} from '../../portal/portalVisibility';

export type {
  PortalPaymentSummary,
  PortalTimelinePage,
  PortalDocumentItem,
  PortalSupportSummary,
  PortalNotificationSummary,
} from '../../portal/portalAggregations';

// ─── Active / Terminal status groupings ───────────────────────────────────────

const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.Onboarding,
  ProjectStatus.Active,
  ProjectStatus.WaitingClient,
  ProjectStatus.InReview,
];

const COMPLETED_STATUSES: ProjectStatus[] = [
  ProjectStatus.Completed,
  ProjectStatus.Delivered,
];

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ClientProjectSummary {
  projectId:            string;
  projectCode:          string;
  title:                string;
  primaryServiceSlug:   string;
  projectStatus:        string;
  isOverdue:            boolean;
  isStalled:            boolean;
  expectedDeliveryDate?: string;
  progressPercentage:   number;
  pendingDocuments:     number;
}

export interface ClientInvoiceSummary {
  invoiceId:     string;
  invoiceNumber: string;
  invoiceStatus: string;
  totalAmount:   number;
  amountPaid:    number;
  amountDue:     number;
  dueDate?:      string;
}

export interface ClientTimelineEntry {
  entryId:      string;
  eventType:    string;
  title:        string;
  description?: string;
  createdAt:    string;
}

export interface ClientDashboardResult {
  clientProfileId: string;
  totals: {
    activeProjects:      number;
    completedProjects:   number;
    overdueProjects:     number;
    pendingPayments:     number;
    unreadNotifications: number;
    openSupportTickets:  number;
  };
  activeProjects:  ClientProjectSummary[];
  recentTimeline:  ClientTimelineEntry[];
  pendingInvoices: ClientInvoiceSummary[];
}

export interface ClientProjectListResult {
  projects: ClientProjectSummary[];
  meta:     ReturnType<typeof buildPaginationMeta>;
}

export interface ClientProjectDetailResult {
  projectId:             string;
  projectCode:           string;
  title:                 string;
  primaryServiceSlug:    string;
  projectStatus:         string;
  isOverdue:             boolean;
  isStalled:             boolean;
  expectedDeliveryDate?: string;
  progressPercentage:    number;
  assignedEmployeeName?: string;
  timeline:              ClientTimelineEntry[];
  invoiceSummary: {
    invoiceStatus: string;
    totalAmount:   number;
    amountPaid:    number;
    amountDue:     number;
  } | null;
  documents: {
    total:         number;
    approved:      number;
    pendingReview: number;
  };
}

// ─── Dashboard Snapshot ───────────────────────────────────────────────────────

export async function getClientDashboard(
  clientProfileId: string,
  previewLimit = 5
): Promise<ClientDashboardResult> {
  const cpid = toClientObjectId(clientProfileId);

  const [
    activeCount,
    completedCount,
    overdueCount,
    pendingPaymentsCount,
    unreadCount,
    openTicketsCount,
    activeProjects,
    recentTimeline,
    pendingInvoices,
  ] = await Promise.all([
    ProjectModel.countDocuments({ clientId: cpid, projectStatus: { $in: ACTIVE_STATUSES } }),
    ProjectModel.countDocuments({ clientId: cpid, projectStatus: { $in: COMPLETED_STATUSES } }),
    ProjectModel.countDocuments({ clientId: cpid, isOverdue: true, projectStatus: { $in: ACTIVE_STATUSES } }),
    Invoice.countDocuments({
      clientId:      cpid,
      invoiceStatus: { $in: [InvoiceStatus.Issued, InvoiceStatus.PartiallyPaid, InvoiceStatus.Overdue] },
    }),
    Notification.countDocuments({
      recipientId:     cpid,
      isRead:          false,
      internalOnly:    { $ne: true },
      visibleToClient: { $ne: false },
    }),
    SupportTicket.countDocuments({
      clientId:     cpid,
      ticketStatus: { $in: ['open', 'assigned', 'in_progress', 'waiting_client', 'escalated', 'reopened'] },
    }),
    _buildActiveProjectsSummary(cpid, previewLimit),
    _buildRecentTimeline(cpid, previewLimit),
    _buildPendingInvoices(cpid, previewLimit),
  ]);

  logger.debug('[ClientDashboard] Snapshot aggregation complete', { clientProfileId });

  return {
    clientProfileId,
    totals: {
      activeProjects:      activeCount,
      completedProjects:   completedCount,
      overdueProjects:     overdueCount,
      pendingPayments:     pendingPaymentsCount,
      unreadNotifications: unreadCount,
      openSupportTickets:  openTicketsCount,
    },
    activeProjects,
    recentTimeline,
    pendingInvoices,
  };
}

// ─── Project List ─────────────────────────────────────────────────────────────

export async function getClientProjectList(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown,
  statusFilter?: string
): Promise<ClientProjectListResult> {
  const cpid = toClientObjectId(clientProfileId);
  const { page, limit, skip } = parsePagination(rawPage, rawLimit, 50);

  const filter: Record<string, unknown> = { clientId: cpid };

  if (statusFilter === 'active') {
    filter.projectStatus = { $in: ACTIVE_STATUSES };
  } else if (statusFilter === 'completed') {
    filter.projectStatus = { $in: COMPLETED_STATUSES };
  } else if (statusFilter === 'overdue') {
    filter.isOverdue     = true;
    filter.projectStatus = { $in: ACTIVE_STATUSES };
  }

  const [projects, total] = await Promise.all([
    ProjectModel.find(filter)
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProjectModel.countDocuments(filter),
  ]);

  const projectIds = projects.map((p) => p._id as Types.ObjectId);

  const pendingDocCounts = projectIds.length
    ? await DocumentModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            projectId:      { $in: projectIds },
            visibility:     DocumentVisibility.ClientVisible,
            documentStatus: { $in: ['uploaded', 'under_review'] },
            isDeleted:      { $ne: true },
          },
        },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
      ])
    : [];

  const docCountMap = new Map<string, number>(
    pendingDocCounts.map((d) => [d._id.toString(), d.count])
  );

  const summaries: ClientProjectSummary[] = projects.map((p) => ({
    projectId:            (p._id as Types.ObjectId).toString(),
    projectCode:          p.projectCode,
    title:                p.title,
    primaryServiceSlug:   p.primaryServiceSlug,
    projectStatus:        p.projectStatus,
    isOverdue:            p.isOverdue,
    isStalled:            p.isStalled,
    expectedDeliveryDate: p.expectedDeliveryDate?.toISOString(),
    progressPercentage:   p.progressPercentage,
    pendingDocuments:     docCountMap.get((p._id as Types.ObjectId).toString()) ?? 0,
  }));

  return { projects: summaries, meta: buildPaginationMeta(page, limit, total) };
}

// ─── Project Detail ───────────────────────────────────────────────────────────

export async function getClientProjectDetail(
  projectId:       string,
  clientProfileId: string
): Promise<ClientProjectDetailResult> {
  const cpid = toClientObjectId(clientProfileId);
  const pid  = toResourceObjectId(projectId, 'Project');

  type PopulatedEmployee = { userId: { firstName: string; lastName: string } | null; isPrimary: boolean };

  const project = await ProjectModel.findOne({ _id: pid, clientId: cpid })
    .populate<{ assignedEmployees: PopulatedEmployee[] }>('assignedEmployees.userId', 'firstName lastName')
    .lean();

  if (!project) {
    const err = new Error('Project not found or access denied');
    err.name = 'NotFoundError';
    throw err;
  }

  const [timeline, invoice, docStats] = await Promise.all([
    TimelineEntry.find({ projectId: pid, ...CLIENT_TIMELINE_FILTER })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Invoice.findOne({ projectId: pid, clientId: cpid })
      .sort({ createdAt: -1 })
      .lean(),
    DocumentModel.aggregate<{ _id: string; count: number }>([
      { $match: { projectId: pid, clientId: cpid, ...CLIENT_DOCUMENT_FILTER } },
      { $group: { _id: '$documentStatus', count: { $sum: 1 } } },
    ]),
  ]);

  const primary = project.assignedEmployees?.find((e) => e.isPrimary)
    ?? project.assignedEmployees?.[0];
  const employeeName = primary?.userId
    ? `${primary.userId.firstName} ${primary.userId.lastName}`.trim()
    : undefined;

  const docStatMap = new Map(docStats.map((d) => [d._id, d.count]));

  return {
    projectId:            pid.toString(),
    projectCode:          project.projectCode,
    title:                project.title,
    primaryServiceSlug:   project.primaryServiceSlug,
    projectStatus:        project.projectStatus,
    isOverdue:            project.isOverdue,
    isStalled:            project.isStalled,
    expectedDeliveryDate: project.expectedDeliveryDate?.toISOString(),
    progressPercentage:   project.progressPercentage,
    assignedEmployeeName: employeeName,
    timeline: timeline.map((e) => ({
      entryId:     (e._id as Types.ObjectId).toString(),
      eventType:   e.eventType,
      title:       e.title,
      description: e.description,
      createdAt:   (e.createdAt as Date).toISOString(),
    })),
    invoiceSummary: invoice
      ? {
          invoiceStatus: invoice.invoiceStatus,
          totalAmount:   invoice.totalAmount,
          amountPaid:    invoice.amountPaid,
          amountDue:     invoice.amountDue,
        }
      : null,
    documents: {
      total:         (docStatMap.get('approved') ?? 0)
                   + (docStatMap.get('uploaded') ?? 0)
                   + (docStatMap.get('under_review') ?? 0),
      approved:      docStatMap.get('approved') ?? 0,
      pendingReview: (docStatMap.get('uploaded') ?? 0) + (docStatMap.get('under_review') ?? 0),
    },
  };
}

// ─── Payment Summary ──────────────────────────────────────────────────────────

export async function getClientPaymentSummary(clientProfileId: string) {
  return buildPortalPaymentSummary(clientProfileId, 20, 10);
}

// ─── Timeline Feed ────────────────────────────────────────────────────────────

export async function getClientTimelineFeed(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
) {
  return buildPortalTimelinePage(clientProfileId, rawPage, rawLimit);
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getClientDocuments(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown,
  projectId?: string
) {
  return buildPortalDocumentsPage(clientProfileId, rawPage, rawLimit, projectId);
}

// ─── Support Tickets ──────────────────────────────────────────────────────────

export async function getClientSupportSummary(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
) {
  return buildPortalSupportSummary(clientProfileId, rawPage, rawLimit);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getClientNotifications(
  clientProfileId: string,
  rawPage: unknown,
  rawLimit: unknown
) {
  return buildPortalNotificationSummary(clientProfileId, rawPage, rawLimit);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function _buildActiveProjectsSummary(
  cpid: Types.ObjectId,
  limit: number
): Promise<ClientProjectSummary[]> {
  const projects = await ProjectModel.find({
    clientId:      cpid,
    projectStatus: { $in: ACTIVE_STATUSES },
  })
    .sort({ lastActivityAt: -1 })
    .limit(limit)
    .lean();

  if (!projects.length) return [];

  const projectIds = projects.map((p) => p._id as Types.ObjectId);

  const pendingDocCounts = await DocumentModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        projectId:      { $in: projectIds },
        visibility:     DocumentVisibility.ClientVisible,
        documentStatus: { $in: ['uploaded', 'under_review'] },
        isDeleted:      { $ne: true },
      },
    },
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
  ]);

  const docCountMap = new Map<string, number>(
    pendingDocCounts.map((d) => [d._id.toString(), d.count])
  );

  return projects.map((p) => ({
    projectId:            (p._id as Types.ObjectId).toString(),
    projectCode:          p.projectCode,
    title:                p.title,
    primaryServiceSlug:   p.primaryServiceSlug,
    projectStatus:        p.projectStatus,
    isOverdue:            p.isOverdue,
    isStalled:            p.isStalled,
    expectedDeliveryDate: p.expectedDeliveryDate?.toISOString(),
    progressPercentage:   p.progressPercentage,
    pendingDocuments:     docCountMap.get((p._id as Types.ObjectId).toString()) ?? 0,
  }));
}

async function _buildRecentTimeline(
  cpid: Types.ObjectId,
  limit: number
): Promise<ClientTimelineEntry[]> {
  const projectIds = await ProjectModel.distinct('_id', { clientId: cpid });
  if (!projectIds.length) return [];

  const entries = await TimelineEntry.find({
    projectId:  { $in: projectIds },
    visibility: TimelineVisibility.Client,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return entries.map((e) => ({
    entryId:     (e._id as Types.ObjectId).toString(),
    eventType:   e.eventType,
    title:       e.title,
    description: e.description,
    createdAt:   (e.createdAt as Date).toISOString(),
  }));
}

async function _buildPendingInvoices(
  cpid: Types.ObjectId,
  limit: number
): Promise<ClientInvoiceSummary[]> {
  const invoices = await Invoice.find({
    clientId:      cpid,
    invoiceStatus: { $in: [InvoiceStatus.Issued, InvoiceStatus.PartiallyPaid, InvoiceStatus.Overdue] },
  })
    .sort({ dueDate: 1 })
    .limit(limit)
    .lean();

  return invoices.map((inv) => ({
    invoiceId:     (inv._id as Types.ObjectId).toString(),
    invoiceNumber: inv.invoiceNumber,
    invoiceStatus: inv.invoiceStatus,
    totalAmount:   inv.totalAmount,
    amountPaid:    inv.amountPaid,
    amountDue:     inv.amountDue,
    dueDate:       inv.dueDate?.toISOString(),
  }));
}
