/**
 * KlawTax Signed URL Utilities
 *
 * Provider-agnostic signed URL generation and validation.
 *
 * Phase 1: Local HMAC-signed tokens (no cloud SDK dependency).
 * Phase 2: Drop-in replacement using AWS S3 presigned URLs via
 *           @aws-sdk/s3-request-presigner — the interface remains identical.
 *
 * Expiry types (per v1.5 architecture doc):
 *   - Standard documents: 15-minute expiry
 *   - Sensitive deliverables: 5-minute expiry
 *   - Export bundles: 60-minute expiry (large files take time to download)
 */

import crypto from 'crypto';
import { getConfig } from '../config/env';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SIGNED_URL_EXPIRY = {
  /** Standard document downloads — 15 minutes */
  STANDARD: 15 * 60,
  /** Sensitive deliverables — 5 minutes */
  SENSITIVE: 5 * 60,
  /** Export/archive bundles — 60 minutes */
  EXPORT: 60 * 60,
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignedUrlPayload {
  /** S3 key or storage path of the resource */
  storagePath: string;
  /** Owner ID — used for ownership validation */
  ownerId: string;
  /** Role of the requesting user */
  ownerRole: string;
  /** Unix timestamp (seconds) when this URL expires */
  expiresAt: number;
  /** Unique nonce — prevents replay across different resources */
  nonce: string;
}

export interface GenerateSignedUrlOptions {
  storagePath: string;
  ownerId: string;
  ownerRole: string;
  /** Expiry in seconds from now. Defaults to STANDARD (15 min). */
  expirySeconds?: number;
  /** Base URL prefix — defaults to API host */
  baseUrl?: string;
}

export interface SignedUrlValidationResult {
  valid: boolean;
  payload?: SignedUrlPayload;
  error?: string;
}

// ─── HMAC Key ─────────────────────────────────────────────────────────────────

function getSigningKey(): string {
  const cfg = getConfig();
  // Derive a signing key from JWT_SECRET — keeps secrets minimal
  return crypto
    .createHash('sha256')
    .update(`klawtax:signed-url:${cfg.JWT_SECRET}`)
    .digest('hex');
}

// ─── Token Generation ─────────────────────────────────────────────────────────

function signPayload(payload: SignedUrlPayload): string {
  const key = getSigningKey();
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = crypto
    .createHmac('sha256', key)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): SignedUrlPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, sig] = parts;
  const key = getSigningKey();
  const expectedSig = crypto
    .createHmac('sha256', key)
    .update(encoded)
    .digest('base64url');

  // Timing-safe comparison
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const data = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(data) as SignedUrlPayload;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a signed download URL for a stored resource.
 *
 * Returns a full URL with the token as a query parameter.
 * The URL can be passed directly to the client for download.
 */
export function generateSignedUrl(options: GenerateSignedUrlOptions): string {
  const {
    storagePath,
    ownerId,
    ownerRole,
    expirySeconds = SIGNED_URL_EXPIRY.STANDARD,
    baseUrl,
  } = options;

  const payload: SignedUrlPayload = {
    storagePath,
    ownerId,
    ownerRole,
    expiresAt: Math.floor(Date.now() / 1_000) + expirySeconds,
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  const token = signPayload(payload);

  // In Phase 2 this becomes an actual S3 presigned URL.
  // For now, it routes through our own /api/v1/documents/download endpoint.
  const base =
    baseUrl ?? (process.env['API_BASE_URL'] ?? 'http://localhost:3000');

  return `${base}/api/v1/documents/download?token=${token}`;
}

/**
 * Validate a signed download URL token from a query parameter.
 *
 * Returns the payload if valid (not expired, not tampered).
 * Returns an error string if invalid.
 */
export function validateSignedToken(token: string): SignedUrlValidationResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided.' };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return { valid: false, error: 'Token signature is invalid.' };
  }

  const nowSeconds = Math.floor(Date.now() / 1_000);
  if (nowSeconds > payload.expiresAt) {
    const expiredAgo = nowSeconds - payload.expiresAt;
    return {
      valid: false,
      error: `Token expired ${expiredAgo} seconds ago. Please request a new download link.`,
    };
  }

  return { valid: true, payload };
}

/**
 * Validate ownership of a signed token.
 * Ensures the requesting user is the owner of the resource.
 */
export function validateTokenOwnership(
  payload: SignedUrlPayload,
  requestingUserId: string,
  requestingRole: string
): boolean {
  // Admins can access any signed URL
  if (requestingRole === 'admin') return true;

  return payload.ownerId === requestingUserId;
}

/**
 * Get the remaining TTL of a signed token in seconds.
 * Returns 0 if already expired.
 */
export function getTokenTtl(payload: SignedUrlPayload): number {
  const remaining = payload.expiresAt - Math.floor(Date.now() / 1_000);
  return Math.max(0, remaining);
}

/**
 * Generate a short-lived sensitive URL (5 minutes).
 * Used for certificate/deliverable downloads.
 */
export function generateSensitiveUrl(
  options: Omit<GenerateSignedUrlOptions, 'expirySeconds'>
): string {
  return generateSignedUrl({
    ...options,
    expirySeconds: SIGNED_URL_EXPIRY.SENSITIVE,
  });
}

/**
 * Generate an export download URL (60 minutes).
 * Used for archive/export bundle downloads.
 */
export function generateExportUrl(
  options: Omit<GenerateSignedUrlOptions, 'expirySeconds'>
): string {
  return generateSignedUrl({
    ...options,
    expirySeconds: SIGNED_URL_EXPIRY.EXPORT,
  });
}
