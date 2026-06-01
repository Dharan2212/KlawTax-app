/**
 * Portal Visibility Helpers
 *
 * Centralised filtering utilities that enforce client-safe data access.
 * Every function here is a security boundary — use them consistently
 * across all client-portal endpoints to prevent information leakage.
 *
 * Rules enforced:
 *  - Internal-only fields are stripped from every client-facing DTO
 *  - Timeline entries with visibility !== 'client' are excluded
 *  - Support messages with visibleToClient === false are stripped
 *  - Documents with visibility !== 'client_visible' are excluded
 */

import { Types } from 'mongoose';
import { TimelineVisibility } from '../../models/taskEnums';
import { DocumentVisibility } from '../../models/documentEnums';

// ─── Client Profile ID Assertions ────────────────────────────────────────────

/**
 * Convert a clientProfileId string to an ObjectId, throwing if invalid.
 * All portal service methods use this to normalise the caller's identity.
 */
export function toClientObjectId(clientProfileId: string): Types.ObjectId {
  if (!clientProfileId || !Types.ObjectId.isValid(clientProfileId)) {
    const err = new Error('Invalid or missing clientProfileId');
    err.name = 'ForbiddenError';
    throw err;
  }
  return new Types.ObjectId(clientProfileId);
}

/**
 * Convert a resource ID string to an ObjectId.
 * Throws NotFoundError for invalid values.
 */
export function toResourceObjectId(id: string, label = 'Resource'): Types.ObjectId {
  if (!id || !Types.ObjectId.isValid(id)) {
    const err = new Error(`${label} not found`);
    err.name = 'NotFoundError';
    throw err;
  }
  return new Types.ObjectId(id);
}

// ─── Timeline Visibility ──────────────────────────────────────────────────────

/**
 * MongoDB match filter that restricts timeline entries to client-visible only.
 * Apply to every timeline query on client-portal routes.
 */
export const CLIENT_TIMELINE_FILTER = {
  visibility: TimelineVisibility.Client,
} as const;

/**
 * Returns true if the timeline visibility level is visible to clients.
 */
export function isClientVisibleTimeline(visibility: string): boolean {
  return visibility === TimelineVisibility.Client;
}

// ─── Document Visibility ──────────────────────────────────────────────────────

/**
 * MongoDB match filter that restricts documents to client-visible only.
 * Apply to every document query on client-portal routes.
 */
export const CLIENT_DOCUMENT_FILTER = {
  visibility: DocumentVisibility.ClientVisible,
  isDeleted:  { $ne: true },
} as const;

/**
 * Returns true if the document visibility level is visible to clients.
 */
export function isClientVisibleDocument(visibility: string): boolean {
  return visibility === DocumentVisibility.ClientVisible;
}

// ─── Support Message Filtering ────────────────────────────────────────────────

/**
 * Filter an array of support messages to only those visible to clients.
 * Strips internalOnly and non-visibleToClient messages.
 */
export function filterClientMessages<T extends { visibleToClient: boolean; internalOnly: boolean }>(
  messages: T[]
): T[] {
  return messages.filter((m) => m.visibleToClient && !m.internalOnly);
}

// ─── Notification Filtering ───────────────────────────────────────────────────

/**
 * Base filter for client-facing notification queries.
 * Excludes internal-only notifications.
 */
export function buildClientNotificationFilter(recipientId: Types.ObjectId) {
  return {
    recipientId,
    internalOnly:    { $ne: true },
    visibleToClient: { $ne: false },
    isDismissed:     { $ne: true },
  };
}
