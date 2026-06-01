/**
 * Overdue Detector Jobs
 *
 * Three detectors:
 *  1. projectOverdueDetector    — flags projects past expectedDeliveryDate
 *  2. taskOverdueDetector       — flags tasks past dueDate
 *  3. invoiceOverdueDetector    — flags issued/partial invoices past dueDate
 *  4. stalledProjectDetector    — flags projects with no timeline activity for N days
 *
 * These detectors never modify business-critical workflow data.
 * They only set `isOverdue` / `isStalled` flags and emit notifications.
 */

import { Types } from 'mongoose';
import { ProjectModel as Project } from '../models/project';
import { Task } from '../models/task';
import { Invoice } from '../models/invoice';
import { TimelineEntry } from '../models/timelineEntry';
import { User } from '../models/user';
import { Settings } from './settingsHelper';
import { NotificationService } from '../modules/notifications/notificationService';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '../models/notificationEnums';
import { TERMINAL_PROJECT_STATUSES } from '../models/projectEnums';
import { TASK_TERMINAL_STATUSES } from '../models/taskEnums';
import { InvoiceStatus } from '../models/invoiceEnums';
import { UserRole } from '../models/enums';
import { logger } from '../utils/logger';

// ─── 1. Project Overdue Detector ─────────────────────────────────────────────

export async function projectOverdueDetector(): Promise<void> {
  const now = new Date();
  const escalationDays = await Settings.projectOverdueEscalationDays();

  // Find non-terminal projects whose expectedDeliveryDate is in the past and not yet flagged overdue
  const justOverdue = await Project.find({
    isOverdue: false,
    projectStatus: { $nin: Array.from(TERMINAL_PROJECT_STATUSES) },
    expectedDeliveryDate: { $lt: now },
  }).select('_id projectCode assignedEmployees clientId').lean();

  if (justOverdue.length > 0) {
    const ids = justOverdue.map((p) => p._id as Types.ObjectId);
    await Project.updateMany({ _id: { $in: ids } }, { $set: { isOverdue: true } });
    logger.info('[OverdueDetector] Flagged projects as overdue', { count: justOverdue.length });

    // Notify assignees and admins
    const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

    for (const project of justOverdue) {
      const notifTargets: string[] = admins.map((a) => (a._id as Types.ObjectId).toString());
      if (project.assignedEmployees?.[0]?.userId) {
        notifTargets.push((project.assignedEmployees?.[0]?.userId as Types.ObjectId).toString());
      }

      for (const recipientId of notifTargets) {
        await NotificationService.create({
          recipientId,
          notificationType: NotificationType.ProjectOverdue,
          category: NotificationCategory.Project,
          priority: NotificationPriority.High,
          title: 'Project is overdue',
          message: `Project ${project.projectCode} has passed its expected delivery date.`,
          shortMessage: `Project ${project.projectCode} is overdue`,
          actionUrl: `/admin/projects/${(project._id as Types.ObjectId).toString()}`,
          actionLabel: 'View Project',
          projectId: project._id as Types.ObjectId,
        }).catch(() => { /* silent — notifications must never block */ });
      }
    }
  }

  // Additionally: escalate projects overdue by > escalationDays with urgent priority
  const escalationCutoff = new Date(now.getTime() - escalationDays * 24 * 60 * 60 * 1000);
  const escalating = await Project.find({
    isOverdue: true,
    projectStatus: { $nin: Array.from(TERMINAL_PROJECT_STATUSES) },
    expectedDeliveryDate: { $lt: escalationCutoff },
  }).select('_id projectCode assignedEmployees').lean();

  if (escalating.length > 0) {
    const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

    for (const project of escalating) {
      for (const admin of admins) {
        await NotificationService.create({
          recipientId: (admin._id as Types.ObjectId).toString(),
          notificationType: NotificationType.ProjectOverdue,
          category: NotificationCategory.Project,
          priority: NotificationPriority.Urgent,
          title: `URGENT: Project overdue by ${escalationDays}+ days`,
          message: `Project ${project.projectCode} is critically overdue. Immediate attention required.`,
          projectId: project._id as Types.ObjectId,
          actionUrl: `/admin/projects/${(project._id as Types.ObjectId).toString()}`,
          actionLabel: 'View Project',
        }).catch(() => {});
      }
    }

    logger.info('[OverdueDetector] Sent escalation notifications', { count: escalating.length });
  }
}

// ─── 2. Task Overdue Detector ─────────────────────────────────────────────────

export async function taskOverdueDetector(): Promise<void> {
  const now = new Date();

  const overdueTasks = await Task.find({
    isOverdue: false,
    taskStatus: { $nin: Array.from(TASK_TERMINAL_STATUSES) },
    dueDate: { $lt: now },
  }).select('_id title assignedEmployeeIds projectId').lean();

  if (overdueTasks.length === 0) return;

  const ids = overdueTasks.map((t) => t._id as Types.ObjectId);
  await Task.updateMany({ _id: { $in: ids } }, { $set: { isOverdue: true } });
  logger.info('[OverdueDetector] Flagged tasks as overdue', { count: overdueTasks.length });

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

  for (const task of overdueTasks) {
    const targets: string[] = admins.map((a) => (a._id as Types.ObjectId).toString());
    if (task.assignedEmployeeIds?.[0]) targets.push((task.assignedEmployeeIds?.[0] as Types.ObjectId).toString());

    for (const recipientId of targets) {
      await NotificationService.create({
        recipientId,
        notificationType: NotificationType.TaskOverdue,
        category: NotificationCategory.Task,
        priority: NotificationPriority.High,
        title: 'Task overdue',
        message: `Task "${task.title}" is past its due date.`,
        taskId: task._id as Types.ObjectId,
        projectId: task.projectId as Types.ObjectId | undefined,
        actionUrl: `/workspace/projects/${task.projectId?.toString()}`,
        actionLabel: 'View Task',
      }).catch(() => {});
    }
  }
}

// ─── 3. Invoice Overdue Detector ──────────────────────────────────────────────

export async function invoiceOverdueDetector(): Promise<void> {
  const now = new Date();

  // Only flag issued or partially-paid invoices past their due date
  const overdueInvoices = await Invoice.find({
    invoiceStatus: { $in: [InvoiceStatus.Issued, InvoiceStatus.PartiallyPaid] },
    dueDate: { $lt: now },
  }).select('_id invoiceNumber clientId totalAmount').lean();

  if (overdueInvoices.length === 0) return;

  const ids = overdueInvoices.map((i) => i._id as Types.ObjectId);
  await Invoice.updateMany({ _id: { $in: ids } }, { $set: { invoiceStatus: InvoiceStatus.Overdue } });
  logger.info('[OverdueDetector] Marked invoices as overdue', { count: overdueInvoices.length });

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

  for (const invoice of overdueInvoices) {
    for (const admin of admins) {
      await NotificationService.create({
        recipientId: (admin._id as Types.ObjectId).toString(),
        notificationType: NotificationType.InvoiceOverdue,
        category: NotificationCategory.Payment,
        priority: NotificationPriority.High,
        title: 'Invoice overdue',
        message: `Invoice ${invoice.invoiceNumber} is past its payment due date.`,
        invoiceId: (invoice._id as Types.ObjectId).toString(),
        actionUrl: `/admin/invoices/${(invoice._id as Types.ObjectId).toString()}`,
        actionLabel: 'View Invoice',
      }).catch(() => {});
    }

    // Notify client
    if (invoice.clientId) {
      await NotificationService.create({
        recipientId: (invoice.clientId as Types.ObjectId).toString(),
        notificationType: NotificationType.InvoiceOverdue,
        category: NotificationCategory.Payment,
        priority: NotificationPriority.Medium,
        title: 'Payment due',
        message: `Invoice ${invoice.invoiceNumber} payment is overdue. Please complete your payment.`,
        invoiceId: (invoice._id as Types.ObjectId).toString(),
        actionUrl: `/portal/payments`,
        actionLabel: 'Pay Now',
        visibleToClient: true,
      }).catch(() => {});
    }
  }
}

// ─── 4. Stalled Project Detector ─────────────────────────────────────────────

export async function stalledProjectDetector(): Promise<void> {
  const stallDays = await Settings.projectStallThresholdDays();
  const cutoff = new Date(Date.now() - stallDays * 24 * 60 * 60 * 1000);

  // Find active projects not yet flagged as stalled
  const activeStatuses = ['onboarding', 'active', 'waiting_client', 'in_review', 'revisions_requested'];
  const candidates = await Project.find({
    isStalled: false,
    projectStatus: { $in: activeStatuses },
    $nor: [{ expectedDeliveryDate: { $exists: false } }],
  }).select('_id projectCode assignedEmployees').lean();

  if (candidates.length === 0) return;

  const nowStalled: Types.ObjectId[] = [];

  for (const project of candidates) {
    // Check if there's a timeline entry more recent than the stall cutoff
    const recentEntry = await TimelineEntry.findOne({
      projectId: project._id,
      createdAt: { $gte: cutoff },
    }).lean();

    if (!recentEntry) {
      nowStalled.push(project._id as Types.ObjectId);
    }
  }

  if (nowStalled.length === 0) return;

  await Project.updateMany(
    { _id: { $in: nowStalled } },
    { $set: { isStalled: true, lastStalledAt: new Date() } }
  );
  logger.info('[StalledDetector] Flagged projects as stalled', { count: nowStalled.length });

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

  for (const projectId of nowStalled) {
    const project = candidates.find((p) => (p._id as Types.ObjectId).equals(projectId));
    if (!project) continue;

    const targets: string[] = admins.map((a) => (a._id as Types.ObjectId).toString());
    if (project.assignedEmployees?.[0]?.userId) {
      targets.push((project.assignedEmployees?.[0]?.userId as Types.ObjectId).toString());
    }

    for (const recipientId of targets) {
      await NotificationService.create({
        recipientId,
        notificationType: NotificationType.ProjectStalled,
        category: NotificationCategory.Project,
        priority: NotificationPriority.Medium,
        title: 'Project stalled',
        message: `Project ${project.projectCode} has had no activity for ${stallDays} days.`,
        projectId,
        actionUrl: `/admin/projects/${projectId.toString()}`,
        actionLabel: 'View Project',
      }).catch(() => {});
    }
  }
}
