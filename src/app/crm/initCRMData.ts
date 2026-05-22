/**
 * initCRMData — Batch 3
 *
 * Syncs the authenticated user from AuthContext into useCRMStore.
 * No mock data is seeded in production. The store is used only for
 * lightweight UI state (selected items, local actions) while all
 * business data comes from live API calls.
 */

import { useCRMStore } from "@/store/useCRMStore";
import type { CRMRole } from "@/store/useCRMStore";

/**
 * Call this once when the CRM mounts to wire the real auth user into
 * useCRMStore so components that still read currentRole/currentUserId
 * from the store work correctly.
 */
export function syncAuthToCRMStore(userId: string, role: string) {
  const crmRole: CRMRole =
    role === "admin" ? "admin" : role === "employee" ? "employee" : "client";
  useCRMStore.setState({
    currentUserId: userId,
    currentRole: crmRole,
  });
}
