/**
 * Lead Auto Archiver
 *
 * Detects leads that have been inactive beyond the configured threshold
 * (default: 90 days, configurable via SystemSetting `lead.auto_archive_days`)
 * and archives them automatically.
 *
 * Safety rules:
 *   - Only archives leads in non-terminal, non-converted statuses:
 *     new | contacted | qualified | proposal_sent
 *   - Never archives: converted, onboarding, lost, already_archived leads
 *   - Checks `updatedAt` for inactivity (not `createdAt`)
 *   - Processes in safe batches of 50
 *   - Writes audit log entry per archival
 *   - Sends admin notification summary (not per-lead spam)
 */

import { Lead } from '../models/lead';
import { LeadStatus } from '../models/leadEnums';
import { User } from '../models/user';
import { NotificationService } from '../modules/notifications/notificationService';
import { AuditService } from '../modules/audit/auditService';
import {
  NotificationType,
  NotificationCategory,
  NotificationPriority,
} from '../models/notificationEnums';
import { AuditCategory, AuditSource, AuditAction } from '../models/auditLogEnums';
import { UserRole } from '../models/enums';
import { Settings } from './settingsHelper';
import { logger } from '../utils/logger';

// ─── Safe-to-archive statuses (non-terminal active statuses only) ─────────────

const ARCHIVABLE_STATUSES: LeadStatus[] = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Qualified,
  LeadStatus.ProposalSent,
];

const BATCH_SIZE = 50;

// ─── Result Type ─────────────────────────────────────────────────────────────

export interface LeadArchivalResult {
  examined: number;
  archived: number;
  errors: number;
}

// ─── Job Implementation ───────────────────────────────────────────────────────

export async function runLeadAutoArchiver(): Promise<LeadArchivalResult> {
  const inactiveDays = await Settings.leadAutoArchiveDays();
  const cutoff = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);

  const staleLeads = await Lead.find({
    status: { $in: ARCHIVABLE_STATUSES },
    updatedAt: { $lt: cutoff },
  })
    .select('_id fullName status email updatedAt')
    .limit(BATCH_SIZE)
    .lean();

  if (staleLeads.length === 0) {
    logger.debug('[LeadAutoArchiver] No stale leads to archive');
    return { examined: 0, archived: 0, errors: 0 };
  }

  logger.info('[LeadAutoArchiver] Found stale leads to archive', {
    count: staleLeads.length,
    inactiveDays,
  });

  let archived = 0;
  let errors = 0;

  for (const lead of staleLeads) {
    try {
      const prevStatus = lead.status;

      await Lead.findByIdAndUpdate(lead._id, {
        $set: {
          status: LeadStatus.Archived,
          archivedAt: new Date(),
        },
      });

      // Audit log — non-blocking
      AuditService.log({
        entityType: 'lead',
        entityId: lead._id.toString(),
        entityName: lead.fullName,
        action: AuditAction.LeadAutoArchived,
        category: AuditCategory.Lead,
        source: AuditSource.System,
        previousState: { status: prevStatus },
        nextState: { status: LeadStatus.Archived },
      }).catch(() => {});

      archived++;
    } catch (err) {
      errors++;
      logger.warn('[LeadAutoArchiver] Failed to archive lead', {
        leadId: lead._id.toString(),
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Single admin notification summary (not per-lead spam)
  if (archived > 0) {
    const admins = await User.find({ role: UserRole.Admin, isActive: true }).select('_id').lean();

    for (const admin of admins) {
      await NotificationService.create({
        recipientId: admin._id.toString(),
        notificationType: NotificationType.SystemAlert,
        category: NotificationCategory.Lead,
        priority: NotificationPriority.Low,
        title: 'Leads auto-archived',
        message: `${archived} lead${archived === 1 ? '' : 's'} inactive for ${inactiveDays}+ days ${archived === 1 ? 'has' : 'have'} been automatically archived.`,
        actionUrl: '/admin/leads?status=archived',
        actionLabel: 'View Archived Leads',
        metadata: { archivedCount: archived, inactiveDays },
      }).catch(() => {});
    }
  }

  const result: LeadArchivalResult = { examined: staleLeads.length, archived, errors };
  logger.info('[LeadAutoArchiver] Archival pass complete', result);
  return result;
}
