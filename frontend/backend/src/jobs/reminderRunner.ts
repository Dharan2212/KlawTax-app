/**
 * Reminder Runner
 *
 * Emits targeted reminder notifications for operational follow-ups.
 * All reminders are idempotent — they check for recently sent similar
 * notifications before creating new ones to prevent spam.
 *
 * Reminders covered:
 *   1. Lead follow-up overdue reminders
 *   2. Pending approval review reminders
 *   3. Email verification reminders (unverified accounts < 14 days old)
 *   4. Support ticket response reminders (for assigned employees)
 */

import { Types } from 'mongoose';
import { Lead } from '../models/lead';
import { ApprovalModel as Approval } from '../models/approval';
import { SupportTicket } from '../models/supportTicket';
import { User } from '../models/user';
import { Notification } from '../models/notification';
import { NotificationService } from '../modules/notifications/notificationService';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '../models/notificationEnums';
import { ACTIVE_LEAD_STATUSES } from '../models/leadEnums';
import { ApprovalStatus } from '../models/documentEnums';
import { SupportTicketStatus } from '../models/supportTicketEnums';
import { UserRole } from '../models/enums';
import { logger } from '../utils/logger';

// ─── Cooldown Helper ──────────────────────────────────────────────────────────
// Checks whether a notification of the same type was already sent
// to the same recipient for the same entity within the cooldown window.

const REMINDER_COOLDOWN_HOURS = 24; // do not re-send the same reminder within 24h

async function wasRecentlyNotified(
  recipientId: string,
  notificationType: NotificationType,
  entityId: Types.ObjectId | string
): Promise<boolean> {
  const cutoff = new Date(Date.now() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000);

  const existing = await Notification.findOne({
    recipientId: new Types.ObjectId(recipientId),
    notificationType,
    createdAt: { $gte: cutoff },
    $or: [
      { projectId: new Types.ObjectId(entityId.toString()) },
      { taskId: new Types.ObjectId(entityId.toString()) },
      { documentId: new Types.ObjectId(entityId.toString()) },
      { supportTicketId: new Types.ObjectId(entityId.toString()) },
    ],
  }).lean();

  return !!existing;
}

// ─── 1. Lead Follow-Up Reminders ─────────────────────────────────────────────

export async function runLeadFollowUpReminders(): Promise<void> {
  const now = new Date();

  const overdueLeads = await Lead.find({
    status: { $in: ACTIVE_LEAD_STATUSES },
    followUpDate: { $lt: now, $exists: true },
  })
    .select('_id fullName assignedTo followUpDate')
    .lean();

  if (overdueLeads.length === 0) return;

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

  let sent = 0;

  for (const lead of overdueLeads) {
    const targets: string[] = admins.map((a) => (a._id as Types.ObjectId).toString());
    if (lead.assignedTo) targets.push((lead.assignedTo as Types.ObjectId).toString());

    for (const recipientId of [...new Set(targets)]) {
      const alreadyNotified = await wasRecentlyNotified(
        recipientId,
        NotificationType.LeadFollowUpOverdue,
        lead._id as Types.ObjectId
      ).catch(() => false);

      if (alreadyNotified) continue;

      const followUpStr = lead.followUpDate
        ? new Date(lead.followUpDate).toLocaleDateString('en-IN')
        : 'unknown date';

      await NotificationService.create({
        recipientId,
        notificationType: NotificationType.LeadFollowUpOverdue,
        category: NotificationCategory.Lead,
        priority: NotificationPriority.Medium,
        title: 'Lead follow-up overdue',
        message: `Follow-up for lead "${lead.fullName}" was due on ${followUpStr}. Please take action.`,
        shortMessage: `Follow-up overdue: ${lead.fullName}`,
        actionUrl: `/admin/leads/${(lead._id as Types.ObjectId).toString()}`,
        actionLabel: 'View Lead',
      }).catch(() => {});

      sent++;
    }
  }

  logger.info('[ReminderRunner] Lead follow-up reminders sent', {
    leadsChecked: overdueLeads.length,
    notificationsSent: sent,
  });
}

// ─── 2. Pending Approval Review Reminders ────────────────────────────────────

export async function runApprovalReviewReminders(): Promise<void> {
  // Approvals that have been pending for more than 12 hours
  const staleCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const staleApprovals = await Approval.find({
    approvalStatus: { $in: [ApprovalStatus.Pending, ApprovalStatus.Resubmitted] },
    createdAt: { $lt: staleCutoff },
  })
    .select('_id projectId approvalStatus createdAt')
    .lean();

  if (staleApprovals.length === 0) return;

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();
  let sent = 0;

  for (const approval of staleApprovals) {
    for (const admin of admins) {
      const recipientId = (admin._id as Types.ObjectId).toString();

      const alreadyNotified = await wasRecentlyNotified(
        recipientId,
        NotificationType.ApprovalRequired,
        approval._id as Types.ObjectId
      ).catch(() => false);

      if (alreadyNotified) continue;

      const ageHours = Math.round(
        (Date.now() - new Date(approval.createdAt).getTime()) / (60 * 60 * 1000)
      );

      await NotificationService.create({
        recipientId,
        notificationType: NotificationType.ApprovalRequired,
        category: NotificationCategory.Approval,
        priority: ageHours > 48 ? NotificationPriority.High : NotificationPriority.Medium,
        title: 'Approval awaiting review',
        message: `An approval submission has been waiting for review for ${ageHours} hours.`,
        shortMessage: `Approval pending for ${ageHours}h`,
        actionUrl: `/admin/approvals`,
        actionLabel: 'Review',
        projectId: approval.projectId as Types.ObjectId | undefined,
      }).catch(() => {});

      sent++;
    }
  }

  logger.info('[ReminderRunner] Approval review reminders sent', {
    approvalsChecked: staleApprovals.length,
    notificationsSent: sent,
  });
}

// ─── 3. Email Verification Reminders ─────────────────────────────────────────

export async function runEmailVerificationReminders(): Promise<void> {
  // Unverified accounts created < 14 days ago
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const unverifiedUsers = await User.find({
    isEmailVerified: false,
    createdAt: { $gte: fourteenDaysAgo },
    status: { $ne: 'inactive' },
  })
    .select('_id email firstName createdAt')
    .lean();

  if (unverifiedUsers.length === 0) return;

  let sent = 0;

  for (const u of unverifiedUsers) {
    const userId = (u._id as Types.ObjectId).toString();

    // Check if a system_alert reminder was already sent recently
    const recentReminder = await Notification.findOne({
      recipientId: new Types.ObjectId(userId),
      notificationType: NotificationType.SystemAlert,
      'metadata.reminderType': 'email_verification',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // once per week
    }).lean();

    if (recentReminder) continue;

    await NotificationService.create({
      recipientId: userId,
      notificationType: NotificationType.SystemAlert,
      category: NotificationCategory.System,
      priority: NotificationPriority.Low,
      title: 'Please verify your email address',
      message: `Hi ${u.firstName ?? 'there'}, your email address (${u.email}) is still unverified. Please check your inbox and click the verification link.`,
      shortMessage: 'Email verification pending',
      actionUrl: '/verify-email',
      actionLabel: 'Verify Email',
      metadata: { reminderType: 'email_verification' },
    }).catch(() => {});

    sent++;
  }

  logger.info('[ReminderRunner] Email verification reminders sent', {
    usersChecked: unverifiedUsers.length,
    notificationsSent: sent,
  });
}

// ─── 4. Support Ticket Response Reminders ────────────────────────────────────

export async function runSupportResponseReminders(): Promise<void> {
  // Tickets in active states with no response for > 8 hours
  const staleCutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);

  const staleTickets = await SupportTicket.find({
    ticketStatus: {
      $in: [
        SupportTicketStatus.Open,
        SupportTicketStatus.Assigned,
        SupportTicketStatus.InProgress,
      ],
    },
    $or: [
      { lastResponseAt: { $lt: staleCutoff } },
      { lastResponseAt: { $exists: false } },
    ],
  })
    .select('_id ticketNumber assignedToId clientId priority escalationLevel')
    .lean();

  if (staleTickets.length === 0) return;

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();
  let sent = 0;

  for (const ticket of staleTickets) {
    const targets: string[] = admins.map((a) => (a._id as Types.ObjectId).toString());
    if (ticket.assignedToId) {
      targets.push((ticket.assignedToId as Types.ObjectId).toString());
    }

    for (const recipientId of [...new Set(targets)]) {
      const alreadyNotified = await wasRecentlyNotified(
        recipientId,
        NotificationType.SupportTicketUpdated,
        ticket._id as Types.ObjectId
      ).catch(() => false);

      if (alreadyNotified) continue;

      await NotificationService.create({
        recipientId,
        notificationType: NotificationType.SupportTicketUpdated,
        category: NotificationCategory.Support,
        priority: ticket.escalationLevel > 0 ? NotificationPriority.High : NotificationPriority.Medium,
        title: 'Support ticket awaiting response',
        message: `Ticket ${ticket.ticketNumber} has not received a response in over 8 hours.`,
        shortMessage: `Ticket ${ticket.ticketNumber} needs attention`,
        supportTicketId: ticket._id as Types.ObjectId,
        actionUrl: `/admin/support/${(ticket._id as Types.ObjectId).toString()}`,
        actionLabel: 'View Ticket',
      }).catch(() => {});

      sent++;
    }
  }

  logger.info('[ReminderRunner] Support response reminders sent', {
    ticketsChecked: staleTickets.length,
    notificationsSent: sent,
  });
}

// ─── Composite: run all reminders ────────────────────────────────────────────

export async function runAllReminders(): Promise<void> {
  await Promise.allSettled([
    runLeadFollowUpReminders(),
    runApprovalReviewReminders(),
    runEmailVerificationReminders(),
    runSupportResponseReminders(),
  ]);
}
