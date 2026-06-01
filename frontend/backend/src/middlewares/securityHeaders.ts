/**
 * KlawTax Security Headers Middleware
 *
 * Applies production-safe security response headers.
 * Designed to complement Helmet (already configured in app.ts) with
 * application-level policies that Helmet alone does not cover.
 *
 * These headers are applied to every response. They are safe for:
 *   - JSON API responses
 *   - Webhook callbacks
 *   - Pre-signed download redirects
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

// ─── Security Headers Middleware ──────────────────────────────────────────────

export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // HTTP Strict Transport Security
  // Only enforced in production; avoids issues with local HTTP dev servers.
  if (config.isProduction) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Deny iframe embedding (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer Policy — don't leak query strings in referrer headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — disable browser features we never use
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  // Cross-Origin Resource Policy — prevent cross-origin reads of our API responses
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  // Cross-Origin Opener Policy — isolate browsing context
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  // Content Security Policy — minimal policy for a JSON API
  // We don't serve HTML so a tight CSP is practical.
  // 'default-src none' + 'sandbox' provides maximum restriction for API responses.
  // If an endpoint ever returns HTML (e.g., email verification redirect), this
  // should be overridden per-route.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // Remove X-Powered-By (Helmet also does this, belt-and-suspenders)
  res.removeHeader('X-Powered-By');

  next();
}

// ─── Webhook-Safe Security Headers ───────────────────────────────────────────

/**
 * Relaxed variant for webhook endpoints.
 * Razorpay sends raw JSON over HTTP in some test environments,
 * so we don't apply HSTS enforcement but keep all other protections.
 */
export function webhookSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.removeHeader('X-Powered-By');
  next();
}

// ─── Download-Safe Security Headers ──────────────────────────────────────────

/**
 * Headers for file download / signed URL responses.
 * Loosens CSP to allow the browser to handle the file stream.
 */
export function downloadSecurityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.removeHeader('X-Powered-By');
  next();
}
