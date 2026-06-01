import { Request, Response, NextFunction } from 'express';
import {
  login,
  refreshTokens,
  logout,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerification,
} from './authService';
import {
  loginSchema,
  refreshSchema,
  logoutSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  validateBody,
} from '../../validators/auth';
import { sendSuccess } from '../../utils/response';
import { getAuthContext } from '../../middlewares/auth';

// ─── POST /auth/login ─────────────────────────────────────────────────────────

export async function handleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(loginSchema, req.body);

    const result = await login({
      email:      input.email,
      password:   input.password,
      ipAddress:  req.ip ?? req.socket.remoteAddress,
      userAgent:  req.headers['user-agent'],
    });

    sendSuccess(res, {
      accessToken:     result.accessToken,
      refreshToken:    result.refreshToken,
      accessExpiresIn: result.accessExpiresIn,
      user:            result.user,
    }, { statusCode: 200, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/refresh ───────────────────────────────────────────────────────

export async function handleRefresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(refreshSchema, req.body);

    const result = await refreshTokens({
      rawRefreshToken: input.refreshToken,
      ipAddress:       req.ip ?? req.socket.remoteAddress,
      userAgent:       req.headers['user-agent'],
    });

    sendSuccess(res, {
      accessToken:     result.accessToken,
      refreshToken:    result.refreshToken,
      accessExpiresIn: result.accessExpiresIn,
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/logout ────────────────────────────────────────────────────────

export async function handleLogout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(logoutSchema, req.body);
    await logout(input.refreshToken);
    sendSuccess(res, null, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/logout-all ────────────────────────────────────────────────────
// Requires authentication — user must present a valid access token

export async function handleLogoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const auth = getAuthContext(req);
    await logoutAll(auth.userId);
    sendSuccess(res, null, { message: 'All sessions revoked successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/password/request-reset ───────────────────────────────────────

export async function handleRequestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(requestPasswordResetSchema, req.body);
    await requestPasswordReset(input.email);
    // Always return 200 — don't reveal whether the email exists
    sendSuccess(res, null, {
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/password/reset ────────────────────────────────────────────────

export async function handleResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(resetPasswordSchema, req.body);
    await resetPassword({ token: input.token, newPassword: input.newPassword });
    sendSuccess(res, null, { message: 'Password has been reset successfully. Please log in again.' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/verify-email ──────────────────────────────────────────────────

export async function handleVerifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(verifyEmailSchema, req.body);
    await verifyEmail(input.token);
    sendSuccess(res, null, { message: 'Email address verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/resend-verification ──────────────────────────────────────────

export async function handleResendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateBody(resendVerificationSchema, req.body);
    await resendVerification(input.email);
    // Always return 200 — don't reveal existence
    sendSuccess(res, null, {
      message: 'If your account exists and is unverified, a new verification email has been sent.',
    });
  } catch (err) {
    next(err);
  }
}
