# KlawTax Backend API

> Production-grade Node.js/Express/TypeScript backend for **KlawTax.online** —
> India's trusted NGO & legal registration platform.

---

## Architecture

```
Modular Monolith — Node.js · TypeScript · Express · MongoDB (Mongoose)
```

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Language | TypeScript (strict mode) |
| Framework | Express 4 |
| Database | MongoDB via Mongoose (MongoDB Atlas) |
| File Storage | AWS S3 |
| Logging | Winston + DailyRotateFile |
| Payment | Razorpay (HMAC-SHA256 webhook verification) |
| Auth | JWT (RS256 access + refresh token rotation) |
| Scheduler | node-cron (10 canonical background jobs) |

---

## Quick Start

```bash
npm install
cp .env.example .env   # fill in required values
npm run dev            # starts with hot-reload
```

Verify: `curl http://localhost:5000/api/v1/health`

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint |
| `npm test` | Run 139 lightweight tests |
| `npm run seed` | Seed services catalog to MongoDB |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Signing secret for JWT tokens |
| `RAZORPAY_KEY_ID` | ✅ | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | ✅ | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | Razorpay HMAC webhook secret |
| `AWS_ACCESS_KEY_ID` | ✅ | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | ✅ | S3 secret key |
| `AWS_S3_BUCKET` | ✅ | S3 bucket name |
| `AWS_REGION` | ✅ | AWS region (e.g. `ap-south-1`) |
| `REDIS_URL` | Optional | Redis URL (Upstash for MVP) |
| `EMAIL_SMTP_HOST` | Optional | SMTP host |
| `EMAIL_SMTP_USER` | Optional | SMTP username |
| `EMAIL_SMTP_PASS` | Optional | SMTP password |
| `EMAIL_FROM` | Optional | Sender address |
| `PORT` | Optional | Server port (default `5000`) |
| `NODE_ENV` | Optional | `development` / `production` / `test` |
| `FRONTEND_URL` | Optional | CORS allowlist |

---

## Seed Usage

Seeds 26-record services catalog (24 active, 2 inactive, 1 bundle):

```bash
npm run seed
```

---

## Health Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/v1/health` | None | System health summary |
| `GET /api/v1/health/ready` | None | Readiness probe (503 if DB down) |
| `GET /api/v1/health/live` | None | Liveness probe |
| `GET /api/v1/health/diagnostics` | Admin JWT | Full diagnostics |

---

## Scheduler

10 canonical background jobs start automatically at server boot:

| Job | Schedule | Purpose |
|---|---|---|
| `project-overdue-detector` | Daily 01:00 UTC | Flag overdue projects |
| `task-overdue-detector` | Daily 01:00 UTC | Flag overdue tasks |
| `invoice-overdue-detector` | Daily 02:00 UTC | Flag overdue invoices |
| `lead-auto-archiver` | Weekly Sun 03:00 UTC | Archive inactive leads (90d) |
| `stalled-project-detector` | Daily 04:00 UTC | Flag stalled projects |
| `notification-archiver` | Weekly Sun 05:00 UTC | Archive old notifications |
| `refresh-token-cleanup` | Weekly Sun 06:00 UTC | Clean revoked tokens |
| `export-job-cleanup` | Daily 07:00 UTC | Delete expired exports |
| `email-verification-reminder` | Weekly Mon 09:00 UTC | Remind unverified accounts |
| `webhook-retry-processor` | Every 15 min | Retry failed webhooks |

Toggle jobs via: `PATCH /api/v1/admin/jobs/:jobName/toggle`

---

## Webhook Integration (Razorpay)

- **Endpoint:** `POST /api/v1/webhooks/razorpay`
- **Auth:** HMAC-SHA256 signature verification (raw body preserved via `express.raw()`)
- **Always returns HTTP 200** to Razorpay (prevents retry storms)
- **Idempotent** — duplicate events skipped via `(provider, eventId)` unique index
- **Supported events:** `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`
- **Manual retry:** `POST /api/v1/admin/webhooks/:eventId/retry`

---

## Role System

| Role | Access |
|---|---|
| `admin` | Full CRM — all resources |
| `employee` | Assigned projects/tasks only |
| `client` | Own projects, invoices, documents only |

Client isolation enforced at 3 layers: middleware, service queries, response filtering.

---

## API Routes

```
/api/v1/auth                   Auth (login, refresh, logout, reset, verify)
/api/v1/users                  User management
/api/v1/services               Public services catalog
/api/v1/contact                Public lead capture
/api/v1/leads                  CRM lead pipeline
/api/v1/projects               Project lifecycle
/api/v1/tasks                  Task management
/api/v1/timeline               Project timeline
/api/v1/documents              Document upload/review/download
/api/v1/approvals              Admin approval queue
/api/v1/invoices               Invoice management
/api/v1/payments               Razorpay orders + verification
/api/v1/webhooks               Inbound Razorpay webhooks
/api/v1/notifications          In-app notification center
/api/v1/support                Support tickets
/api/v1/exports                Background export jobs
/api/v1/dashboard/admin        Admin dashboard
/api/v1/dashboard/employee     Employee workspace dashboard
/api/v1/dashboard/client       Client portal dashboard
/api/v1/admin/audit-logs       Audit logs (Admin only)
/api/v1/admin/settings         Operational settings (Admin only)
/api/v1/admin/jobs             Scheduler management (Admin only)
/api/v1/health                 Health / readiness / liveness
```

---

## Tests

139 lightweight unit/contract tests — no database required:

```bash
npm test
```

Coverage: JWT auth, RBAC, project lifecycle, invoice/payment rules, lead lifecycle,
services catalog (26 records), Razorpay webhook verification, health/scheduler,
signed URL, pagination helpers, notifications, support ticket transitions.

---

*KlawTax Backend v1.5 — Phase 7.1 Final | Production-Ready*
