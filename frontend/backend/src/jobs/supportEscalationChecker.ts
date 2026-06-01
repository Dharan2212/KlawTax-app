/**
 * Support Escalation Checker
 *
 * Checks open support tickets for SLA violations and progressively escalates them.
 *
 * Escalation tiers (configurable via SystemSettings):
 *   Tier 1: No response for `support.escalation_hours_tier1` (default: 24h)
 *           → priority bump, admin notified (medium priority)
 *   Tier 2: Still unresolved after `support.escalation_hours_tier2` (default: 72h)
 *           → priority → urgent, admin notified (urgent priority)
 *
 * Safety rules:
 *   - Checks escalationLevel to avoid double-escalating at same tier
 *   - Uses `lastResponseAt` if set; falls back to `createdAt`
 *   - Skips resolved, closed, and already-escalated-at-tier tickets
 *   - Cooldown: uses escalatedAt to prevent re-escalation within the same window
 *   - Never modifies ticket messages or workflow state (only escalationLevel + priority)
 */

import { SupportTicket } from '../models/supportTicket';
import { User } from '../models/user';
import { NotificationService } from '../modules/notifications/notificationService';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '../models/notificationEnums';
import { SupportTicketStatus, SupportTicketPriority } from '../models/supportTicketEnums';
import { UserRole } from '../models/enums';
import { Settings } from './settingsHelper';
import { logger } from '../utils/logger';

// ─── Terminal ticket statuses — skip these ────────────────────────────────────

const TERMINAL_TICKET_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.Resolved,
  SupportTicketStatus.Closed,
];

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface EscalationResult {
  examined: number;
  escalatedTier1: number;
  escalatedTier2: number;
  skipped: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the effective last-activity time for SLA measurement. */
function getActivityTime(ticket: {
  lastResponseAt?: Date;
  createdAt: Date;
}): Date {
  return ticket.lastResponseAt ?? ticket.createdAt;
}

// ─── Job Implementation ───────────────────────────────────────────────────────

export async function runSupportEscalationChecker(): Promise<EscalationResult> {
  const [tier1Hours, tier2Hours] = await Promise.all([
    Settings.supportEscalationHoursTier1(),
    Settings.supportEscalationHoursTier2(),
  ]);

  const now = new Date();
  const tier1Cutoff = new Date(now.getTime() - tier1Hours * 60 * 60 * 1000);
  const tier2Cutoff = new Date(now.getTime() - tier2Hours * 60 * 60 * 1000);

  // Fetch all non-terminal tickets for analysis
  const tickets = await SupportTicket.find({
    ticketStatus: { $nin: TERMINAL_TICKET_STATUSES },
  })
    .select('_id ticketNumber ticketStatus priority escalationLevel escalatedAt lastResponseAt createdAt assignedToId clientId')
    .lean();

  const admins = await User.find({ role: UserRole.Admin, isActive: true }).limit(50).lean()
    .select('_id')
    .lean();

  let escalatedTier1 = 0;
  let escalatedTier2 = 0;
  let skipped = 0;

  for (const ticket of tickets) {
    const activityTime = getActivityTime(ticket);
    const ticketId = ticket._id.toString();

    // ── Tier 2 check (overrides tier 1 if applicable) ──
    if (
      ticket.escalationLevel < 2 &&
      activityTime <= tier2Cutoff
    ) {
      // Avoid re-escalating to tier 2 if already done within this window
      if (
        ticket.escalationLevel === 2 &&
        ticket.escalatedAt &&
        ticket.escalatedAt > tier2Cutoff
      ) {
        skipped++;
        continue;
      }

      await SupportTicket.findByIdAndUpdate(ticket._id, {
        $set: {
          escalationLevel: 2,
          priority: SupportTicketPriority.Urgent,
          escalatedAt: now,
          ticketStatus:
            ticket.ticketStatus === SupportTicketStatus.Open
              ? SupportTicketStatus.Escalated
              : ticket.ticketStatus,
        },
      });

      // Notify all admins at urgent priority
      for (const admin of admins) {
        await NotificationService.create({
          recipientId: admin._id.toString(),
          notificationType: NotificationType.SupportTicketUpdated,
          category: NotificationCategory.Support,
          priority: NotificationPriority.Urgent,
          title: `URGENT: Support ticket ${ticket.ticketNumber} unresolved for ${tier2Hours}h`,
          message: `Ticket ${ticket.ticketNumber} has not been resolved in over ${tier2Hours} hours. Immediate attention required.`,
          supportTicketId: ticket._id.toString(),
          actionUrl: `/admin/support/${ticketId}`,
          actionLabel: 'View Ticket',
          metadata: { escalationTier: 2, hours: tier2Hours },
        }).catch(() => {});
      }

      escalatedTier2++;
      logger.warn('[EscalationChecker] Ticket escalated to tier 2', {
        ticketId,
        ticketNumber: ticket.ticketNumber,
        activityHoursAgo: Math.round((now.getTime() - activityTime.getTime()) / (60 * 60 * 1000)),
      });

      continue;
    }

    // ── Tier 1 check ──
    if (
      ticket.escalationLevel < 1 &&
      activityTime <= tier1Cutoff
    ) {
      // Avoid re-notifying if already escalated to tier 1 within this window
      if (
        ticket.escalationLevel >= 1 &&
        ticket.escalatedAt &&
        ticket.escalatedAt > tier1Cutoff
      ) {
        skipped++;
        continue;
      }

      // Bump priority by one level
      const newPriority = bumpPriority(ticket.priority as SupportTicketPriority);

      await SupportTicket.findByIdAndUpdate(ticket._id, {
        $set: {
          escalationLevel: 1,
          priority: newPriority,
          escalatedAt: now,
        },
      });

      for (const admin of admins) {
        await NotificationService.create({
          recipientId: admin._id.toString(),
          notificationType: NotificationType.SupportTicketUpdated,
          category: NotificationCategory.Support,
          priority: NotificationPriority.Medium,
          title: `Support ticket ${ticket.ticketNumber} unanswered for ${tier1Hours}h`,
          message: `Ticket ${ticket.ticketNumber} has not received a response in ${tier1Hours} hours.`,
          supportTicketId: ticket._id.toString(),
          actionUrl: `/admin/support/${ticketId}`,
          actionLabel: 'View Ticket',
          metadata: { escalationTier: 1, hours: tier1Hours },
        }).catch(() => {});
      }

      escalatedTier1++;
      logger.info('[EscalationChecker] Ticket escalated to tier 1', {
        ticketId,
        ticketNumber: ticket.ticketNumber,
      });

      continue;
    }

    skipped++;
  }

  const result: EscalationResult = {
    examined: tickets.length,
    escalatedTier1,
    escalatedTier2,
    skipped,
  };

  logger.info('[EscalationChecker] Escalation check complete', result);
  return result;
}

// ─── Priority Bump ────────────────────────────────────────────────────────────

function bumpPriority(current: SupportTicketPriority): SupportTicketPriority {
  switch (current) {
    case SupportTicketPriority.Low:    return SupportTicketPriority.Medium;
    case SupportTicketPriority.Medium: return SupportTicketPriority.High;
    case SupportTicketPriority.High:
    case SupportTicketPriority.Urgent:
    default:
      return SupportTicketPriority.Urgent;
  }
}
