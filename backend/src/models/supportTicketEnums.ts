/**
 * SupportTicket-specific enums.
 */

export enum SupportTicketStatus {
  Open = 'open',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  WaitingClient = 'waiting_client',
  Resolved = 'resolved',
  Closed = 'closed',
  Reopened = 'reopened',
  Escalated = 'escalated',
}

export enum SupportTicketCategory {
  Billing = 'billing',
  DocumentSubmission = 'document_submission',
  ProjectUpdate = 'project_update',
  RegistrationStatus = 'registration_status',
  Refund = 'refund',
  Technical = 'technical',
  General = 'general',
  Complaint = 'complaint',
  Other = 'other',
}

export enum SupportTicketPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum SupportTicketResolutionType {
  Resolved = 'resolved',
  Duplicate = 'duplicate',
  NoAction = 'no_action',
  Escalated = 'escalated',
  WontFix = 'wont_fix',
}

export enum SupportMessageSenderRole {
  Admin = 'admin',
  Employee = 'employee',
  Client = 'client',
  System = 'system',
}

// Valid status transitions (enforced in service layer)
export const SUPPORT_TICKET_TRANSITIONS: Record<SupportTicketStatus, SupportTicketStatus[]> = {
  [SupportTicketStatus.Open]: [
    SupportTicketStatus.Assigned,
    SupportTicketStatus.InProgress,
    SupportTicketStatus.Closed,
    SupportTicketStatus.Escalated,
  ],
  [SupportTicketStatus.Assigned]: [
    SupportTicketStatus.InProgress,
    SupportTicketStatus.WaitingClient,
    SupportTicketStatus.Escalated,
    SupportTicketStatus.Resolved,
    SupportTicketStatus.Closed,
  ],
  [SupportTicketStatus.InProgress]: [
    SupportTicketStatus.WaitingClient,
    SupportTicketStatus.Resolved,
    SupportTicketStatus.Escalated,
    SupportTicketStatus.Closed,
  ],
  [SupportTicketStatus.WaitingClient]: [
    SupportTicketStatus.InProgress,
    SupportTicketStatus.Resolved,
    SupportTicketStatus.Closed,
    SupportTicketStatus.Escalated,
  ],
  [SupportTicketStatus.Resolved]: [
    SupportTicketStatus.Reopened,
    SupportTicketStatus.Closed,
  ],
  [SupportTicketStatus.Closed]: [
    SupportTicketStatus.Reopened,
  ],
  [SupportTicketStatus.Reopened]: [
    SupportTicketStatus.Assigned,
    SupportTicketStatus.InProgress,
    SupportTicketStatus.Escalated,
  ],
  [SupportTicketStatus.Escalated]: [
    SupportTicketStatus.InProgress,
    SupportTicketStatus.Resolved,
    SupportTicketStatus.Closed,
  ],
};
