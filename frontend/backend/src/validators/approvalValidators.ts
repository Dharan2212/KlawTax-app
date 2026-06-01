/**
 * Approval input validators.
 *
 * Manual validation — consistent with leadValidators.ts pattern.
 */

import { ApprovalType, ReviewPriority, ApprovalStatus } from '../models/documentEnums';
import { ValidationError } from '../middlewares/errorHandler';
import { isObjectId } from './documentValidators';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === 'string' && Object.values(enumObj).includes(value);
}

function optionalString(v: unknown, field: string, maxLen = 2000): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new ValidationError(`${field} must be a string`);
  if (v.length > maxLen) throw new ValidationError(`${field} must be ${maxLen} characters or fewer`);
  return v.trim() || undefined;
}

// ─── Submit for Review ────────────────────────────────────────────────────────

export interface SubmitForReviewDto {
  documentId:     string;
  projectId?:     string;
  taskId?:        string;
  approvalType:   ApprovalType;
  reviewPriority: ReviewPriority;
  submissionNote?: string;
  visibleToClient: boolean;
}

export function validateSubmitForReview(raw: unknown): SubmitForReviewDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!isObjectId(b.documentId)) {
    throw new ValidationError('documentId must be a valid 24-char hex ObjectId');
  }
  if (b.projectId !== undefined && !isObjectId(b.projectId)) {
    throw new ValidationError('projectId must be a valid 24-char hex ObjectId');
  }
  if (b.taskId !== undefined && !isObjectId(b.taskId)) {
    throw new ValidationError('taskId must be a valid 24-char hex ObjectId');
  }

  const approvalType: ApprovalType = isEnumValue(ApprovalType, b.approvalType)
    ? (b.approvalType as ApprovalType)
    : ApprovalType.DocumentReview;

  const reviewPriority: ReviewPriority = isEnumValue(ReviewPriority, b.reviewPriority)
    ? (b.reviewPriority as ReviewPriority)
    : ReviewPriority.Medium;

  return {
    documentId:      b.documentId as string,
    projectId:       isObjectId(b.projectId) ? (b.projectId as string) : undefined,
    taskId:          isObjectId(b.taskId)     ? (b.taskId as string)    : undefined,
    approvalType,
    reviewPriority,
    submissionNote:  optionalString(b.submissionNote, 'submissionNote'),
    visibleToClient: b.visibleToClient === true,
  };
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export interface ApproveApprovalDto {
  reviewNotes?: string;
}

export function validateApprove(raw: unknown): ApproveApprovalDto {
  if (!raw || typeof raw !== 'object') return {};
  const b = raw as Record<string, unknown>;
  return { reviewNotes: optionalString(b.reviewNotes, 'reviewNotes') };
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export interface RejectApprovalDto {
  rejectionReason: string;
  reviewNotes?:    string;
}

export function validateReject(raw: unknown): RejectApprovalDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!b.rejectionReason || typeof b.rejectionReason !== 'string' || b.rejectionReason.trim().length === 0) {
    throw new ValidationError('rejectionReason is required');
  }
  if (b.rejectionReason.length > 2000) throw new ValidationError('rejectionReason must be 2000 characters or fewer');

  return {
    rejectionReason: b.rejectionReason.trim(),
    reviewNotes:     optionalString(b.reviewNotes, 'reviewNotes'),
  };
}

// ─── Request Revision ─────────────────────────────────────────────────────────

export interface RequestRevisionDto {
  revisionInstructions: string;
  reviewNotes?:         string;
  visibleToClient?:     boolean;
}

export function validateRequestRevision(raw: unknown): RequestRevisionDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!b.revisionInstructions || typeof b.revisionInstructions !== 'string' || b.revisionInstructions.trim().length === 0) {
    throw new ValidationError('revisionInstructions is required');
  }
  if (b.revisionInstructions.length > 2000) throw new ValidationError('revisionInstructions must be 2000 characters or fewer');

  return {
    revisionInstructions: b.revisionInstructions.trim(),
    reviewNotes:          optionalString(b.reviewNotes, 'reviewNotes'),
    visibleToClient:      b.visibleToClient === true ? true : b.visibleToClient === false ? false : undefined,
  };
}

// ─── Assign Reviewer ──────────────────────────────────────────────────────────

export interface AssignReviewerDto {
  reviewerId:      string;
  reviewPriority?: ReviewPriority;
}

export function validateAssignReviewer(raw: unknown): AssignReviewerDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!isObjectId(b.reviewerId)) {
    throw new ValidationError('reviewerId must be a valid 24-char hex ObjectId');
  }

  return {
    reviewerId:     b.reviewerId as string,
    reviewPriority: isEnumValue(ReviewPriority, b.reviewPriority)
      ? (b.reviewPriority as ReviewPriority)
      : undefined,
  };
}

// ─── List Approvals Query ─────────────────────────────────────────────────────

export interface ListApprovalsQuery {
  approvalStatus?:  ApprovalStatus;
  approvalType?:    ApprovalType;
  reviewPriority?:  ReviewPriority;
  projectId?:       string;
  taskId?:          string;
  reviewerId?:      string;
  requestedBy?:     string;
  page:             number;
  limit:            number;
  sortBy:           'submittedAt' | 'reviewPriority' | 'resubmissionCount';
  sortOrder:        'asc' | 'desc';
}

export function parseListApprovalsQuery(q: Record<string, unknown>): ListApprovalsQuery {
  return {
    approvalStatus:  isEnumValue(ApprovalStatus, q.approvalStatus)  ? (q.approvalStatus as ApprovalStatus)  : undefined,
    approvalType:    isEnumValue(ApprovalType, q.approvalType)       ? (q.approvalType as ApprovalType)       : undefined,
    reviewPriority:  isEnumValue(ReviewPriority, q.reviewPriority)   ? (q.reviewPriority as ReviewPriority)   : undefined,
    projectId:       isObjectId(q.projectId) ? (q.projectId as string) : undefined,
    taskId:          isObjectId(q.taskId)    ? (q.taskId as string)    : undefined,
    reviewerId:      isObjectId(q.reviewerId) ? (q.reviewerId as string) : undefined,
    requestedBy:     isObjectId(q.requestedBy) ? (q.requestedBy as string) : undefined,
    page:            Math.max(1, parseInt(String(q.page  ?? '1'),  10) || 1),
    limit:           Math.min(100, Math.max(1, parseInt(String(q.limit ?? '20'), 10) || 20)),
    sortBy:          (['submittedAt', 'reviewPriority', 'resubmissionCount'] as const).includes(q.sortBy as 'submittedAt')
      ? (q.sortBy as ListApprovalsQuery['sortBy'])
      : 'submittedAt',
    sortOrder:       q.sortOrder === 'desc' ? 'desc' : 'asc',
  };
}
