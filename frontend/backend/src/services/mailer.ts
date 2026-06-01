/**
 * KlawTax Mailer Service
 *
 * Provides transactional email delivery via nodemailer (SMTP).
 * Graceful degradation: if SMTP credentials are not configured, emails
 * are logged at warn level rather than crashing the server. This allows
 * the application to run in development / staging without an SMTP setup.
 *
 * Usage:
 *   await mailer.sendPasswordReset({ to, resetLink });
 *   await mailer.sendEmailVerification({ to, verifyLink });
 */

import nodemailer, { Transporter } from 'nodemailer';
import { getConfig } from '../config/env';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PasswordResetEmailParams {
  to: string;
  fullName: string;
  resetLink: string;
}

export interface EmailVerificationParams {
  to: string;
  fullName: string;
  verifyLink: string;
}

// ─── Transport Factory ────────────────────────────────────────────────────────

let _transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  const cfg = getConfig();
  return !!(cfg.EMAIL_SMTP_HOST && cfg.EMAIL_SMTP_USER && cfg.EMAIL_SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  if (!isSmtpConfigured()) {
    return null;
  }

  const cfg = getConfig();
  _transporter = nodemailer.createTransport({
    host:   cfg.EMAIL_SMTP_HOST,
    port:   cfg.EMAIL_SMTP_PORT,
    secure: cfg.EMAIL_SMTP_PORT === 465,
    auth: {
      user: cfg.EMAIL_SMTP_USER,
      pass: cfg.EMAIL_SMTP_PASS,
    },
  });

  return _transporter;
}

// ─── Internal Send Helper ─────────────────────────────────────────────────────

async function send(params: {
  to:      string;
  subject: string;
  html:    string;
  text:    string;
}): Promise<void> {
  const cfg = getConfig();
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn('[Mailer] SMTP not configured — email not sent (set EMAIL_SMTP_* env vars)', {
      to:      params.to,
      subject: params.subject,
    });
    return;
  }

  await transporter.sendMail({
    from:    `"${cfg.EMAIL_FROM_NAME}" <${cfg.EMAIL_FROM_ADDRESS}>`,
    to:      params.to,
    subject: params.subject,
    html:    params.html,
    text:    params.text,
  });

  logger.info('[Mailer] Email sent', { to: params.to, subject: params.subject });
}

// ─── Email Templates ─────────────────────────────────────────────────────────

function passwordResetHtml(fullName: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #334155; max-width: 600px; margin: auto; padding: 32px;">
  <h2 style="color: #1E3A8A;">Reset Your Password — KlawTax</h2>
  <p>Hi ${escapeHtml(fullName)},</p>
  <p>We received a request to reset the password for your KlawTax account.</p>
  <p style="margin: 24px 0;">
    <a href="${resetLink}"
       style="background:#1E3A8A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
      Reset Password
    </a>
  </p>
  <p>This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.</p>
  <p style="color:#64748B;font-size:13px;">For security reasons, never share this link with anyone.</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
  <p style="color:#94A3B8;font-size:12px;">KlawTax.online — India's Trusted NGO Registration Platform</p>
</body>
</html>`;
}

function passwordResetText(fullName: string, resetLink: string): string {
  return [
    `Hi ${fullName},`,
    '',
    'We received a request to reset the password for your KlawTax account.',
    '',
    `Reset your password here: ${resetLink}`,
    '',
    'This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.',
    '',
    'KlawTax.online',
  ].join('\n');
}

function emailVerificationHtml(fullName: string, verifyLink: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; color: #334155; max-width: 600px; margin: auto; padding: 32px;">
  <h2 style="color: #1E3A8A;">Verify Your Email — KlawTax</h2>
  <p>Hi ${escapeHtml(fullName)},</p>
  <p>Thank you for registering with KlawTax. Please verify your email address to activate your account.</p>
  <p style="margin: 24px 0;">
    <a href="${verifyLink}"
       style="background:#1E3A8A;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
      Verify Email
    </a>
  </p>
  <p>This link expires in <strong>48 hours</strong>.</p>
  <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;">
  <p style="color:#94A3B8;font-size:12px;">KlawTax.online — India's Trusted NGO Registration Platform</p>
</body>
</html>`;
}

function emailVerificationText(fullName: string, verifyLink: string): string {
  return [
    `Hi ${fullName},`,
    '',
    'Thank you for registering with KlawTax. Please verify your email address to activate your account.',
    '',
    `Verify your email here: ${verifyLink}`,
    '',
    'This link expires in 48 hours.',
    '',
    'KlawTax.online',
  ].join('\n');
}

// ─── Escape Helper ────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const mailer = {
  /**
   * Send a password reset email with a secure link.
   * The link must include the raw (unhashed) token as a query parameter.
   */
  async sendPasswordReset(params: PasswordResetEmailParams): Promise<void> {
    await send({
      to:      params.to,
      subject: 'Reset your KlawTax password',
      html:    passwordResetHtml(params.fullName, params.resetLink),
      text:    passwordResetText(params.fullName, params.resetLink),
    });
  },

  /**
   * Send an email verification link to a newly registered user.
   */
  async sendEmailVerification(params: EmailVerificationParams): Promise<void> {
    await send({
      to:      params.to,
      subject: 'Verify your KlawTax email address',
      html:    emailVerificationHtml(params.fullName, params.verifyLink),
      text:    emailVerificationText(params.fullName, params.verifyLink),
    });
  },
};
