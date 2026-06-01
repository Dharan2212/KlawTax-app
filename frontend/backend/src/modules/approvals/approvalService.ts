import { Types, SortOrder } from 'mongoose';
import { ApprovalModel, IApproval } from '../../models/approval';
import { DocumentModel } from '../../models/document';
import {
  ApprovalStatus,
  ReviewPriority,
  DocumentStatus,
  APPROVAL_TRANSITIONS,
  isValidApprovalTransition,
} from '../../models/documentEnums';
import { transitionDocumentStatus } from '../documents/documentService';
import {
  SubmitForReviewDto,
  ApproveApprovalDto,
  RejectApprovalDto,
  RequestRevisionDto,
  AssignReviewerDto,
  ListApprovalsQuery,
} from '../../validators/approvalValidators';
import { NotFoundError, ValidationError, ForbiddenError } from '../../middlewares/errorHandler';
import { buildPaginationMeta } from '../../utils/response';
import { Role } from '../../utils/permissions';
import { logger } from '../../utils/logger';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Warn when an approval has been resubmitted this many times or more. */
const RESUBMISSION_WARNING_THRESHOLD = 3;

// ─── Transition Guard ─────────────────────────────────────────────────────────

function assertApprovalTransition(
  approval: IApproval,
  target: ApprovalStatus
): void {
  if (!isValidApprovalTransition(approval.approvalStatus, target)) {
    throw new ValidationError(
      `Cannot transition approval from "${approval.approvalStatus}" to "${target}".`,
      { allowed: APPROVAL_TRANSITIONS[approval.approvalStatus] }
    );
  }
}

// ─── Submit for Review ────────────────────────────────────────────────────────

/**
 * Creates an Approval record for a document and transitions the document to under_review.
 *
 * Guard: document must have no existing active (pending/under_review) approval.
 * Guard: document must exist and be in an uploadable state.
 */
export async function submitForReview(
  dto: SubmitForReviewDto,
  requestedBy: Types.ObjectId
): Promise<IApproval> {
  const docId = new Types.ObjectId(dto.documentId);

  const doc = await DocumentModel.findOne({ _id: docId, isDeleted: false });
  if (!doc) throw new NotFoundError('Document');

  // Verify document has no in-flight approval already
  const existingActive = await ApprovalModel.findOne({
    documentId: docId,
    approvalStatus: { $in: [ApprovalStatus.Pending, ApprovalStatus.UnderReview] },
    isDeleted: false,
  });
  if (existingActive) {
    throw new ValidationError(
      'This document already has an active approval in progress. ' +
      'Wait for the current review to complete before submitting again.'
    );
  }

  // Document must be in a submittable state
  const submittableStatuses: DocumentStatus[] = [
    DocumentStatus.Uploaded,
    DocumentStatus.Resubmitted,
  ];
  if (!submittableStatuses.includes(doc.documentStatus)) {
    throw new ValidationError(
      `Document status "${doc.documentStatus}" is not submittable. ` +
      `Document must be uploaded or resubmitted before review submission.`
    );
  }

  const approval = await ApprovalModel.create({
    projectId:            dto.projectId  ? new Types.ObjectId(dto.projectId)  : undefined,
    taskId:               dto.taskId     ? new Types.ObjectId(dto.taskId)     : undefined,
    documentId:           docId,
    requestedBy,
    approvalType:         dto.approvalType,
    approvalStatus:       ApprovalStatus.Pending,
    reviewPriority:       dto.reviewPriority,
    submissionNote:       dto.submissionNote,
    resubmissionCount:    0,
    submittedAt:          new Date(),
    requiresResubmission: false,
    finalDecision:        false,
    visibleToClient:      dto.visibleToClient,
    currentVersionId:     docId,
    versionHistory:       [],
    createdBy:            requestedBy,
  });

  // Link approval back to document
  await DocumentModel.findByIdAndUpdate(docId, {
    $set: { approvalId: approval._id },
  });

  // Transition document → under_review
  await transitionDocumentStatus(docId, DocumentStatus.UnderReview, requestedBy);

  // Update approval to under_review immediately (auto-start review)
  await ApprovalModel.findByIdAndUpdate(approval._id, {
    $set: {
      approvalStatus:    ApprovalStatus.UnderReview,
      reviewStartedAt:   new Date(),
      updatedBy:         requestedBy,
    },
  });

  logger.info('[Approvals] Submitted for review', {
    approvalId:  String(approval._id),
    documentId:  String(docId),
    requestedBy: String(requestedBy),
  });

  const updated = await ApprovalModel.findById(approval._id);
  return updated!;
}

// ─── Approve ──────────────────────────────────────────────────────────────────

export async function approveApproval(
  approvalId: Types.ObjectId,
  dto: ApproveApprovalDto,
  reviewerId: Types.ObjectId
): Promise<IApproval> {
  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  assertApprovalTransition(approval, ApprovalStatus.Approved);

  const now = new Date();

  // Transition document → approved
  if (approval.documentId) {
    await transitionDocumentStatus(
      approval.documentId,
      DocumentStatus.Approved,
      reviewerId,
      { reviewNotes: dto.reviewNotes, reviewerId }
    );
  }

  const updated = await ApprovalModel.findByIdAndUpdate(
    approvalId,
    {
      $set: {
        approvalStatus:    ApprovalStatus.Approved,
        reviewedAt:        now,
        approvedAt:        now,
        reviewNotes:       dto.reviewNotes,
        reviewerId,
        finalDecision:     true,
        approvedVersionId: approval.currentVersionId,
        updatedBy:         reviewerId,
      },
    },
    { new: true }
  );

  if (!updated) throw new NotFoundError('Approval');

  logger.info('[Approvals] Approved', {
    approvalId:  String(approvalId),
    documentId:  String(approval.documentId),
    reviewer:    String(reviewerId),
    withNote:    !!dto.reviewNotes,
  });

  if (!dto.reviewNotes) {
    logger.info('[Approvals] Approved without a review note (EC-A2)', { approvalId: String(approvalId) });
  }

  return updated;
}

// ─── Reject ───────────────────────────────────────────────────────────────────

export async function rejectApproval(
  approvalId: Types.ObjectId,
  dto: RejectApprovalDto,
  reviewerId: Types.ObjectId
): Promise<IApproval> {
  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  assertApprovalTransition(approval, ApprovalStatus.Rejected);

  const now = new Date();

  if (approval.documentId) {
    await transitionDocumentStatus(
      approval.documentId,
      DocumentStatus.Rejected,
      reviewerId,
      {
        rejectionReason: dto.rejectionReason,
        reviewNotes:     dto.reviewNotes,
        reviewerId,
      }
    );
  }

  const updated = await ApprovalModel.findByIdAndUpdate(
    approvalId,
    {
      $set: {
        approvalStatus:       ApprovalStatus.Rejected,
        reviewedAt:           now,
        rejectedAt:           now,
        rejectionReason:      dto.rejectionReason,
        reviewNotes:          dto.reviewNotes,
        reviewerId,
        requiresResubmission: true,
        finalDecision:        false,
        updatedBy:            reviewerId,
      },
    },
    { new: true }
  );

  if (!updated) throw new NotFoundError('Approval');

  logger.info('[Approvals] Rejected', {
    approvalId: String(approvalId),
    reason:     dto.rejectionReason,
  });

  return updated;
}

// ─── Request Revision ─────────────────────────────────────────────────────────

export async function requestRevision(
  approvalId: Types.ObjectId,
  dto: RequestRevisionDto,
  reviewerId: Types.ObjectId
): Promise<IApproval> {
  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  assertApprovalTransition(approval, ApprovalStatus.RevisionRequested);

  // Resubmission count warning (EC-P4 guard)
  if (approval.resubmissionCount >= RESUBMISSION_WARNING_THRESHOLD) {
    logger.warn('[Approvals] High resubmission count — escalation recommended', {
      approvalId:        String(approvalId),
      resubmissionCount: approval.resubmissionCount,
    });
  }

  const now = new Date();

  if (approval.documentId) {
    await transitionDocumentStatus(
      approval.documentId,
      DocumentStatus.RevisionRequested,
      reviewerId,
      {
        revisionInstructions: dto.revisionInstructions,
        reviewNotes:          dto.reviewNotes,
        reviewerId,
      }
    );
  }

  const setPayload: Record<string, unknown> = {
    approvalStatus:         ApprovalStatus.RevisionRequested,
    revisionRequestedAt:    now,
    revisionInstructions:   dto.revisionInstructions,
    reviewNotes:            dto.reviewNotes,
    reviewerId,
    requiresResubmission:   true,
    finalDecision:          false,
    updatedBy:              reviewerId,
  };
  if (dto.visibleToClient !== undefined) setPayload.visibleToClient = dto.visibleToClient;

  const updated = await ApprovalModel.findByIdAndUpdate(
    approvalId,
    { $set: setPayload },
    { new: true }
  );

  if (!updated) throw new NotFoundError('Approval');

  logger.info('[Approvals] Revision requested', {
    approvalId: String(approvalId),
    resubmissionCount: approval.resubmissionCount,
  });

  return updated;
}

// ─── Assign Reviewer ──────────────────────────────────────────────────────────

export async function assignReviewer(
  approvalId: Types.ObjectId,
  dto: AssignReviewerDto,
  assignedBy: Types.ObjectId
): Promise<IApproval> {
  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  const terminalStatuses: ApprovalStatus[] = [ApprovalStatus.Approved, ApprovalStatus.Cancelled];
  if (terminalStatuses.includes(approval.approvalStatus)) {
    throw new ValidationError(`Cannot assign a reviewer to an approval with status "${approval.approvalStatus}".`);
  }

  const setPayload: Record<string, unknown> = {
    reviewerId: new Types.ObjectId(dto.reviewerId),
    updatedBy:  assignedBy,
  };
  if (dto.reviewPriority) setPayload.reviewPriority = dto.reviewPriority;

  const updated = await ApprovalModel.findByIdAndUpdate(
    approvalId,
    { $set: setPayload },
    { new: true }
  );

  if (!updated) throw new NotFoundError('Approval');
  return updated;
}

// ─── Get Approval ─────────────────────────────────────────────────────────────

export async function getApprovalById(
  approvalId: Types.ObjectId,
  role: Role,
  requesterId: Types.ObjectId
): Promise<IApproval> {
  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  // Client may only see their own approvals that are client-visible
  if (role === Role.Client) {
    if (!approval.visibleToClient) throw new NotFoundError('Approval');
    if (String(approval.requestedBy) !== String(requesterId)) throw new NotFoundError('Approval');
  }

  // Employee may see approvals they submitted or are assigned to review
  if (role === Role.Employee) {
    const isOwn      = String(approval.requestedBy) === String(requesterId);
    const isReviewer = String(approval.reviewerId)  === String(requesterId);
    if (!isOwn && !isReviewer) throw new ForbiddenError('Access denied to this approval');
  }

  return approval;
}

// ─── List / Queue ─────────────────────────────────────────────────────────────

/**
 * Approval queue listing — used for CRM admin dashboard and employee workspace.
 */
export async function listApprovals(
  query: ListApprovalsQuery,
  role: Role,
  requesterId: Types.ObjectId
): Promise<{ approvals: IApproval[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const skip = (query.page - 1) * query.limit;

  const filter: Record<string, unknown> = { isDeleted: false };

  // Role scoping
  if (role === Role.Employee) {
    filter.$or = [
      { requestedBy: requesterId },
      { reviewerId:  requesterId },
    ];
  }
  if (role === Role.Client) {
    filter.requestedBy  = requesterId;
    filter.visibleToClient = true;
  }

  if (query.approvalStatus)  filter.approvalStatus  = query.approvalStatus;
  if (query.approvalType)    filter.approvalType    = query.approvalType;
  if (query.reviewPriority)  filter.reviewPriority  = query.reviewPriority;
  if (query.projectId)       filter.projectId       = new Types.ObjectId(query.projectId);
  if (query.taskId)          filter.taskId          = new Types.ObjectId(query.taskId);
  if (query.reviewerId)      filter.reviewerId      = new Types.ObjectId(query.reviewerId);
  if (query.requestedBy)     filter.requestedBy     = new Types.ObjectId(query.requestedBy);

  // Sort mapping
  const sortFieldMap: Record<string, string> = {
    submittedAt:       'submittedAt',
    reviewPriority:    'reviewPriority',
    resubmissionCount: 'resubmissionCount',
  };
  const sortField = sortFieldMap[query.sortBy] ?? 'submittedAt';
  const sortDir: SortOrder = query.sortOrder === 'desc' ? -1 : 1;

  const [approvals, total] = await Promise.all([
    ApprovalModel.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ApprovalModel.countDocuments(filter),
  ]);

  return {
    approvals: approvals as unknown as IApproval[],
    meta:      buildPaginationMeta(query.page, query.limit, total),
  };
}

// ─── Pending Queue (convenience) ──────────────────────────────────────────────

/**
 * Returns pending/under_review approvals ordered by priority for the admin queue.
 */
export async function getPendingQueue(
  page = 1,
  limit = 20,
  projectId?: Types.ObjectId
): Promise<{ approvals: IApproval[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const skip   = (page - 1) * limit;
  const filter: Record<string, unknown> = {
    approvalStatus: { $in: [ApprovalStatus.Pending, ApprovalStatus.UnderReview, ApprovalStatus.Resubmitted] },
    isDeleted:      false,
  };
  if (projectId) filter.projectId = projectId;

  const priorityOrder = {
    [ReviewPriority.Urgent]: 0,
    [ReviewPriority.High]:   1,
    [ReviewPriority.Medium]: 2,
    [ReviewPriority.Low]:    3,
  };

  // Mongo sort by enum priority requires a numeric mapping — use aggregation for full accuracy
  // Simple sort approximation: urgent first by submittedAt within priority
  const [approvals, total] = await Promise.all([
    ApprovalModel.find(filter)
      .sort({ reviewPriority: 1, submittedAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ApprovalModel.countDocuments(filter),
  ]);

  // Re-sort in memory by priority weight for small result sets
  const weighted = (approvals as unknown as IApproval[]).sort(
    (a, b) =>
      (priorityOrder[a.reviewPriority] ?? 2) - (priorityOrder[b.reviewPriority] ?? 2) ||
      a.submittedAt.getTime() - b.submittedAt.getTime()
  );

  return { approvals: weighted, meta: buildPaginationMeta(page, limit, total) };
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelApproval(
  approvalId: Types.ObjectId,
  cancelledBy: Types.ObjectId,
  role: Role
): Promise<IApproval> {
  if (role !== Role.Admin) throw new ForbiddenError('Only admins can cancel approvals');

  const approval = await ApprovalModel.findOne({ _id: approvalId, isDeleted: false });
  if (!approval) throw new NotFoundError('Approval');

  assertApprovalTransition(approval, ApprovalStatus.Cancelled);

  const updated = await ApprovalModel.findByIdAndUpdate(
    approvalId,
    { $set: { approvalStatus: ApprovalStatus.Cancelled, finalDecision: true, updatedBy: cancelledBy } },
    { new: true }
  );

  if (!updated) throw new NotFoundError('Approval');
  return updated;
}
