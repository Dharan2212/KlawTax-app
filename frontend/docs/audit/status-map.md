# KlawTax — Status Map
### Batch 1 Audit | May 2026

---

## 1. PROJECT STATUS

### Backend (Canonical — `backend/src/models/projectEnums.ts`)
```typescript
enum ProjectStatus {
  Draft         = 'draft',
  Onboarding    = 'onboarding',
  Active        = 'active',
  WaitingClient = 'waiting_client',
  InReview      = 'in_review',
  Completed     = 'completed',
  Delivered     = 'delivered',
  Archived      = 'archived',
  Cancelled     = 'cancelled',
}
```

### Frontend CRM (`frontend/src/store/useCRMStore.ts`)
```typescript
type ProjectStatus =
  | "pending"       // ← maps to Draft (approximate)
  | "active"        // ← maps to Active
  | "waiting-client"// ← maps to WaitingClient (hyphen vs underscore)
  | "review"        // ← maps to InReview (shortened)
  | "completed"     // ← matches Completed
  | "rejected";     // ← no equivalent (closest: Cancelled)
```

### Frontend Dashboard (`frontend/src/pages/DashboardPage.tsx`)
```typescript
// UI display labels — not actual status values
"payment_confirmed" | "documents_received" | "processing" | "filed" | "completed"
```

### Mismatch Analysis

| Backend Value | Frontend CRM | Match? | Note |
|---|---|---|---|
| `draft` | (none) | ❌ | Not represented in CRM UI |
| `onboarding` | (none) | ❌ | Not represented |
| `active` | `active` | ✅ | Matches |
| `waiting_client` | `waiting-client` | ⚠️ | Hyphen vs underscore |
| `in_review` | `review` | ⚠️ | Abbreviated |
| `completed` | `completed` | ✅ | Matches |
| `delivered` | (none) | ❌ | Not represented |
| `archived` | (none) | ❌ | Not represented |
| `cancelled` | `rejected` | ⚠️ | Different semantics |

**Resolution required:** When CRM is wired to the backend API, the frontend `ProjectStatus` type must be updated to match backend values exactly, or a mapping layer must be added.

---

## 2. LEAD STATUS

### Backend (`backend/src/models/leadEnums.ts`)
```typescript
enum LeadStatus {
  New        = 'new',
  Contacted  = 'contacted',
  Qualified  = 'qualified',
  Converted  = 'converted',
  Lost       = 'lost',
  Archived   = 'archived',
}
```

### Frontend CRM
The CRM does not have a lead pipeline view yet. No frontend lead status values defined.

**Status:** Backend only. No conflict.

---

## 3. INVOICE STATUS

### Backend (`backend/src/models/invoiceEnums.ts`)
```typescript
enum InvoiceStatus {
  Draft    = 'draft',
  Sent     = 'sent',
  Partial  = 'partial',
  Paid     = 'paid',
  Overdue  = 'overdue',
  Disputed = 'disputed',
  Overpaid = 'overpaid',   // ← Added in v1.5 EC-Pay2
  Cancelled = 'cancelled',
}
```

### Frontend CRM
```typescript
type PaymentStatus = "pending" | "partial" | "paid" | "overdue";
```

**Mismatch:** Frontend is missing `draft`, `sent`, `disputed`, `overpaid`, `cancelled`. Frontend has `pending` which doesn't exist in backend. Resolution required when PaymentsPanel is wired.

---

## 4. PAYMENT STATUS

### Backend (`backend/src/models/invoiceEnums.ts`)
```typescript
enum PaymentStatus {
  Pending   = 'pending',
  Captured  = 'captured',
  Failed    = 'failed',
  Refunded  = 'refunded',
}
```

### Frontend
Not separately tracked — rolled into invoice status display. No conflict currently.

---

## 5. TASK STATUS

### Backend (`backend/src/models/taskEnums.ts`)
Expected values per v1.5: `open`, `in_progress`, `blocked`, `completed`, `cancelled`

### Frontend CRM (`frontend/src/store/useCRMStore.ts`)
```typescript
type TaskStatus = "todo" | "active" | "done";
```

**Mismatch:** Values differ significantly. Resolution required when TaskPanel is wired.

---

## 6. DOCUMENT STATUS

### Backend (`backend/src/models/documentEnums.ts`)
Per v1.5: `uploaded`, `under_review`, `approved`, `rejected`

### Frontend
No document status type in frontend CRM. ClientDocuments shows static data.
**Status:** No conflict currently. Will need mapping when wired.

---

## 7. APPROVAL STATUS

### Backend (`backend/src/models/approval.ts`)
Per v1.5: `pending`, `approved`, `rejected`, `revision_requested`

### Frontend CRM (`frontend/src/store/useCRMStore.ts`)
```typescript
type SubmissionStatus = "pending" | "approved" | "rejected";
```

**Mismatch:** `revision_requested` not in frontend type. Minor.

---

## 8. SUPPORT TICKET STATUS

### Backend (`backend/src/models/supportTicketEnums.ts`)
Per v1.5: `open`, `in_progress`, `resolved`, `closed`, `on_hold`

### Frontend
ClientSupport shows static data. No status type defined.
**Status:** No conflict. Will need mapping when wired.

---

## 9. CLIENT STATUS (Frontend-only concept)

### Frontend CRM
```typescript
type ClientStatus = "active" | "pending" | "completed";
```

**Note:** No direct backend equivalent. Backend tracks client accounts via `users.isActive` boolean + `clientProfiles`. The frontend `ClientStatus` is a UI-level aggregation. When CRM is wired, this will need to be derived from project/payment state.

---

## 10. WEBHOOK PROCESSING STATUS

### Backend (`backend/src/models/enums.ts`)
```typescript
enum WebhookProcessingStatus {
  Received        = 'received',
  Processing      = 'processing',
  Processed       = 'processed',
  Failed          = 'failed',
  FailedPermanent = 'failed_permanent',
  Skipped         = 'skipped',
}
```

**Frontend consumer:** None (admin-only infra). No conflict.

---

## STATUS SUMMARY

| Status System | Backend Defined | Frontend Defined | Match? | Priority |
|---|---|---|---|---|
| Project | ✅ 9 values | ✅ 6 values | ❌ Mismatch | High |
| Lead | ✅ 6 values | ❌ None | N/A | Medium |
| Invoice | ✅ 8 values | ⚠️ 4 values | ❌ Partial | High |
| Payment | ✅ 4 values | N/A | N/A | Low |
| Task | ✅ defined | ⚠️ 3 values | ❌ Mismatch | High |
| Document | ✅ defined | ❌ None | N/A | Medium |
| Approval | ✅ 4 values | ⚠️ 3 values | ⚠️ Near-match | Medium |
| Support Ticket | ✅ defined | ❌ None | N/A | Medium |
| Webhook | ✅ 6 values | N/A | N/A | Low |
