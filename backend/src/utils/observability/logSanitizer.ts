/**
 * Log sanitizer.
 * Strips sensitive field values before they reach any log sink.
 * Never log passwords, tokens, secrets, or signed URLs.
 */

// Fields whose values are always redacted regardless of nesting level
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'newPassword',
  'oldPassword',
  'currentPassword',
  'confirmPassword',
  'token',
  'tokenHash',
  'token_hash',
  'refreshToken',
  'refresh_token',
  'accessToken',
  'access_token',
  'authToken',
  'auth_token',
  'secret',
  'webhookSecret',
  'webhook_secret',
  'razorpaySecret',
  'razorpay_secret',
  'jwtSecret',
  'jwt_secret',
  'privateKey',
  'private_key',
  'apiKey',
  'api_key',
  'smtpPassword',
  'smtp_password',
  'signedUrl',
  'signed_url',
  'presignedUrl',
  'presigned_url',
  'downloadUrl',
  'download_url',
  'authorization',
  'x-razorpay-signature',
  'signature',
  'cvv',
  'cardNumber',
  'card_number',
  'accountNumber',
  'account_number',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 6;

/**
 * Recursively sanitize a plain object for safe logging.
 * - Redacts known sensitive keys
 * - Truncates large string values in production to avoid log flooding
 * - Returns a new object (does not mutate the original)
 */
export function sanitizeLogPayload(
  obj: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  if (depth > MAX_DEPTH) return { '[truncated]': true };

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase();

    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(normalizedKey)) {
      result[key] = REDACTED;
      continue;
    }

    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeLogPayload(value as Record<string, unknown>, depth + 1);
      continue;
    }

    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === 'object' && item !== null && !(item instanceof Date)
          ? sanitizeLogPayload(item as Record<string, unknown>, depth + 1)
          : item
      );
      continue;
    }

    // Truncate very long strings
    if (typeof value === 'string' && value.length > 2000) {
      result[key] = value.slice(0, 200) + '…[truncated]';
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * Sanitize an error object for safe logging.
 * Keeps message and stack; strips any attached sensitive metadata.
 */
export function sanitizeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { raw: typeof err === 'string' ? err : '[non-error thrown]' };
  }

  return {
    name: err.name,
    message: err.message,
    stack: process.env['NODE_ENV'] !== 'production' ? err.stack : undefined,
  };
}
