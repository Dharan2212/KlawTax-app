# KlawTax — Missing Files & Gaps
### Batch 1 Audit | May 2026

---

## CRITICAL MISSING — BACKEND

### 1. Guest Checkout Endpoint
**Severity:** CRITICAL — blocks primary revenue flow

**Missing:** A public, unauthenticated checkout endpoint that the frontend can call without an existing client account.

Per v1.5 spec section 9.2.6:
> "Auth required: None (creates a guest order); creates client account after payment is verified."

**Current state:** `POST /api/v1/payments/create-order` requires `authenticate()` middleware and expects pre-existing `invoiceId` and `clientId`.

**What needs to be created:**
- `POST /api/v1/payments/checkout` — public guest checkout handler that:
  1. Validates customer info (name, email, phone)
  2. Looks up or creates a client user + clientProfile
  3. Creates invoice
  4. Creates project (or bundle projects)
  5. Creates Razorpay order
  6. Returns `{ razorpayOrderId, invoiceId, amount, currency, clientAccessToken? }`
- Update `POST /api/v1/payments/verify` to work without prior auth (signature-based)
- Update response shape to include `projectId` and `orderId` as frontend expects

**Suggested file:** `backend/src/modules/payments/checkoutService.ts`

---

### 2. Redis Client Package
**Severity:** HIGH — cache and rate-limiting depend on it

**Missing packages:**
- `ioredis` or `redis` npm package

**Current state:** `backend/src/utils/cache/index.ts` references Redis but package.json has no Redis client.

**What needs to be added to `package.json`:**
```
"ioredis": "^5.3.2"
"@types/ioredis": "^4.28.10"
```

---

### 3. AWS S3 SDK Package
**Severity:** HIGH — document upload flow requires it

**Missing packages:**
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`
- `multer` (file upload middleware)
- `@types/multer`

**Current state:** Document upload endpoints exist in `documentRoutes.ts` but no S3 client or multipart upload handling is present in package.json.

---

### 4. Seed Files for System Settings and Scheduled Jobs
**Severity:** HIGH — backend scheduler and settings depend on seeds

**Missing:**
- `backend/src/seeds/systemSettings.seed.ts` — initial operational settings
- `backend/src/seeds/scheduledJobs.seed.ts` — job registry entries

**Current state:** `runSeeds.ts` only runs services seed. System settings collection will be empty on first deploy. Jobs will not appear in admin job registry until manually seeded.

---

### 5. Admin User Seed / First-Run Script
**Severity:** HIGH — no way to log into admin panel on fresh deployment

**Missing:**
- `backend/src/seeds/adminUser.seed.ts` — creates the first admin account
- Or: a `POST /api/v1/admin/bootstrap` one-time setup endpoint

**Current state:** No way to create the first admin user. Database has no user records until manually inserted.

---

### 6. Session Management Route
**Severity:** MEDIUM — v1.5 spec section 6.1.6 defines admin session termination

**Missing route:**
- `DELETE /api/v1/admin/users/:userId/sessions/:sessionId`

**Current state:** `userRoutes.ts` does not include session management endpoints. `activitySessions` model exists but no route to terminate specific sessions.

---

## CRITICAL MISSING — FRONTEND

### 7. Login Page
**Severity:** CRITICAL — CRM cannot be used without authentication

**Missing:** `frontend/src/pages/LoginPage.tsx` (or `CRMLoginPage.tsx`)

**Current state:** CRM uses a `RoleSwitcher` component that lets users toggle between admin/employee/client roles in-memory. No actual authentication flow. JWT is never obtained.

**Required:**
- Login page at `/login` or `/crm/login`
- `POST /api/v1/auth/login` integration
- Token storage in sessionStorage (mechanism exists in `lib/api.ts`)
- Route guard wrapping `/crm/*` and `/dashboard`

---

### 8. Route Guards / Auth HOC
**Severity:** CRITICAL — all protected routes are currently accessible without auth

**Missing:**
- `frontend/src/components/shared/ProtectedRoute.tsx` or equivalent
- Auth context/provider that checks stored JWT
- Redirect to `/login` for unauthenticated access to `/dashboard`, `/crm/*`

**Current state:** All routes in App.tsx render unconditionally. Any user can access `/crm/admin` without credentials.

---

### 9. API Integration Layer for CRM
**Severity:** HIGH — CRM is a demo with no live data

**Missing files:**
- `frontend/src/lib/api/crmApi.ts` — API client methods for CRM operations
  - `fetchProjects()`, `updateProjectStatus()`, `assignProject()`
  - `fetchLeads()`, `updateLeadStatus()`, `convertLead()`
  - `fetchApprovals()`, `approveSubmission()`, `rejectSubmission()`
  - `fetchInvoices()`, `fetchPayments()`
  - `fetchUsers()`, `createEmployee()`
- `frontend/src/lib/api/notificationsApi.ts`
  - `getUnreadCount()`, `getNotifications()`, `markRead()`
- `frontend/src/lib/api/supportApi.ts`
  - `getTickets()`, `createTicket()`, `addMessage()`

---

### 10. Dashboard API Integration
**Severity:** HIGH — client dashboard shows static mock data

**Missing:**
- Wire `fetchClientDashboard()` (already exists in `lib/api.ts`) into `DashboardPage.tsx`
- Map backend response to dashboard state
- Add loading/error states

---

### 11. Document Upload Integration
**Severity:** MEDIUM — SubmitDocumentsPage has no backend call

**Missing:**
- File upload API method in `lib/api.ts`
- Multipart form submission handler in `SubmitDocumentsPage.tsx`

---

### 12. Email Verification Page
**Severity:** MEDIUM — backend sends verification links but no page to handle them

**Missing:**
- `frontend/src/pages/VerifyEmailPage.tsx`
- Route: `/verify-email?token=<token>`
- Calls `POST /api/v1/auth/verify-email`

---

### 13. Password Reset Pages
**Severity:** MEDIUM — backend supports password reset but no frontend pages

**Missing:**
- `frontend/src/pages/ForgotPasswordPage.tsx` — calls `POST /api/v1/auth/password/request-reset`
- `frontend/src/pages/ResetPasswordPage.tsx` — calls `POST /api/v1/auth/password/reset`
- Routes: `/forgot-password`, `/reset-password?token=<token>`

---

## NON-CRITICAL MISSING

### 14. Frontend Typecheck Script
**Severity:** LOW

**Missing:** `"typecheck": "tsc --noEmit"` in `frontend/package.json`
**Impact:** No TypeScript validation in CI pipeline for frontend.

---

### 15. TypeScript tsconfig Deprecation
**Severity:** LOW

**File:** `backend/tsconfig.json`
**Issue:** `"moduleResolution": "node"` is deprecated. Should be `"bundler"` or `"node16"` + `"ignoreDeprecations": "6.0"`.

---

### 16. Sentry Integration
**Severity:** LOW (missing per v1.5 infrastructure spec)

**Missing:** `@sentry/node` in backend package.json. Error tracking not configured.

---

### 17. Admin Webhook History Route Alignment
**Severity:** LOW

**Current:** Webhook history at `GET /api/v1/webhooks` (admin-protected)
**Spec says:** `GET /api/v1/admin/webhooks`
**Impact:** Cosmetic — functionally equivalent. Frontend not wired yet so no user impact.

---

### 18. Admin Dashboard Route Comment
**Severity:** LOW (documentation only)

**File:** `backend/src/routes/dashboard.admin.ts`
**Comment says:** `Base path: /api/v1/admin/dashboard`
**Actual mounting:** `/api/v1/dashboard/admin`
**Impact:** None. Implementation is correct, comment is wrong.

---

## SUMMARY TABLE

| # | Missing Item | Layer | Severity | Blocks Launch? |
|---|---|---|---|---|
| 1 | Guest checkout endpoint | Backend | CRITICAL | ✅ YES |
| 2 | Redis client package | Backend | HIGH | Partial |
| 3 | AWS S3 SDK + multer | Backend | HIGH | Partial |
| 4 | System settings seed | Backend | HIGH | No |
| 5 | Admin user seed | Backend | HIGH | ✅ YES |
| 6 | Session management route | Backend | MEDIUM | No |
| 7 | Login page | Frontend | CRITICAL | ✅ YES |
| 8 | Route guards / auth HOC | Frontend | CRITICAL | ✅ YES |
| 9 | CRM API integration | Frontend | HIGH | No |
| 10 | Dashboard API integration | Frontend | HIGH | No |
| 11 | Document upload integration | Frontend | MEDIUM | No |
| 12 | Email verification page | Frontend | MEDIUM | No |
| 13 | Password reset pages | Frontend | MEDIUM | No |
| 14 | Frontend typecheck script | Frontend | LOW | No |
| 15 | tsconfig deprecation | Backend | LOW | No |
| 16 | Sentry integration | Backend | LOW | No |
| 17 | Webhook route alignment | Backend | LOW | No |
| 18 | Admin dashboard comment | Backend | LOW | No |
