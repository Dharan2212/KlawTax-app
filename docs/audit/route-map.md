# KlawTax — Route Map
### Batch 1 Audit | May 2026

All backend routes with HTTP method, auth requirement, RBAC, frontend consumer, and wiring status.

---

## HEALTH

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/health` | None | None | Uptime monitors | ✅ |
| GET | `/api/v1/health/live` | None | None | Load balancer | ✅ |
| GET | `/api/v1/health/ready` | None | None | Orchestrator | ✅ |
| GET | `/api/v1/health/diagnostics` | JWT | Admin | Admin panel | ✅ |

---

## AUTH (`/api/v1/auth`)

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| POST | `/auth/login` | None | None | Login page (❌ missing) | ✅ Backend |
| POST | `/auth/refresh` | None | None | Token refresh utility | ✅ Backend |
| POST | `/auth/logout` | None | None | Logout button (❌ not wired) | ✅ Backend |
| POST | `/auth/logout-all` | JWT | Any | Security settings | ✅ Backend |
| POST | `/auth/password/request-reset` | None | None | Forgot password page (❌ missing) | ✅ Backend |
| POST | `/auth/password/reset` | None | None | Reset password page (❌ missing) | ✅ Backend |
| POST | `/auth/verify-email` | None | None | Email verification redirect | ✅ Backend |
| POST | `/auth/resend-verification` | None | None | Verification reminder | ✅ Backend |

---

## SERVICES / PUBLIC CATALOG (`/api/v1/services`)

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/services` | None | None | ServicesPage, PricingPage | ⚠️ Not called (static) |
| GET | `/services/featured` | None | None | HomePage hero card | ⚠️ Not called (static) |
| GET | `/services/:slug` | None | None | ServiceDetailPage | ⚠️ Not called (static) |

---

## LEADS / CONTACT

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/contact` | None | None | ContactPage | ✅ **WIRED** |
| GET | `/api/v1/leads` | JWT | Admin, Employee | CRM Lead Management | ❌ Not wired |
| GET | `/api/v1/leads/:id` | JWT | Admin, Employee | CRM Lead Detail | ❌ Not wired |
| POST | `/api/v1/leads` | JWT | Admin | CRM — manual lead create | ❌ Not wired |
| PATCH | `/api/v1/leads/:id` | JWT | Admin, Employee | CRM Lead update | ❌ Not wired |
| PATCH | `/api/v1/leads/:id/status` | JWT | Admin, Employee | CRM Lead pipeline | ❌ Not wired |
| PATCH | `/api/v1/leads/:id/assign` | JWT | Admin | CRM Lead assign | ❌ Not wired |
| POST | `/api/v1/leads/:id/notes` | JWT | Admin, Employee | CRM Lead notes | ❌ Not wired |
| DELETE | `/api/v1/leads/:id` | JWT | Admin | CRM Lead delete | ❌ Not wired |

---

## PAYMENTS / CHECKOUT

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/payments/create-order` | JWT ❌ | Any | CheckoutPage | ❌ **BROKEN** |
| POST | `/api/v1/payments/verify` | JWT ❌ | Any | CheckoutPage | ❌ **BROKEN** |
| GET | `/api/v1/payments` | JWT | Admin, Client | CRM Payments Panel | ❌ Not wired |
| GET | `/api/v1/payments/anomalies` | JWT | Admin | CRM Reports | ❌ Not wired |

**Critical issue:** v1.5 spec section 9.2.6 specifies that `POST /payments/create-order` and `POST /payments/verify` should be **public** (no auth) for the guest checkout flow. Current implementation requires JWT authentication. The guest checkout flow cannot function.

**Required fix:** A new public endpoint `POST /api/v1/payments/checkout` (or make `create-order` public) that accepts the full guest checkout payload (service + customer info) and orchestrates:
1. Client account creation (or lookup)
2. Invoice creation
3. Project creation
4. Razorpay order creation

---

## INVOICES

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/invoices` | JWT | Admin, Client (scoped) | CRM Payments, Client Portal | ❌ Not wired |
| POST | `/api/v1/invoices` | JWT | Admin | CRM Invoice create | ❌ Not wired |
| GET | `/api/v1/invoices/:id` | JWT | Admin, Client (scoped) | Invoice detail | ❌ Not wired |
| PATCH | `/api/v1/invoices/:id` | JWT | Admin | Invoice update | ❌ Not wired |
| POST | `/api/v1/invoices/:id/record-payment` | JWT | Admin | Manual payment record | ❌ Not wired |

---

## PROJECTS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/projects` | JWT | Admin, Employee | CRM Project list | ❌ Not wired |
| POST | `/api/v1/projects` | JWT | Admin | Project create | ❌ Not wired |
| GET | `/api/v1/projects/:id` | JWT | Admin, Employee | CRM Project detail | ❌ Not wired |
| GET | `/api/v1/projects/:id/summary` | JWT | All roles | Project detail, portal | ❌ Not wired |
| PATCH | `/api/v1/projects/:id` | JWT | Admin | Project update | ❌ Not wired |
| PATCH | `/api/v1/projects/:id/status` | JWT | Admin, Employee | CRM status change | ❌ Not wired |
| PATCH | `/api/v1/projects/:id/assign` | JWT | Admin | CRM assignment | ❌ Not wired |
| POST | `/api/v1/projects/:id/submit-for-review` | JWT | Employee | Employee workspace | ❌ Not wired |
| DELETE | `/api/v1/projects/:id` | JWT | Admin | CRM project delete | ❌ Not wired |

---

## TASKS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/tasks` | JWT | Admin, Employee | CRM task list | ❌ Not wired |
| POST | `/api/v1/tasks` | JWT | Admin, Employee | Task create | ❌ Not wired |
| GET | `/api/v1/tasks/:id` | JWT | Admin, Employee | Task detail | ❌ Not wired |
| PATCH | `/api/v1/tasks/:id` | JWT | Admin, Employee | Task update | ❌ Not wired |
| PATCH | `/api/v1/tasks/:id/complete` | JWT | Admin, Employee | Task complete | ❌ Not wired |
| DELETE | `/api/v1/tasks/:id` | JWT | Admin | Task delete | ❌ Not wired |

---

## DOCUMENTS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/documents` | JWT | All roles | Client portal, CRM | ❌ Not wired |
| POST | `/api/v1/documents` | JWT | All roles | Submit Documents page | ❌ Not wired |
| GET | `/api/v1/documents/:id` | JWT | All roles (scoped) | Document view | ❌ Not wired |
| GET | `/api/v1/documents/:id/download` | JWT | All roles (scoped) | Download button | ❌ Not wired |
| PATCH | `/api/v1/documents/:id/approve` | JWT | Admin | Approval flow | ❌ Not wired |
| PATCH | `/api/v1/documents/:id/reject` | JWT | Admin | Approval flow | ❌ Not wired |

**Note:** Actual file upload requires `multer` middleware, which is not in `package.json`. File upload to S3 requires `@aws-sdk/client-s3`, also missing from `package.json`.

---

## APPROVALS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/approvals` | JWT | Admin, Employee | Approval Queue | ❌ Not wired |
| GET | `/api/v1/approvals/:id` | JWT | Admin, Employee | Approval detail | ❌ Not wired |
| PATCH | `/api/v1/approvals/:id/approve` | JWT | Admin | Approval action | ❌ Not wired |
| PATCH | `/api/v1/approvals/:id/reject` | JWT | Admin | Approval action | ❌ Not wired |
| PATCH | `/api/v1/approvals/:id/request-revision` | JWT | Admin | Revision request | ❌ Not wired |

---

## NOTIFICATIONS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/notifications/unread-count` | JWT | Any | Navbar bell icon | ❌ Not wired |
| GET | `/api/v1/notifications` | JWT | Any | Notification center | ❌ Not wired |
| PATCH | `/api/v1/notifications/:id/read` | JWT | Any | Mark read | ❌ Not wired |
| PATCH | `/api/v1/notifications/read-all` | JWT | Any | Mark all read | ❌ Not wired |
| DELETE | `/api/v1/notifications/:id` | JWT | Any | Dismiss | ❌ Not wired |
| DELETE | `/api/v1/notifications` | JWT | Any | Bulk dismiss | ❌ Not wired |

---

## SUPPORT TICKETS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/support/tickets` | JWT | All roles (scoped) | Support panel | ❌ Not wired |
| POST | `/api/v1/support/tickets` | JWT | Any | Client support | ❌ Not wired |
| GET | `/api/v1/support/tickets/:id` | JWT | All (scoped) | Ticket thread | ❌ Not wired |
| PATCH | `/api/v1/support/tickets/:id` | JWT | Admin, Employee | Ticket update | ❌ Not wired |
| POST | `/api/v1/support/tickets/:id/messages` | JWT | All (scoped) | Reply | ❌ Not wired |

---

## EXPORTS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| POST | `/api/v1/exports` | JWT | Admin, Client | Reports panel | ❌ Not wired |
| GET | `/api/v1/exports` | JWT | Admin, Client (scoped) | Export center | ❌ Not wired |
| GET | `/api/v1/exports/:jobId/download` | JWT | Admin, Client (scoped) | Download link | ❌ Not wired |

---

## WEBHOOKS

| Method | Path | Auth | Notes | Status |
|---|---|---|---|---|
| POST | `/api/v1/webhooks/razorpay` | HMAC | Razorpay inbound | ✅ |
| GET | `/api/v1/webhooks` | JWT Admin | History browser | ✅ (at /webhooks not /admin/webhooks — minor spec deviation) |
| GET | `/api/v1/webhooks/:eventId` | JWT Admin | Single event | ✅ |
| POST | `/api/v1/webhooks/:eventId/retry` | JWT Admin | Manual retry | ✅ |

**Spec deviation:** v1.5 Part 8.3 says `GET /api/v1/admin/webhooks`. Implementation mounts at `GET /api/v1/webhooks`. Routes are functionally equivalent and both admin-protected; deviation is cosmetic. Recommend aligning to spec in next batch.

---

## TIMELINE

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/timeline` | JWT | All roles | Project timeline | ❌ Not wired |
| POST | `/api/v1/timeline` | JWT | Admin, Employee | Timeline entry | ❌ Not wired |
| GET | `/api/v1/timeline/:projectId` | JWT | All roles | Project timeline | ❌ Not wired |

---

## DASHBOARDS

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/dashboard/admin` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/revenue` | JWT | Admin | AdminDashboard revenue | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/overdue-projects` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/approvals` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/leads` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/workload` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/admin/activity` | JWT | Admin | AdminDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/employee` | JWT | Employee, Admin | EmployeeDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/employee/tasks` | JWT | Employee, Admin | TaskPanel | ❌ Not wired |
| GET | `/api/v1/dashboard/client` | JWT | Client, Admin | DashboardPage, ClientDashboard | ❌ Not wired |
| GET | `/api/v1/dashboard/client/projects` | JWT | Client, Admin | ClientProjects | ❌ Not wired |
| GET | `/api/v1/dashboard/client/projects/:id` | JWT | Client, Admin | ClientProjectView | ❌ Not wired |
| GET | `/api/v1/dashboard/client/payments` | JWT | Client, Admin | ClientPayments | ❌ Not wired |
| GET | `/api/v1/dashboard/client/timeline` | JWT | Client, Admin | Timeline feed | ❌ Not wired |
| GET | `/api/v1/dashboard/client/documents` | JWT | Client, Admin | ClientDocuments | ❌ Not wired |
| GET | `/api/v1/dashboard/client/support` | JWT | Client, Admin | ClientSupport | ❌ Not wired |

---

## USERS / ADMIN

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/users` | JWT | Admin | Employee list | ❌ Not wired |
| POST | `/api/v1/users/employees` | JWT | Admin | Employee create | ❌ Not wired |
| GET | `/api/v1/users/:id` | JWT | Admin | User detail | ❌ Not wired |
| PATCH | `/api/v1/users/:id` | JWT | Admin | User update | ❌ Not wired |
| PATCH | `/api/v1/users/:id/deactivate` | JWT | Admin | Employee deactivate | ❌ Not wired |
| DELETE | `/api/v1/admin/users/:userId/sessions/:sessionId` | JWT | Admin | Session management (v1.5 spec) | ❌ Missing route |

---

## ADMIN OPERATIONAL

| Method | Path | Auth | RBAC | Frontend Consumer | Status |
|---|---|---|---|---|---|
| GET | `/api/v1/admin/settings` | JWT | Admin | System settings | ❌ Not wired |
| GET | `/api/v1/admin/settings/:key` | JWT | Admin | Settings detail | ❌ Not wired |
| PATCH | `/api/v1/admin/settings/:key` | JWT | Admin | Settings update | ❌ Not wired |
| GET | `/api/v1/admin/jobs` | JWT | Admin | Job registry | ❌ Not wired |
| PATCH | `/api/v1/admin/jobs/:jobName/toggle` | JWT | Admin | Job enable/disable | ❌ Not wired |
| GET | `/api/v1/admin/jobs/failed` | JWT | Admin | Failed jobs | ❌ Not wired |
| PATCH | `/api/v1/admin/jobs/failed/:id/resolve` | JWT | Admin | Resolve failed job | ❌ Not wired |
| GET | `/api/v1/admin/audit-logs` | JWT | Admin | Audit log browser | ❌ Not wired |

---

## ROUTE SUMMARY

| Category | Total Routes | Backend Implemented | Frontend Wired |
|---|---|---|---|
| Health | 4 | 4 | 0 (infra-only) |
| Auth | 8 | 8 | 0 (no login page) |
| Services | 3 | 3 | 0 (static data used) |
| Contact/Leads | 9 | 9 | 1 |
| Payments | 4 | 4 | 2 (broken) |
| Invoices | 5 | 5 | 0 |
| Projects | 9 | 9 | 0 |
| Tasks | 6 | 6 | 0 |
| Documents | 6 | 6 | 0 |
| Approvals | 5 | 5 | 0 |
| Notifications | 6 | 6 | 0 |
| Support | 5 | 5 | 0 |
| Exports | 3 | 3 | 0 |
| Webhooks | 4 | 4 | 0 (infra-only) |
| Timeline | 3 | 3 | 0 |
| Dashboards | 15 | 15 | 0 |
| Users/Admin | 6 | 5 | 0 |
| Admin Ops | 8 | 8 | 0 |
| **TOTAL** | **109** | **108** | **3 (1 working, 2 broken)** |
