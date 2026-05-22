import { createHash, randomBytes } from 'crypto';

/**
 * Hash a raw token string using SHA-256.
 * Raw tokens are NEVER stored — only their hash.
 *
 * @param raw - The plaintext token string
 * @returns   Hex-encoded SHA-256 digest
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Generate a cryptographically secure random token.
 * Default length: 32 bytes → 64-character hex string.
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Constant-time comparison of two strings.
 * Prevents timing attacks when comparing token hashes.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
