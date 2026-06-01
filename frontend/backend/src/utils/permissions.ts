/**
 * KlawTax — Centralized Permission Architecture
 *
 * Single source of truth for:
 *   - Role definitions
 *   - Permission constants
 *   - Role → permission mappings
 *   - Permission guard utilities
 *
 * DO NOT scatter permission logic across modules.
 * Import from this file everywhere authorization is needed.
 */

// ─── Roles ────────────────────────────────────────────────────────────────────

export enum Role {
  Admin    = 'admin',
  Employee = 'employee',
  Client   = 'client',
}

export type RoleType = `${Role}`;

// ─── Permission Namespace ─────────────────────────────────────────────────────

/**
 * Permissions follow the pattern: `resource.action`
 * Grouped by resource domain for maintainability.
 */

// Users & identity
export const Permission = {
  // ── Users ──────────────────────────────────────────────────────────────────
  USERS_READ:             'users.read',
  USERS_CREATE:           'users.create',
  USERS_UPDATE:           'users.update',
  USERS_DEACTIVATE:       'users.deactivate',
  USERS_MANAGE_SESSIONS:  'users.manage_sessions',

  // ── Own profile (any authenticated user) ───────────────────────────────────
  PROFILE_READ_OWN:       'profile.read_own',
  PROFILE_UPDATE_OWN:     'profile.update_own',

  // ── Leads ──────────────────────────────────────────────────────────────────
  LEADS_READ:             'leads.read',
  LEADS_CREATE:           'leads.create',
  LEADS_UPDATE:           'leads.update',
  LEADS_CONVERT:          'leads.convert',
  LEADS_DELETE:           'leads.delete',

  // ── Services catalog ───────────────────────────────────────────────────────
  SERVICES_READ:          'services.read',         // public + authenticated
  SERVICES_MANAGE:        'services.manage',       // admin only

  // ── Projects ───────────────────────────────────────────────────────────────
  PROJECTS_READ_ALL:      'projects.read_all',     // admin sees all
  PROJECTS_READ_ASSIGNED: 'projects.read_assigned',// employee sees assigned
  PROJECTS_READ_OWN:      'projects.read_own',     // client sees own
  PROJECTS_CREATE:        'projects.create',
  PROJECTS_UPDATE:        'projects.update',
  PROJECTS_STATUS_CHANGE: 'projects.status_change',
  PROJECTS_ASSIGN:        'projects.assign',
  PROJECTS_SUBMIT_REVIEW: 'projects.submit_review',

  // ── Tasks ──────────────────────────────────────────────────────────────────
  TASKS_READ:             'tasks.read',
  TASKS_CREATE:           'tasks.create',
  TASKS_UPDATE:           'tasks.update',
  TASKS_COMPLETE:         'tasks.complete',
  TASKS_MANAGE:           'tasks.manage',          // admin full control

  // ── Documents ──────────────────────────────────────────────────────────────
  DOCUMENTS_UPLOAD:       'documents.upload',
  DOCUMENTS_READ:         'documents.read',
  DOCUMENTS_APPROVE:      'documents.approve',
  DOCUMENTS_REJECT:       'documents.reject',
  DOCUMENTS_DELETE:       'documents.delete',

  // ── Approvals ──────────────────────────────────────────────────────────────
  APPROVALS_READ:         'approvals.read',
  APPROVALS_REVIEW:       'approvals.review',      // admin: approve/reject/revise

  // ── Invoices ───────────────────────────────────────────────────────────────
  INVOICES_READ_ALL:      'invoices.read_all',
  INVOICES_READ_OWN:      'invoices.read_own',
  INVOICES_CREATE:        'invoices.create',
  INVOICES_UPDATE:        'invoices.update',

  // ── Payments ───────────────────────────────────────────────────────────────
  PAYMENTS_INITIATE:      'payments.initiate',
  PAYMENTS_RECORD:        'payments.record',       // admin manual recording
  PAYMENTS_READ_ALL:      'payments.read_all',
  PAYMENTS_READ_OWN:      'payments.read_own',

  // ── Notifications ──────────────────────────────────────────────────────────
  NOTIFICATIONS_READ_OWN: 'notifications.read_own',
  NOTIFICATIONS_SEND:     'notifications.send',    // admin/system only

  // ── Support tickets ────────────────────────────────────────────────────────
  SUPPORT_READ_ALL:       'support.read_all',
  SUPPORT_READ_OWN:       'support.read_own',
  SUPPORT_CREATE:         'support.create',
  SUPPORT_RESPOND:        'support.respond',
  SUPPORT_MANAGE:         'support.manage',        // admin: status changes, assign

  // ── Exports ────────────────────────────────────────────────────────────────
  EXPORTS_GENERATE:       'exports.generate',
  EXPORTS_DOWNLOAD_OWN:   'exports.download_own',

  // ── System settings ────────────────────────────────────────────────────────
  SETTINGS_READ:          'settings.read',
  SETTINGS_UPDATE:        'settings.update',

  // ── Scheduled jobs ─────────────────────────────────────────────────────────
  JOBS_READ:              'jobs.read',
  JOBS_TOGGLE:            'jobs.toggle',

  // ── Webhooks ───────────────────────────────────────────────────────────────
  WEBHOOKS_READ:          'webhooks.read',
  WEBHOOKS_RETRY:         'webhooks.retry',

  // ── Dashboard ──────────────────────────────────────────────────────────────
  DASHBOARD_ADMIN:        'dashboard.admin',
  DASHBOARD_EMPLOYEE:     'dashboard.employee',
  DASHBOARD_CLIENT:       'dashboard.client',

  // ── Audit logs ─────────────────────────────────────────────────────────────
  AUDIT_READ:             'audit.read',
} as const;

export type PermissionKey = keyof typeof Permission;
export type PermissionValue = (typeof Permission)[PermissionKey];

// ─── Role → Permission Mappings ───────────────────────────────────────────────

/**
 * Canonical permission set for each role.
 *
 * Rules:
 *  - Admin has all permissions (wildcard via `ADMIN_PERMISSIONS`)
 *  - Employee has operational permissions scoped to assigned resources
 *  - Client has own-resource permissions only
 *
 * Additional per-user permissions can be stored on `User.additionalPermissions`
 * and merged at runtime for granular overrides.
 */

export const ADMIN_PERMISSIONS: PermissionValue[] = Object.values(Permission);

export const EMPLOYEE_PERMISSIONS: PermissionValue[] = [
  Permission.PROFILE_READ_OWN,
  Permission.PROFILE_UPDATE_OWN,

  Permission.SERVICES_READ,

  Permission.PROJECTS_READ_ASSIGNED,
  Permission.PROJECTS_UPDATE,
  Permission.PROJECTS_SUBMIT_REVIEW,

  Permission.TASKS_READ,
  Permission.TASKS_CREATE,
  Permission.TASKS_UPDATE,
  Permission.TASKS_COMPLETE,

  Permission.DOCUMENTS_UPLOAD,
  Permission.DOCUMENTS_READ,

  Permission.APPROVALS_READ,

  Permission.NOTIFICATIONS_READ_OWN,

  Permission.SUPPORT_READ_ALL,
  Permission.SUPPORT_RESPOND,

  Permission.EXPORTS_GENERATE,
  Permission.EXPORTS_DOWNLOAD_OWN,

  Permission.DASHBOARD_EMPLOYEE,
];

export const CLIENT_PERMISSIONS: PermissionValue[] = [
  Permission.PROFILE_READ_OWN,
  Permission.PROFILE_UPDATE_OWN,

  Permission.SERVICES_READ,

  Permission.PROJECTS_READ_OWN,

  Permission.DOCUMENTS_UPLOAD,
  Permission.DOCUMENTS_READ,

  Permission.INVOICES_READ_OWN,

  Permission.PAYMENTS_INITIATE,
  Permission.PAYMENTS_READ_OWN,

  Permission.NOTIFICATIONS_READ_OWN,

  Permission.SUPPORT_READ_OWN,
  Permission.SUPPORT_CREATE,

  Permission.EXPORTS_DOWNLOAD_OWN,

  Permission.DASHBOARD_CLIENT,
];

export const ROLE_PERMISSIONS: Record<Role, PermissionValue[]> = {
  [Role.Admin]:    ADMIN_PERMISSIONS,
  [Role.Employee]: EMPLOYEE_PERMISSIONS,
  [Role.Client]:   CLIENT_PERMISSIONS,
};

// ─── Permission Utilities ─────────────────────────────────────────────────────

/**
 * Returns the full permission set for a given role, merged with any additional
 * per-user permissions (used for granular admin-granted overrides).
 */
export function resolvePermissions(
  role: Role,
  additionalPermissions: PermissionValue[] = []
): PermissionValue[] {
  const base = ROLE_PERMISSIONS[role] ?? [];
  if (additionalPermissions.length === 0) return base;

  const merged = new Set([...base, ...additionalPermissions]);
  return Array.from(merged);
}

/**
 * Check if a resolved permission set includes ALL of the required permissions.
 */
export function hasPermissions(
  userPermissions: PermissionValue[],
  required: PermissionValue[]
): boolean {
  const set = new Set(userPermissions);
  return required.every((p) => set.has(p));
}

/**
 * Check if a resolved permission set includes ANY of the specified permissions.
 */
export function hasAnyPermission(
  userPermissions: PermissionValue[],
  oneOf: PermissionValue[]
): boolean {
  const set = new Set(userPermissions);
  return oneOf.some((p) => set.has(p));
}

/**
 * Type-guard: check if a string is a valid Role value.
 */
export function isValidRole(value: string): value is Role {
  return Object.values(Role).includes(value as Role);
}

/**
 * Returns true if the role is admin.
 * Convenience shorthand to avoid magic string comparisons.
 */
export function isAdmin(role: string): boolean {
  return role === Role.Admin;
}

/**
 * Returns true if the role is employee.
 */
export function isEmployee(role: string): boolean {
  return role === Role.Employee;
}

/**
 * Returns true if the role is client.
 */
export function isClient(role: string): boolean {
  return role === Role.Client;
}
