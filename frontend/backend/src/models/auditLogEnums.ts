/**
 * AuditLog-specific enums and action constants.
 */

export enum AuditCategory {
  Auth = 'auth',
  User = 'user',
  Lead = 'lead',
  Project = 'project',
  Task = 'task',
  Document = 'document',
  Approval = 'approval',
  Payment = 'payment',
  Invoice = 'invoice',
  Support = 'support',
  Export = 'export',
  System = 'system',
  Notification = 'notification',
}

export enum AuditSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

export enum AuditSource {
  Api = 'api',
  System = 'system',        // Background job / scheduler
  Admin = 'admin',          // Manual admin action via CRM
  Webhook = 'webhook',      // Inbound webhook event
  Migration = 'migration',  // Data migration scripts
}

// Canonical audit action constants
export const AuditAction = {
  // Auth
  Login: 'auth.login',
  Logout: 'auth.logout',
  LoginFailed: 'auth.login_failed',
  PasswordReset: 'auth.password_reset',
  TokenReuse: 'auth.token_reuse_detected',
  AccountLocked: 'auth.account_locked',

  // User
  UserCreated: 'user.created',
  UserUpdated: 'user.updated',
  UserDeactivated: 'user.deactivated',
  UserReactivated: 'user.reactivated',
  DeactivationBlocked: 'user.deactivation_blocked_active_projects',

  // Lead
  LeadCreated: 'lead.created',
  LeadCreatedPublic: 'lead.created_public',
  LeadStatusUpdated: 'lead.status_updated',
  LeadConverted: 'lead.converted',
  LeadConversionBlocked: 'lead.conversion_blocked_duplicate_email',
  LeadAutoArchived: 'lead.auto_archived',

  // Project
  ProjectCreated: 'project.created',
  ProjectStatusUpdated: 'project.status_updated',
  ProjectAssigned: 'project.assigned',
  ProjectOverdueFlagged: 'project.overdue_flagged',
  ProjectStalledFlagged: 'project.stalled_flagged',
  ProjectCompletionGateFailed: 'project.completion_gate_failed',
  ProjectInvalidTransition: 'project.invalid_transition_attempted',
  ProjectBundleSubprojectCancelled: 'project.bundle_subproject_cancelled',
  RevisionRequested: 'project.revisions_requested',

  // Task
  TaskCreated: 'task.created',
  TaskCompleted: 'task.completed',
  TaskOverdueFlagged: 'task.overdue_flagged',
  TaskBlocked: 'task.blocked',

  // Document
  DocumentUploaded: 'document.uploaded',
  DocumentApproved: 'document.approved',
  DocumentRejected: 'document.rejected',
  DocumentCorrupt: 'document.upload_corrupt',
  SubmissionBlocked: 'project.submission_blocked_no_documents',

  // Approval
  ApprovalApproved: 'approval.approved',
  ApprovalRejected: 'approval.rejected',
  ApprovalApprovedWithoutNote: 'approval.approved_without_note',

  // Payment (future-compatible — Batch 4.1)
  PaymentWebhookCaptured: 'payment.webhook_captured',
  PaymentWebhookUnmatched: 'payment.webhook_unmatched_order',
  PaymentVerifiedFrontend: 'payment.verified_via_frontend_callback',
  PaymentOverpayment: 'payment.overpayment_detected',
  InvoiceDisputeOpened: 'invoice.dispute_opened',
  WebhookManualRetry: 'webhook.manual_retry_triggered',

  // Support
  SupportTicketCreated: 'support.ticket_created',
  SupportTicketEscalatedTier1: 'support.ticket_escalated_tier1',
  SupportTicketEscalatedTier2: 'support.ticket_escalated_tier2',
  SupportTicketResolved: 'support.ticket_resolved',
  SupportMessageAdded: 'support.message_added',

  // Export
  ExportRequested: 'export.requested',
  ExportCompleted: 'export.completed',
  ExportFailed: 'export.failed',
  ExportTimeout: 'export.job_timeout',

  // System
  SystemSettingUpdated: 'system_settings.updated',
  ScheduledJobRun: 'system.scheduled_job_run',
  ScheduledJobFailed: 'system.scheduled_job_failed',
} as const;

export type AuditActionValue = typeof AuditAction[keyof typeof AuditAction];
