import { Types } from 'mongoose';
import { DocumentModel, IDocument } from '../../models/document';
import { ApprovalModel } from '../../models/approval';
import {
  DocumentStatus,
  DocumentVisibility,
  StorageProvider,
  DOCUMENT_TRANSITIONS,
  isValidDocumentTransition,
  ApprovalStatus,
  SENSITIVE_PRESIGN_TTL_SECONDS,
  STANDARD_PRESIGN_TTL_SECONDS,
} from '../../models/documentEnums';
import {
  RegisterDocumentDto,
  ResubmitDocumentDto,
  ListDocumentsQuery,
} from '../../validators/documentValidators';
import { NotFoundError, ValidationError } from '../../middlewares/errorHandler';
import { buildPaginationMeta } from '../../utils/response';
import { Role } from '../../utils/permissions';
import { logger } from '../../utils/logger';

// ─── Visibility Filtering ─────────────────────────────────────────────────────

/**
 * Returns a Mongoose query fragment restricting document visibility by role.
 * Clients must NEVER see EmployeeOnly or InternalOnly documents.
 */
export function buildVisibilityFilter(role: Role): Record<string, unknown> {
  if (role === Role.Admin) return {};
  if (role === Role.Employee) {
    return { visibility: { $in: [DocumentVisibility.ClientVisible, DocumentVisibility.EmployeeOnly] } };
  }
  // Client — strict: only explicitly client-visible documents
  return { visibility: DocumentVisibility.ClientVisible };
}

// ─── Register Upload ──────────────────────────────────────────────────────────

/**
 * Registers a document metadata record after the file has been written to storage.
 * Storage I/O (S3 / local) is handled by the route handler before calling this.
 */
export async function registerDocumentUpload(
  dto: RegisterDocumentDto,
  uploadedBy: Types.ObjectId,
  clientId?: Types.ObjectId
): Promise<IDocument> {
  const ext = dto.originalFileName.split('.').pop()?.toLowerCase() ?? '';

  const doc = await DocumentModel.create({
    title:                dto.title,
    description:          dto.description,
    projectId:            dto.projectId  ? new Types.ObjectId(dto.projectId)  : undefined,
    taskId:               dto.taskId     ? new Types.ObjectId(dto.taskId)     : undefined,
    uploadedBy,
    clientId,
    fileName:             dto.fileName,
    originalFileName:     dto.originalFileName,
    mimeType:             dto.mimeType,
    extension:            ext,
    fileSizeBytes:        dto.fileSizeBytes,
    storageKey:           dto.storageKey,
    storageProvider:      StorageProvider.S3,
    documentCategory:     dto.documentCategory,
    tags:                 dto.tags,
    versionNumber:        1,
    isLatestVersion:      true,
    documentStatus:       DocumentStatus.Uploaded,
    uploadedAt:           new Date(),
    requiresApproval:     dto.requiresApproval,
    requiresResubmission: false,
    visibility:           dto.visibility,
    sensitiveDelivery:    dto.sensitiveDelivery,
    createdBy:            uploadedBy,
  });

  logger.info('[Documents] Upload registered', {
    documentId: String(doc._id),
    projectId:  dto.projectId,
    category:   dto.documentCategory,
  });

  return doc;
}

// ─── List Documents ───────────────────────────────────────────────────────────

export async function listDocuments(
  query: ListDocumentsQuery,
  role: Role,
  scopeClientId?: Types.ObjectId
): Promise<{ documents: IDocument[]; meta: ReturnType<typeof buildPaginationMeta> }> {
  const skip = (query.page - 1) * query.limit;

  const filter: Record<string, unknown> = {
    isDeleted: false,
    ...buildVisibilityFilter(role),
  };

  if (scopeClientId)          filter.clientId         = scopeClientId;
  if (query.projectId)        filter.projectId        = new Types.ObjectId(query.projectId);
  if (query.taskId)           filter.taskId           = new Types.ObjectId(query.taskId);
  if (query.documentCategory) filter.documentCategory = query.documentCategory;
  if (query.documentStatus)   filter.documentStatus   = query.documentStatus;
  if (query.visibility)       filter.visibility       = query.visibility;
  if (query.isLatestVersion !== undefined) filter.isLatestVersion = query.isLatestVersion;

  const [documents, total] = await Promise.all([
    DocumentModel.find(filter).sort({ uploadedAt: -1 }).skip(skip).limit(query.limit).lean(),
    DocumentModel.countDocuments(filter),
  ]);

  return {
    documents: documents as unknown as IDocument[],
    meta:      buildPaginationMeta(query.page, query.limit, total),
  };
}

// ─── Get Document ─────────────────────────────────────────────────────────────

export async function getDocumentById(
  documentId: Types.ObjectId,
  role: Role,
  scopeClientId?: Types.ObjectId
): Promise<IDocument> {
  const filter: Record<string, unknown> = {
    _id:       documentId,
    isDeleted: false,
    ...buildVisibilityFilter(role),
  };
  if (scopeClientId) filter.clientId = scopeClientId;

  const doc = await DocumentModel.findOne(filter);
  if (!doc) throw new NotFoundError('Document');
  return doc;
}

// ─── Version History ──────────────────────────────────────────────────────────

export async function getVersionHistory(
  parentDocumentId: Types.ObjectId,
  role: Role
): Promise<IDocument[]> {
  const filter: Record<string, unknown> = {
    $or: [
      { _id:              parentDocumentId },
      { parentDocumentId: parentDocumentId },
    ],
    isDeleted: false,
    ...buildVisibilityFilter(role),
  };

  const docs = await DocumentModel.find(filter).sort({ versionNumber: -1 }).lean();
  return docs as unknown as IDocument[];
}

// ─── Resubmit (new version) ───────────────────────────────────────────────────

/**
 * Creates a new document version linked to the root parent.
 *
 * Rules:
 * - Only rejected or revision_requested docs may be resubmitted.
 * - Previous latest version is marked isLatestVersion: false (immutable history).
 * - New version inherits all metadata; only storage fields change.
 * - Linked approval resubmissionCount is incremented.
 */
export async function resubmitDocument(
  dto: ResubmitDocumentDto,
  uploadedBy: Types.ObjectId,
  clientId?: Types.ObjectId
): Promise<IDocument> {
  const parentId = new Types.ObjectId(dto.parentDocumentId);

  const currentLatest = await DocumentModel.findOne({
    $or: [{ _id: parentId }, { parentDocumentId: parentId }],
    isLatestVersion: true,
    isDeleted: false,
  });

  if (!currentLatest) throw new NotFoundError('Document (latest version)');

  const resubmittableStatuses: DocumentStatus[] = [
    DocumentStatus.Rejected,
    DocumentStatus.RevisionRequested,
  ];
  if (!resubmittableStatuses.includes(currentLatest.documentStatus)) {
    throw new ValidationError(
      `Cannot resubmit a document with status "${currentLatest.documentStatus}". ` +
      `Only rejected or revision_requested documents can be resubmitted.`
    );
  }

  const ext = dto.originalFileName.split('.').pop()?.toLowerCase() ?? '';
  const rootId = (currentLatest.parentDocumentId ?? currentLatest._id) as Types.ObjectId;

  // Demote current latest — immutable history preserved
  await DocumentModel.findByIdAndUpdate(currentLatest._id, {
    $set: { isLatestVersion: false },
  });

  const newVersion = await DocumentModel.create({
    title:                currentLatest.title,
    description:          currentLatest.description,
    projectId:            currentLatest.projectId,
    taskId:               currentLatest.taskId,
    uploadedBy,
    clientId:             clientId ?? currentLatest.clientId,
    approvalId:           currentLatest.approvalId,
    fileName:             dto.fileName,
    originalFileName:     dto.originalFileName,
    mimeType:             dto.mimeType,
    extension:            ext,
    fileSizeBytes:        dto.fileSizeBytes,
    storageKey:           dto.storageKey,
    storageProvider:      currentLatest.storageProvider,
    documentCategory:     currentLatest.documentCategory,
    tags:                 currentLatest.tags,
    versionNumber:        currentLatest.versionNumber + 1,
    previousVersionId:    currentLatest._id,
    parentDocumentId:     rootId,
    isLatestVersion:      true,
    documentStatus:       DocumentStatus.Resubmitted,
    uploadedAt:           new Date(),
    requiresApproval:     currentLatest.requiresApproval,
    requiresResubmission: false,
    visibility:           currentLatest.visibility,
    sensitiveDelivery:    currentLatest.sensitiveDelivery,
    createdBy:            uploadedBy,
  });

  // Update linked approval
  if (currentLatest.approvalId) {
    await ApprovalModel.findByIdAndUpdate(currentLatest.approvalId, {
      $inc:  { resubmissionCount: 1 },
      $push: { versionHistory: currentLatest._id },
      $set:  {
        currentVersionId:     newVersion._id,
        approvalStatus:       ApprovalStatus.Resubmitted,
        resubmittedAt:        new Date(),
        requiresResubmission: false,
        updatedBy:            uploadedBy,
      },
    });

    // Link approval to new document version
    await DocumentModel.findByIdAndUpdate(newVersion._id, {
      $set: { approvalId: currentLatest.approvalId },
    });
  }

  logger.info('[Documents] Version resubmitted', {
    rootId:        String(rootId),
    newVersionId:  String(newVersion._id),
    versionNumber: newVersion.versionNumber,
  });

  return newVersion;
}

// ─── Status Transition (internal — called by approvalService) ─────────────────

export async function transitionDocumentStatus(
  documentId: Types.ObjectId,
  targetStatus: DocumentStatus,
  updatedBy: Types.ObjectId,
  meta?: {
    reviewNotes?:          string;
    rejectionReason?:      string;
    revisionInstructions?: string;
    reviewerId?:           Types.ObjectId;
  }
): Promise<IDocument> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new NotFoundError('Document');

  if (!isValidDocumentTransition(doc.documentStatus, targetStatus)) {
    throw new ValidationError(
      `Invalid document transition: "${doc.documentStatus}" → "${targetStatus}".`,
      { allowed: DOCUMENT_TRANSITIONS[doc.documentStatus] }
    );
  }

  const now = new Date();
  const update: Record<string, unknown> = { documentStatus: targetStatus, updatedBy };

  if (targetStatus === DocumentStatus.Approved)         update.approvedAt = now;
  if (targetStatus === DocumentStatus.Rejected)         update.rejectedAt = now;
  if (targetStatus === DocumentStatus.Archived)         update.archivedAt = now;
  if (meta?.reviewNotes)          update.reviewNotes          = meta.reviewNotes;
  if (meta?.rejectionReason)      update.rejectionReason      = meta.rejectionReason;
  if (meta?.revisionInstructions) update.revisionInstructions = meta.revisionInstructions;
  if (meta?.reviewerId)           update.currentReviewerId    = meta.reviewerId;

  const updated = await DocumentModel.findByIdAndUpdate(
    documentId,
    { $set: update },
    { new: true }
  );
  if (!updated) throw new NotFoundError('Document');
  return updated;
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export async function softDeleteDocument(
  documentId: Types.ObjectId,
  deletedBy: Types.ObjectId
): Promise<void> {
  const doc = await DocumentModel.findById(documentId);
  if (!doc) throw new NotFoundError('Document');

  if (doc.documentStatus === DocumentStatus.Approved) {
    throw new ValidationError('Approved documents cannot be deleted. Archive them instead.');
  }

  await DocumentModel.findByIdAndUpdate(documentId, {
    $set: { isDeleted: true, deletedAt: new Date(), deletedBy },
  });

  logger.info('[Documents] Soft-deleted', { documentId: String(documentId) });
}

// ─── Pre-signed URL helpers ───────────────────────────────────────────────────

export function getPresignTtl(doc: IDocument): number {
  return doc.sensitiveDelivery ? SENSITIVE_PRESIGN_TTL_SECONDS : STANDARD_PRESIGN_TTL_SECONDS;
}

/**
 * Generates a pre-signed download URL descriptor for a document.
 *
 * The URL format used here is a signed-URL pattern compatible with S3 presign
 * conventions. In the storage integration layer (Phase 5), replace the URL
 * construction with the real AWS SDK GetObjectCommand + getSignedUrl call.
 * The TTL and expiry logic are already production-correct.
 */
export function generatePresignedDownloadUrl(doc: IDocument): {
  url:        string;
  expiresAt:  Date;
  ttlSeconds: number;
} {
  const ttl       = getPresignTtl(doc);
  const expiresAt = new Date(Date.now() + ttl * 1000);
  return {
    url:        `https://storage.klawtax.online/presigned/${doc.storageKey}?expires=${expiresAt.getTime()}`,
    expiresAt,
    ttlSeconds: ttl,
  };
}
