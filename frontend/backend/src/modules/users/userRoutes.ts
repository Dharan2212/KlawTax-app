/**
 * User Management Routes — Admin only
 *
 * Base path: /api/v1/users
 *
 * Employee sub-resource:
 *   GET    /employees           — list all employees (paginated)
 *   POST   /employees           — create employee account
 *   GET    /employees/:id       — get employee detail
 *   PATCH  /employees/:id       — update employee profile fields
 *   PATCH  /employees/:id/deactivate  — deactivate employee
 *   PATCH  /employees/:id/reactivate  — reactivate employee
 *
 * Client sub-resource:
 *   GET    /clients             — list all clients (paginated)
 *   POST   /clients             — create client account (admin-initiated)
 *   GET    /clients/:id         — get client detail
 *   PATCH  /clients/:id/deactivate    — deactivate client
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin }   from '../../middlewares/rbac';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../utils/response';
import { ValidationError, NotFoundError } from '../../middlewares/errorHandler';
import { Role }            from '../../utils/permissions';
import { Department }      from '../../models/employeeProfile';
import {
  createEmployeeUser,
  createClientUser,
  deactivateUser,
  reactivateUser,
  updateUserProfile,
  CreateEmployeeInput,
  CreateClientInput,
} from './userService';
import {
  listUsers,
  findUserWithProfile,
} from './userRepository';

export const userRouter = Router();

// All user management routes require admin role
userRouter.use(authenticate, requireAdmin);

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE ROUTES
// ═══════════════════════════════════════════════════════════════════

/** GET /api/v1/users/employees */
userRouter.get(
  '/employees',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(req.query.page, req.query.limit);
      const { users, total } = await listUsers({ role: Role.Employee, page, limit });
      sendSuccess(res, { users, meta: buildPaginationMeta(page, limit, total) }, { message: 'Employees loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/v1/users/employees — create a new employee account */
userRouter.post(
  '/employees',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      const { firstName, lastName, email, password, department, designation } = req.body as {
        firstName?:   unknown;
        lastName?:    unknown;
        email?:       unknown;
        password?:    unknown;
        department?:  unknown;
        designation?: unknown;
      };

      if (typeof firstName !== 'string' || !firstName.trim())  throw new ValidationError('firstName is required');
      if (typeof lastName  !== 'string' || !lastName.trim())   throw new ValidationError('lastName is required');
      if (typeof email     !== 'string' || !email.trim())      throw new ValidationError('email is required');
      if (typeof password  !== 'string' || password.length < 8) throw new ValidationError('password must be at least 8 characters');
      if (typeof designation !== 'string' || !designation.trim()) throw new ValidationError('designation is required');

      const validDepts = Object.values(Department) as string[];
      if (typeof department !== 'string' || !validDepts.includes(department)) {
        throw new ValidationError(`department must be one of: ${validDepts.join(', ')}`);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const input: CreateEmployeeInput = {
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        email:       email.toLowerCase().trim(),
        passwordHash,
        designation: designation.trim(),
        department:  department as Department,
        createdBy:   auth.userId,
      };

      const result = await createEmployeeUser(input);
      sendSuccess(res, result, { statusCode: 201, message: 'Employee created successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/** GET /api/v1/users/employees/:id */
userRouter.get(
  '/employees/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await findUserWithProfile(req.params.id);
      if (!user) throw new NotFoundError('Employee');
      sendSuccess(res, user, { message: 'Employee detail loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/v1/users/employees/:id — update profile fields */
userRouter.patch(
  '/employees/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Prevent privilege escalation — strip role & passwordHash from update payload
      const { role: _r, passwordHash: _ph, password: _pw, ...safe } = req.body as Record<string, unknown>;
      const updated = await updateUserProfile(req.params.id, safe);
      sendSuccess(res, updated, { message: 'Employee profile updated' });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/v1/users/employees/:id/deactivate */
userRouter.patch(
  '/employees/:id/deactivate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      await deactivateUser(req.params.id, auth.userId);
      sendSuccess(res, { id: req.params.id }, { message: 'Employee deactivated' });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/v1/users/employees/:id/reactivate */
userRouter.patch(
  '/employees/:id/reactivate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reactivateUser(req.params.id);
      sendSuccess(res, { id: req.params.id }, { message: 'Employee reactivated' });
    } catch (err) {
      next(err);
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
// CLIENT ROUTES
// ═══════════════════════════════════════════════════════════════════

/** GET /api/v1/users/clients */
userRouter.get(
  '/clients',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(req.query.page, req.query.limit);
      const { users, total } = await listUsers({ role: Role.Client, page, limit });
      sendSuccess(res, { users, meta: buildPaginationMeta(page, limit, total) }, { message: 'Clients loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/** POST /api/v1/users/clients — admin-initiated client account creation */
userRouter.post(
  '/clients',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, email, password, phone, organizationName } = req.body as {
        firstName?:       unknown;
        lastName?:        unknown;
        email?:           unknown;
        password?:        unknown;
        phone?:           unknown;
        organizationName?: unknown;
      };

      if (typeof firstName !== 'string' || !firstName.trim()) throw new ValidationError('firstName is required');
      if (typeof email     !== 'string' || !email.trim())     throw new ValidationError('email is required');
      if (typeof password  !== 'string' || password.length < 8) throw new ValidationError('password must be at least 8 characters');

      const passwordHash = await bcrypt.hash(password, 12);

      const input: CreateClientInput = {
        firstName:        firstName.trim(),
        lastName:         typeof lastName === 'string' ? lastName.trim() : '',
        email:            email.toLowerCase().trim(),
        passwordHash,
        phone:            typeof phone === 'string' ? phone : undefined,
        organizationName: typeof organizationName === 'string' ? organizationName.trim() : undefined,
      };

      const result = await createClientUser(input);
      sendSuccess(res, result, { statusCode: 201, message: 'Client account created successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/** GET /api/v1/users/clients/:id */
userRouter.get(
  '/clients/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await findUserWithProfile(req.params.id);
      if (!user) throw new NotFoundError('Client');
      sendSuccess(res, user, { message: 'Client detail loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/v1/users/clients/:id/deactivate */
userRouter.patch(
  '/clients/:id/deactivate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      await deactivateUser(req.params.id, auth.userId);
      sendSuccess(res, { id: req.params.id }, { message: 'Client deactivated' });
    } catch (err) {
      next(err);
    }
  }
);
