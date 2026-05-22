import { z, ZodSchema, ZodError, ZodIssue } from 'zod';
import { PASSWORD_POLICY } from '../constants/auth';

// ─── Reusable field definitions ───────────────────────────────────────────────

const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Please provide a valid email address')
  .max(320)
  .transform((v) => v.toLowerCase().trim());

const passwordField = z
  .string()
  .min(1, 'Password is required')
  .min(PASSWORD_POLICY.MIN_LENGTH, `Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`)
  .max(PASSWORD_POLICY.MAX_LENGTH, `Password must be at most ${PASSWORD_POLICY.MAX_LENGTH} characters`);

const tokenField = z
  .string()
  .min(1, 'Token is required')
  .trim();

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshSchema = z.object({
  refreshToken: tokenField,
});

export type RefreshInput = z.infer<typeof refreshSchema>;

// ─── Logout (single session) ──────────────────────────────────────────────────

export const logoutSchema = z.object({
  refreshToken: tokenField,
});

export type LogoutInput = z.infer<typeof logoutSchema>;

// ─── Password Reset Request ───────────────────────────────────────────────────

export const requestPasswordResetSchema = z.object({
  email: emailField,
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

// ─── Password Reset Completion ────────────────────────────────────────────────

export const resetPasswordSchema = z.object({
  token:       tokenField,
  newPassword: passwordField,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Email Verification ───────────────────────────────────────────────────────

export const verifyEmailSchema = z.object({
  token: tokenField,
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// ─── Resend Verification ──────────────────────────────────────────────────────

export const resendVerificationSchema = z.object({
  email: emailField,
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// ─── Validation Helper ────────────────────────────────────────────────────────

import { ValidationError } from '../middlewares/errorHandler';

/**
 * Parse and validate a request body against a Zod schema.
 * Throws `ValidationError` with structured details on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = (result.error as ZodError).issues.map((e: ZodIssue) => ({
      field:   e.path.join('.'),
      message: e.message,
    }));
    throw new ValidationError('Validation failed', details);
  }
  return result.data;
}
