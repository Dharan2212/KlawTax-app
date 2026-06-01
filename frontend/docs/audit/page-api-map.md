# KlawTax — Page → API Map
### Batch 1 Audit | May 2026

---

## PUBLIC SITE PAGES

---

### 1. Homepage (`/`)
**File:** `frontend/src/pages/Index.tsx`
**Purpose:** Landing page — hero, stats, services grid, featured package, process timeline, pricing preview, testimonials, CTA

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Services list (hero card, grid) | `frontend/src/lib/services.ts` (static) | `GET /api/v1/services` | ❌ Static |
| Featured package | `frontend/src/lib/services.ts` (static) | `GET /api/v1/services/featured` | ❌ Static |
| Pricing data | `frontend/src/lib/pricing.ts` (static) | `GET /api/v1/services` | ❌ Static |

**Auth required:** None
**Role access:** Public
**Mutations:** None
**Gap:** All content is hardcoded static data. Should eventually pull from `GET /api/v1/services` for real-time pricing and availability. Low priority — static data is acceptable for v1 launch.

---

### 2. Services Listing (`/services`)
**File:** `frontend/src/pages/ServicesPage.tsx`
**Purpose:** Browse and filter all services by category

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Services list with categories | `frontend/src/lib/services.ts` (static) | `GET /api/v1/services?category=<cat>` | ❌ Static |

**Auth required:** None
**Gap:** Static data. No category filter calls to backend.

---

### 3. Service Detail (`/services/:slug`)
**File:** `frontend/src/pages/ServiceDetailPage.tsx`
**Purpose:** Individual service page — overview, inclusions, documents required, process timeline, FAQ, pricing

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Service details | `frontend/src/lib/services.ts` (static lookup) | `GET /api/v1/services/:slug` | ❌ Static |
| Related services | `frontend/src/lib/services.ts` (static) | `GET /api/v1/services?category=<cat>&limit=3` | ❌ Static |

**Auth required:** None
**Gap:** Static data. SEO pages rely on static content which is acceptable. Should wire for future CMS flexibility.

---

### 4. Pricing (`/pricing`)
**File:** `frontend/src/pages/PricingPage.tsx`
**Purpose:** Full pricing table, toggle between NGO / Business, comparison table

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| All service prices | `frontend/src/lib/pricing.ts` (static) | `GET /api/v1/services` | ❌ Static |

**Auth required:** None
**Gap:** Static data. Acceptable for v1.

---

### 5. Contact (`/contact`)
**File:** `frontend/src/pages/ContactPage.tsx`
**Purpose:** Lead capture form — name, phone, email, service interest, message

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Form submission | `frontend/src/lib/api.ts` → `submitLead()` | `POST /api/v1/contact` | ✅ **WIRED** |

**Request payload sent:**
```json
{ "name": "string", "phone": "string", "email": "string", "service": "string", "message": "string" }
```
**Backend receives at:** `POST /api/v1/contact` → `leadService.createPublicLead()`
**Auth required:** None (rate-limited: 3/hr/IP)
**Status:** ✅ Contract matches. Live integration working.

---

### 6. Checkout (`/checkout?service=<slug>&advance=true`)
**File:** `frontend/src/pages/CheckoutPage.tsx`
**Purpose:** Customer details → payment selection → Razorpay modal → confirmation

| Step | API Call | Endpoint | Wired? | Status |
|---|---|---|---|---|
| Create Razorpay order | `createPaymentOrder()` | `POST /api/v1/payments/create-order` | ⚠️ Wired | ❌ **BROKEN** |
| Verify payment | `verifyPayment()` | `POST /api/v1/payments/verify` | ⚠️ Wired | ❌ **BROKEN** |
| Store client token | `setStoredToken()` | n/a | — | ✅ |

**CRITICAL MISMATCHES:**

**Mismatch 1 — create-order request body:**
```
Frontend sends:
{
  serviceId: string,
  serviceName: string,
  amount: number,
  paymentType: "full" | "advance",
  customer: { name, email, phone, city }
}

Backend expects:
{
  invoiceId: string,   ← DOES NOT EXIST YET at checkout
  clientId: string,    ← CLIENT DOES NOT EXIST YET at checkout
  projectId?: string   ← PROJECT DOES NOT EXIST YET at checkout
}
```

**Mismatch 2 — authentication requirement:**
```
Frontend: Calls without auth token (guest checkout flow)
Backend:  Requires authenticate() middleware → 401 for unauthenticated request
```

**Mismatch 3 — verify response shape:**
```
Frontend expects:  { verified: boolean, projectId: string, orderId: string, clientAccessToken?: string }
Backend returns:   { verified: boolean, invoiceStatus: string, redirectUrl: string }
```

**Root cause:** The backend `paymentRoutes.ts` implements a post-onboarding payment flow (for returning authenticated clients). The frontend implements the v1.5 spec's guest checkout flow (unauthenticated first-time purchase). These two flows require a separate "guest checkout" endpoint on the backend that:
1. Accepts customer details + service info
2. Creates a client account (or links existing)
3. Creates invoice + project
4. Creates Razorpay order
5. Returns order ID + invoice ID + temporary client token

**Impact:** Checkout is currently non-functional for the primary user journey.

---

### 7. Submit Documents (`/submit-documents`)
**File:** `frontend/src/pages/SubmitDocumentsPage.tsx`
**Purpose:** Post-payment document submission — checklist + upload or WhatsApp redirect

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Service document checklist | Static fallback | `GET /api/v1/services/:slug` | ❌ Not wired |
| File upload | None | `POST /api/v1/documents` | ❌ Not wired |

**Auth required:** Client JWT (issued after checkout)
**Gap:** No API integration. WhatsApp redirect is the primary flow. File upload form is UI-only.

---

### 8. Dashboard (`/dashboard`)
**File:** `frontend/src/pages/DashboardPage.tsx`
**Purpose:** Client order tracking — project status, payment status, updates

| Data Needed | Source | API Endpoint | Wired? |
|---|---|---|---|
| Order list | `useDashboardStore` (hardcoded mock) | `GET /api/v1/dashboard/client` | ❌ **NOT WIRED** |
| Updates feed | `useDashboardStore` (hardcoded mock) | `GET /api/v1/dashboard/client/timeline` | ❌ **NOT WIRED** |

**Auth required:** Client JWT (none enforced currently — no auth guard on this route)
**Gap:** Entire page uses static mock data. `fetchClientDashboard()` exists in `lib/api.ts` but is never called.

---

### 9. About (`/about`)
**File:** `frontend/src/pages/AboutPage.tsx`
**Purpose:** About company — static content
**API calls:** None. Static page. ✅ Correct.

---

## CRM SCREENS

---

### 10–17. CRM / Admin Screens (`/crm/admin/*`)

| Screen | File | Data Source | API Wired? |
|---|---|---|---|
| Admin Dashboard | components/crm/admin/AdminDashboard.tsx | useCRMStore + mockNotifications | ❌ Mock only |
| Client Management | components/crm/admin/ClientManagement.tsx | useCRMStore | ❌ Mock only |
| Project Management | components/crm/admin/ProjectManagement.tsx | useCRMStore | ❌ Mock only |
| Project Detail | components/crm/admin/ProjectDetail.tsx | useCRMStore | ❌ Mock only |
| Approval Queue | components/crm/admin/ApprovalQueue.tsx | useCRMStore | ❌ Mock only |
| Payments Panel | components/crm/admin/PaymentsPanel.tsx | useCRMStore | ❌ Mock only |
| Reports Panel | components/crm/admin/ReportsPanel.tsx | useCRMStore + crmWorkflow | ❌ Mock only |

**Backend endpoints that should power these screens (all exist, none wired):**
- `GET /api/v1/dashboard/admin` → AdminDashboard
- `GET /api/v1/users?role=client` → ClientManagement
- `GET /api/v1/projects` → ProjectManagement
- `GET /api/v1/projects/:id/summary` → ProjectDetail
- `GET /api/v1/approvals?status=pending` → ApprovalQueue
- `GET /api/v1/invoices`, `GET /api/v1/payments` → PaymentsPanel
- `POST /api/v1/exports` → ReportsPanel

---

### 18–20. CRM / Employee Screens (`/crm/employee/*`)

| Screen | File | Data Source | API Wired? |
|---|---|---|---|
| Employee Dashboard | components/crm/employee/EmployeeDashboard.tsx | useCRMStore + mockData | ❌ Mock only |
| My Projects | components/crm/employee/MyProjects.tsx | useCRMStore | ❌ Mock only |
| Project Workspace | components/crm/employee/ProjectWorkspace.tsx | useCRMStore | ❌ Mock only |
| Task Panel | components/crm/employee/TaskPanel.tsx | useCRMStore | ❌ Mock only |

**Backend endpoints that should power these screens (all exist, none wired):**
- `GET /api/v1/dashboard/employee` → EmployeeDashboard
- `GET /api/v1/projects?assignedTo=me` → MyProjects
- `GET /api/v1/projects/:id/summary` → ProjectWorkspace
- `GET /api/v1/tasks?projectId=<id>` → TaskPanel

---

### 21–27. CRM / Client Screens (`/crm/client/*`)

| Screen | File | Data Source | API Wired? |
|---|---|---|---|
| Client Dashboard | components/crm/client/ClientDashboard.tsx | useCRMStore + mockData | ❌ Mock only |
| Client Projects | components/crm/client/ClientProjects.tsx | useCRMStore | ❌ Mock only |
| Client Project View | components/crm/client/ClientProjectView.tsx | useCRMStore | ❌ Mock only |
| Client Submission | components/crm/client/ClientSubmission.tsx | useCRMStore | ❌ Mock only |
| Client Payments | components/crm/client/ClientPayments.tsx | useCRMStore | ❌ Mock only |
| Client Documents | components/crm/client/ClientDocuments.tsx | useCRMStore | ❌ Mock only |
| Client Support | components/crm/client/ClientSupport.tsx | useCRMStore | ❌ Mock only |

**Backend endpoints that should power these screens (all exist, none wired):**
- `GET /api/v1/dashboard/client` → ClientDashboard
- `GET /api/v1/dashboard/client/projects` → ClientProjects
- `GET /api/v1/dashboard/client/projects/:id` → ClientProjectView
- `POST /api/v1/documents` (upload) → ClientSubmission
- `GET /api/v1/dashboard/client/payments` → ClientPayments
- `GET /api/v1/dashboard/client/documents` → ClientDocuments
- `GET /api/v1/support/tickets` → ClientSupport

---

## SHARED COMPONENTS

| Component | API Integration | Notes |
|---|---|---|
| Navbar | None | Static navigation |
| Footer | None | Static footer |
| StickyMobileBar | None | Static WhatsApp link |
| NotificationCenter | useCRMStore (mock) | Should call `GET /api/v1/notifications` |
| SEO | None | Static meta generation |
| ScrollToTop | None | UI utility |

---

## SUMMARY

| Category | Total Pages/Screens | Fully Wired | Partially Wired | Not Wired |
|---|---|---|---|---|
| Public Site | 9 | 1 (Contact) | 1 (Checkout — broken) | 7 |
| CRM Admin | 7 | 0 | 0 | 7 |
| CRM Employee | 4 | 0 | 0 | 4 |
| CRM Client | 7 | 0 | 0 | 7 |
| **TOTAL** | **27** | **1** | **1** | **25** |
