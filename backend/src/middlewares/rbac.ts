import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Role, PermissionValue, hasPermissions, hasAnyPermission, isAdmin } from '../utils/permissions';
import { ForbiddenError, UnauthorizedError } from './errorHandler';
import { getAuthContext, AuthenticatedRequest } from './auth';

// ─── Role Guards ──────────────────────────────────────────────────────────────

/**
 * `allowRoles(...roles)` — restricts a route to users with one of the given roles.
 *
 * Usage:
 *   router.get('/admin/leads', authenticate, allowRoles(Role.Admin), handler)
 *   router.get('/workspace',   authenticate, allowRoles(Role.Admin, Role.Employee), handler)
 */
export function allowRoles(...roles: Role[]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    try {
      const auth = getAuthContext(req);

      if (!roles.includes(auth.role as Role)) {
        throw new ForbiddenError(
          `This operation requires one of the following roles: ${roles.join(', ')}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * `requireAdmin` — restricts a route to admin users only.
 * Shorthand for `allowRoles(Role.Admin)`.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  allowRoles(Role.Admin)(req, res, next);
}

/**
 * `requireEmployee` — restricts a route to admin or employee users.
 * Clients are excluded.
 */
export function requireEmployee(req: Request, res: Response, next: NextFunction): void {
  allowRoles(Role.Admin, Role.Employee)(req, res, next);
}

/**
 * `requireClient` — restricts a route to client users (or admin override).
 */
export function requireClient(req: Request, res: Response, next: NextFunction): void {
  allowRoles(Role.Admin, Role.Client)(req, res, next);
}

// ─── Permission Guards ────────────────────────────────────────────────────────

/**
 * `requirePermissions(...permissions)` — requires the authenticated user to
 * hold ALL of the listed permissions.
 *
 * Usage:
 *   router.post('/approvals/:id/approve',
 *     authenticate,
 *     requirePermissions(Permission.APPROVALS_REVIEW),
 *     handler
 *   )
 */
export function requirePermissions(...required: PermissionValue[]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    try {
      const auth = getAuthContext(req);

      // Admins hold all permissions — fast path
      if (isAdmin(auth.role)) {
        next();
        return;
      }

      if (!hasPermissions(auth.permissions, required)) {
        const missing = required.filter((p) => !auth.permissions.includes(p));
        throw new ForbiddenError(
          `You do not have the required permission(s): ${missing.join(', ')}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * `requireAnyPermission(...permissions)` — requires the authenticated user to
 * hold AT LEAST ONE of the listed permissions.
 */
export function requireAnyPermission(...oneOf: PermissionValue[]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    try {
      const auth = getAuthContext(req);

      if (isAdmin(auth.role)) {
        next();
        return;
      }

      if (!hasAnyPermission(auth.permissions, oneOf)) {
        throw new ForbiddenError(
          `You need at least one of these permissions: ${oneOf.join(', ')}`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Ownership Guards ─────────────────────────────────────────────────────────

/**
 * Ownership check function type.
 * Implementations inspect the request (params, body, query) and a resolved
 * resource to determine if the authenticated user owns it.
 */
export type OwnershipChecker<TResource = unknown> = (
  auth: ReturnType<typeof getAuthContext>,
  resource: TResource
) => boolean;

/**
 * `requireOwnership(fetchResource, ownershipChecker)` — fetches a resource
 * and verifies the authenticated user is the owner (or admin).
 *
 * Usage:
 *   router.get('/portal/projects/:id',
 *     authenticate,
 *     requireOwnership(
 *       (req) => ProjectService.findById(req.params.id),
 *       (auth, project) => project.clientId.toString() === auth.clientProfileId
 *     ),
 *     handler
 *   )
 *
 * - Admins always pass (ownership is not enforced for admins).
 * - If the resource is null/undefined, the request is treated as 404 and
 *   the not-found error is propagated.
 */
export function requireOwnership<TResource>(
  fetchResource: (req: Request) => Promise<TResource | null>,
  checker: OwnershipChecker<TResource>
) {
  return async function (req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const auth = getAuthContext(req);

      // Admins bypass ownership checks
      if (isAdmin(auth.role)) {
        next();
        return;
      }

      const resource = await fetchResource(req);

      if (resource === null || resource === undefined) {
        // Let the route handler produce the 404 — don't leak existence info here
        next();
        return;
      }

      if (!checker(auth, resource)) {
        throw new ForbiddenError('You do not have access to this resource');
      }

      // Attach the pre-fetched resource to the request to avoid a second DB hit
      (req as Request & { resource: TResource }).resource = resource;

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── Scope Assertion Helpers ──────────────────────────────────────────────────

/**
 * Asserts that the authenticated user is an admin.
 * Throws `ForbiddenError` if not.
 * Used inside controllers/services when the check needs to be conditional.
 */
export function assertAdmin(req: Request): void {
  const auth = getAuthContext(req);
  if (!isAdmin(auth.role)) {
    throw new ForbiddenError('Admin access required');
  }
}

/**
 * Asserts that the resource belongs to the authenticated client.
 * `resourceClientProfileId` is the client profile ObjectId stored on the resource.
 */
export function assertClientOwnership(req: Request, resourceClientProfileId: Types.ObjectId | string): void {
  const auth = getAuthContext(req);

  // Admins can access any client resource
  if (isAdmin(auth.role)) return;

  if (!auth.clientProfileId) {
    throw new ForbiddenError('Client profile not found on auth context');
  }

  if (auth.clientProfileId !== resourceClientProfileId.toString()) {
    throw new ForbiddenError('You do not have access to this resource');
  }
}

/**
 * Asserts that the authenticated user is the assigned employee on a resource,
 * or is an admin.
 */
export function assertEmployeeOwnership(
  req: Request,
  resourceAssignedEmployeeId: Types.ObjectId | string
): void {
  const auth = getAuthContext(req);

  if (isAdmin(auth.role)) return;

  if (!auth.employeeProfileId) {
    throw new ForbiddenError('Employee profile not found on auth context');
  }

  if (auth.employeeProfileId !== resourceAssignedEmployeeId.toString()) {
    throw new ForbiddenError('You are not assigned to this resource');
  }
}

// ─── Account Status Guard ─────────────────────────────────────────────────────

/** Account statuses that are allowed to access protected routes. */
const ACTIVE_ACCOUNT_STATUSES = new Set(['active', 'locked']);

/**
 * `requireActiveAccount` — blocks inactive, deactivated, and archived users.
 *
 * Uses the `accountStatus` claim embedded in the JWT payload — no DB lookup needed.
 * Must be placed AFTER `authenticate` in the middleware chain.
 *
 * Usage:
 *   router.get('/portal', authenticate, requireActiveAccount, handler)
 */
export function requireActiveAccount(req: Request, _res: Response, next: NextFunction): void {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      throw new UnauthorizedError('Authentication required');
    }

    const status = auth.accountStatus;

    if (status === 'archived') {
      throw new ForbiddenError('This account has been archived and is no longer accessible');
    }

    if (status === 'inactive') {
      throw new ForbiddenError('This account has been deactivated. Please contact support.');
    }

    if (!ACTIVE_ACCOUNT_STATUSES.has(status)) {
      throw new ForbiddenError(`Account status "${status}" does not permit access`);
    }

    next();
  } catch (err) {
    next(err);
  }
}
