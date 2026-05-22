/**
 * Document & Approval enums for KlawTax.
 * Single source of truth — import from here, never redeclare.
 */

// ─── Document Category ────────────────────────────────────────────────────────

export enum DocumentCategory {
  Registration       = 'registration',
  Compliance         = 'compliance',
  Audit              = 'audit',
  Report             = 'report',
  Invoice            = 'invoice',
  Certificate        = 'certificate',
  Deliverable        = 'deliverable',      // v1.4 — final output delivered to client
  SocialAudit        = 'social_audit',     // v1.4 — social audit report category
  SupportingDocument = 'supporting_document',
  ClientSubmission   = 'client_submission',
  InternalReview     = 'internal_review',
}

// ─── Document Status ──────────────────────────────────────────────────────────

/**
 * Lifecycle states for a document record.
 *
 * Valid transitions:
 *   uploaded          → under_review
 *   under_review      → approved | rejected | revision_requested
 *   rejected          → resubmitted
 *   revision_requested→ resubmitted
 *   resubmitted       → under_review
 *   approved          → archived   (admin/system only)
 *   *                 → archived   (admin force-archive)
 */
export enum DocumentStatus {
  Uploaded           = 'uploaded',
  UnderReview        = 'under_review',
  Approved           = 'approved',
  Rejected           = 'rejected',
  RevisionRequested  = 'revision_requested',
  Resubmitted        = 'resubmitted',
  Archived           = 'archived',
}

// ─── Allowed Transitions Map ──────────────────────────────────────────────────

export const DOCUMENT_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  [DocumentStatus.Uploaded]:          [DocumentStatus.UnderReview, DocumentStatus.Archived],
  [DocumentStatus.UnderReview]:       [DocumentStatus.Approved, DocumentStatus.Rejected, DocumentStatus.RevisionRequested],
  [DocumentStatus.Approved]:          [DocumentStatus.Archived],
  [DocumentStatus.Rejected]:          [DocumentStatus.Resubmitted, DocumentStatus.Archived],
  [DocumentStatus.RevisionRequested]: [DocumentStatus.Resubmitted, DocumentStatus.Archived],
  [DocumentStatus.Resubmitted]:       [DocumentStatus.UnderReview, DocumentStatus.Archived],
  [DocumentStatus.Archived]:          [],
};

export function isValidDocumentTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return DOCUMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Storage Provider ─────────────────────────────────────────────────────────

export enum StorageProvider {
  S3    = 's3',
  Local = 'local',  // dev/testing only
}

// ─── Document Visibility ──────────────────────────────────────────────────────

export enum DocumentVisibility {
  ClientVisible = 'client_visible',  // client can see and download
  EmployeeOnly  = 'employee_only',   // employees + admin only
  InternalOnly  = 'internal_only',   // admin only
}

// ─── Approval Type ────────────────────────────────────────────────────────────

export enum ApprovalType {
  DocumentReview = 'document_review',
  ProjectSubmission = 'project_submission',  // for Batch 3.1 integration
  TaskCompletion = 'task_completion',        // for Batch 3.2 integration
}

// ─── Approval Status ──────────────────────────────────────────────────────────

/**
 * Valid transitions:
 *   pending           → under_review
 *   under_review      → approved | rejected | revision_requested
 *   revision_requested→ resubmitted
 *   resubmitted       → under_review
 *   rejected          → resubmitted (if admin allows)
 */
export enum ApprovalStatus {
  Pending            = 'pending',
  UnderReview        = 'under_review',
  Approved           = 'approved',
  Rejected           = 'rejected',
  RevisionRequested  = 'revision_requested',
  Resubmitted        = 'resubmitted',
  Cancelled          = 'cancelled',
}

export const APPROVAL_TRANSITIONS: Record<ApprovalStatus, ApprovalStatus[]> = {
  [ApprovalStatus.Pending]:            [ApprovalStatus.UnderReview, ApprovalStatus.Cancelled],
  [ApprovalStatus.UnderReview]:        [ApprovalStatus.Approved, ApprovalStatus.Rejected, ApprovalStatus.RevisionRequested],
  [ApprovalStatus.Approved]:           [],
  [ApprovalStatus.Rejected]:           [ApprovalStatus.Resubmitted],
  [ApprovalStatus.RevisionRequested]:  [ApprovalStatus.Resubmitted],
  [ApprovalStatus.Resubmitted]:        [ApprovalStatus.UnderReview],
  [ApprovalStatus.Cancelled]:          [],
};

export function isValidApprovalTransition(from: ApprovalStatus, to: ApprovalStatus): boolean {
  return APPROVAL_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Review Priority ──────────────────────────────────────────────────────────

export enum ReviewPriority {
  Low    = 'low',
  Medium = 'medium',
  High   = 'high',
  Urgent = 'urgent',
}

// ─── Allowed MIME Types ───────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Sensitive delivery flag ──────────────────────────────────────────────────

/** Documents marked sensitive get a shorter pre-signed URL TTL (5 min vs 15 min). */
export const SENSITIVE_PRESIGN_TTL_SECONDS  = 5 * 60;
export const STANDARD_PRESIGN_TTL_SECONDS   = 15 * 60;
