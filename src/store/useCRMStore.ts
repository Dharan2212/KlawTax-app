import { create } from "zustand";

// ============================================================
// CRM ROLES
// ============================================================

export type CRMRole = "admin" | "employee" | "client";

// ============================================================
// STANDARDIZED STATUS ENUMS
// ============================================================

/** Project lifecycle states */
export type ProjectStatus =
  | "pending"          // Created, not yet assigned or started
  | "active"           // In active progress by employee
  | "waiting-client"   // Blocked — awaiting client documents / response
  | "review"           // Internal review before completion
  | "completed"        // Fully delivered
  | "rejected";        // Cancelled or rejected

/** Submission approval states */
export type SubmissionStatus = "pending" | "approved" | "rejected";

/** Payment states */
export type PaymentStatus = "pending" | "partial" | "paid" | "overdue";

/** Client account states */
export type ClientStatus = "active" | "pending" | "completed";

/** Task states */
export type TaskStatus = "todo" | "active" | "done";

// ============================================================
// CORE ENTITY INTERFACES
// ============================================================

export interface CRMUser {
  id: string;
  name: string;
  role: CRMRole;
  email: string;
  phone?: string;
  /** Links a client-role user to a CRMClient record */
  clientId?: string;
}

export interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  service: string;
  status: ClientStatus;
  createdAt: string;
}

export interface CRMProject {
  id: string;
  title: string;
  serviceType: string;
  clientId: string;
  /** Single assigned employee user ID — enforces one-employee-per-project rule */
  assignedTo: string | null;
  status: ProjectStatus;
  progress: number;         // 0-100
  deadline: string;         // ISO date YYYY-MM-DD
  startDate: string;
  totalAmount: number;
  notes?: string;
}

export interface CRMTask {
  id: string;
  projectId: string;
  title: string;
  assignedTo: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  dueDate?: string;
}

export interface CRMUpdate {
  id: string;
  projectId: string;
  from: string;             // Display name
  fromType: "admin" | "employee" | "client";
  message: string;
  date: string;
  /** Controls visibility in client-facing timeline */
  visibleToClient: boolean;
}

export interface CRMClientSubmission {
  id: string;
  clientId: string;
  projectId: string;
  title: string;
  description: string;
  fileHint?: string;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface CRMPayment {
  id: string;
  clientId: string;
  projectId: string;
  amount: number;
  paidAmount: number;       // Actual amount received
  type: "advance" | "balance" | "full";
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

export interface RejectedLog {
  id: string;
  submissionId: string;
  clientId: string;
  projectId: string;
  title: string;
  description: string;
  rejectedBy: string;
  rejectedByName: string;
  reason: string;
  date: string;
}

export interface CommunicationEntry {
  id: string;
  clientId: string;
  projectId?: string;
  from: string;
  fromType: "admin" | "employee";
  channel: "whatsapp" | "call" | "email" | "note";
  message: string;
  date: string;
}

// ============================================================
// ROLE PERMISSIONS (pure data — no auth, just structure)
// ============================================================

export const ROLE_PERMISSIONS = {
  admin: {
    canApproveSubmissions: true,
    canRejectSubmissions: true,
    canAssignProjects: true,
    canManagePayments: true,
    canViewAllClients: true,
    canViewAllProjects: true,
    canViewRejectedLog: true,
    canExportData: true,
  },
  employee: {
    canApproveSubmissions: false,
    canRejectSubmissions: false,
    canAssignProjects: false,
    canManagePayments: false,
    canViewAllClients: false,
    canViewAllProjects: false,
    canViewRejectedLog: false,
    canExportData: false,
  },
  client: {
    canApproveSubmissions: false,
    canRejectSubmissions: false,
    canAssignProjects: false,
    canManagePayments: false,
    canViewAllClients: false,
    canViewAllProjects: false,
    canViewRejectedLog: false,
    canExportData: false,
  },
} as const;

// ============================================================
// STORE STATE + ACTIONS
// ============================================================

export interface CRMState {
  // Session
  currentRole: CRMRole;
  currentUserId: string | null;

  // Data
  users: CRMUser[];
  clients: CRMClient[];
  projects: CRMProject[];
  tasks: CRMTask[];
  updates: CRMUpdate[];
  clientSubmissions: CRMClientSubmission[];
  payments: CRMPayment[];
  rejectedLog: RejectedLog[];
  communicationLog: CommunicationEntry[];

  // Actions
  setRole: (role: CRMRole, userId?: string) => void;
  approveSubmission: (submissionId: string, reviewerName?: string) => void;
  rejectSubmission: (submissionId: string, reason: string, reviewerName?: string) => void;
  assignEmployee: (projectId: string, employeeUserId: string) => void;
  updateProjectStatus: (projectId: string, status: ProjectStatus, progress?: number) => void;
  updateProjectProgress: (projectId: string, progress: number) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addUpdate: (update: Omit<CRMUpdate, "id">) => void;
  addCommunication: (entry: Omit<CommunicationEntry, "id">) => void;
  addClientSubmission: (submission: Omit<CRMClientSubmission, "id" | "status" | "submittedAt">) => void;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, paidAmount?: number) => void;

  // Role-scoped selectors
  getProjectsForCurrentRole: () => CRMProject[];
  getPendingSubmissions: () => CRMClientSubmission[];
  getClientForCurrentUser: () => CRMClient | null;
}

// ============================================================
// STORE
// ============================================================

export const useCRMStore = create<CRMState>((set, get) => ({
  currentRole: "admin",
  currentUserId: null,

  users: [],
  clients: [],
  projects: [],
  tasks: [],
  updates: [],
  clientSubmissions: [],
  payments: [],
  rejectedLog: [],
  communicationLog: [],

  setRole: (role, userId) => {
    const state = get();
    let id = userId ?? null;
    if (!id) {
      if (role === "admin") {
        id = state.users.find((u) => u.role === "admin")?.id ?? null;
      } else if (role === "employee") {
        id = state.users.find((u) => u.role === "employee")?.id ?? null;
      } else {
        id = state.users.find((u) => u.role === "client" && u.clientId)?.id ?? null;
      }
    }
    set({ currentRole: role, currentUserId: id });
  },

  approveSubmission: (submissionId, reviewerName = "Admin") => {
    const state = get();
    const sub = state.clientSubmissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== "pending") return;
    const now = new Date().toISOString().split("T")[0];
    set({
      clientSubmissions: state.clientSubmissions.map((s) =>
        s.id === submissionId
          ? { ...s, status: "approved" as SubmissionStatus, reviewedAt: now, reviewedBy: reviewerName }
          : s
      ),
      updates: [
        ...state.updates,
        {
          id: `upd-${Date.now()}`,
          projectId: sub.projectId,
          from: reviewerName,
          fromType: "admin" as const,
          message: `Document approved: "${sub.title}". ${sub.description}`,
          date: now,
          visibleToClient: true,
        },
      ],
    });
  },

  rejectSubmission: (submissionId, reason, reviewerName = "Admin") => {
    const state = get();
    const sub = state.clientSubmissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== "pending") return;
    const now = new Date().toISOString().split("T")[0];
    set({
      clientSubmissions: state.clientSubmissions.map((s) =>
        s.id === submissionId
          ? { ...s, status: "rejected" as SubmissionStatus, reviewedAt: now, reviewedBy: reviewerName }
          : s
      ),
      rejectedLog: [
        ...state.rejectedLog,
        {
          id: `rej-${Date.now()}`,
          submissionId,
          clientId: sub.clientId,
          projectId: sub.projectId,
          title: sub.title,
          description: sub.description,
          rejectedBy: state.currentUserId ?? "unknown",
          rejectedByName: reviewerName,
          reason: reason || "No reason provided",
          date: now,
        },
      ],
    });
  },

  assignEmployee: (projectId, employeeUserId) => {
    const state = get();
    const employee = state.users.find(
      (u) => u.id === employeeUserId && u.role === "employee"
    );
    if (!employee) return;
    set({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, assignedTo: employeeUserId } : p
      ),
    });
  },

  updateProjectStatus: (projectId, status, progress) => {
    set({
      projects: get().projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              status,
              ...(progress !== undefined ? { progress } : {}),
              ...(status === "completed" ? { progress: 100 } : {}),
            }
          : p
      ),
    });
  },

  updateProjectProgress: (projectId, progress) => {
    set({
      projects: get().projects.map((p) =>
        p.id === projectId
          ? { ...p, progress: Math.min(100, Math.max(0, progress)) }
          : p
      ),
    });
  },

  updateTaskStatus: (taskId, status) => {
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    });
  },

  addUpdate: (update) => {
    set({
      updates: [
        ...get().updates,
        {
          ...update,
          id: `upd-${Date.now()}`,
          visibleToClient: update.visibleToClient !== false,
        },
      ],
    });
  },

  addCommunication: (entry) => {
    set({
      communicationLog: [
        ...get().communicationLog,
        { ...entry, id: `comm-${Date.now()}` },
      ],
    });
  },

  addClientSubmission: (submission) => {
    set({
      clientSubmissions: [
        ...get().clientSubmissions,
        {
          ...submission,
          id: `cs-${Date.now()}`,
          status: "pending" as SubmissionStatus,
          submittedAt: new Date().toISOString().split("T")[0],
        },
      ],
    });
  },

  updatePaymentStatus: (paymentId, status, paidAmount) => {
    set({
      payments: get().payments.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status,
              ...(paidAmount !== undefined ? { paidAmount } : {}),
              ...(status === "paid"
                ? { paidDate: new Date().toISOString().split("T")[0] }
                : {}),
            }
          : p
      ),
    });
  },

  getProjectsForCurrentRole: () => {
    const state = get();
    const { currentRole, currentUserId, projects, users } = state;
    if (currentRole === "admin") return projects;
    if (currentRole === "employee") {
      return projects.filter((p) => p.assignedTo === currentUserId);
    }
    if (currentRole === "client") {
      const clientUser = users.find((u) => u.id === currentUserId);
      const clientId = clientUser?.clientId;
      if (!clientId) return [];
      return projects.filter((p) => p.clientId === clientId);
    }
    return [];
  },

  getPendingSubmissions: () => {
    return get().clientSubmissions.filter((s) => s.status === "pending");
  },

  getClientForCurrentUser: () => {
    const state = get();
    const user = state.users.find((u) => u.id === state.currentUserId);
    if (!user?.clientId) return null;
    return state.clients.find((c) => c.id === user.clientId) ?? null;
  },
}));
