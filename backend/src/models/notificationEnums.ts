/**
 * Notification-specific enums.
 * Kept in a separate file to avoid circular imports.
 */

export enum NotificationType {
  // Task
  TaskAssigned = 'task_assigned',
  TaskOverdue = 'task_overdue',
  TaskCompleted = 'task_completed',
  TaskBlocked = 'task_blocked',

  // Project
  ProjectUpdated = 'project_updated',
  ProjectOverdue = 'project_overdue',
  ProjectStalled = 'project_stalled',
  ProjectCompleted = 'project_completed',
  ProjectAssigned = 'project_assigned',
  ProjectCancelled = 'project_cancelled',

  // Approvals & Documents
  ApprovalRequired = 'approval_required',
  ApprovalApproved = 'approval_approved',
  ApprovalRejected = 'approval_rejected',
  RevisionRequested = 'revision_requested',
  DocumentUploaded = 'document_uploaded',
  DocumentRejected = 'document_rejected',

  // Payments (future-compatible — Batch 4.1)
  PaymentReceived = 'payment_received',
  PaymentFailed = 'payment_failed',
  InvoiceCreated = 'invoice_created',
  InvoiceOverdue = 'invoice_overdue',
  InvoiceDisputed = 'invoice_disputed',

  // Support
  SupportTicketCreated = 'support_ticket_created',
  SupportTicketUpdated = 'support_ticket_updated',
  SupportTicketEscalated = 'support_ticket_escalated',
  SupportTicketResolved = 'support_ticket_resolved',
  SupportMessageReceived = 'support_message_received',

  // Exports
  ExportCompleted = 'export_completed',
  ExportFailed = 'export_failed',

  // Leads (CRM)
  LeadAssigned = 'lead_assigned',
  LeadFollowUpOverdue = 'lead_follow_up_overdue',

  // System / Admin
  SystemAlert = 'system_alert',
  AdminDigest = 'admin_digest',
  SecurityAlert = 'security_alert',
}

export enum NotificationCategory {
  Task = 'task',
  Project = 'project',
  Approval = 'approval',
  Document = 'document',
  Payment = 'payment',
  Support = 'support',
  Export = 'export',
  Lead = 'lead',
  System = 'system',
}

export enum NotificationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

export enum NotificationDeliveryChannel {
  InApp = 'in_app',
  Email = 'email',
  Sms = 'sms',
  WhatsApp = 'whatsapp',
  Push = 'push',
}

export enum NotificationDeliveryStatus {
  Pending = 'pending',
  Delivered = 'delivered',
  Failed = 'failed',
  Skipped = 'skipped',
}
