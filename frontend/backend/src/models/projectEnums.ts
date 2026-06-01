/**
 * Project lifecycle enums and transition rules.
 *
 * Single source of truth for:
 *   - Project status values
 *   - Priority levels
 *   - Delivery requirement types
 *   - Lifecycle transition matrix
 *   - Operational constants
 *
 * Import from here in models, services, validators, and workflow helpers.
 * DO NOT scatter status strings across modules.
 */

// ─── Project Status ───────────────────────────────────────────────────────────

export enum ProjectStatus {
  /** Initial state — not yet active, being set up */
  Draft = 'draft',

  /** Client onboarding in progress — docs and details being collected */
  Onboarding = 'onboarding',

  /** Actively being worked on by the assigned team */
  Active = 'active',

  /** Work paused — waiting for client input, documents, or approval */
  WaitingClient = 'waiting_client',

  /** Submitted for admin/manager review before completion */
  InReview = 'in_review',

  /** All work completed — ready for final delivery */
  Completed = 'completed',

  /** Physically delivered to client (certificates, reports, etc.) */
  Delivered = 'delivered',

  /** Permanently archived — no further action needed */
  Archived = 'archived',

  /** Cancelled — no further action possible */
  Cancelled = 'cancelled',
}

// ─── Terminal Statuses ────────────────────────────────────────────────────────

/** Statuses from which NO further transitions are allowed. */
export const TERMINAL_PROJECT_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  ProjectStatus.Archived,
  ProjectStatus.Cancelled,
]);

/** Statuses considered "active work" — used in overdue/stalled detection. */
export const ACTIVE_WORK_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  ProjectStatus.Onboarding,
  ProjectStatus.Active,
  ProjectStatus.WaitingClient,
  ProjectStatus.InReview,
]);

/** Statuses that are fully closed (positive or negative outcome). */
export const CLOSED_PROJECT_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  ProjectStatus.Completed,
  ProjectStatus.Delivered,
  ProjectStatus.Archived,
  ProjectStatus.Cancelled,
]);

// ─── Status Transition Matrix ─────────────────────────────────────────────────
/**
 * Maps each project status to the set of statuses it may transition INTO.
 *
 * Rules:
 *   - Terminal statuses (Archived, Cancelled) have no outgoing transitions.
 *   - Cancelled is reachable from any non-terminal, non-closed status.
 *   - Archived is reachable only from Completed or Delivered.
 *   - The transition from InReview back to Active / WaitingClient supports
 *     the revision cycle (EC-P4 in v1.5).
 */
export const PROJECT_STATUS_TRANSITIONS: Readonly<Record<ProjectStatus, ProjectStatus[]>> = {
  [ProjectStatus.Draft]: [
    ProjectStatus.Onboarding,
    ProjectStatus.Cancelled,
  ],
  [ProjectStatus.Onboarding]: [
    ProjectStatus.Active,
    ProjectStatus.Cancelled,
  ],
  [ProjectStatus.Active]: [
    ProjectStatus.WaitingClient,
    ProjectStatus.InReview,
    ProjectStatus.Completed,
    ProjectStatus.Cancelled,
  ],
  [ProjectStatus.WaitingClient]: [
    ProjectStatus.Active,
    ProjectStatus.Cancelled,
  ],
  [ProjectStatus.InReview]: [
    ProjectStatus.Active,         // Revisions requested — back to employee
    ProjectStatus.WaitingClient,  // Further client input needed
    ProjectStatus.Completed,      // Approved
    ProjectStatus.Cancelled,
  ],
  [ProjectStatus.Completed]: [
    ProjectStatus.Delivered,
    ProjectStatus.Archived,
  ],
  [ProjectStatus.Delivered]: [
    ProjectStatus.Archived,
  ],
  [ProjectStatus.Archived]: [],   // Terminal
  [ProjectStatus.Cancelled]: [],  // Terminal
} as const;

// ─── Project Priority ─────────────────────────────────────────────────────────

export enum ProjectPriority {
  Low    = 'low',
  Medium = 'medium',
  High   = 'high',
  Urgent = 'urgent',
}

// ─── Cancellation Reason ──────────────────────────────────────────────────────

export enum CancellationReason {
  ClientRequest     = 'client_request',
  NonPayment        = 'non_payment',
  DocumentsNotProvided = 'documents_not_provided',
  DuplicateOrder    = 'duplicate_order',
  ServiceUnavailable = 'service_unavailable',
  AdminDecision     = 'admin_decision',
  Other             = 'other',
}

// ─── Delivery Requirement Type ────────────────────────────────────────────────
/**
 * Per-delivery-type completion requirements.
 * These gate the transition to ProjectStatus.Completed.
 * Maps to ServiceDeliveryType from serviceEnums.ts.
 */
export enum DeliveryRequirementType {
  /** Government certificate / incorporation document required */
  RegistrationCertificate = 'registration_certificate',

  /** Compliance filing confirmation required */
  ComplianceFiling = 'compliance_filing',

  /** Audit report with UDIN required */
  AuditReport = 'audit_report',

  /** Written report document required */
  ReportDocument = 'report_document',

  /** Digital deliverable / deployed URL confirmation required */
  DigitalDeliverable = 'digital_deliverable',

  /** Hosting / infrastructure deployment confirmed */
  HostingDeployment = 'hosting_deployment',

  /** Marketing campaign launched / report submitted */
  MarketingDeliverable = 'marketing_deliverable',

  /** Consulting report / engagement summary delivered */
  ConsultingDeliverable = 'consulting_deliverable',
}

// ─── Completion Checklist Item Status ────────────────────────────────────────

export enum ChecklistItemStatus {
  Pending    = 'pending',
  InProgress = 'in_progress',
  Completed  = 'completed',
  Waived     = 'waived',
}

// ─── Stalled / Overdue Thresholds ────────────────────────────────────────────

/**
 * Default inactivity threshold (days) before a project is considered stalled.
 * Configurable via system settings in production.
 */
export const DEFAULT_STALL_THRESHOLD_DAYS = 7;

/**
 * Default number of days a project can be overdue before escalation.
 * Configurable via system settings in production.
 */
export const DEFAULT_OVERDUE_ESCALATION_DAYS = 3;

// ─── Project Code Prefix ──────────────────────────────────────────────────────

export const PROJECT_CODE_PREFIX = 'KT';
