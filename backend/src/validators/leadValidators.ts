/**
 * Lead input validators.
 *
 * All validators:
 *   - Accept `unknown` input (raw request body)
 *   - Return strongly-typed payload objects
 *   - Throw AppError / ValidationError on invalid input
 *   - Are pure functions with no side effects
 *
 * No external validation library required.
 */

import {
  LeadSource,
  OrganisationType,
  PreferredContactMethod,
  UrgencyLevel,
  LeadStatus,
  LeadPriority,
  LeadLossReason,
  LeadArchiveReason,
  LEAD_STATUS_TRANSITIONS,
} from '../models/leadEnums';
import { AppError, ValidationError } from '../middlewares/errorHandler';

// ─── Field-level validators ───────────────────────────────────────────────────

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidIndianPhone(value: string): boolean {
  // Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX (10 digits, 6-9 start)
  return /^(\+?91)?[6-9]\d{9}$/.test(value.replace(/[\s\-()]/g, ''));
}

export function sanitiseString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\x00/g, '').trim();
}

// ─── Typed Payload Interfaces ─────────────────────────────────────────────────

export interface PublicLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  serviceInterestSlugs?: string[];
  leadSource?: LeadSource;
  organisationName?: string;
  organisationType?: OrganisationType;
  preferredContactMethod?: PreferredContactMethod;
  urgencyLevel?: UrgencyLevel;
  landingPage?: string;
  campaignSource?: string;
}

export interface CreateLeadPayload extends PublicLeadPayload {
  priority?: LeadPriority;
  internalNotes?: string;
  estimatedBudget?: number;
  qualificationScore?: number;
  tags?: string[];
  followUpDate?: string;
}

export interface UpdateLeadPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  internalNotes?: string;
  serviceInterestSlugs?: string[];
  organisationName?: string;
  organisationType?: OrganisationType;
  preferredContactMethod?: PreferredContactMethod;
  urgencyLevel?: UrgencyLevel;
  priority?: LeadPriority;
  estimatedBudget?: number;
  qualificationScore?: number;
  tags?: string[];
  followUpDate?: string;
}

export interface UpdateLeadStatusPayload {
  status: LeadStatus;
  lossReason?: LeadLossReason;
  lossNote?: string;
  archiveReason?: LeadArchiveReason;
}

export interface AssignLeadPayload {
  assignedTo: string;
}

export interface AddLeadNotePayload {
  note: string;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function requireString(val: unknown, fieldName: string, maxLen = 500): string {
  if (typeof val !== 'string' || val.trim().length === 0) {
    throw new ValidationError(`"${fieldName}" is required and must be a non-empty string.`);
  }
  const s = sanitiseString(val);
  if (s.length > maxLen) {
    throw new ValidationError(`"${fieldName}" must not exceed ${maxLen} characters.`);
  }
  return s;
}

function optionalString(val: unknown, fieldName: string, maxLen = 500): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val !== 'string') {
    throw new ValidationError(`"${fieldName}" must be a string.`);
  }
  const s = sanitiseString(val);
  if (s.length > maxLen) {
    throw new ValidationError(`"${fieldName}" must not exceed ${maxLen} characters.`);
  }
  return s || undefined;
}

function optionalEnum<T extends string>(
  val: unknown,
  fieldName: string,
  allowed: T[]
): T | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (!allowed.includes(val as T)) {
    throw new ValidationError(
      `"${fieldName}" must be one of: ${allowed.join(', ')}. Received: "${String(val)}".`
    );
  }
  return val as T;
}

function requireEnum<T extends string>(val: unknown, fieldName: string, allowed: T[]): T {
  if (!allowed.includes(val as T)) {
    throw new ValidationError(
      `"${fieldName}" must be one of: ${allowed.join(', ')}. Received: "${String(val)}".`
    );
  }
  return val as T;
}

function optionalPositiveNumber(val: unknown, fieldName: string): number | undefined {
  if (val === undefined || val === null) return undefined;
  const n = Number(val);
  if (isNaN(n) || n < 0) {
    throw new ValidationError(`"${fieldName}" must be a non-negative number.`);
  }
  return n;
}

function optionalStringArray(val: unknown, fieldName: string, itemMaxLen = 100): string[] | undefined {
  if (val === undefined || val === null) return undefined;
  if (!Array.isArray(val)) {
    throw new ValidationError(`"${fieldName}" must be an array.`);
  }
  return (val as unknown[]).map((item, idx) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new ValidationError(`"${fieldName}[${idx}]" must be a non-empty string.`);
    }
    const s = sanitiseString(item);
    if (s.length > itemMaxLen) {
      throw new ValidationError(`"${fieldName}[${idx}]" must not exceed ${itemMaxLen} characters.`);
    }
    return s;
  });
}

function optionalIsoDate(val: unknown, fieldName: string): string | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val !== 'string') {
    throw new ValidationError(`"${fieldName}" must be a date string.`);
  }
  if (isNaN(new Date(val).getTime())) {
    throw new ValidationError(`"${fieldName}" must be a valid ISO date string.`);
  }
  return val;
}

function requireBody(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  return body as Record<string, unknown>;
}

// ─── Public Lead Payload Validator ────────────────────────────────────────────

export function validatePublicLeadPayload(body: unknown): PublicLeadPayload {
  const b = requireBody(body);

  const fullName = requireString(b.fullName, 'fullName', 100);
  const rawPhone = requireString(b.phone, 'phone', 20);
  if (!isValidIndianPhone(rawPhone)) {
    throw new ValidationError('"phone" must be a valid Indian mobile number (10 digits, 6-9 prefix).');
  }

  const email = optionalString(b.email, 'email', 255);
  if (email && !isValidEmail(email)) {
    throw new ValidationError('"email" must be a valid email address.');
  }

  return {
    fullName,
    phone: rawPhone,
    ...(email ? { email } : {}),
    ...(optionalString(b.notes, 'notes', 2000) ? { notes: optionalString(b.notes, 'notes', 2000) } : {}),
    ...(optionalStringArray(b.serviceInterestSlugs, 'serviceInterestSlugs', 100)
      ? { serviceInterestSlugs: optionalStringArray(b.serviceInterestSlugs, 'serviceInterestSlugs', 100) }
      : {}),
    ...(optionalEnum(b.leadSource, 'leadSource', Object.values(LeadSource))
      ? { leadSource: optionalEnum(b.leadSource, 'leadSource', Object.values(LeadSource)) }
      : {}),
    ...(optionalString(b.organisationName, 'organisationName', 200)
      ? { organisationName: optionalString(b.organisationName, 'organisationName', 200) }
      : {}),
    ...(optionalEnum(b.organisationType, 'organisationType', Object.values(OrganisationType))
      ? { organisationType: optionalEnum(b.organisationType, 'organisationType', Object.values(OrganisationType)) }
      : {}),
    ...(optionalEnum(b.preferredContactMethod, 'preferredContactMethod', Object.values(PreferredContactMethod))
      ? { preferredContactMethod: optionalEnum(b.preferredContactMethod, 'preferredContactMethod', Object.values(PreferredContactMethod)) }
      : {}),
    ...(optionalEnum(b.urgencyLevel, 'urgencyLevel', Object.values(UrgencyLevel))
      ? { urgencyLevel: optionalEnum(b.urgencyLevel, 'urgencyLevel', Object.values(UrgencyLevel)) }
      : {}),
    ...(optionalString(b.landingPage, 'landingPage', 500)
      ? { landingPage: optionalString(b.landingPage, 'landingPage', 500) }
      : {}),
    ...(optionalString(b.campaignSource, 'campaignSource', 100)
      ? { campaignSource: optionalString(b.campaignSource, 'campaignSource', 100) }
      : {}),
  };
}

// ─── Admin Create Lead Validator ──────────────────────────────────────────────

export function validateCreateLeadPayload(body: unknown): CreateLeadPayload {
  const base = validatePublicLeadPayload(body);
  const b = requireBody(body);

  return {
    ...base,
    ...(optionalEnum(b.priority, 'priority', Object.values(LeadPriority))
      ? { priority: optionalEnum(b.priority, 'priority', Object.values(LeadPriority)) }
      : {}),
    ...(optionalString(b.internalNotes, 'internalNotes', 5000)
      ? { internalNotes: optionalString(b.internalNotes, 'internalNotes', 5000) }
      : {}),
    ...(optionalPositiveNumber(b.estimatedBudget, 'estimatedBudget') !== undefined
      ? { estimatedBudget: optionalPositiveNumber(b.estimatedBudget, 'estimatedBudget') }
      : {}),
    ...(optionalPositiveNumber(b.qualificationScore, 'qualificationScore') !== undefined
      ? { qualificationScore: optionalPositiveNumber(b.qualificationScore, 'qualificationScore') }
      : {}),
    ...(optionalStringArray(b.tags, 'tags', 50)
      ? { tags: optionalStringArray(b.tags, 'tags', 50) }
      : {}),
    ...(optionalIsoDate(b.followUpDate, 'followUpDate')
      ? { followUpDate: optionalIsoDate(b.followUpDate, 'followUpDate') }
      : {}),
  };
}

// ─── Update Lead Payload Validator ────────────────────────────────────────────

export function validateUpdateLeadPayload(body: unknown): UpdateLeadPayload {
  const b = requireBody(body);

  const phone = (() => {
    if (!b.phone) return undefined;
    const p = requireString(b.phone, 'phone', 20);
    if (!isValidIndianPhone(p)) throw new ValidationError('"phone" must be a valid Indian mobile number.');
    return p;
  })();

  const email = (() => {
    if (b.email === undefined) return undefined;
    const e = optionalString(b.email, 'email', 255);
    if (e && !isValidEmail(e)) throw new ValidationError('"email" must be a valid email address.');
    return e;
  })();

  const result: UpdateLeadPayload = {};

  const fullName = optionalString(b.fullName, 'fullName', 100);
  if (fullName) result.fullName = fullName;
  if (phone) result.phone = phone;
  if (email !== undefined) result.email = email;

  const notes = optionalString(b.notes, 'notes', 2000);
  if (notes !== undefined) result.notes = notes;

  const internalNotes = optionalString(b.internalNotes, 'internalNotes', 5000);
  if (internalNotes !== undefined) result.internalNotes = internalNotes;

  const slugs = optionalStringArray(b.serviceInterestSlugs, 'serviceInterestSlugs', 100);
  if (slugs) result.serviceInterestSlugs = slugs;

  const orgName = optionalString(b.organisationName, 'organisationName', 200);
  if (orgName !== undefined) result.organisationName = orgName;

  const orgType = optionalEnum(b.organisationType, 'organisationType', Object.values(OrganisationType));
  if (orgType) result.organisationType = orgType;

  const contact = optionalEnum(b.preferredContactMethod, 'preferredContactMethod', Object.values(PreferredContactMethod));
  if (contact) result.preferredContactMethod = contact;

  const urgency = optionalEnum(b.urgencyLevel, 'urgencyLevel', Object.values(UrgencyLevel));
  if (urgency) result.urgencyLevel = urgency;

  const priority = optionalEnum(b.priority, 'priority', Object.values(LeadPriority));
  if (priority) result.priority = priority;

  const budget = optionalPositiveNumber(b.estimatedBudget, 'estimatedBudget');
  if (budget !== undefined) result.estimatedBudget = budget;

  const score = optionalPositiveNumber(b.qualificationScore, 'qualificationScore');
  if (score !== undefined) result.qualificationScore = score;

  const tags = optionalStringArray(b.tags, 'tags', 50);
  if (tags) result.tags = tags;

  const followUpDate = optionalIsoDate(b.followUpDate, 'followUpDate');
  if (followUpDate) result.followUpDate = followUpDate;

  return result;
}

// ─── Status Transition Validator ─────────────────────────────────────────────

export function validateLeadStatusTransition(
  currentStatus: LeadStatus,
  targetStatusRaw: unknown,
  body: unknown
): UpdateLeadStatusPayload {
  const targetStatus = requireEnum(targetStatusRaw, 'status', Object.values(LeadStatus));

  const allowed = LEAD_STATUS_TRANSITIONS[currentStatus];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(
      `Cannot transition lead from "${currentStatus}" to "${targetStatus}".`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const b = (typeof body === 'object' && body !== null) ? body as Record<string, unknown> : {};

  if (targetStatus === LeadStatus.Lost) {
    const lossReason = requireEnum(b.lossReason, 'lossReason', Object.values(LeadLossReason));
    const lossNote = optionalString(b.lossNote, 'lossNote', 500);
    return { status: targetStatus, lossReason, ...(lossNote ? { lossNote } : {}) };
  }

  if (targetStatus === LeadStatus.Archived) {
    const archiveReason =
      optionalEnum(b.archiveReason, 'archiveReason', Object.values(LeadArchiveReason)) ??
      LeadArchiveReason.AdminDecision;
    return { status: targetStatus, archiveReason };
  }

  return { status: targetStatus };
}

// ─── Assign Lead Validator ────────────────────────────────────────────────────

export function validateAssignLeadPayload(body: unknown): AssignLeadPayload {
  const b = requireBody(body);
  const assignedTo = requireString(b.assignedTo, 'assignedTo', 50);
  if (!/^[0-9a-fA-F]{24}$/.test(assignedTo)) {
    throw new ValidationError('"assignedTo" must be a valid 24-character user ID.');
  }
  return { assignedTo };
}

// ─── Add Internal Note Validator ──────────────────────────────────────────────

export function validateAddNotePayload(body: unknown): AddLeadNotePayload {
  const b = requireBody(body);
  const note = requireString(b.note, 'note', 5000);
  return { note };
}
