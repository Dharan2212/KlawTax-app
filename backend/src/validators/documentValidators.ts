/**
 * Document input validators.
 *
 * Manual validation — consistent with leadValidators.ts pattern.
 * No external validation library dependency.
 */

import {
  DocumentCategory,
  DocumentVisibility,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../models/documentEnums';
import { ValidationError } from '../middlewares/errorHandler';

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function isObjectId(v: unknown): v is string {
  return typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);
}

function isEnumValue<T extends Record<string, string>>(enumObj: T, value: unknown): value is T[keyof T] {
  return typeof value === 'string' && Object.values(enumObj).includes(value);
}

// ─── Register Document Upload ─────────────────────────────────────────────────

export interface RegisterDocumentDto {
  title:             string;
  description?:      string;
  projectId?:        string;
  taskId?:           string;
  documentCategory:  DocumentCategory;
  tags:              string[];
  visibility:        DocumentVisibility;
  requiresApproval:  boolean;
  sensitiveDelivery: boolean;
  fileName:          string;
  originalFileName:  string;
  mimeType:          string;
  fileSizeBytes:     number;
  storageKey:        string;
}

export function validateRegisterDocument(raw: unknown): RegisterDocumentDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!b.title || typeof b.title !== 'string' || b.title.trim().length === 0) {
    throw new ValidationError('title is required');
  }
  if (b.title.trim().length > 255) throw new ValidationError('title must be 255 characters or fewer');

  if (b.description !== undefined) {
    if (typeof b.description !== 'string' || b.description.length > 1000) {
      throw new ValidationError('description must be a string up to 1000 characters');
    }
  }

  if (b.projectId !== undefined && !isObjectId(b.projectId)) {
    throw new ValidationError('projectId must be a valid 24-char hex ObjectId');
  }
  if (b.taskId !== undefined && !isObjectId(b.taskId)) {
    throw new ValidationError('taskId must be a valid 24-char hex ObjectId');
  }

  if (!isEnumValue(DocumentCategory, b.documentCategory)) {
    throw new ValidationError(
      `documentCategory must be one of: ${Object.values(DocumentCategory).join(', ')}`
    );
  }

  const tags: string[] = [];
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) throw new ValidationError('tags must be an array');
    if (b.tags.length > 10) throw new ValidationError('tags may have at most 10 entries');
    for (const t of b.tags) {
      if (typeof t !== 'string') throw new ValidationError('each tag must be a string');
      tags.push(t.trim().toLowerCase());
    }
  }

  const visibility: DocumentVisibility = isEnumValue(DocumentVisibility, b.visibility)
    ? (b.visibility as DocumentVisibility)
    : DocumentVisibility.EmployeeOnly;

  if (!b.fileName || typeof b.fileName !== 'string' || b.fileName.trim().length === 0) {
    throw new ValidationError('fileName is required');
  }
  if (!b.originalFileName || typeof b.originalFileName !== 'string' || b.originalFileName.trim().length === 0) {
    throw new ValidationError('originalFileName is required');
  }
  if (!b.mimeType || typeof b.mimeType !== 'string') {
    throw new ValidationError('mimeType is required');
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(b.mimeType)) {
    throw new ValidationError(`mimeType not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }
  if (typeof b.fileSizeBytes !== 'number' || b.fileSizeBytes <= 0) {
    throw new ValidationError('fileSizeBytes must be a positive number');
  }
  if (b.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`fileSizeBytes must be under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`);
  }
  if (!b.storageKey || typeof b.storageKey !== 'string' || b.storageKey.trim().length === 0) {
    throw new ValidationError('storageKey is required');
  }

  return {
    title:             b.title.trim(),
    description:       typeof b.description === 'string' ? b.description.trim() : undefined,
    projectId:         isObjectId(b.projectId) ? b.projectId : undefined,
    taskId:            isObjectId(b.taskId) ? b.taskId : undefined,
    documentCategory:  b.documentCategory as DocumentCategory,
    tags,
    visibility,
    requiresApproval:  b.requiresApproval !== false,
    sensitiveDelivery: b.sensitiveDelivery === true,
    fileName:          b.fileName.trim(),
    originalFileName:  b.originalFileName.trim(),
    mimeType:          b.mimeType,
    fileSizeBytes:     b.fileSizeBytes,
    storageKey:        b.storageKey.trim(),
  };
}

// ─── Resubmit Document ────────────────────────────────────────────────────────

export interface ResubmitDocumentDto {
  parentDocumentId: string;
  fileName:         string;
  originalFileName: string;
  mimeType:         string;
  fileSizeBytes:    number;
  storageKey:       string;
  submissionNote?:  string;
}

export function validateResubmitDocument(raw: unknown): ResubmitDocumentDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;

  if (!isObjectId(b.parentDocumentId)) {
    throw new ValidationError('parentDocumentId must be a valid 24-char hex ObjectId');
  }
  if (!b.fileName || typeof b.fileName !== 'string' || b.fileName.trim().length === 0) {
    throw new ValidationError('fileName is required');
  }
  if (!b.originalFileName || typeof b.originalFileName !== 'string') {
    throw new ValidationError('originalFileName is required');
  }
  if (!b.mimeType || typeof b.mimeType !== 'string') {
    throw new ValidationError('mimeType is required');
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(b.mimeType)) {
    throw new ValidationError('mimeType not allowed');
  }
  if (typeof b.fileSizeBytes !== 'number' || b.fileSizeBytes <= 0) {
    throw new ValidationError('fileSizeBytes must be a positive number');
  }
  if (b.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError(`fileSizeBytes must be under ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`);
  }
  if (!b.storageKey || typeof b.storageKey !== 'string' || b.storageKey.trim().length === 0) {
    throw new ValidationError('storageKey is required');
  }
  if (b.submissionNote !== undefined && (typeof b.submissionNote !== 'string' || b.submissionNote.length > 2000)) {
    throw new ValidationError('submissionNote must be a string up to 2000 characters');
  }

  return {
    parentDocumentId: b.parentDocumentId as string,
    fileName:         (b.fileName as string).trim(),
    originalFileName: (b.originalFileName as string).trim(),
    mimeType:         b.mimeType as string,
    fileSizeBytes:    b.fileSizeBytes as number,
    storageKey:       (b.storageKey as string).trim(),
    submissionNote:   typeof b.submissionNote === 'string' ? b.submissionNote.trim() : undefined,
  };
}

// ─── Update Visibility ────────────────────────────────────────────────────────

export interface UpdateDocumentVisibilityDto {
  visibility: DocumentVisibility;
}

export function validateUpdateVisibility(raw: unknown): UpdateDocumentVisibilityDto {
  if (!raw || typeof raw !== 'object') throw new ValidationError('Request body is required');
  const b = raw as Record<string, unknown>;
  if (!isEnumValue(DocumentVisibility, b.visibility)) {
    throw new ValidationError(
      `visibility must be one of: ${Object.values(DocumentVisibility).join(', ')}`
    );
  }
  return { visibility: b.visibility as DocumentVisibility };
}

// ─── List Documents Query ─────────────────────────────────────────────────────

export interface ListDocumentsQuery {
  projectId?:        string;
  taskId?:           string;
  documentCategory?: DocumentCategory;
  documentStatus?:   string;
  visibility?:       DocumentVisibility;
  isLatestVersion?:  boolean;
  page:              number;
  limit:             number;
}

export function parseListDocumentsQuery(q: Record<string, unknown>): ListDocumentsQuery {
  return {
    projectId:        isObjectId(q.projectId) ? (q.projectId as string) : undefined,
    taskId:           isObjectId(q.taskId)    ? (q.taskId as string)    : undefined,
    documentCategory: isEnumValue(DocumentCategory, q.documentCategory) ? (q.documentCategory as DocumentCategory) : undefined,
    documentStatus:   typeof q.documentStatus === 'string'              ? q.documentStatus : undefined,
    visibility:       isEnumValue(DocumentVisibility, q.visibility)     ? (q.visibility as DocumentVisibility) : undefined,
    isLatestVersion:  q.isLatestVersion === 'true' ? true : q.isLatestVersion === 'false' ? false : undefined,
    page:             Math.max(1, parseInt(String(q.page  ?? '1'),  10) || 1),
    limit:            Math.min(100, Math.max(1, parseInt(String(q.limit ?? '20'), 10) || 20)),
  };
}
