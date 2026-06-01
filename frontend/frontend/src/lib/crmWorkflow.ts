/**
 * crmWorkflow.ts — Batch 3 (cleaned)
 *
 * Status label maps and pure display helpers.
 * All operational types now come from crmApi.ts (ApiProject, ApiInvoice, etc.)
 * No dependency on the old useCRMStore business types.
 */

// Re-export canonical status helpers from crmApi so callers have one import
export { PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS, LEAD_STATUS_LABELS } from "@/lib/crmApi";

// ── Invoice / Payment status display ──────────────────────────

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft:     "Draft",
  issued:    "Issued",
  partial:   "Partial",
  paid:      "Paid",
  overdue:   "Overdue",
  disputed:  "Disputed",
  cancelled: "Cancelled",
  overpaid:  "Overpaid",
};

export const INVOICE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  issued:    { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  partial:   { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  paid:      { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  overdue:   { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  disputed:  { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  cancelled: { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  overpaid:  { bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
};

// ── Support ticket status display ─────────────────────────────

export const TICKET_STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  closed:      "Closed",
  escalated:   "Escalated",
};

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  low:    "Low",
  medium: "Medium",
  high:   "High",
  urgent: "Urgent",
};

// ── Task status display ───────────────────────────────────────

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo:        "To Do",
  in_progress: "In Progress",
  blocked:     "Blocked",
  done:        "Done",
};

// ── Approval status display ───────────────────────────────────

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending:            "Pending Review",
  approved:           "Approved",
  rejected:           "Rejected",
  revision_requested: "Revision Requested",
};

// ── Lead status display ───────────────────────────────────────

export const LEAD_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  new:       { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  contacted: { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  qualified: { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  converted: { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  lost:      { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  archived:  { bg: "rgba(100,116,139,0.10)", color: "#475569" },
};

// ── Generic helpers ───────────────────────────────────────────

export function fmtCurrency(amount: number, currency = "INR"): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function fmtDateShort(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fmtDateFull(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function daysFromNow(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

export function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
