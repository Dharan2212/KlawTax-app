/**
 * Project input validators — Batch 3.1
 *
 * Follows the same pattern established in leadValidators.ts:
 *   - Accept `unknown` input
 *   - Return strongly-typed payload objects
 *   - Throw ValidationError / AppError on invalid input
 *   - Pure functions — no side effects
 */

import { ValidationError, AppError } from '../middlewares/errorHandler';
import {
  ProjectStatus,
  ProjectPriority,
  CancellationReason,
  ChecklistItemStatus,
  TERMINAL_PROJECT_STATUSES,
} from '../models/projectEnums';
import { ServiceDeliveryType } from '../models/serviceEnums';

// ─── Field-level helpers ──────────────────────────────────────────────────────

function requireBody(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

function requireString(val: unknown, field: string, maxLen = 500): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ValidationError(`"${field}" is required and must be a non-empty string.`);
  }
  const s = val.replace(/\x00/g, '').trim();
  if (s.length > maxLen) {
    throw new ValidationError(`"${field}" must not exceed ${maxLen} characters.`);
  }
  return s;
}

function optionalString(val: unknown, field: string, maxLen = 500): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val !== 'string') throw new ValidationError(`"${field}" must be a string.`);
  const s = val.replace(/\x00/g, '').trim();
  if (s.length > maxLen) throw new ValidationError(`"${field}" must not exceed ${maxLen} characters.`);
  return s || undefined;
}

function requireEnum<T extends string>(val: unknown, field: string, allowed: T[]): T {
  if (!allowed.includes(val as T)) {
    throw new ValidationError(
      `"${field}" must be one of: ${allowed.join(', ')}. Received: "${String(val)}".`
    );
  }
  return val as T;
}

function optionalEnum<T extends string>(
  val: unknown,
  field: string,
  allowed: T[]
): T | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (!allowed.includes(val as T)) {
    throw new ValidationError(
      `"${field}" must be one of: ${allowed.join(', ')}. Received: "${String(val)}".`
    );
  }
  return val as T;
}

function requireObjectId(val: unknown, field: string): string {
  if (typeof val !== 'string' || !/^[0-9a-fA-F]{24}$/.test(val)) {
    throw new ValidationError(`"${field}" must be a valid 24-character ObjectId.`);
  }
  return val;
}

function optionalObjectId(val: unknown, field: string): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  return requireObjectId(val, field);
}

function requireStringArray(val: unknown, field: string, itemMaxLen = 100): string[] {
  if (!Array.isArray(val) || val.length === 0) {
    throw new ValidationError(`"${field}" must be a non-empty array.`);
  }
  return (val as unknown[]).map((item, i) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new ValidationError(`"${field}[${i}]" must be a non-empty string.`);
    }
    const s = item.trim();
    if (s.length > itemMaxLen) {
      throw new ValidationError(`"${field}[${i}]" must not exceed ${itemMaxLen} characters.`);
    }
    return s;
  });
}

function optionalStringArray(val: unknown, field: string, itemMaxLen = 100): string[] | undefined {
  if (val === undefined || val === null) return undefined;
  if (!Array.isArray(val)) throw new ValidationError(`"${field}" must be an array.`);
  if (val.length === 0) return [];
  return requireStringArray(val, field, itemMaxLen);
}

function optionalIsoDate(val: unknown, field: string): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val !== 'string') throw new ValidationError(`"${field}" must be a date string.`);
  if (isNaN(new Date(val).getTime())) throw new ValidationError(`"${field}" must be a valid ISO date string.`);
  return val;
}

function optionalNumber(val: unknown, field: string, min = 0, max = 100): number | undefined {
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  if (isNaN(n)) throw new ValidationError(`"${field}" must be a number.`);
  if (n < min || n > max) throw new ValidationError(`"${field}" must be between ${min} and ${max}.`);
  return n;
}

// ─── Typed Payload Interfaces ─────────────────────────────────────────────────

export interface CreateProjectPayload {
  clientId:            string;
  primaryServiceSlug:  string;
  serviceSlugs:        string[];
  serviceDeliveryTypes?: string[];
  title:               string;
  description?:        string;
  projectPriority?:    ProjectPriority;
  leadId?:             string;
  targetStartDate?:    string;
  targetCompletionDate?: string;
  expectedDeliveryDate?: string;
  isBundleAnchor?:     boolean;
  billingAnchorProjectId?: string;
  internalNotes?:      string;
  tags?:               string[];
}

export interface UpdateProjectPayload {
  title?:              string;
  description?:        string;
  projectPriority?:    ProjectPriority;
  expectedDeliveryDate?: string;
  targetStartDate?:    string;
  targetCompletionDate?: string;
  internalNotes?:      string;
  tags?:               string[];
  requiresClientInput?: boolean;
  requiresManualReview?: boolean;
  isBlocked?:          boolean;
  blockReason?:        string;
  progressPercentage?: number;
}

export interface TransitionProjectStatusPayload {
  status:              ProjectStatus;
  note?:               string;
  cancellationReason?: CancellationReason;
  cancellationNote?:   string;
}

export interface UpdateChecklistItemPayload {
  key:       string;
  status:    ChecklistItemStatus;
  notes?:    string;
}

export interface SetPrimaryManagerPayload {
  employeeProfileId: string;
  userId:            string;
}

// ─── Validators ───────────────────────────────────────────────────────────────

export function validateCreateProject(body: unknown): CreateProjectPayload {
  const b = requireBody(body);

  const clientId           = requireObjectId(b.clientId, 'clientId');
  const primaryServiceSlug = requireString(b.primaryServiceSlug, 'primaryServiceSlug', 100);
  const serviceSlugs       = requireStringArray(b.serviceSlugs, 'serviceSlugs', 100);
  const title              = requireString(b.title, 'title', 300);

  // Validate delivery types if provided
  const rawDeliveryTypes = b.serviceDeliveryTypes;
  let serviceDeliveryTypes: string[] | undefined;
  if (rawDeliveryTypes !== undefined && rawDeliveryTypes !== null) {
    serviceDeliveryTypes = requireStringArray(rawDeliveryTypes, 'serviceDeliveryTypes', 50).map(
      (dt) => requireEnum(dt, 'serviceDeliveryTypes[]', Object.values(ServiceDeliveryType))
    );
  }

  return {
    clientId,
    primaryServiceSlug,
    serviceSlugs,
    title,
    ...(serviceDeliveryTypes ? { serviceDeliveryTypes } : {}),
    ...(optionalString(b.description, 'description', 2000) ? { description: optionalString(b.description, 'description', 2000) } : {}),
    ...(optionalEnum(b.projectPriority, 'projectPriority', Object.values(ProjectPriority))
      ? { projectPriority: optionalEnum(b.projectPriority, 'projectPriority', Object.values(ProjectPriority)) }
      : {}),
    ...(optionalObjectId(b.leadId, 'leadId') ? { leadId: optionalObjectId(b.leadId, 'leadId') } : {}),
    ...(optionalIsoDate(b.targetStartDate, 'targetStartDate') ? { targetStartDate: optionalIsoDate(b.targetStartDate, 'targetStartDate') } : {}),
    ...(optionalIsoDate(b.targetCompletionDate, 'targetCompletionDate') ? { targetCompletionDate: optionalIsoDate(b.targetCompletionDate, 'targetCompletionDate') } : {}),
    ...(optionalIsoDate(b.expectedDeliveryDate, 'expectedDeliveryDate') ? { expectedDeliveryDate: optionalIsoDate(b.expectedDeliveryDate, 'expectedDeliveryDate') } : {}),
    ...(b.isBundleAnchor === true ? { isBundleAnchor: true } : {}),
    ...(optionalObjectId(b.billingAnchorProjectId, 'billingAnchorProjectId')
      ? { billingAnchorProjectId: optionalObjectId(b.billingAnchorProjectId, 'billingAnchorProjectId') }
      : {}),
    ...(optionalString(b.internalNotes, 'internalNotes', 10000) ? { internalNotes: optionalString(b.internalNotes, 'internalNotes', 10000) } : {}),
    ...(optionalStringArray(b.tags, 'tags', 50) ? { tags: optionalStringArray(b.tags, 'tags', 50) } : {}),
  };
}

export function validateUpdateProject(body: unknown): UpdateProjectPayload {
  const b = requireBody(body);
  const result: UpdateProjectPayload = {};

  const title = optionalString(b.title, 'title', 300);
  if (title) result.title = title;

  const description = optionalString(b.description, 'description', 2000);
  if (description !== undefined) result.description = description;

  const priority = optionalEnum(b.projectPriority, 'projectPriority', Object.values(ProjectPriority));
  if (priority) result.projectPriority = priority;

  const expectedDeliveryDate = optionalIsoDate(b.expectedDeliveryDate, 'expectedDeliveryDate');
  if (expectedDeliveryDate) result.expectedDeliveryDate = expectedDeliveryDate;

  const targetStart = optionalIsoDate(b.targetStartDate, 'targetStartDate');
  if (targetStart) result.targetStartDate = targetStart;

  const targetCompletion = optionalIsoDate(b.targetCompletionDate, 'targetCompletionDate');
  if (targetCompletion) result.targetCompletionDate = targetCompletion;

  const notes = optionalString(b.internalNotes, 'internalNotes', 10000);
  if (notes !== undefined) result.internalNotes = notes;

  const tags = optionalStringArray(b.tags, 'tags', 50);
  if (tags) result.tags = tags;

  if (b.requiresClientInput !== undefined) {
    result.requiresClientInput = Boolean(b.requiresClientInput);
  }
  if (b.requiresManualReview !== undefined) {
    result.requiresManualReview = Boolean(b.requiresManualReview);
  }
  if (b.isBlocked !== undefined) {
    result.isBlocked = Boolean(b.isBlocked);
    if (result.isBlocked) {
      result.blockReason = optionalString(b.blockReason, 'blockReason', 500);
    }
  }

  const progress = optionalNumber(b.progressPercentage, 'progressPercentage', 0, 100);
  if (progress !== undefined) result.progressPercentage = progress;

  return result;
}

export function validateTransitionStatus(
  currentStatus: ProjectStatus,
  body: unknown
): TransitionProjectStatusPayload {
  const b = requireBody(body);
  const targetStatus = requireEnum(b.status, 'status', Object.values(ProjectStatus));

  // Quick sanity check — full validation happens in projectWorkflow
  if (currentStatus === targetStatus) {
    throw new AppError(
      `Project is already in status "${currentStatus}".`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  if (TERMINAL_PROJECT_STATUSES.has(currentStatus as ProjectStatus)) {
    throw new AppError(
      `Cannot transition from terminal status "${currentStatus}".`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const result: TransitionProjectStatusPayload = { status: targetStatus };

  const note = optionalString(b.note, 'note', 1000);
  if (note) result.note = note;

  if (targetStatus === ProjectStatus.Cancelled) {
    const reason = requireEnum(b.cancellationReason, 'cancellationReason', Object.values(CancellationReason));
    result.cancellationReason = reason;
    const cancelNote = optionalString(b.cancellationNote, 'cancellationNote', 1000);
    if (cancelNote) result.cancellationNote = cancelNote;
  }

  return result;
}

export function validateUpdateChecklistItem(body: unknown): UpdateChecklistItemPayload {
  const b = requireBody(body);
  const key    = requireString(b.key, 'key', 100);
  const status = requireEnum(b.status, 'status', Object.values(ChecklistItemStatus));

  return {
    key,
    status,
    ...(optionalString(b.notes, 'notes', 1000) ? { notes: optionalString(b.notes, 'notes', 1000) } : {}),
  };
}

export function validateSetPrimaryManager(body: unknown): SetPrimaryManagerPayload {
  const b = requireBody(body);
  return {
    employeeProfileId: requireObjectId(b.employeeProfileId, 'employeeProfileId'),
    userId:            requireObjectId(b.userId, 'userId'),
  };
}

export function parseProjectListQuery(query: Record<string, unknown>): {
  filter: import('../modules/projects/projectRepository').ProjectFilter;
  sortField: 'createdAt' | 'updatedAt' | 'projectPriority' | 'lastActivityAt' | 'expectedDeliveryDate' | 'projectCode';
  sortDirection: 'asc' | 'desc';
} {
  const VALID_SORT_FIELDS = [
    'createdAt', 'updatedAt', 'projectPriority',
    'lastActivityAt', 'expectedDeliveryDate', 'projectCode',
  ] as const;

  const rawSort = typeof query.sortBy === 'string' ? query.sortBy : 'createdAt';
  const sortField = VALID_SORT_FIELDS.includes(rawSort as typeof VALID_SORT_FIELDS[number])
    ? (rawSort as typeof VALID_SORT_FIELDS[number])
    : 'createdAt';
  const sortDirection = query.sortOrder === 'asc' ? 'asc' : 'desc';

  const filter: import('../modules/projects/projectRepository').ProjectFilter = {};

  if (typeof query.clientId === 'string' && /^[0-9a-fA-F]{24}$/.test(query.clientId)) {
    filter.clientId = query.clientId;
  }
  if (typeof query.status === 'string') {
    filter.projectStatus = query.status as ProjectStatus;
  }
  if (typeof query.priority === 'string') {
    filter.projectPriority = query.priority as ProjectPriority;
  }
  if (typeof query.assignedTo === 'string' && /^[0-9a-fA-F]{24}$/.test(query.assignedTo)) {
    filter.assignedEmployeeId = query.assignedTo;
  }
  if (query.isOverdue === 'true') filter.isOverdue = true;
  if (query.isOverdue === 'false') filter.isOverdue = false;
  if (query.isStalled === 'true') filter.isStalled = true;
  if (query.isStalled === 'false') filter.isStalled = false;
  if (query.isBlocked === 'true') filter.isBlocked = true;
  if (query.requiresClientInput === 'true') filter.requiresClientInput = true;
  if (typeof query.serviceSlug === 'string') filter.primaryServiceSlug = query.serviceSlug;
  if (typeof query.deliveryType === 'string') filter.serviceDeliveryType = query.deliveryType;
  if (typeof query.search === 'string' && query.search.trim().length > 0) {
    filter.search = query.search.trim().slice(0, 100);
  }

  return { filter, sortField, sortDirection };
}
