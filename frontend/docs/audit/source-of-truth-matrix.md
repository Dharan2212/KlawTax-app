# KlawTax — Source-of-Truth Matrix
### Batch 1: Full Project Audit Freeze | May 2026

---

## OVERVIEW

| Layer | Status | Notes |
|---|---|---|
| Backend Architecture | ✅ Implemented | Follows v1.5 spec closely |
| Backend Models (27 collections) | ✅ Implemented | All collections present |
| Backend Routes (18 API families) | ✅ Implemented | All route families mounted |
| Backend Auth / RBAC | ✅ Implemented | JWT RS256, refresh rotation, RBAC |
| Backend Jobs / Scheduler | ✅ Implemented | node-cron (not BullMQ — see gaps) |
| Frontend Public Site | ✅ Implemented | 9 pages, fully production-ready |
| Frontend CRM Screens | ⚠️ Mock-only | UI complete; no live API wiring |
| Frontend Client Dashboard | ⚠️ Mock-only | Static mock orders; no API calls |
| Checkout ↔ Backend Contract | ❌ BROKEN | Request schema mismatch (critical) |
| CRM ↔ Backend Integration | ❌ Not wired | All CRM data is mock/in-memory |
| Auth Flow (Frontend Login) | ❌ Missing | No login page; CRM uses role-switcher |

---

## 1. COLLECTIONS — SOURCE OF TRUTH

### Primary (15 collections)

| Collection | Model File | Schema Complete | Indexes | Seed Data |
|---|---|---|---|---|
| `users` | `models/user.ts` | ✅ | ✅ | ❌ (no user seed) |
| `clientProfiles` | `models/clientProfile.ts` | ✅ | ✅ | ❌ |
| `employeeProfiles` | `models/employeeProfile.ts` | ✅ | ✅ | ❌ |
| `leads` | `models/lead.ts` | ✅ | ✅ | ❌ |
| `services` | `models/service.ts` | ✅ | ✅ | ✅ (26 records) |
| `projects` | `models/project.ts` | ✅ | ✅ | ❌ |
| `tasks` | `models/task.ts` | ✅ | ✅ | ❌ |
| `documents` | `models/document.ts` | ✅ | ✅ | ❌ |
| `approvals` | `models/approval.ts` | ✅ | ✅ | ❌ |
| `invoices` | `models/invoice.ts` | ✅ | ✅ | ❌ |
| `payments` | `models/payment.ts` | ✅ | ✅ | ❌ |
| `timelineEntries` | `models/timelineEntry.ts` | ✅ | ✅ | ❌ |
| `notifications` | `models/notification.ts` | ✅ | ✅ | ❌ |
| `supportTickets` | `models/supportTicket.ts` | ✅ | ✅ | ❌ |
| `auditLogs` | `models/auditLog.ts` | ✅ | ✅ | ❌ |

### Support (10 collections)

| Collection | Model File | Schema Complete | Notes |
|---|---|---|---|
| `refreshTokens` | `models/refreshToken.ts` | ✅ | SHA-256 hash, TTL, family tracking |
| `passwordResetTokens` | `models/passwordResetToken.ts` | ✅ | 1-hour TTL |
| `emailVerificationTokens` | `models/emailVerificationToken.ts` | ✅ | 48-hour TTL |
| `webhookEvents` | `models/webhookEvent.ts` | ✅ | Idempotency key: (provider, eventId) |
| `systemSettings` | `models/systemSetting.ts` | ✅ | Seed required |
| `activitySessions` | `models/activitySession.ts` | ✅ | |
| `loginAttempts` | `models/loginAttempt.ts` | ✅ | 24-hour TTL |
| `exportJobs` | `models/exportJob.ts` | ✅ | 7-day TTL |
| `scheduledJobs` | `models/scheduledJob.ts` | ✅ | Seed required |
| `failedJobLogs` | `models/failedJobLog.ts` | ✅ | |

**v1.5 micro-additions verified:**
- `accountLockedUntil: Date | null` — ✅ present in `users` model
- `lastStalledAt: Date` — ⚠️ needs verification in `projects` model
- `escalatedAt: Date` + `escalationTier: Number` — ⚠️ needs verification in `supportTickets` model

---

## 2. STATUS ENUMS — SOURCE OF TRUTH

### Backend Canonical Status Enums

| Entity | Enum Location | Values |
|---|---|---|
| Project Status | `models/projectEnums.ts` | `draft`, `onboarding`, `active`, `waiting_client`, `in_review`, `completed`, `delivered`, `archived`, `cancelled` |
| Lead Status | `models/leadEnums.ts` | (defined) |
| Invoice Status | `models/invoiceEnums.ts` | (defined — includes `overpaid` per v1.5) |
| Payment Status | `models/invoiceEnums.ts` | (defined) |
| Document Status | `models/documentEnums.ts` | (defined) |
| Notification Status | `models/notificationEnums.ts` | (defined) |
| Support Ticket Status | `models/supportTicketEnums.ts` | (defined) |
| Task Status | `models/taskEnums.ts` | (defined) |
| Webhook Processing Status | `models/enums.ts` | (defined) |
| Audit Actions | `models/auditLogEnums.ts` | (defined) |

### Frontend CRM Status Enums (useCRMStore.ts)

| Entity | Frontend Values | Backend Values | Match? |
|---|---|---|---|
| ProjectStatus | `pending`, `active`, `waiting-client`, `review`, `completed`, `rejected` | `draft`, `onboarding`, `active`, `waiting_client`, `in_review`, `completed`, `delivered`, `archived`, `cancelled` | ❌ MISMATCH |
| PaymentStatus | `pending`, `partial`, `paid`, `overdue` | `pending`, `partial`, `paid`, `overdue`, `overpaid`, `disputed` | ⚠️ Partial |
| TaskStatus | `todo`, `active`, `done` | (backend values in taskEnums.ts) | ⚠️ Needs verification |

**Client Dashboard status labels (DashboardPage.tsx):**
`payment_confirmed`, `documents_received`, `processing`, `filed`, `completed`
→ These are UI-only labels, not backend enum values. When wired to API, must be mapped from backend project statuses.

---

## 3. API FAMILIES — SOURCE OF TRUTH

| Family | Base Path | Auth | Controller | Route File | Status |
|---|---|---|---|---|---|
| Health | `/api/v1/health` | None | healthService | routes/health.ts + modules/health/healthRoutes.ts | ✅ |
| Auth | `/api/v1/auth` | Mixed | authController | routes/auth.ts | ✅ |
| Services (public) | `/api/v1/services` | None | serviceService | routes/publicServices.ts | ✅ |
| Leads | `/api/v1/leads` | Mixed | leadService | modules/leads/leadRoutes.ts | ✅ |
| Contact (public) | `/api/v1/contact` | None | leadService | modules/leads/leadRoutes.ts | ✅ |
| Users | `/api/v1/users` | Admin | userService | modules/users/userRoutes.ts | ✅ |
| Projects | `/api/v1/projects` | Admin+Employee | projectService | modules/projects/projectRoutes.ts | ✅ |
| Tasks | `/api/v1/tasks` | Admin+Employee | taskService | modules/tasks/taskRoutes.ts | ✅ |
| Timeline | `/api/v1/timeline` | All roles | timelineService | modules/timeline/timelineRoutes.ts | ✅ |
| Documents | `/api/v1/documents` | All roles | documentService | modules/documents/documentRoutes.ts | ✅ |
| Approvals | `/api/v1/approvals` | Admin+Employee | approvalService | modules/approvals/approvalRoutes.ts | ✅ |
| Invoices | `/api/v1/invoices` | Admin+Client | invoiceService | modules/payments/invoiceRoutes.ts | ✅ |
| Payments | `/api/v1/payments` | Mixed (❌ mismatch) | paymentService | modules/payments/paymentRoutes.ts | ❌ CRITICAL |
| Webhooks | `/api/v1/webhooks` | None+Admin | webhookProcessor | modules/webhooks/webhookRoutes.ts | ✅ |
| Notifications | `/api/v1/notifications` | All roles | notificationService | modules/notifications/notificationRoutes.ts | ✅ |
| Support | `/api/v1/support` | All roles | supportService | modules/support/supportRoutes.ts | ✅ |
| Exports | `/api/v1/exports` | Admin+Client | exportService | modules/exports/exportRoutes.ts | ✅ |
| Dashboard (Admin) | `/api/v1/dashboard/admin` | Admin | adminDashboardController | routes/dashboard.admin.ts | ✅ |
| Dashboard (Employee) | `/api/v1/dashboard/employee` | Employee | employeeDashboardService | routes/dashboard.employee.ts | ✅ |
| Dashboard (Client) | `/api/v1/dashboard/client` | Client | clientDashboardService | modules/dashboards/client/clientDashboardRouter.ts | ✅ |
| Admin Settings | `/api/v1/admin/settings` | Admin | systemSetting model | modules/admin/adminSettingsRoutes.ts | ✅ |
| Admin Jobs | `/api/v1/admin/jobs` | Admin | scheduledJob model | modules/admin/adminJobsRoutes.ts | ✅ |
| Audit Logs | `/api/v1/admin/audit-logs` | Admin | auditService | modules/audit/auditRoutes.ts | ✅ |

---

## 4. FRONTEND PAGE → API MAP

| Page | File | Backend Endpoints Used | Integration Status |
|---|---|---|---|
| Homepage | pages/Index.tsx | None currently (services from static lib) | ⚠️ Static data |
| Services | pages/ServicesPage.tsx | None currently | ⚠️ Static data |
| Service Detail | pages/ServiceDetailPage.tsx | None currently | ⚠️ Static data |
| Pricing | pages/PricingPage.tsx | None currently | ⚠️ Static data |
| Contact | pages/ContactPage.tsx | `POST /api/v1/contact` (submitLead) | ✅ Wired |
| Checkout | pages/CheckoutPage.tsx | `POST /api/v1/payments/create-order` + `/verify` | ❌ Schema mismatch |
| Submit Docs | pages/SubmitDocumentsPage.tsx | None (WhatsApp redirect only) | ⚠️ Not wired |
| Dashboard | pages/DashboardPage.tsx | None (mock useDashboardStore) | ❌ Not wired |
| About | pages/AboutPage.tsx | None | ✅ Static |
| CRM / Admin | components/crm/admin/* | None (mock useCRMStore) | ❌ Not wired |
| CRM / Employee | components/crm/employee/* | None (mock useCRMStore) | ❌ Not wired |
| CRM / Client | components/crm/client/* | None (mock useCRMStore) | ❌ Not wired |

---

## 5. FRONTEND ROUTES MAP

| Route | Component | Auth Guard | Notes |
|---|---|---|---|
| `/` | Index | None | Public landing page |
| `/services` | ServicesPage | None | Public |
| `/services/:slug` | ServiceDetailPage | None | Public |
| `/pricing` | PricingPage | None | Public |
| `/checkout` | CheckoutPage | None | Public (payment entry) |
| `/submit-documents` | SubmitDocumentsPage | None | Post-payment |
| `/dashboard` | DashboardPage | None (should be Client) | ⚠️ No auth guard |
| `/contact` | ContactPage | None | Public |
| `/about` | AboutPage | None | Public |
| `/crm/*` | CRMApp | None (role-switcher mock) | ⚠️ No real auth |
| `*` | NotFound | None | 404 |

**Missing frontend routes (vs v1.5 spec):**
- `/login` — no login page exists
- `/portal` — client portal should be separate from `/dashboard`
- `/workspace` — employee workspace not under `/crm` in spec

---

## 6. BACKGROUND JOBS — SOURCE OF TRUTH

**Expected (v1.5 spec):** BullMQ queues
**Actual (implementation):** `node-cron` (see package.json — no `bullmq` or `bull` dependency)

| Job Name | Cron | Implemented | File |
|---|---|---|---|
| `project-overdue-detector` | `0 1 * * *` | ✅ | jobs/overdueDetector.ts |
| `task-overdue-detector` | `0 1 * * *` | ✅ | jobs/overdueDetector.ts |
| `invoice-overdue-detector` | `0 2 * * *` | ✅ | jobs/overdueDetector.ts |
| `lead-auto-archiver` | `0 3 * * 0` | ✅ | jobs/leadAutoArchiver.ts |
| `stalled-project-detector` | `0 4 * * *` | ✅ | jobs/overdueDetector.ts |
| `notification-archiver` | `0 5 * * 0` | ✅ | jobs/cleanupJobs.ts |
| `refresh-token-cleanup` | `0 6 * * 0` | ✅ | jobs/cleanupJobs.ts |
| `export-job-cleanup` | `0 7 * * *` | ✅ | jobs/exportCleanup.ts |
| `email-verification-reminder` | `0 9 * * 1` | ✅ | jobs/reminderRunner.ts |
| `webhook-retry-processor` | `*/15 * * * *` | ✅ | jobs/webhookRetryProcessor.ts |

**Architecture gap:** Implementation uses `node-cron` instead of BullMQ. Per v1.5 spec, retries and job queuing should use BullMQ for:
- Webhook retry logic
- Export job processing
- Email delivery

The `node-cron` implementation achieves the same scheduling behaviour but lacks distributed lock support and BullMQ's job-state persistence. Acceptable for MVP.

---

## 7. SEED DATA — SOURCE OF TRUTH

| Seed | File | Records | Status |
|---|---|---|---|
| Services catalog | seeds/services.seed.ts | 26 (24 active + 2 inactive) | ✅ Matches v1.5 Part 10 |
| System settings | None | 0 | ❌ Missing |
| Scheduled jobs registry | None | 0 | ❌ Missing |
| Admin user | None | 0 | ❌ Missing |

---

## 8. INFRASTRUCTURE MAP

| Component | MVP Stack | Growth Stack | Status |
|---|---|---|---|
| Runtime | Node.js 20+ | Node.js 20+ | ✅ |
| Framework | Express 4 | Express 4 | ✅ |
| Database | MongoDB Atlas | MongoDB Atlas | ✅ (no connection yet) |
| Cache | Redis (Upstash) | ElastiCache | ⚠️ No Redis client lib in package.json |
| Queue | node-cron | BullMQ | ⚠️ Using node-cron |
| Storage | AWS S3 | CloudFront + S3 | ✅ (config present, client missing) |
| Email | Nodemailer | Nodemailer | ✅ |
| Payment | Razorpay | Razorpay | ✅ |
| Logging | Winston + Pino | Winston | ✅ |
| Error tracking | Sentry | Sentry | ❌ Missing |

**Packages present but not fully integrated:**
- `node-cron` — scheduler (✅ present and used)
- `nodemailer` — email (✅ in services/mailer.ts)

**Packages spec'd but absent from package.json:**
- `ioredis` / `redis` — no Redis client (cache module references it but implementation may be graceful-fallback)
- `@aws-sdk/client-s3` — S3 SDK not in package.json
- `bullmq` — not in package.json
- `@sentry/node` — not in package.json
- `multer` — file upload middleware not in package.json
