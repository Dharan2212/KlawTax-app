/**
 * Models barrel export.
 *
 * Import from this file in application code:
 *   import { Invoice, Payment, User, ProjectModel } from '@models/index';
 */

// ─── Enums & Shared Types ─────────────────────────────────────────────────────
export * from './enums';

// ─── Domain Models (Batch 1.3+) ───────────────────────────────────────────────
export { User, AccountStatus } from './user';
export type { IUser, IUserDocument, IUserModel, IUserVirtuals } from './user';

export { ClientProfile, ClientCategory, OnboardingStatus, CommunicationPreference } from './clientProfile';
export type { IClientProfile, IClientProfileDocument, IClientProfileModel } from './clientProfile';

export { EmployeeProfile, Department, EmploymentStatus } from './employeeProfile';
export type { IEmployeeProfile, IEmployeeProfileDocument, IEmployeeProfileModel } from './employeeProfile';

// ─── Auth / Token Support Collections ────────────────────────────────────────
export { RefreshToken } from './refreshToken';
export type { IRefreshToken, IRefreshTokenDocument, IRefreshTokenModel } from './refreshToken';

export { PasswordResetToken } from './passwordResetToken';
export type {
  IPasswordResetToken,
  IPasswordResetTokenDocument,
  IPasswordResetTokenModel,
} from './passwordResetToken';

export { EmailVerificationToken } from './emailVerificationToken';
export type {
  IEmailVerificationToken,
  IEmailVerificationTokenDocument,
  IEmailVerificationTokenModel,
} from './emailVerificationToken';

// ─── Session & Security Monitoring ───────────────────────────────────────────
export { ActivitySession } from './activitySession';
export type {
  IActivitySession,
  IActivitySessionDocument,
  IActivitySessionModel,
} from './activitySession';

export { LoginAttempt } from './loginAttempt';
export type {
  ILoginAttempt,
  ILoginAttemptDocument,
  ILoginAttemptModel,
} from './loginAttempt';

// ─── Webhook Processing ───────────────────────────────────────────────────────
export { WebhookEvent } from './webhookEvent';
export type {
  IWebhookEvent,
  IWebhookEventDocument,
  IWebhookEventModel,
} from './webhookEvent';

// ─── Operational Configuration ────────────────────────────────────────────────
export { SystemSetting, SYSTEM_SETTING_SEEDS } from './systemSetting';
export type {
  ISystemSetting,
  ISystemSettingDocument,
  ISystemSettingModel,
} from './systemSetting';

// ─── Background Job Infrastructure ───────────────────────────────────────────
export { ExportJob } from './exportJob';
export type {
  IExportJob,
  IExportJobDocument,
  IExportJobModel,
} from './exportJob';

export { ScheduledJob, SCHEDULED_JOB_SEEDS } from './scheduledJob';
export type {
  IScheduledJob,
  IScheduledJobDocument,
  IScheduledJobModel,
} from './scheduledJob';

export { FailedJobLog } from './failedJobLog';
export type {
  IFailedJobLog,
  IFailedJobLogDocument,
  IFailedJobLogModel,
} from './failedJobLog';

// ─── Finance — Invoices & Payments ─────────────────────────────────────────────
export { Invoice } from './invoice';
export type { IInvoice, ILineItem } from './invoice';
export { Payment } from './payment';
export type { IPayment, IPaymentDocument } from './payment';
export * from './invoiceEnums';

// ─── Lead / CRM ───────────────────────────────────────────────────────────────
export { Lead } from './lead';
export type { ILead } from './lead';
export * from './leadEnums';

// ─── Services Catalog (Batch 2.3) ─────────────────────────────────────────────
export { Service as ServiceModel } from './service';
export type { IService } from './service';
export * from './serviceEnums';

// ─── Projects (Batch 3.1) ─────────────────────────────────────────────────────
export { ProjectModel } from './project';
export type { IProject, IAssignedEmployee, IChecklistItem, IStatusHistoryEntry } from './project';
export * from './projectEnums';

// ─── Tasks & Timeline (Batch 3.2) ─────────────────────────────────────────────
export { Task } from './task';
export type { ITask, IChecklistItem as ITaskChecklistItem } from './task';
export { TimelineEntry } from './timelineEntry';
export type { ITimelineEntry } from './timelineEntry';
export * from './taskEnums';

// ─── Documents & Approvals (Batch 3.3) ────────────────────────────────────────
export { DocumentModel } from './document';
export type { IDocument } from './document';
export { ApprovalModel } from './approval';
export type { IApproval } from './approval';
export * from './documentEnums';

// ─── Notifications (Batch 4.2) ────────────────────────────────────────────────
export { Notification } from './notification';
export type { INotification, INotificationDocument, INotificationModel } from './notification';
export * from './notificationEnums';

// ─── Support Tickets (Batch 4.2) ──────────────────────────────────────────────
export { SupportTicket } from './supportTicket';
export type {
  ISupportTicket,
  ISupportMessage,
  ISupportTicketDocument,
  ISupportTicketModel,
} from './supportTicket';
export * from './supportTicketEnums';

// ─── Audit Logs (Batch 4.2) ───────────────────────────────────────────────────
export { AuditLog } from './auditLog';
export type { IAuditLog, IAuditLogDocument, IAuditLogModel } from './auditLog';
export * from './auditLogEnums';
