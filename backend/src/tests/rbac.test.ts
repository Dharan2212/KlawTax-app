import { describe, it, expect, printResults } from './_helpers';
import {
  Role, Permission, ADMIN_PERMISSIONS, EMPLOYEE_PERMISSIONS, CLIENT_PERMISSIONS,
  ROLE_PERMISSIONS, resolvePermissions, hasPermissions, hasAnyPermission,
  isValidRole, isAdmin, isEmployee, isClient,
} from '../utils/permissions';

describe('Role guards', () => {
  it('isValidRole accepts valid roles', () => {
    expect(isValidRole('admin')).toBeTruthy();
    expect(isValidRole('employee')).toBeTruthy();
    expect(isValidRole('client')).toBeTruthy();
  });

  it('isValidRole rejects unknown strings', () => {
    expect(isValidRole('superuser')).toBeFalsy();
    expect(isValidRole('')).toBeFalsy();
  });

  it('isAdmin / isEmployee / isClient work correctly', () => {
    expect(isAdmin('admin')).toBeTruthy();
    expect(isAdmin('employee')).toBeFalsy();
    expect(isEmployee('employee')).toBeTruthy();
    expect(isClient('client')).toBeTruthy();
    expect(isClient('admin')).toBeFalsy();
  });
});

describe('Permission sets', () => {
  it('Admin has every permission', () => {
    for (const perm of Object.values(Permission)) {
      expect(ADMIN_PERMISSIONS).toContain(perm);
    }
  });

  it('Employee permissions are a subset of Admin permissions', () => {
    for (const perm of EMPLOYEE_PERMISSIONS) {
      expect(ADMIN_PERMISSIONS).toContain(perm);
    }
  });

  it('Client permissions are a subset of Admin permissions', () => {
    for (const perm of CLIENT_PERMISSIONS) {
      expect(ADMIN_PERMISSIONS).toContain(perm);
    }
  });

  it('ROLE_PERMISSIONS maps all three roles', () => {
    expect(ROLE_PERMISSIONS).toHaveProperty(Role.Admin);
    expect(ROLE_PERMISSIONS).toHaveProperty(Role.Employee);
    expect(ROLE_PERMISSIONS).toHaveProperty(Role.Client);
  });
});

describe('resolvePermissions', () => {
  it('admin has more permissions than client', () => {
    const adminPerms  = resolvePermissions(Role.Admin);
    const clientPerms = resolvePermissions(Role.Client);
    expect(adminPerms.length > clientPerms.length).toBeTruthy();
  });
});

describe('hasPermissions', () => {
  it('returns true when all required perms are present', () => {
    const adminPerms = resolvePermissions(Role.Admin);
    expect(hasPermissions(adminPerms, [Permission.PROJECTS_READ_ALL, Permission.LEADS_READ])).toBeTruthy();
  });

  it('returns false when a required perm is missing', () => {
    const clientPerms = resolvePermissions(Role.Client);
    expect(hasPermissions(clientPerms, [Permission.PROJECTS_READ_ALL])).toBeFalsy();
  });

  it('returns true for empty required set', () => {
    expect(hasPermissions([], [])).toBeTruthy();
  });
});

describe('hasAnyPermission', () => {
  it('returns true when at least one matches', () => {
    const adminPerms = resolvePermissions(Role.Admin);
    expect(hasAnyPermission(adminPerms, [Permission.PROJECTS_READ_ALL, Permission.EXPORTS_GENERATE])).toBeTruthy();
  });

  it('returns false when none match', () => {
    expect(hasAnyPermission([], [Permission.PROJECTS_READ_ALL])).toBeFalsy();
  });
});

void (async () => { await printResults(); })();
