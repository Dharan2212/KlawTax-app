/**
 * useCRMStore — Batch 3 (UI state only)
 *
 * This store is now ONLY responsible for UI / local state:
 *  - currentRole  (synced from auth on mount via syncAuthToCRMStore)
 *  - currentUserId (synced from auth)
 *  - sidebar open state
 *  - selected/active IDs for navigation
 *
 * ALL operational/business data (projects, clients, tasks, invoices,
 * notifications, approvals) is fetched directly from the backend API
 * in the components that need it. The store is NOT the source of truth
 * for any business data.
 */

import { create } from "zustand";

// ── Role type (kept for backward compat with sidebar/nav) ──

export type CRMRole = "admin" | "employee" | "client";

// ── Role permissions helper (pure, no state) ──────────────

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

// ── UI State interface ─────────────────────────────────────

export interface CRMUIState {
  // Auth-synced identity
  currentRole:   CRMRole;
  currentUserId: string | null;

  // UI / navigation state
  sidebarOpen:       boolean;
  selectedProjectId: string | null;
  selectedClientId:  string | null;

  // Actions
  setRole:            (role: CRMRole, userId?: string | null) => void;
  setSidebarOpen:     (open: boolean) => void;
  setSelectedProject: (id: string | null) => void;
  setSelectedClient:  (id: string | null) => void;
}

// ── Store ──────────────────────────────────────────────────

export const useCRMStore = create<CRMUIState>((set) => ({
  currentRole:       "admin",
  currentUserId:     null,
  sidebarOpen:       false,
  selectedProjectId: null,
  selectedClientId:  null,

  setRole: (role, userId = null) =>
    set({ currentRole: role, currentUserId: userId }),

  setSidebarOpen:     (open) => set({ sidebarOpen: open }),
  setSelectedProject: (id)   => set({ selectedProjectId: id }),
  setSelectedClient:  (id)   => set({ selectedClientId: id }),
}));
