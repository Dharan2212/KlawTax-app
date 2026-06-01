/**
 * crmUtils.ts — Batch 5.4 (Dashboard Integration Cleanup)
 *
 * Single source of truth for all CRM display configs.
 *
 * Previously, every CRM component defined its own local copies of:
 *   - fmtDate / fmtCurrency / ageLabel
 *   - STATUS_CFG / TASK_STATUS_CFG / INVOICE_STATUS_CFG etc.
 *
 * Centralising these here removes duplication, ensures consistency,
 * and makes status label / colour updates a single-file change.
 *
 * Components that still define local copies for isolated reasons
 * (e.g., different colour palettes) are left untouched intentionally.
 */

// ─── Re-exports from crmWorkflow (keeps existing import paths working) ────────

export {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  APPROVAL_STATUS_LABELS,
  fmtCurrency,
  fmtDateShort,
  fmtDateFull,
  daysFromNow,
  ageLabel,
} from "@/lib/crmWorkflow";

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Format a date string as "1 Jan 2025" */
export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a date string as "1 Jan" (no year) */
export function fmtDateNoYear(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Format paise (integer) as ₹ string with auto K/L/Cr suffix.
 * Use for admin-facing monetary values stored as paise.
 */
export function fmtPaise(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 10_000_000) return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

/** Format paise as exact ₹ value (no abbreviation). */
export function fmtPaiseExact(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

// ─── Shared status config type ────────────────────────────────────────────────

export interface StatusChip {
  label: string;
  bg: string;
  color: string;
}

// ─── Project status configs ───────────────────────────────────────────────────

/**
 * Full project status config with client-friendly labels.
 * Used by client portal components (ClientDashboard, ClientProjects, etc.).
 */
export const CLIENT_PROJECT_STATUS_CFG: Record<string, StatusChip> = {
  draft:          { label: "Getting Started",  bg: "rgba(100,116,139,0.10)", color: "#475569" },
  onboarding:     { label: "Onboarding",       bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  active:         { label: "In Progress",      bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress:    { label: "In Progress",      bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_client: { label: "Action Required",  bg: "rgba(245,158,11,0.12)", color: "#B45309" },
  in_review:      { label: "Under Review",     bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  completed:      { label: "Completed",        bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  delivered:      { label: "Delivered",        bg: "rgba(22,163,74,0.15)",  color: "#14532D" },
  cancelled:      { label: "Cancelled",        bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

/**
 * Project status config with internal labels.
 * Used by admin / employee CRM components.
 */
export const INTERNAL_PROJECT_STATUS_CFG: Record<string, StatusChip> = {
  draft:               { label: "Draft",         bg: "#F1F5F9",              color: "#64748B" },
  onboarding:          { label: "Onboarding",    bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  active:              { label: "In Progress",   bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress:         { label: "In Progress",   bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_client:      { label: "Waiting Client", bg: "rgba(217,119,6,0.10)", color: "#B45309" },
  in_review:           { label: "In Review",     bg: "rgba(20,184,166,0.10)", color: "#0F766E" },
  completed:           { label: "Completed",     bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  cancelled:           { label: "Cancelled",     bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  revisions_requested: { label: "Revisions",     bg: "rgba(245,158,11,0.10)", color: "#D97706" },
};

// ─── Task status configs ──────────────────────────────────────────────────────

export const TASK_STATUS_CFG: Record<string, StatusChip> = {
  todo:           { label: "To Do",       bg: "#F1F5F9",               color: "#64748B" },
  queued:         { label: "Queued",      bg: "rgba(37,99,235,0.08)",  color: "#2563EB" },
  in_progress:    { label: "In Progress", bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_review: { label: "In Review",  bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
  waiting_client: { label: "Waiting",    bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  blocked:        { label: "Blocked",     bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  completed:      { label: "Done",        bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
};

// ─── Approval status configs ──────────────────────────────────────────────────

export const APPROVAL_STATUS_CFG: Record<string, StatusChip> = {
  pending:            { label: "Pending",          bg: "#FEF3C7", color: "#92400E" },
  under_review:       { label: "Under Review",     bg: "#EFF6FF", color: "#1E3A8A" },
  revision_requested: { label: "Revisions Needed", bg: "#FEE2E2", color: "#B91C1C" },
  approved:           { label: "Approved",         bg: "#DCFCE7", color: "#15803D" },
  rejected:           { label: "Rejected",         bg: "#FEE2E2", color: "#DC2626" },
};

// ─── Invoice status configs ───────────────────────────────────────────────────

export const INVOICE_STATUS_CFG: Record<string, StatusChip> = {
  draft:          { label: "Draft",     bg: "rgba(100,116,139,0.10)", color: "#475569" },
  issued:         { label: "Issued",    bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  partially_paid: { label: "Partial",  bg: "rgba(217,119,6,0.10)",    color: "#B45309" },
  partial:        { label: "Partial",   bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  paid:           { label: "Paid",      bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  overdue:        { label: "Overdue",   bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  overpaid:       { label: "Overpaid",  bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  disputed:       { label: "Disputed",  bg: "rgba(245,158,11,0.10)",  color: "#B45309" },
  cancelled:      { label: "Cancelled", bg: "rgba(100,116,139,0.10)", color: "#475569" },
};

// ─── Payment status configs ───────────────────────────────────────────────────

export interface PaymentStatusConfig {
  label: string;
  color: string;
}

export const PAYMENT_STATUS_CFG: Record<string, PaymentStatusConfig> = {
  captured:   { label: "Confirmed", color: "#15803D" },
  pending:    { label: "Pending",   color: "#B45309" },
  failed:     { label: "Failed",    color: "#DC2626" },
  refunded:   { label: "Refunded",  color: "#6D28D9" },
};

// ─── Support ticket status configs ────────────────────────────────────────────

export const SUPPORT_STATUS_CFG: Record<string, StatusChip> = {
  open:        { label: "Open",        bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress: { label: "In Progress", bg: "rgba(20,184,166,0.10)", color: "#0F766E" },
  resolved:    { label: "Resolved",    bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  closed:      { label: "Closed",      bg: "rgba(100,116,139,0.10)", color: "#475569" },
  escalated:   { label: "Escalated",   bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

// ─── Priority configs ─────────────────────────────────────────────────────────

export interface PriorityConfig {
  label: string;
  color: string;
}

export const PRIORITY_CFG: Record<string, PriorityConfig> = {
  critical: { label: "Critical", color: "#9F1239" },
  high:     { label: "High",     color: "#DC2626" },
  medium:   { label: "Medium",   color: "#B45309" },
  low:      { label: "Low",      color: "#64748B" },
};

export const PRIORITY_CHIP_CFG: Record<string, StatusChip> = {
  urgent: { label: "Urgent", bg: "rgba(220,38,38,0.10)", color: "#DC2626" },
  high:   { label: "High",   bg: "rgba(217,119,6,0.10)", color: "#B45309" },
  medium: { label: "Medium", bg: "rgba(37,99,235,0.10)", color: "#1E3A8A" },
  low:    { label: "Low",    bg: "rgba(100,116,139,0.10)", color: "#64748B" },
};

// ─── Document status configs ──────────────────────────────────────────────────

export const DOCUMENT_STATUS_CFG: Record<string, StatusChip> = {
  uploaded:        { label: "Uploaded",    bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  under_review:    { label: "Reviewing",   bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  approved:        { label: "Approved",    bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  rejected:        { label: "Rejected",    bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
  resubmit_needed: { label: "Resubmit",   bg: "rgba(245,158,11,0.10)",  color: "#B45309" },
};

// ─── Shared lookup helper ─────────────────────────────────────────────────────

/**
 * Safe config lookup with a guaranteed fallback.
 * Returns the config for `key`, or the fallback if key is unknown.
 */
export function getStatusChip(
  cfg: Record<string, StatusChip>,
  key: string,
  fallback: StatusChip = { label: key, bg: "rgba(100,116,139,0.10)", color: "#475569" },
): StatusChip {
  return cfg[key] ?? fallback;
}
