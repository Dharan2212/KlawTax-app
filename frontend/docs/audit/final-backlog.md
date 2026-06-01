# KlawTax — Final Backlog
### Batch 1 Audit | May 2026

Ranked by production impact. Items marked 🔴 block launch. Items marked 🟡 should be done soon. Items marked 🟢 can be deferred.

---

## 🔴 MUST FIX NOW (Launch Blockers)

---

### B1 — Guest Checkout Endpoint (Backend)
**Priority:** P0 — CRITICAL
**Files:**
- `backend/src/modules/payments/checkoutService.ts` (new)
- `backend/src/modules/payments/paymentRoutes.ts` (add new public route)
- `backend/src/modules/onboarding/onboardingHelpers.ts` (extend)

**Work:**
1. Create `POST /api/v1/payments/checkout` — public (no JWT)
2. Accept `{ serviceId, serviceName, amount, paymentType, customer: { name, email, phone, city? } }`
3. Inside handler:
   - Find or create user (by email) + clientProfile
   - Create invoice with `status: draft`
   - Create project (or bundle anchor + sub-projects for bundles)
   - Create Razorpay order via existing `razorpayHelper.ts`
   - Issue short-lived client JWT (or include clientId for subsequent verify call)
4. Return `{ razorpayOrderId, invoiceId, amount, currency, clientAccessToken? }`
5. Update `POST /api/v1/payments/verify` to not require prior JWT (validate by Razorpay signature alone)
6. Verify response must include `{ verified, projectId, orderId, clientAccessToken? }`

**Impact:** Entire checkout-to-payment flow is broken without this.

---

### B2 — Login Page + Auth Flow (Frontend)
**Priority:** P0 — CRITICAL
**Files:**
- `frontend/src/pages/LoginPage.tsx` (new)
- `frontend/src/components/shared/ProtectedRoute.tsx` (new)
- `frontend/src/App.tsx` (add login route, wrap protected routes)
- `frontend/src/lib/api.ts` (extend with login/logout methods)

**Work:**
1. Create login page with email/password form
2. Call `POST /api/v1/auth/login` on submit
3. Store access token via `setStoredToken()` (already in api.ts)
4. Store refresh token in memory (or secure cookie)
5. Create `<ProtectedRoute>` component that reads stored token and redirects to `/login` if absent
6. Wrap `/dashboard` and `/crm/*` routes with `<ProtectedRoute>`
7. Replace `RoleSwitcher` with real role derived from JWT payload

**Impact:** Without login, CRM and dashboard are accessible to anyone with no data.

---

### B3 — Admin User Bootstrap (Backend)
**Priority:** P0 — CRITICAL
**Files:**
- `backend/src/seeds/adminUser.seed.ts` (new)
- `backend/src/seeds/runSeeds.ts` (extend)

**Work:**
1. Create seed that inserts a hashed admin account from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
2. Skip if admin account already exists
3. Run as part of `npm run seed`

**Impact:** No way to log into the system on fresh deployment.

---

### B4 — System Settings + Scheduled Jobs Seeds (Backend)
**Priority:** P1 — HIGH
**Files:**
- `backend/src/seeds/systemSettings.seed.ts` (new)
- `backend/src/seeds/scheduledJobs.seed.ts` (new)
- `backend/src/seeds/runSeeds.ts` (extend)

**Work:**
1. Seed all 11 canonical `systemSettings` entries from v1.5 Part 6.1.5
2. Seed all 10 canonical `scheduledJobs` entries from v1.5 Part 6.1.9
3. Use `upsert` so re-running seeds doesn't create duplicates

**Impact:** Background jobs and settings panel will be empty on first deploy.

---

### B5 — Add Missing npm Packages (Backend)
**Priority:** P1 — HIGH
**Files:**
- `backend/package.json`

**Missing packages to add:**
```json
"ioredis": "^5.3.2",
"@aws-sdk/client-s3": "^3.600.0",
"@aws-sdk/s3-request-presigner": "^3.600.0",
"multer": "^1.4.5-lts.1"
```
**Dev dependencies:**
```json
"@types/multer": "^1.4.11",
"@types/ioredis": "^4.28.10"
```

**Impact:** S3 file uploads and Redis caching will not work without these.

---

## 🟡 SHOULD FIX SOON

---

### B6 — Dashboard Page API Integration (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/store/useDashboardStore.ts`
- `frontend/src/lib/api.ts` (extend)

**Work:**
1. Call `fetchClientDashboard()` on mount (already exists in api.ts)
2. Map API response to dashboard store state
3. Add loading skeleton + error state
4. Replace hardcoded mock orders with live data

---

### B7 — CRM API Integration — Admin Dashboard (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/components/crm/admin/AdminDashboard.tsx`
- `frontend/src/lib/api/crmApi.ts` (new)

**Work:**
1. Create `crmApi.ts` with `fetchAdminDashboard()` calling `GET /api/v1/dashboard/admin`
2. Wire into AdminDashboard — replace mock data
3. Add loading/error states

---

### B8 — CRM API Integration — Project Management (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/components/crm/admin/ProjectManagement.tsx`
- `frontend/src/components/crm/admin/ProjectDetail.tsx`
- `frontend/src/lib/api/crmApi.ts` (extend)

**Work:**
1. Add `fetchProjects()`, `updateProjectStatus()`, `assignProject()` to crmApi
2. Wire ProjectManagement and ProjectDetail to API
3. Align `ProjectStatus` frontend type with backend enum values

---

### B9 — CRM API Integration — Lead Management (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/lib/api/crmApi.ts` (extend — lead methods)

**Work:**
1. Add `fetchLeads()`, `updateLeadStatus()`, `convertLead()`, `addLeadNote()`
2. Build lead list view (not currently in CRM — only client list exists)

---

### B10 — CRM API Integration — Employee Workspace (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/components/crm/employee/EmployeeDashboard.tsx`
- `frontend/src/components/crm/employee/ProjectWorkspace.tsx`
- `frontend/src/components/crm/employee/TaskPanel.tsx`

**Work:**
1. Extend crmApi with employee endpoints
2. Wire EmployeeDashboard → `GET /api/v1/dashboard/employee`
3. Wire ProjectWorkspace → `GET /api/v1/projects/:id/summary`
4. Wire TaskPanel → `GET /api/v1/tasks?projectId=<id>`

---

### B11 — CRM API Integration — Client Portal (Frontend)
**Priority:** P2 — HIGH
**Files:**
- All `frontend/src/components/crm/client/*`

**Work:**
1. Wire all 7 client portal screens to respective `GET /api/v1/dashboard/client/*` endpoints
2. Replace `useCRMStore` usage with API calls
3. Align status values

---

### B12 — Approval Queue API Integration (Frontend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/components/crm/admin/ApprovalQueue.tsx`

**Work:**
1. Fetch `GET /api/v1/approvals?status=pending`
2. Implement approve/reject/revise actions
3. Add resubmission count warning per v1.5 EC-P4

---

### B13 — Document Upload Integration (Frontend + Backend)
**Priority:** P2 — HIGH
**Files:**
- `frontend/src/pages/SubmitDocumentsPage.tsx`
- `backend/src/modules/documents/documentRoutes.ts` (add multer middleware)
- `backend/src/modules/documents/documentService.ts` (S3 upload)

**Work:**
1. Install multer + aws-sdk (see B5)
2. Add multipart upload handler in documentRoutes
3. Implement S3 upload in documentService
4. Wire upload form in SubmitDocumentsPage
5. Track upload progress

---

### B14 — Notification Center API Integration (Frontend)
**Priority:** P2
**Files:**
- `frontend/src/components/crm/shared/NotificationCenter.tsx`

**Work:**
1. Poll `GET /api/v1/notifications/unread-count` every 30s
2. On click, fetch `GET /api/v1/notifications`
3. Mark read on open

---

### B15 — Email Verification + Password Reset Pages (Frontend)
**Priority:** P3
**Files:**
- `frontend/src/pages/VerifyEmailPage.tsx` (new)
- `frontend/src/pages/ForgotPasswordPage.tsx` (new)
- `frontend/src/pages/ResetPasswordPage.tsx` (new)
- `frontend/src/App.tsx` (add routes)

---

### B16 — Support Ticket Integration (Frontend)
**Priority:** P3
**Files:**
- `frontend/src/components/crm/client/ClientSupport.tsx`
- `frontend/src/components/crm/admin/* (admin support panel — missing screen)`

**Work:**
1. Wire ClientSupport → `GET /api/v1/support/tickets` + `POST`
2. Create admin support management screen (currently missing from CRMApp routes)

---

## 🟢 CAN DEFER

---

### B17 — Fix Admin Dashboard Route Comment (Backend)
**Priority:** P4 — LOW
**File:** `backend/src/routes/dashboard.admin.ts`
**Work:** Change comment from `/api/v1/admin/dashboard` to `/api/v1/dashboard/admin`

---

### B18 — Align Webhook Route to Spec (Backend)
**Priority:** P4 — LOW
**File:** `backend/src/app.ts`, `backend/src/modules/webhooks/webhookRoutes.ts`
**Work:** Register GET `/api/v1/admin/webhooks` in addition to current `/api/v1/webhooks`

---

### B19 — Fix TypeScript tsconfig Deprecation (Backend)
**Priority:** P4 — LOW
**File:** `backend/tsconfig.json`
**Work:** Add `"ignoreDeprecations": "6.0"` or change moduleResolution to `"bundler"`

---

### B20 — Add Frontend Typecheck Script
**Priority:** P4 — LOW
**File:** `frontend/package.json`
**Work:** Add `"typecheck": "tsc --noEmit"` to scripts

---

### B21 — Sentry Integration (Backend)
**Priority:** P4 — LOW
**Work:** Add `@sentry/node`, initialize in `server.ts`, configure DSN via env var

---

### B22 — Services API Integration (Frontend)
**Priority:** P4 — DEFER
**Files:** `Index.tsx`, `ServicesPage.tsx`, `ServiceDetailPage.tsx`, `PricingPage.tsx`
**Work:** Replace static lib/services.ts with live API calls. Static data is acceptable for v1 launch; backend API is ready when needed.

---

### B23 — Session Management Route (Backend)
**Priority:** P4
**File:** `backend/src/modules/users/userRoutes.ts`
**Work:** Add `DELETE /api/v1/admin/users/:userId/sessions/:sessionId` per v1.5 spec 6.1.6

---

## IMPLEMENTATION ORDER (RECOMMENDED)

```
Week 1: B1 → B3 → B5 (fix the broken checkout + admin access + packages)
Week 2: B2 → B4 (frontend auth + seeds)
Week 3: B6 → B7 → B8 (wire dashboard + admin CRM)
Week 4: B9 → B10 → B11 (wire employee + client CRM)
Week 5: B12 → B13 → B14 (approvals + docs + notifications)
Week 6: B15 → B16 + cleanup (auth pages + support + deferred items)
```
