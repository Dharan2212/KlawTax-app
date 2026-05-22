import { logger } from '../../utils/logger';
import { LeadStatus } from '../../models/leadEnums';

/**
 * Lead notification event registry.
 *
 * These are the trigger points that the in-app notification engine hooks into.
 * Phase 1-2: events are durably logged via the structured logger so that the
 * notification payload is observable in production logs and can be replayed.
 *
 * Phase 3 (notifications module): replace the logger.info calls below with
 * calls to the NotificationService, which will persist records to the
 * `notifications` collection and fan out to clients via SSE / WebSocket.
 * No call-site changes will be required — only the body of each trigger
 * function needs to change.
 */

export enum LeadNotificationEvent {
  LeadCreated      = 'lead.created',
  LeadAssigned     = 'lead.assigned',
  LeadStatusChanged = 'lead.status_changed',
  LeadFollowUpDue  = 'lead.follow_up_due',
  LeadConverted    = 'lead.converted',
  LeadAutoArchived = 'lead.auto_archived',
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface LeadCreatedPayload {
  leadId:               string;
  fullName:             string;
  phone:                string;
  email?:               string;
  serviceInterestSlugs: string[];
  leadSource:           string;
}

export interface LeadAssignedPayload {
  leadId:           string;
  fullName:         string;
  assignedToUserId: string;
  assignedByUserId?: string;
}

export interface LeadStatusChangedPayload {
  leadId:            string;
  fullName:          string;
  previousStatus:    LeadStatus;
  newStatus:         LeadStatus;
  changedByUserId?:  string;
}

export interface LeadConvertedPayload {
  leadId:             string;
  fullName:           string;
  clientProfileId:    string;
  convertedByUserId?: string;
}

// ─── Trigger Functions ────────────────────────────────────────────────────────

export function triggerLeadCreatedNotification(payload: LeadCreatedPayload): void {
  logger.info('[LeadNotification] Lead created', {
    event: LeadNotificationEvent.LeadCreated,
    ...payload,
  });
  // Phase 3: await notificationService.dispatch({ recipientRole: 'admin', priority: 'medium', ...payload })
}

export function triggerLeadAssignedNotification(payload: LeadAssignedPayload): void {
  logger.info('[LeadNotification] Lead assigned', {
    event: LeadNotificationEvent.LeadAssigned,
    ...payload,
  });
  // Phase 3: notify assignedToUserId (employee) — medium priority
}

export function triggerLeadStatusChangedNotification(payload: LeadStatusChangedPayload): void {
  logger.info('[LeadNotification] Lead status changed', {
    event: LeadNotificationEvent.LeadStatusChanged,
    ...payload,
  });
  // Phase 3: notify admin — low priority
}

export function triggerLeadConvertedNotification(payload: LeadConvertedPayload): void {
  logger.info('[LeadNotification] Lead converted to client', {
    event: LeadNotificationEvent.LeadConverted,
    ...payload,
  });
  // Phase 3: notify admin — low priority; notify employee if assigned
}

export function triggerLeadAutoArchivedNotification(leadId: string, fullName: string): void {
  logger.info('[LeadNotification] Lead auto-archived after inactivity', {
    event: LeadNotificationEvent.LeadAutoArchived,
    leadId,
    fullName,
  });
  // Phase 3: notify admin — low priority
}
