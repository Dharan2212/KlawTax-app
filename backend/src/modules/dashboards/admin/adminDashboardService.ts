/**
 * Admin Dashboard Service — Batch 5.1
 *
 * Aggregates metrics from existing KlawTax domain collections.
 * Does NOT replicate business logic — reads from collections only.
 *
 * Design rules:
 *   - All paise amounts are integers throughout (no floating-point math)
 *   - No `any` — all aggregation results are typed with local interfaces
 *   - Each section is its own async function for testability
 *   - buildAdminDashboard() runs all sections in parallel
 */

import { Types } from 'mongoose';

import { ProjectModel }  from '../../../models/project';
import { Task }          from '../../../models/task';
import { Lead }          from '../../../models/lead';
import { ApprovalModel } from '../../../models/approval';
import { Invoice }       from '../../../models/invoice';
import { Payment }       from '../../../models/payment';
import { SupportTicket } from '../../../models/supportTicket';
import { ExportJob }     from '../../../models/exportJob';
import { User }          from '../../../models/user';
import { ClientProfile } from '../../../models/clientProfile';

import { ProjectStatus, ACTIVE_WORK_STATUSES } from '../../../models/projectEnums';
import { InvoiceStatus, PaymentStatus }         from '../../../models/invoiceEnums';
import { LeadStatus, ACTIVE_LEAD_STATUSES }     from '../../../models/leadEnums';
import { ApprovalStatus }                       from '../../../models/documentEnums';
import { TaskStatus }                           from '../../../models/taskEnums';

import type {
  AdminDashboardQuery,
  AdminDashboardResponse,
  DashboardPeriod,
  ResolvedDateRange,
  RevenueSummary,
  OverdueProjectsSummary,
  OverdueProjectPreview,
  OverdueAgeBucket,
  PendingApprovalsSummary,
  PendingApprovalPreview,
  LeadMetricsSummary,
  WorkloadSummary,
  EmployeeWorkloadItem,
  RecentActivitySummary,
  ClientStatsSummary,
  FollowUpCounts,
} from './adminDashboardTypes';

// ─── Internal aggregation result interfaces ───────────────────────────────────

interface StatusCountRow {
  _id:   string;
  count: number;
}

interface InvoiceStatusRow {
  _id:         string;
  totalAmount: number;
  amountPaid:  number;
  count:       number;
}

interface CollectedRow {
  _id:   null;
  total: number;
}

interface EmployeeProjectRow {
  _id:            Types.ObjectId;
  activeProjects: number;
  inReview:       number;
}

interface EmployeeTaskRow {
  _id:          Types.ObjectId;
  activeTasks:  number;
  overdueTasks: number;
  blockedTasks: number;
}

interface TrendRow {
  _id:   string;
  count: number;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function resolveDateRange(
  period: DashboardPeriod,
  fromStr?: string,
  toStr?:   string,
): ResolvedDateRange {
  const now = new Date();

  if (period === 'custom' && fromStr && toStr) {
    return { from: new Date(fromStr), to: new Date(toStr) };
  }

  const from = new Date(now);
  switch (period) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(from.getDate() - 7);
      break;
    case 'quarter':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    default: // 'month'
      from.setDate(from.getDate() - 30);
  }
  return { from, to: now };
}

function daysAgo(n: number): Date {
  const d = new Date();
  if (n === 0) { d.setHours(0, 0, 0, 0); return d; }
  d.setDate(d.getDate() - n);
  return d;
}

// ─── 1. Revenue ───────────────────────────────────────────────────────────────

async function buildRevenueSummary(dateRange: ResolvedDateRange): Promise<RevenueSummary> {
  // Invoice aggregation — all status rows in one pass
  const invoiceRows = (await Invoice.aggregate([
    {
      $group: {
        _id:         '$invoiceStatus',
        totalAmount: { $sum: '$totalAmount' },
        amountPaid:  { $sum: '$amountPaid' },
        count:       { $sum: 1 },
      },
    },
  ])) as InvoiceStatusRow[];

  const byInv: Record<string, InvoiceStatusRow> = {};
  for (const r of invoiceRows) {
    if (r._id) byInv[r._id] = r;
  }

  const inv = (s: InvoiceStatus): InvoiceStatusRow =>
    byInv[s] ?? { _id: s, totalAmount: 0, amountPaid: 0, count: 0 };

  const paid      = inv(InvoiceStatus.Paid);
  const partial   = inv(InvoiceStatus.PartiallyPaid);
  const overdue   = inv(InvoiceStatus.Overdue);
  const disputed  = inv(InvoiceStatus.Disputed);
  const issued    = inv(InvoiceStatus.Issued);
  const draft     = inv(InvoiceStatus.Draft);
  const cancelled = inv(InvoiceStatus.Cancelled);

  // Payment aggregation — captured amounts across windows
  const capturedMatch = { paymentStatus: PaymentStatus.Captured };

  const [totalRows, periodRows, todayRows, weekRows, monthRows] = await Promise.all([
    Payment.aggregate([
      { $match: capturedMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]) as Promise<CollectedRow[]>,

    Payment.aggregate([
      { $match: { ...capturedMatch, verifiedAt: { $gte: dateRange.from, $lte: dateRange.to } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]) as Promise<CollectedRow[]>,

    Payment.aggregate([
      { $match: { ...capturedMatch, verifiedAt: { $gte: daysAgo(0) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]) as Promise<CollectedRow[]>,

    Payment.aggregate([
      { $match: { ...capturedMatch, verifiedAt: { $gte: daysAgo(7) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]) as Promise<CollectedRow[]>,

    Payment.aggregate([
      { $match: { ...capturedMatch, verifiedAt: { $gte: daysAgo(30) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]) as Promise<CollectedRow[]>,
  ]);

  const outstanding = Math.max(0,
    (issued.totalAmount  - issued.amountPaid) +
    (partial.totalAmount - partial.amountPaid) +
    (overdue.totalAmount - overdue.amountPaid),
  );

  return {
    totalCollected:  totalRows[0]?.total  ?? 0,
    periodCollected: periodRows[0]?.total  ?? 0,
    todayCollected:  todayRows[0]?.total   ?? 0,
    weekCollected:   weekRows[0]?.total    ?? 0,
    monthCollected:  monthRows[0]?.total   ?? 0,
    byStatus: {
      paid:          paid.amountPaid,
      partiallyPaid: partial.amountPaid,
      overdue:       Math.max(0, overdue.totalAmount  - overdue.amountPaid),
      disputed:      Math.max(0, disputed.totalAmount - disputed.amountPaid),
      outstanding,
    },
    pendingAdvances: 0,
    invoiceCounts: {
      total:         invoiceRows.reduce((s, r) => s + r.count, 0),
      paid:          paid.count,
      partiallyPaid: partial.count,
      overdue:       overdue.count,
      disputed:      disputed.count,
      draft:         draft.count,
      cancelled:     cancelled.count,
    },
  };
}

// ─── 2. Overdue Projects ──────────────────────────────────────────────────────

async function buildOverdueProjectsSummary(limit: number): Promise<OverdueProjectsSummary> {
  const now = new Date();

  const [byStatusRows, byPriorityRows, stalledCount, previewDocs] = await Promise.all([
    ProjectModel.aggregate([
      { $match: { isOverdue: true } },
      { $group: { _id: '$projectStatus',  count: { $sum: 1 } } },
    ]) as Promise<StatusCountRow[]>,

    ProjectModel.aggregate([
      { $match: { isOverdue: true } },
      { $group: { _id: '$projectPriority', count: { $sum: 1 } } },
    ]) as Promise<StatusCountRow[]>,

    ProjectModel.countDocuments({ isStalled: true }),

    ProjectModel.find(
      { isOverdue: true },
      {
        projectCode:          1,
        projectStatus:        1,
        projectPriority:      1,
        expectedDeliveryDate: 1,
      },
    )
      .sort({ expectedDeliveryDate: 1 })
      .limit(limit)
      .lean(),
  ]);

  const total = byStatusRows.reduce((s, r) => s + r.count, 0);

  const byStatus: Record<string, number>   = {};
  for (const r of byStatusRows)   byStatus[r._id]   = r.count;

  const byPriority: Record<string, number> = {};
  for (const r of byPriorityRows) byPriority[r._id] = r.count;

  const ageBuckets: OverdueAgeBucket[] = [
    { label: '1–7 days',   count: 0 },
    { label: '8–14 days',  count: 0 },
    { label: '15–30 days', count: 0 },
    { label: '30+ days',   count: 0 },
  ];

  const preview: OverdueProjectPreview[] = previewDocs.map((p) => {
    const deliveryDate = p.expectedDeliveryDate as Date | undefined;
    const daysOverdue  = deliveryDate
      ? Math.max(0, Math.floor((now.getTime() - deliveryDate.getTime()) / 86_400_000))
      : 0;

    if      (daysOverdue <= 7)  ageBuckets[0].count++;
    else if (daysOverdue <= 14) ageBuckets[1].count++;
    else if (daysOverdue <= 30) ageBuckets[2].count++;
    else                        ageBuckets[3].count++;

    return {
      projectId:            String(p._id),
      projectNumber:        p.projectCode    as string,
      status:               p.projectStatus  as string,
      priority:             p.projectPriority as string,
      daysOverdue,
      expectedDeliveryDate: deliveryDate,
    };
  });

  return { total, byStatus, byPriority, ageBuckets, stalledCount, preview };
}

// ─── 3. Pending Approvals ─────────────────────────────────────────────────────

async function buildPendingApprovalsSummary(limit: number): Promise<PendingApprovalsSummary> {
  const now = new Date();

  const activePendingStatuses = [
    ApprovalStatus.Pending,
    ApprovalStatus.UnderReview,
    ApprovalStatus.RevisionRequested,
  ];

  const reviewOnlyStatuses = [
    ApprovalStatus.Pending,
    ApprovalStatus.UnderReview,
  ];

  const [byStatusRows, previewDocs, od1, od3, od7] = await Promise.all([
    ApprovalModel.aggregate([
      { $match: { approvalStatus: { $in: activePendingStatuses }, isDeleted: false } },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
    ]) as Promise<StatusCountRow[]>,

    ApprovalModel.find(
      { approvalStatus: { $in: activePendingStatuses }, isDeleted: false },
      {
        approvalType:      1,
        approvalStatus:    1,
        reviewPriority:    1,
        submittedAt:       1,
        resubmissionCount: 1,
      },
    )
      .sort({ reviewPriority: -1, submittedAt: 1 })
      .limit(limit)
      .lean(),

    ApprovalModel.countDocuments({
      approvalStatus: { $in: reviewOnlyStatuses },
      submittedAt:    { $lt: new Date(now.getTime() - 86_400_000) },
      isDeleted: false,
    }),
    ApprovalModel.countDocuments({
      approvalStatus: { $in: reviewOnlyStatuses },
      submittedAt:    { $lt: new Date(now.getTime() - 3 * 86_400_000) },
      isDeleted: false,
    }),
    ApprovalModel.countDocuments({
      approvalStatus: { $in: reviewOnlyStatuses },
      submittedAt:    { $lt: new Date(now.getTime() - 7 * 86_400_000) },
      isDeleted: false,
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const r of byStatusRows) statusMap[r._id] = r.count;

  const pending     = statusMap[ApprovalStatus.Pending]           ?? 0;
  const underReview = statusMap[ApprovalStatus.UnderReview]       ?? 0;
  const revisionReq = statusMap[ApprovalStatus.RevisionRequested] ?? 0;

  const preview: PendingApprovalPreview[] = previewDocs.map((a) => {
    const submittedAt = a.submittedAt as Date;
    const daysPending = Math.floor(
      (now.getTime() - submittedAt.getTime()) / 86_400_000,
    );
    return {
      approvalId:        String(a._id),
      approvalType:      a.approvalType      as string,
      priority:          a.reviewPriority    as string,
      submittedAt,
      daysPending,
      resubmissionCount: a.resubmissionCount as number,
    };
  });

  return {
    total:             pending + underReview + revisionReq,
    pending,
    underReview,
    revisionRequested: revisionReq,
    overdueByAge: {
      overOneDayCount:   od1,
      overThreeDayCount: od3,
      overSevenDayCount: od7,
    },
    preview,
  };
}

// ─── 4. Lead Metrics ──────────────────────────────────────────────────────────

async function buildLeadMetricsSummary(dateRange: ResolvedDateRange): Promise<LeadMetricsSummary> {
  const now = new Date();

  const [
    statusRows,
    periodNew,
    todayNew,
    weekNew,
    monthNew,
    followUpOverdue,
    unassigned,
    trendRows,
  ] = await Promise.all([
    Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]) as Promise<StatusCountRow[]>,

    Lead.countDocuments({ createdAt: { $gte: dateRange.from, $lte: dateRange.to } }),
    Lead.countDocuments({ createdAt: { $gte: daysAgo(0) } }),
    Lead.countDocuments({ createdAt: { $gte: daysAgo(7) } }),
    Lead.countDocuments({ createdAt: { $gte: daysAgo(30) } }),

    Lead.countDocuments({
      followUpDate: { $lt: now },
      status:       { $in: ACTIVE_LEAD_STATUSES },
    }),

    Lead.countDocuments({
      assignedTo: { $exists: false },
      status:     { $in: ACTIVE_LEAD_STATUSES },
    }),

    Lead.aggregate([
      { $match: { createdAt: { $gte: daysAgo(7) } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format:   '%Y-%m-%d',
              date:     '$createdAt',
              timezone: 'Asia/Kolkata',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]) as Promise<TrendRow[]>,
  ]);

  const sm: Partial<Record<LeadStatus, number>> = {};
  let total = 0;
  for (const r of statusRows) {
    sm[r._id as LeadStatus] = r.count;
    total += r.count;
  }
  const g = (s: LeadStatus): number => sm[s] ?? 0;

  const converted  = g(LeadStatus.Converted);
  const lost       = g(LeadStatus.Lost);
  const totalClosed = converted + lost;
  const conversionRate = totalClosed > 0
    ? Math.round((converted / totalClosed) * 100)
    : 0;

  const active = ACTIVE_LEAD_STATUSES.reduce((s, ls) => s + g(ls), 0);

  return {
    total,
    active,
    periodNew,
    todayNew,
    weekNew,
    monthNew,
    byStatus: {
      new:          g(LeadStatus.New),
      contacted:    g(LeadStatus.Contacted),
      qualified:    g(LeadStatus.Qualified),
      proposalSent: g(LeadStatus.ProposalSent),
      onboarding:   g(LeadStatus.Onboarding),
      converted,
      lost,
      archived:     g(LeadStatus.Archived),
    },
    conversionRate,
    followUpOverdue,
    unassigned,
    last7DaysTrend: trendRows.map((r) => ({ date: r._id, count: r.count })),
  };
}

// ─── 5. Workload ──────────────────────────────────────────────────────────────

async function buildWorkloadSummary(): Promise<WorkloadSummary> {
  const activeStatuses = Array.from(ACTIVE_WORK_STATUSES);

  const [
    totalActiveProjects,
    totalUnassigned,
    inReviewCount,
    waitingClientCount,
    taskStatusRows,
    totalBlockedTasks,
    totalOverdueTasks,
    employeeProjectRows,
  ] = await Promise.all([
    ProjectModel.countDocuments({ projectStatus: { $in: activeStatuses } }),

    ProjectModel.countDocuments({
      projectStatus:         { $in: activeStatuses },
      'assignedEmployees.0': { $exists: false },
    }),

    ProjectModel.countDocuments({ projectStatus: ProjectStatus.InReview }),
    ProjectModel.countDocuments({ projectStatus: ProjectStatus.WaitingClient }),

    Task.aggregate([
      { $match: { archivedAt: { $exists: false } } },
      { $group: { _id: '$taskStatus', count: { $sum: 1 } } },
    ]) as Promise<StatusCountRow[]>,

    Task.countDocuments({ isBlocked: true, archivedAt: { $exists: false } }),
    Task.countDocuments({ isOverdue: true, archivedAt: { $exists: false } }),

    ProjectModel.aggregate([
      { $match: { projectStatus: { $in: activeStatuses } } },
      { $unwind: '$assignedEmployees' },
      { $match: { 'assignedEmployees.isActive': true } },
      {
        $group: {
          _id:            '$assignedEmployees.userId',
          activeProjects: { $sum: 1 },
          inReview:       {
            $sum: { $cond: [{ $eq: ['$projectStatus', ProjectStatus.InReview] }, 1, 0] },
          },
        },
      },
      { $sort: { activeProjects: -1 } },
      { $limit: 10 },
    ]) as Promise<EmployeeProjectRow[]>,
  ]);

  const taskMap: Record<string, number> = {};
  for (const r of taskStatusRows) taskMap[r._id] = r.count;

  // Fetch display names for the top-10 employees
  const empIds = employeeProjectRows.map((e) => e._id);

  const [userDocs, taskEmployeeRows] = await Promise.all([
    empIds.length > 0
      ? User.find({ _id: { $in: empIds } }, { firstName: 1, lastName: 1 }).lean()
      : Promise.resolve([] as Array<{ _id: Types.ObjectId; firstName: string; lastName: string }>),

    empIds.length > 0
      ? (Task.aggregate([
          {
            $match: {
              archivedAt:          { $exists: false },
              assignedEmployeeIds: { $in: empIds },
            },
          },
          { $unwind: '$assignedEmployeeIds' },
          { $match: { assignedEmployeeIds: { $in: empIds } } },
          {
            $group: {
              _id:          '$assignedEmployeeIds',
              activeTasks:  { $sum: 1 },
              overdueTasks: { $sum: { $cond: ['$isOverdue', 1, 0] } },
              blockedTasks: { $sum: { $cond: ['$isBlocked', 1, 0] } },
            },
          },
        ]) as Promise<EmployeeTaskRow[]>)
      : Promise.resolve([] as EmployeeTaskRow[]),
  ]);

  const nameMap: Record<string, string> = {};
  for (const u of userDocs) {
    nameMap[String(u._id)] = `${u.firstName} ${u.lastName}`.trim();
  }

  const taskEmpMap: Record<string, EmployeeTaskRow> = {};
  for (const r of taskEmployeeRows) {
    taskEmpMap[String(r._id)] = r;
  }

  const employeeWorkload: EmployeeWorkloadItem[] = employeeProjectRows.map((e) => {
    const eid = String(e._id);
    const t   = taskEmpMap[eid];
    return {
      employeeId:       eid,
      name:             nameMap[eid] ?? 'Unknown',
      activeProjects:   e.activeProjects,
      activeTasks:      t?.activeTasks  ?? 0,
      overdueTasks:     t?.overdueTasks ?? 0,
      blockedTasks:     t?.blockedTasks ?? 0,
      inReviewProjects: e.inReview,
    };
  });

  return {
    totalActiveProjects,
    totalUnassignedProjects: totalUnassigned,
    totalBlockedTasks,
    totalOverdueTasks,
    inReviewProjects:        inReviewCount,
    waitingClientProjects:   waitingClientCount,
    employeeWorkload,
    tasksByStatus: {
      todo:       taskMap[TaskStatus.Todo]         ?? 0,
      inProgress: taskMap[TaskStatus.InProgress]   ?? 0,
      inReview:   taskMap[TaskStatus.WaitingReview] ?? 0,
      blocked:    taskMap[TaskStatus.Blocked]       ?? 0,
      completed:  taskMap[TaskStatus.Completed]     ?? 0,
    },
  };
}

// ─── 6. Recent Activity ───────────────────────────────────────────────────────

async function buildRecentActivity(limit: number): Promise<RecentActivitySummary> {
  const now = new Date();

  const [
    recentProjects,
    recentLeads,
    recentPayments,
    recentApprovals,
    recentSupport,
    recentExports,
  ] = await Promise.all([
    ProjectModel.find(
      {},
      { projectCode: 1, projectStatus: 1, lastActivityAt: 1 },
    )
      .sort({ lastActivityAt: -1 })
      .limit(limit)
      .lean(),

    Lead.find(
      {},
      { fullName: 1, phone: 1, status: 1, leadSource: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

    Payment.find(
      {},
      { invoiceId: 1, amount: 1, paymentStatus: 1, paymentMethod: 1, initiatedAt: 1 },
    )
      .sort({ initiatedAt: -1 })
      .limit(limit)
      .lean(),

    ApprovalModel.find(
      {
        approvalStatus: {
          $in: [
            ApprovalStatus.Pending,
            ApprovalStatus.UnderReview,
            ApprovalStatus.RevisionRequested,
          ],
        },
        isDeleted: false,
      },
      { approvalType: 1, approvalStatus: 1, submittedAt: 1 },
    )
      .sort({ submittedAt: -1 })
      .limit(limit)
      .lean(),

    SupportTicket.find(
      {},
      { ticketNumber: 1, subject: 1, ticketStatus: 1, priority: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

    ExportJob.find({}, { exportType: 1, status: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  return {
    projects: recentProjects.map((p) => ({
      projectId:     String(p._id),
      projectNumber: p.projectCode   as string,
      status:        p.projectStatus as string,
      updatedAt:     p.lastActivityAt as Date,
    })),

    leads: recentLeads.map((l) => ({
      leadId:    String(l._id),
      fullName:  l.fullName   as string,
      phone:     l.phone      as string,
      status:    l.status     as string,
      source:    l.leadSource as string,
      createdAt: l.createdAt  as Date,
    })),

    payments: recentPayments.map((p) => ({
      paymentId:   String(p._id),
      invoiceId:   String(p.invoiceId),
      amountPaise: p.amount        as number,
      status:      p.paymentStatus as string,
      method:      p.paymentMethod as string,
      initiatedAt: p.initiatedAt   as Date,
    })),

    approvals: recentApprovals.map((a) => {
      const submittedAt = a.submittedAt as Date;
      const daysPending = Math.floor(
        (now.getTime() - submittedAt.getTime()) / 86_400_000,
      );
      return {
        approvalId:   String(a._id),
        approvalType: a.approvalType  as string,
        status:       a.approvalStatus as string,
        submittedAt,
        daysPending,
      };
    }),

    support: recentSupport.map((t) => ({
      ticketId:     String(t._id),
      ticketNumber: t.ticketNumber as string,
      subject:      t.subject      as string,
      status:       t.ticketStatus as string,
      priority:     t.priority     as string,
      createdAt:    t.createdAt    as Date,
    })),

    exports: recentExports.map((e) => ({
      exportId:    String(e._id),
      exportType:  e.exportType as string,
      status:      e.status     as string,
      requestedAt: e.createdAt  as Date,
    })),
  };
}

// ─── 7. Client Stats ──────────────────────────────────────────────────────────

async function buildClientStatsSummary(): Promise<ClientStatsSummary> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);

  const [totalClients, activeClients, newToday, newMonth, activeEmployees] = await Promise.all([
    ClientProfile.countDocuments({}),
    ClientProfile.countDocuments({ onboardingStatus: { $in: ['active', 'onboarded'] } }),
    User.countDocuments({ role: 'client', createdAt: { $gte: todayStart } }),
    User.countDocuments({ role: 'client', createdAt: { $gte: monthStart } }),
    User.countDocuments({ role: 'employee', deactivatedAt: { $exists: false } }),
  ]);

  return { totalClients, activeClients, newClientsToday: newToday, newClientsMonth: newMonth, activeEmployees };
}

// ─── 8. Follow-Up Counts ──────────────────────────────────────────────────────

async function buildFollowUpCounts(): Promise<FollowUpCounts> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekEnd    = new Date(now); weekEnd.setDate(weekEnd.getDate() + 7);

  const base = { status: { $in: ACTIVE_LEAD_STATUSES }, followUpDate: { $exists: true, $ne: null } };

  const [overdue, today, upcoming] = await Promise.all([
    Lead.countDocuments({ ...base, followUpDate: { $lt: todayStart } }),
    Lead.countDocuments({ ...base, followUpDate: { $gte: todayStart, $lte: todayEnd } }),
    Lead.countDocuments({ ...base, followUpDate: { $gt: todayEnd, $lte: weekEnd } }),
  ]);

  return { overdue, today, upcoming, total: overdue + today + upcoming };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clampLimit(raw?: number): number {
  return Math.min(Math.max(1, raw ?? 5), 20);
}

function parsePeriod(q: AdminDashboardQuery): { period: DashboardPeriod; dateRange: ResolvedDateRange } {
  const period: DashboardPeriod = q.period ?? 'month';
  return { period, dateRange: resolveDateRange(period, q.from, q.to) };
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Full admin dashboard — runs all sections in parallel.
 */
export async function buildAdminDashboard(
  query: AdminDashboardQuery,
): Promise<AdminDashboardResponse> {
  const { period, dateRange } = parsePeriod(query);
  const limit = clampLimit(query.limit);

  const [revenue, overdueProjects, pendingApprovals, leads, workload, recentActivity, clientStats, followUpCounts] =
    await Promise.all([
      buildRevenueSummary(dateRange),
      buildOverdueProjectsSummary(limit),
      buildPendingApprovalsSummary(limit),
      buildLeadMetricsSummary(dateRange),
      buildWorkloadSummary(),
      buildRecentActivity(limit),
      buildClientStatsSummary(),
      buildFollowUpCounts(),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    period,
    dateRange:   { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() },
    revenue,
    overdueProjects,
    pendingApprovals,
    leads,
    workload,
    recentActivity,
    clientStats,
    followUpCounts,
  };
}

/** Revenue section only */
export async function getAdminRevenueSummary(q: AdminDashboardQuery): Promise<RevenueSummary> {
  const { dateRange } = parsePeriod(q);
  return buildRevenueSummary(dateRange);
}

/** Overdue projects section only */
export async function getAdminOverdueSummary(q: AdminDashboardQuery): Promise<OverdueProjectsSummary> {
  return buildOverdueProjectsSummary(clampLimit(q.limit));
}

/** Pending approvals section only */
export async function getAdminApprovalsSummary(q: AdminDashboardQuery): Promise<PendingApprovalsSummary> {
  return buildPendingApprovalsSummary(clampLimit(q.limit));
}

/** Lead metrics section only */
export async function getAdminLeadsSummary(q: AdminDashboardQuery): Promise<LeadMetricsSummary> {
  const { dateRange } = parsePeriod(q);
  return buildLeadMetricsSummary(dateRange);
}

/** Workload section only */
export async function getAdminWorkloadSummary(): Promise<WorkloadSummary> {
  return buildWorkloadSummary();
}

/** Recent activity section only */
export async function getAdminRecentActivity(q: AdminDashboardQuery): Promise<RecentActivitySummary> {
  return buildRecentActivity(clampLimit(q.limit));
}
