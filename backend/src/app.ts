import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';

import { getConfig, config as appConfig } from './config/env';
import { logger, httpLogStream } from './utils/logger';
import { requestIdMiddleware } from './middlewares/requestId';
import { requestTracingMiddleware } from './middlewares/requestTracing';
import { requestLoggerMiddleware } from './middlewares/requestLogger';
import { securityHeaders } from './middlewares/securityHeaders';
import { generalApiRateLimiter } from './middlewares/rateLimit';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

// ── Core / Public routes ────────────────────────────────────────────────────────
import { healthRouter }         from './routes/health';
import { extendedHealthRouter } from './modules/health/healthRoutes';
import { authRouter }           from './routes/auth';
import { publicServicesRouter } from './routes/publicServices';

// ── CRM — Leads (public form + protected CRM) ───────────────────────────────────
import { leadRouter, contactRouter } from './modules/leads/leadRoutes';
import { followUpRouter }            from './modules/leads/followUpRoutes';

// ── User management (Admin CRUD for employees & clients) ────────────────────────
import { userRouter } from './modules/users/userRoutes';

// ── Project operations ──────────────────────────────────────────────────────────
import { projectRouter }  from './modules/projects/projectRoutes';
import { taskRouter }     from './modules/tasks/taskRoutes';
import { timelineRouter } from './modules/timeline/timelineRoutes';
import { documentRouter } from './modules/documents/documentRoutes';
import { approvalRouter } from './modules/approvals/approvalRoutes';

// ── Finance — Invoices & Payments ───────────────────────────────────────────────
import { invoiceRouter } from './modules/payments/invoiceRoutes';
import { paymentRouter } from './modules/payments/paymentRoutes';

// ── Webhooks (Razorpay inbound — raw body required) ─────────────────────────────
import { webhookRouter } from './modules/webhooks/webhookRoutes';

// ── Communication & Collaboration ───────────────────────────────────────────────
import { notificationRouter } from './modules/notifications/notificationRoutes';
import { supportRouter }      from './modules/support/supportRoutes';
import { exportRouter }       from './modules/exports/exportRoutes';

// ── Dashboards ──────────────────────────────────────────────────────────────────
import { adminDashboardRouter }  from './routes/dashboard.admin';
import { employeeDashboardRouter } from './routes/dashboard.employee';
import { clientDashboardRouter } from './modules/dashboards/client/clientDashboardRouter';

// ── Admin operational utilities ─────────────────────────────────────────────────
import { auditRouter }          from './modules/audit/auditRoutes';
import { adminSettingsRouter }  from './modules/admin/adminSettingsRoutes';
import { adminJobsRouter }      from './modules/admin/adminJobsRoutes';
import { adminWebhookRouter }   from './modules/admin/adminWebhookRoutes';

// ─── App Factory ───────────────────────────────────────────────────────────────

export function createApp(): Application {
  const app = express();
  const cfg = getConfig();

  // ── 1. Security Headers ────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: appConfig.isProduction ? undefined : false,
    })
  );

  // ── 1a. Application-Level Security Headers (complements Helmet) ───────────
  app.use(securityHeaders);

  // ── 2. CORS ────────────────────────────────────────────────────────────────
  const allowedOrigins = cfg.CLIENT_URL.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin) || appConfig.isDevelopment) {
          callback(null, true);
        } else {
          logger.warn('[CORS] Blocked request from disallowed origin', { origin });
          callback(new Error(`CORS: Origin "${origin}" is not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // ── 3. Compression ─────────────────────────────────────────────────────────
  app.use(compression());

  // ── 4. Request ID ──────────────────────────────────────────────────────────
  app.use(requestIdMiddleware);

  // ── 4a. Request Tracing & Structured Access Logging ────────────────────────
  app.use(requestTracingMiddleware);
  app.use(requestLoggerMiddleware);

  // ── 5. Body Parsing ────────────────────────────────────────────────────────
  // IMPORTANT: The Razorpay webhook endpoint needs raw bytes for HMAC-SHA256
  // signature verification. We apply express.raw() *before* express.json() for
  // that specific path so the raw body is preserved on req.body.
  app.use(
    '/api/v1/webhooks/razorpay',
    express.raw({ type: 'application/json' })
  );

  // All other routes use parsed JSON / URL-encoded bodies.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── 6. HTTP Request Logging (Morgan → Winston) ─────────────────────────────
  const morganFormat = appConfig.isProduction
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms';

  app.use(
    morgan(morganFormat, {
      stream: httpLogStream,
      skip: (_req: Request, res: Response) => {
        return appConfig.isProduction && res.statusCode === 200;
      },
    })
  );

  // ── 6a. General API Rate Limiting ─────────────────────────────────────────
  app.use(generalApiRateLimiter);

  // ────────────────────────────────────────────────────────────────────────────
  // 7. ROUTE REGISTRY
  //
  // Order matters:
  //   a) Public / unauthenticated routes first (health, auth, public catalog)
  //   b) Webhook (HMAC-verified; no JWT) immediately after body-parsing section
  //   c) Finance routes (used by both public checkout and authenticated clients)
  //   d) CRM & project operations (Admin + Employee)
  //   e) Communication & exports (all authenticated roles)
  //   f) Dashboards (role-scoped — each enforces its own RBAC internally)
  //   g) Admin-only operational utilities last
  // ────────────────────────────────────────────────────────────────────────────

  // ── a. Public / Unauthenticated ────────────────────────────────────────────

  // Uptime & readiness probe — no auth
  app.use('/api/v1/health', healthRouter);

  // Extended health: /live, /ready, /diagnostics (admin)
  app.use('/api/v1/health', extendedHealthRouter);

  // Auth lifecycle — login, refresh, logout, password reset, email verify
  app.use('/api/v1/auth', authRouter);

  // Services catalog — public read (homepage, pricing page, service detail)
  app.use('/api/v1/services', publicServicesRouter);

  // Public lead/contact form — rate-limited, no auth
  app.use('/api/v1/contact', contactRouter);

  // ── b. Webhooks ────────────────────────────────────────────────────────────

  // Razorpay inbound events — HMAC-SHA256 verified inside the handler
  // Returns HTTP 200 always (even on errors) to prevent Razorpay retry storms
  app.use('/api/v1/webhooks', webhookRouter);

  // ── c. Finance — Invoices & Payments ──────────────────────────────────────

  // Invoice CRUD — Admin creates/manages; Client views own invoices (scoped)
  app.use('/api/v1/invoices', invoiceRouter);

  // Payment orders + Razorpay client verification — public for checkout flow
  app.use('/api/v1/payments', paymentRouter);

  // ── d. CRM & Project Operations ───────────────────────────────────────────

  // Lead management — public contact form endpoint + protected CRM endpoints
  app.use('/api/v1/leads', leadRouter);
  app.use('/api/v1/followups', followUpRouter);

  // User management — Admin CRUD for employee & client accounts
  app.use('/api/v1/users', userRouter);

  // Project lifecycle — Admin + Employee (scoped by project assignment)
  app.use('/api/v1/projects', projectRouter);

  // Task management — Admin + Employee (scoped by task assignment)
  app.use('/api/v1/tasks', taskRouter);

  // Timeline feed — Admin/Employee see all; Client sees client-visible entries
  app.use('/api/v1/timeline', timelineRouter);

  // Document upload & review — Admin + Employee manage; Client uploads & views own
  app.use('/api/v1/documents', documentRouter);

  // Approval queue — Employee submits; Admin reviews
  app.use('/api/v1/approvals', approvalRouter);

  // ── e. Communication & Exports ─────────────────────────────────────────────

  // Notifications — all authenticated roles, scoped to own notifications
  app.use('/api/v1/notifications', notificationRouter);

  // Support tickets — Client creates; Admin/Employee manages
  app.use('/api/v1/support', supportRouter);

  // Export jobs — Admin + Client (client sees own exports only)
  app.use('/api/v1/exports', exportRouter);

  // ── f. Dashboards (role-isolated) ─────────────────────────────────────────

  // Admin dashboard — full metrics, revenue, approvals, workload (Admin only)
  app.use('/api/v1/dashboard/admin', adminDashboardRouter);

  // Employee workspace — assigned projects, tasks, reviews (Employee + Admin)
  app.use('/api/v1/dashboard/employee', employeeDashboardRouter);

  // Client portal — project status, payments, timeline (Client only)
  app.use('/api/v1/dashboard/client', clientDashboardRouter);

  // ── g. Admin Operational Utilities ─────────────────────────────────────────

  // Audit log browser — Admin only
  app.use('/api/v1/admin/audit-logs', auditRouter);

  // System settings CRUD — Admin only (operational parameters)
  app.use('/api/v1/admin/settings', adminSettingsRouter);

  // Scheduled job registry + failed job log browser — Admin only
  app.use('/api/v1/admin/jobs', adminJobsRouter);

  // Webhook event history + manual retry — Admin only
  app.use('/api/v1/admin/webhooks', adminWebhookRouter);

  // ── 8. 404 Handler ────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── 9. Global Error Handler ────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
