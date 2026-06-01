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
| Cache | Redis / Upstash |
| File Storage | AWS S3 |
| Logging | Winston + DailyRotateFile |
| Payment | Razorpay (HMAC-SHA256 webhook verification) |
| Auth | JWT (access + refresh token rotation with reuse detection) |
| Scheduler | node-cron (10 canonical background jobs) |
| Process Mgmt | PM2 (production) |

---

## Quick Start (Development)

```bash
npm install
cp .env.example .env   # fill in required values
npm run dev            # starts with hot-reload on port 5000
```

Verify: `curl http://localhost:5000/api/v1/health`

---

## Quick Start (Production)

```bash
# 1. Install production dependencies
npm ci --omit=dev

# 2. Build TypeScript
npm run build

# 3. Configure environment
cp .env.example .env
# Edit .env with production values

# 4. Seed services catalog (first deploy only)
npm run seed

# 5. Start with PM2
npm run start:pm2

# 6. Persist across reboots
pm2 save && pm2 startup
```

See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for full production deployment guide.

---

## NPM Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot-reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build directly |
| `npm run typecheck` | Type-check without emitting |
| `npm run build:check` | Typecheck + build (CI validation) |
| `npm run lint` | ESLint |
| `npm test` | Run 139 lightweight tests |
| `npm run seed` | Seed services catalog (dev) |
| `npm run seed:prod` | Seed services catalog (production) |
| `npm run start:pm2` | Start with PM2 in production mode |
| `npm run reload` | Reload PM2 process (zero-downtime) |
| `npm run logs` | Tail PM2 logs |
| `npm run health` | Quick health check |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. See `.env.example` for full documentation.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ★ Required | MongoDB Atlas connection string |
| `JWT_SECRET` | ★ Required | Access token secret (≥ 64 chars) |
| `JWT_REFRESH_SECRET` | ★ Required | Refresh token secret (≥ 64 chars, different) |
| `RAZORPAY_KEY_ID` | ◈ Recommended | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | ◈ Recommended | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | ◈ Recommended | Razorpay HMAC webhook secret |
| `AWS_ACCESS_KEY_ID` | ◈ Recommended | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | ◈ Recommended | S3 secret key |
| `AWS_S3_BUCKET` | ◈ Recommended | S3 bucket name |
| `AWS_REGION` | ◈ Recommended | AWS region (default: `ap-south-1`) |
| `REDIS_URL` | ◈ Recommended | Redis URL (Upstash for MVP) |
| `EMAIL_SMTP_HOST` | ◈ Recommended | SMTP host |
| `EMAIL_SMTP_USER` | ◈ Recommended | SMTP username |
| `EMAIL_SMTP_PASS` | ◈ Recommended | SMTP password |
| `CLIENT_URL` | ○ Optional | CORS origin (default: `http://localhost:3000`) |
| `PORT` | ○ Optional | Server port (default: `5000`) |
| `NODE_ENV` | ○ Optional | `development` / `production` / `test` |
| `LOG_LEVEL` | ○ Optional | `error`/`warn`/`info`/`http`/`debug` |

---

## Health Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/v1/health` | None | System health summary |
| `GET /api/v1/health/ready` | None | Readiness probe — 503 if DB down |
| `GET /api/v1/health/live` | None | Liveness probe — always 200 if process running |
| `GET /api/v1/health/diagnostics` | Admin JWT | Full diagnostics with metrics |

---

## Scheduler

10 background jobs start automatically at server boot. Single-instance only — do not run with PM2 `cluster` mode.

| Job | Schedule | Purpose |
|---|---|---|
| `project-overdue-detector` | Daily 01:00 UTC | Flag overdue projects |
| `task-overdue-detector` | Daily 01:00 UTC | Flag overdue tasks |
| `invoice-overdue-detector` | Daily 02:00 UTC | Flag overdue invoices |
| `lead-auto-archiver` | Weekly Sun 03:00 UTC | Archive inactive leads (90d) |
| `stalled-project-detector` | Daily 04:00 UTC | Flag stalled projects |
| `notification-archiver` | Weekly Sun 05:00 UTC | Archive old notifications |
| `refresh-token-cleanup` | Weekly Sun 06:00 UTC | Delete old revoked tokens |
| `export-job-cleanup` | Daily 07:00 UTC | Delete expired exports |
| `email-verification-reminder` | Weekly Mon 09:00 UTC | Remind unverified accounts |
| `webhook-retry-processor` | Every 15 min | Retry failed webhooks |

Toggle jobs via: `PATCH /api/v1/admin/jobs/:jobName/toggle`

⚠️ **Important:** Always use `instances: 1` in PM2 / Docker. Running multiple instances will cause duplicate scheduled job execution.

---

## Webhook Integration (Razorpay)

- **Endpoint:** `POST /api/v1/webhooks/razorpay`
- **Auth:** HMAC-SHA256 signature verification (raw body preserved)
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

Client isolation enforced at 3 layers: middleware → service queries → response filtering.

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

## Documentation

| Document | Description |
|---|---|
| [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) | Full production deployment guide |
| [docs/BACKUP_RECOVERY.md](../docs/BACKUP_RECOVERY.md) | Backup strategy and disaster recovery |
| [docs/RELEASE_CHECKLIST.md](../docs/RELEASE_CHECKLIST.md) | Pre/post-deployment release checklist |

---

*KlawTax Backend v1.5 — Phase 7.2 Release Hardening | Production-Ready*
