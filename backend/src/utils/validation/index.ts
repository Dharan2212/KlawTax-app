/**
 * KlawTax Validation Utilities
 *
 * Reusable validation and sanitization helpers.
 * Focused on preventing injection, regex abuse, and unsafe query construction.
 */

import { Types } from 'mongoose';

// ─── ObjectId Validation ──────────────────────────────────────────────────────

/** Check if a string is a valid 24-character MongoDB ObjectId hex string. */
export function isValidObjectId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return Types.ObjectId.isValid(value) && /^[a-f\d]{24}$/i.test(value);
}

/**
 * Parse and validate an ObjectId string.
 * Returns the ObjectId instance or null if invalid.
 */
export function parseObjectId(value: unknown): Types.ObjectId | null {
  if (!isValidObjectId(value)) return null;
  return new Types.ObjectId(value as string);
}

/**
 * Parse a required ObjectId — throws a descriptive error if invalid.
 * Use in service functions where an invalid ID should surface as a 400/422.
 */
export function requireObjectId(value: unknown, fieldName = 'id'): Types.ObjectId {
  const oid = parseObjectId(value);
  if (!oid) {
    throw new Error(`Invalid ${fieldName}: "${String(value)}" is not a valid ObjectId.`);
  }
  return oid;
}

// ─── String Sanitization ──────────────────────────────────────────────────────

/** Maximum safe string length for general inputs */
const MAX_STRING_LENGTH = 2_000;

/** Maximum safe length for search queries */
const MAX_SEARCH_LENGTH = 200;

/**
 * Normalize a string input:
 *   - Trims whitespace
 *   - Strips null bytes (prevents DB corruption)
 *   - Truncates to safe maximum
 */
export function sanitizeString(
  value: unknown,
  maxLength = MAX_STRING_LENGTH
): string {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .replace(/\0/g, '') // null bytes
    .slice(0, maxLength);
}

/**
 * Sanitize a search query string.
 * More aggressive than sanitizeString — also escapes regex metacharacters.
 */
export function sanitizeSearchQuery(value: unknown): string {
  const str = sanitizeString(value, MAX_SEARCH_LENGTH);
  // Escape special regex characters to prevent ReDoS
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check whether a string is safe to use as a MongoDB text search query.
 * Rejects strings that are suspiciously long or contain obvious injection patterns.
 */
export function isSafeSearchQuery(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_SEARCH_LENGTH) return false;
  // Reject strings with excessive special characters (likely injection attempt)
  const specialChars = (value.match(/[{}()|\\$]/g) ?? []).length;
  return specialChars < 5;
}

// ─── Regex Safety ─────────────────────────────────────────────────────────────

/**
 * Build a safe case-insensitive MongoDB regex from a search term.
 * Escapes all regex metacharacters first.
 */
export function buildSafeRegex(
  term: unknown,
  options: { caseInsensitive?: boolean } = {}
): RegExp | null {
  if (!isSafeSearchQuery(term)) return null;
  const escaped = sanitizeSearchQuery(term);
  if (!escaped) return null;
  const flags = options.caseInsensitive !== false ? 'i' : '';
  return new RegExp(escaped, flags);
}

// ─── Enum Validation ──────────────────────────────────────────────────────────

/**
 * Validate that a value is a member of a given enum object.
 */
export function isValidEnumValue<T extends string>(
  value: unknown,
  enumObj: Record<string, T>
): value is T {
  return Object.values(enumObj).includes(value as T);
}

// ─── Email / Phone Validation ─────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return PHONE_REGEX.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

// ─── Sort Field Safety ────────────────────────────────────────────────────────

/**
 * Validate that a sort field is in an allowlist.
 * Prevents injection through sort parameters.
 */
export function validateSortField<T extends string>(
  field: unknown,
  allowedFields: ReadonlyArray<T>,
  defaultField: T
): T {
  if (typeof field !== 'string') return defaultField;
  if ((allowedFields as ReadonlyArray<string>).includes(field)) {
    return field as T;
  }
  return defaultField;
}

/**
 * Validate sort direction — only 'asc' or 'desc' are allowed.
 */
export function validateSortDirection(
  value: unknown,
  defaultDir: 'asc' | 'desc' = 'desc'
): 'asc' | 'desc' {
  if (value === 'asc' || value === 'desc') return value;
  return defaultDir;
}

// ─── URL / Path Safety ────────────────────────────────────────────────────────

/**
 * Check that a storage path does not contain path traversal sequences.
 */
export function isSafeStoragePath(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.includes('..')) return false;
  if (value.startsWith('/')) return false;
  if (/[\0\r\n]/.test(value)) return false;
  return true;
}
