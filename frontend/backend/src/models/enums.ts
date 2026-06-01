/**
 * Shared enums and lightweight types used across support/auth models.
 * Keep this file minimal — only values that are genuinely shared.
 */

// ─── Token Revocation Reasons ─────────────────────────────────────────────────

export enum RefreshTokenRevocationReason {
  Logout = 'logout',
  Rotation = 'rotation',
  PasswordReset = 'password_reset',
  AdminAction = 'admin_action',
  SuspectedReuse = 'suspected_reuse',
}

// ─── Session Status ───────────────────────────────────────────────────────────

export enum ActivitySessionStatus {
  Active = 'active',
  Expired = 'expired',
  LoggedOut = 'logged_out',
  Terminated = 'terminated', // Admin / security-forced
}

export enum SessionTerminationReason {
  Logout = 'logout',
  AdminAction = 'admin_action',
  PasswordReset = 'password_reset',
  TokenReuse = 'token_reuse',
  Expiry = 'expiry',
}

// ─── Login Attempt ────────────────────────────────────────────────────────────

export enum LoginFailureReason {
  InvalidPassword = 'invalid_password',
  AccountInactive = 'account_inactive',
  AccountLocked = 'account_locked',
  EmailNotFound = 'email_not_found',
  EmailNotVerified = 'email_not_verified',
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

export enum WebhookProvider {
  Razorpay = 'razorpay',
}

export enum WebhookProcessingStatus {
  Received = 'received',
  Processing = 'processing',
  Processed = 'processed',
  Failed = 'failed',
  FailedPermanent = 'failed_permanent',
  Skipped = 'skipped', // e.g. invalid signature, duplicate
}

// ─── System Settings ──────────────────────────────────────────────────────────

export enum SystemSettingCategory {
  Operations = 'operations',
  Notifications = 'notifications',
  Payments = 'payments',
  Security = 'security',
  Exports = 'exports',
}

export enum SystemSettingValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Json = 'json',
}

// ─── Export Jobs ──────────────────────────────────────────────────────────────

export enum ExportJobStatus {
  Queued = 'queued',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  FailedPermanent = 'failed_permanent',
  Expired = 'expired',
}

export enum ExportJobType {
  InvoicePdf = 'invoice_pdf',
  ProjectSummary = 'project_summary',
  CertificateBundle = 'certificate_bundle',
  ClientDocumentsArchive = 'client_documents_archive',
  AdminReport = 'admin_report',
}

export enum ExportRequestorRole {
  Admin = 'admin',
  Client = 'client',
}

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────

export enum ScheduledJobStatus {
  Success = 'success',
  Failed = 'failed',
  Skipped = 'skipped',
  Running = 'running',
  Idle = 'idle',
}

// ─── User Roles (mirrored here for schema use without circular imports) ───────

export enum UserRole {
  Admin = 'admin',
  Employee = 'employee',
  Client = 'client',
}

// ─── Failed Job Logs ──────────────────────────────────────────────────────────

export enum FailedJobSeverity {
  Low = 'low',       // Non-critical background task
  Medium = 'medium', // Operational impact
  High = 'high',     // Business impact
  Critical = 'critical', // Revenue / data integrity impact
}
