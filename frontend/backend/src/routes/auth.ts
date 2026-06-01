import { Router } from 'express';
import {
  handleLogin,
  handleRefresh,
  handleLogout,
  handleLogoutAll,
  handleRequestPasswordReset,
  handleResetPassword,
  handleVerifyEmail,
  handleResendVerification,
} from '../modules/auth/authController';
import { authenticate } from '../middlewares/auth';
import {
  authRateLimiter,
  forgotPasswordRateLimiter,
  resendVerificationRateLimiter,
} from '../middlewares/rateLimit';

const router = Router();

/**
 * Auth API Routes
 * Base path: /api/v1/auth
 *
 * Public (no auth required):
 *   POST /login
 *   POST /refresh
 *   POST /logout
 *   POST /password/request-reset
 *   POST /password/reset
 *   POST /verify-email
 *   POST /resend-verification
 *
 * Protected (valid access token required):
 *   POST /logout-all
 */

// ── Public ─────────────────────────────────────────────────────────────────────
router.post('/login', authRateLimiter, handleLogin);
router.post('/refresh',                 handleRefresh);
router.post('/logout',                  handleLogout);
router.post('/password/request-reset',  forgotPasswordRateLimiter, handleRequestPasswordReset);
router.post('/password/reset',          handleResetPassword);
router.post('/verify-email',            handleVerifyEmail);
router.post('/resend-verification',     resendVerificationRateLimiter, handleResendVerification);

// ── Protected ──────────────────────────────────────────────────────────────────
router.post('/logout-all', authenticate, handleLogoutAll);

export { router as authRouter };
