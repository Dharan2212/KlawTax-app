/**
 * CRM Workflow Utilities
 * Pure helper functions for role-scoped data access, status labels,
 * and export-safe data structures.
 *
 * ⚠️ Frontend-only. No API calls or auth logic.
 */

import type {
  CRMRole,
  CRMProject,
  CRMClient,
  CRMClientSubmission,
  CRMTask,
  CRMPayment,
  ProjectStatus,
  SubmissionStatus,
  PaymentStatus,
  TaskStatus,
  RejectedLog,
  CRMUpdate,
  CRMUser,
} from "@/store/useCRMStore";

// ============================================================
// STATUS LABEL MAPS
// ============================================================

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  pending:        "Pending",
  active:         "In Progress",
  "waiting-client": "Waiting for Client",
  review:         "Under Review",
  completed:      "Completed",
  rejected:       "Rejected",
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  pending:          { bg: "bg-neutral-100", text: "text-neutral-600" },
  active:           { bg: "bg-blue-50",    text: "text-blue-700" },
  "waiting-client": { bg: "bg-amber-50",   text: "text-amber-700" },
  review:           { bg: "bg-purple-50",  text: "text-purple-700" },
  completed:        { bg: "bg-green-50",   text: "text-green-700" },
  rejected:         { bg: "bg-red-50",     text: "text-red-600" },
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending:  "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  partial: "Partial",
  paid:    "Paid",
  overdue: "Overdue",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-neutral-100", text: "text-neutral-600" },
  partial: { bg: "bg-amber-50",    text: "text-amber-700" },
  paid:    { bg: "bg-green-50",    text: "text-green-700" },
  overdue: { bg: "bg-red-50",      text: "text-red-600" },
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo:   "To Do",
  active: "In Progress",
  done:   "Done",
};

// ============================================================
// ROLE-SCOPED DATA ACCESS
// ============================================================

/**
 * Returns only projects visible to the given role + user.
 * - admin: all projects
 * - employee: only assigned projects
 * - client: only projects matching clientId
 */
export function getProjectsForRole(
  projects: CRMProject[],
  role: CRMRole,
  currentUserId: string | null,
  users: CRMUser[]
): CRMProject[] {
  if (role === "admin") return projects;
  if (role === "employee") {
    return projects.filter((p) => p.assignedTo === currentUserId);
  }
  if (role === "client") {
    const user = users.find((u) => u.id === currentUserId);
    if (!user?.clientId) return [];
    return projects.filter((p) => p.clientId === user.clientId);
  }
  return [];
}

/**
 * Returns submissions visible to the given role.
 * - admin: all
 * - employee: approved submissions for assigned projects only
 * - client: own submissions (approved + pending)
 */
export function getSubmissionsForRole(
  submissions: CRMClientSubmission[],
  role: CRMRole,
  currentUserId: string | null,
  users: CRMUser[],
  assignedProjectIds: string[]
): CRMClientSubmission[] {
  if (role === "admin") return submissions;
  if (role === "employee") {
    return submissions.filter(
      (s) => assignedProjectIds.includes(s.projectId) && s.status === "approved"
    );
  }
  if (role === "client") {
    const user = users.find((u) => u.id === currentUserId);
    if (!user?.clientId) return [];
    return submissions.filter(
      (s) => s.clientId === user.clientId && s.status !== "rejected"
    );
  }
  return [];
}

/**
 * Returns updates visible to the given role.
 * - admin: all
 * - employee: all updates for assigned projects
 * - client: only visibleToClient updates for own projects
 */
export function getUpdatesForRole(
  updates: CRMUpdate[],
  role: CRMRole,
  projectIds: string[]
): CRMUpdate[] {
  const projectUpdates = updates.filter((u) => projectIds.includes(u.projectId));
  if (role === "admin") return updates;
  if (role === "employee") return projectUpdates;
  if (role === "client") return projectUpdates.filter((u) => u.visibleToClient);
  return [];
}

// ============================================================
// AGGREGATE HELPERS
// ============================================================

/** Total revenue collected vs expected */
export function getPaymentSummary(payments: CRMPayment[]) {
  const expected = payments.reduce((sum, p) => sum + p.amount, 0);
  const collected = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const outstanding = expected - collected;
  const overdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
  return { expected, collected, outstanding, overdue };
}

/** Count tasks by status for a project */
export function getTaskSummary(tasks: CRMTask[], projectId: string) {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  return {
    total: projectTasks.length,
    done: projectTasks.filter((t) => t.status === "done").length,
    active: projectTasks.filter((t) => t.status === "active").length,
    todo: projectTasks.filter((t) => t.status === "todo").length,
  };
}

/** Check if a project is overdue */
export function isProjectOverdue(project: CRMProject): boolean {
  return (
    project.status !== "completed" &&
    project.status !== "rejected" &&
    new Date(project.deadline) < new Date()
  );
}

/** Get projects that are overdue */
export function getOverdueProjects(projects: CRMProject[]): CRMProject[] {
  return projects.filter(isProjectOverdue);
}

// ============================================================
// PERMISSION HELPERS
// ============================================================

export function canApprove(role: CRMRole): boolean {
  return role === "admin";
}

export function canAssignEmployee(role: CRMRole): boolean {
  return role === "admin";
}

export function canManagePayments(role: CRMRole): boolean {
  return role === "admin";
}

export function canViewRejectedLog(role: CRMRole): boolean {
  return role === "admin";
}

export function canExport(role: CRMRole): boolean {
  return role === "admin";
}

// ============================================================
// EXPORT-SAFE DATA BUILDER
// ============================================================

/**
 * Produces a flat, export-ready snapshot of CRM data.
 * Can be serialized to JSON for future backend sync.
 */
export function buildExportSnapshot(data: {
  clients: CRMClient[];
  projects: CRMProject[];
  payments: CRMPayment[];
  submissions: CRMClientSubmission[];
  rejectedLog: RejectedLog[];
}) {
  const paymentSummary = getPaymentSummary(data.payments);
  return {
    exportedAt: new Date().toISOString(),
    summary: {
      totalClients: data.clients.length,
      totalProjects: data.projects.length,
      activeProjects: data.projects.filter((p) => p.status === "active").length,
      completedProjects: data.projects.filter((p) => p.status === "completed").length,
      totalRevenue: paymentSummary.expected,
      collectedRevenue: paymentSummary.collected,
      outstandingRevenue: paymentSummary.outstanding,
      overdueRevenue: paymentSummary.overdue,
      pendingSubmissions: data.submissions.filter((s) => s.status === "pending").length,
      totalRejections: data.rejectedLog.length,
    },
    clients: data.clients,
    projects: data.projects,
    payments: data.payments,
    submissions: data.submissions,
    rejectedLog: data.rejectedLog,
  };
}
