# KlawTax — Production Release Checklist
## Version 1.5 | Phase 7.2

Use this checklist for every production release. Check off each item before declaring the release live.

**Release date:** ___________________
**Release version / commit:** ___________________
**Deployer:** ___________________

---

## PRE-DEPLOYMENT

### Environment & Infrastructure
- [ ] MongoDB Atlas cluster provisioned (M10+) and accessible
- [ ] Atlas Backup enabled (Continuous Backup)
- [ ] Atlas network access: VPS IP is in allowlist
- [ ] Redis (Upstash) provisioned and `REDIS_URL` populated in `.env`
- [ ] AWS S3 bucket created with versioning enabled
- [ ] S3 bucket public access blocked
- [ ] IAM user created with S3-only permissions; keys in `.env`
- [ ] All `.env` values filled in (no empty required fields)
- [ ] `NODE_ENV=production` in `.env`
- [ ] `CLIENT_URL` points to production frontend domain

### Auth Secrets
- [ ] `JWT_SECRET` is ≥ 64 chars, cryptographically random, NOT a human-readable phrase
- [ ] `JWT_REFRESH_SECRET` is ≥ 64 chars, DIFFERENT from `JWT_SECRET`
- [ ] Secrets stored in password manager / secure vault (not just on server)

### Domain & SSL
- [ ] DNS A record for `klawtax.online` points to VPS IP
- [ ] DNS A record for `api.klawtax.online` points to VPS IP
- [ ] Let's Encrypt SSL certificate issued for both domains
- [ ] SSL auto-renewal verified: `sudo certbot renew --dry-run`
- [ ] Nginx config tested: `sudo nginx -t`

### Build Verification
- [ ] Backend TypeScript build passes: `npm run build` (no errors)
- [ ] Backend tests pass: `npm test` (139 tests, all pass)
- [ ] Frontend build passes: `npm run build` (no errors)
- [ ] `dist/server.js` exists after backend build

---

## DEPLOYMENT

### Code Deployment
- [ ] Latest code pulled: `git pull origin main`
- [ ] Backend dependencies installed: `npm ci --omit=dev`
- [ ] Backend built: `npm run build`
- [ ] Frontend dependencies installed: `npm ci`
- [ ] Frontend built: `npm run build`

### Process Management
- [ ] PM2 started: `pm2 start ecosystem.config.js --env production`
- [ ] PM2 process is running: `pm2 status` shows `online`
- [ ] PM2 saved: `pm2 save`
- [ ] PM2 startup configured: `pm2 startup` (run once per server)

### Database Seeding (First Deploy Only)
- [ ] Services catalog seeded: `npm run seed`
- [ ] Verify: `curl https://api.klawtax.online/api/v1/services` returns 26 services

---

## SMOKE TESTS

### API Health
- [ ] `curl https://api.klawtax.online/api/v1/health` → `{"status":"ok",...}`
- [ ] `curl https://api.klawtax.online/api/v1/health/ready` → HTTP 200
- [ ] `curl https://api.klawtax.online/api/v1/health/live` → HTTP 200
- [ ] Health check shows `database: ok`
- [ ] Health check shows `redis: ok` (or `degraded` if Redis not connected — acceptable)

### Public Endpoints
- [ ] `GET /api/v1/services` returns service list (26 items including bundle)
- [ ] `GET /api/v1/services/section-8-complete-package` returns featured package
- [ ] `POST /api/v1/contact` with test payload returns 200 (lead created)

### Auth
- [ ] Admin login: `POST /api/v1/auth/login` returns access + refresh tokens
- [ ] Refresh token: `POST /api/v1/auth/refresh` returns new access token
- [ ] Protected route without token: returns 401

### Frontend
- [ ] `https://klawtax.online` loads (HTTP 200, correct page)
- [ ] `https://www.klawtax.online` redirects to `https://klawtax.online`
- [ ] Browser shows green padlock (SSL valid)
- [ ] No mixed content warnings in browser console

### Scheduler
- [ ] `GET /api/v1/admin/jobs` (admin JWT) shows 10 scheduled jobs
- [ ] All jobs show `isEnabled: true`
- [ ] No jobs in `lastRunStatus: failed`

---

## INTEGRATION VERIFICATION

### Razorpay
- [ ] Razorpay webhook configured in dashboard with correct URL
- [ ] Test webhook event delivered successfully from Razorpay dashboard
- [ ] `GET /api/v1/admin/webhooks` shows the test event with `processingStatus: processed`
- [ ] Razorpay test payment flow: create order → pay → webhook received → invoice updated

### AWS S3
- [ ] Test file upload via document upload endpoint
- [ ] Pre-signed download URL generated and accessible
- [ ] File visible in S3 bucket console

### Email (SMTP)
- [ ] Send a test email via contact form
- [ ] Check inbox for received email
- [ ] Check spam if not in inbox (add SPF/DKIM records if needed)

---

## OPERATIONAL READINESS

### Monitoring
- [ ] UptimeRobot (or equivalent) configured for `api.klawtax.online/api/v1/health`
- [ ] UptimeRobot alert email set up
- [ ] PM2 log files rotating (or logrotate configured)

### Admin Account
- [ ] Admin user account created in database
- [ ] Admin can log in to CRM at `/admin`
- [ ] Admin dashboard loads without errors
- [ ] `GET /api/v1/admin/settings` returns system settings

### Backup
- [ ] Atlas Backup policy active and shows at least one snapshot
- [ ] `.env` file backed up securely (encrypted, off-server)
- [ ] S3 versioning confirmed enabled

---

## FINAL SIGN-OFF

- [ ] All smoke tests passed
- [ ] All integration tests passed
- [ ] PM2 shows process as `online` with uptime > 1 minute
- [ ] No errors in PM2 error log: `pm2 logs klawtax-api --err --lines 50`
- [ ] Rollback plan confirmed: last working commit SHA noted _______________

**Release declared LIVE:** ___________________

**Sign-off:** ___________________

---

## ROLLBACK TRIGGER CONDITIONS

Initiate rollback immediately if:
- API `/health/ready` returns 503 for > 3 consecutive checks
- PM2 shows `errored` or crash loop (`restarts > 5`)
- Payment webhook endpoint not returning 200
- Authentication completely broken (no login possible)

**Rollback procedure:** See [DEPLOYMENT.md — Rollback Procedure](./DEPLOYMENT.md#13-rollback-procedure)

---

*KlawTax Release Checklist v1.5 — Phase 7.2*
