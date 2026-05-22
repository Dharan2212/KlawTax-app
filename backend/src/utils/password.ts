import bcrypt from 'bcryptjs';
import { PASSWORD_POLICY } from '../constants/auth';

// ─── Salt Rounds ──────────────────────────────────────────────────────────────

function getSaltRounds(): number {
  const fromEnv = parseInt(process.env['BCRYPT_SALT_ROUNDS'] ?? '', 10);
  return isNaN(fromEnv) ? PASSWORD_POLICY.SALT_ROUNDS : fromEnv;
}

// ─── Hash ─────────────────────────────────────────────────────────────────────

/**
 * Hash a plaintext password using bcrypt.
 * The raw password is never stored — always call this before persisting.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const rounds = getSaltRounds();
  return bcrypt.hash(plaintext, rounds);
}

// ─── Compare ──────────────────────────────────────────────────────────────────

/**
 * Compare a plaintext password against a stored bcrypt hash.
 * Returns true if they match.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function comparePassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// ─── Policy Validation ────────────────────────────────────────────────────────

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a password against the current policy.
 * Called at registration / password-reset time.
 */
export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`);
  }
  if (password.length > PASSWORD_POLICY.MAX_LENGTH) {
    errors.push(`Password must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}
