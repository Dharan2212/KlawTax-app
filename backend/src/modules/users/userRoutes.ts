/**
 * User Management Routes — Admin only
 *
 * Base path: /api/v1/users
 *
 * Employee sub-resource:
 *   GET    /employees           — list all employees (paginated, search, filter)
 *   POST   /employees           — create employee account
 *   GET    /employees/:id       — get employee detail with projects
 *   PATCH  /employees/:id       — update employee profile fields
 *   PATCH  /employees/:id/deactivate  — deactivate employee
 *   PATCH  /employees/:id/reactivate  — reactivate employee
 *   DELETE /employees/:id       — soft-delete (archive) employee
 *
 * Client sub-resource:
 *   GET    /clients             — list all clients (paginated, search, filter)
 *   POST   /clients             — create client account (admin-initiated)
 *   GET    /clients/:id         — get client detail with projects
 *   PATCH  /clients/:id         — update client profile fields
 *   PATCH  /clients/:id/deactivate    — deactivate client
 *   PATCH  /clients/:id/reactivate    — reactivate client
 *   DELETE /clients/:id         — soft-delete (archive) client
 */

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin }   from '../../middlewares/rbac';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../utils/response';
import { ValidationError, NotFoundError } from '../../middlewares/errorHandler';
import { Role }            from '../../utils/permissions';
import { Department }      from '../../models/employeeProfile';
import { AccountStatus }   from '../../models/user';
import { User }            from '../../models/user';
import { ClientProfile }   from '../../models/clientProfile';
import { EmployeeProfile } from '../../models/employeeProfile';
import { ProjectModel }         from '../../models/project';
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
  findClientProfileByUserId,
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
      const search  = typeof req.query.search  === 'string' ? req.query.search.trim()  : undefined;
      const status  = typeof req.query.status  === 'string' ? req.query.status.trim()  : undefined;
      const dept    = typeof req.query.department === 'string' ? req.query.department.trim() : undefined;

      // Build filter
      const filter: Record<string, unknown> = { role: Role.Employee };
      if (status) filter['accountStatus'] = status;

      // Name/email search via aggregation
      let users: unknown[] = [];
      let total = 0;

      if (search || dept) {
        // Need join with profile for dept filter + text search
        const pipeline: unknown[] = [
          { $match: filter },
          {
            $lookup: {
              from: 'employeeprofiles',
              localField: '_id',
              foreignField: 'userId',
              as: 'profile',
            },
          },
          { $unwind: { path: '$profile', preserveNullAndEmpty: true } },
        ];

        const andConds: unknown[] = [];
        if (search) {
          andConds.push({
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName:  { $regex: search, $options: 'i' } },
              { email:     { $regex: search, $options: 'i' } },
              { phone:     { $regex: search, $options: 'i' } },
            ],
          });
        }
        if (dept) {
          andConds.push({ 'profile.department': dept });
        }
        if (andConds.length > 0) {
          pipeline.push({ $match: { $and: andConds } });
        }

        pipeline.push({ $sort: { createdAt: -1 } });

        const countPipeline = [...pipeline, { $count: 'total' }];
        const [countRes, docs] = await Promise.all([
          User.aggregate(countPipeline as never[]),
          User.aggregate([...pipeline as never[], { $skip: (page - 1) * limit }, { $limit: limit }] as never[]),
        ]);
        total = (countRes[0] as { total?: number } | undefined)?.total ?? 0;
        users = docs;
      } else {
        const result = await listUsers({ role: Role.Employee, page, limit });
        users = result.users;
        total = result.total;
      }

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
      const {
        firstName, lastName, email, password, department, designation,
        phone, whatsappNumber, city, address,
        specializations, maxProjectCapacity, employeeCode,
      } = req.body as Record<string, unknown>;

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
        phone:       typeof phone === 'string' ? phone.trim() : undefined,
        specializations: Array.isArray(specializations) ? specializations.filter((s) => typeof s === 'string') as string[] : [],
        maxProjectCapacity: typeof maxProjectCapacity === 'number' ? maxProjectCapacity : 20,
        employeeCode: typeof employeeCode === 'string' ? employeeCode.trim() : undefined,
        createdBy:   auth.userId,
      };

      const result = await createEmployeeUser(input);

      // Update extra fields on user if provided
      if (typeof whatsappNumber === 'string' || typeof city === 'string' || typeof address === 'string') {
        const extras: Record<string, unknown> = {};
        if (whatsappNumber) extras['whatsappNumber'] = whatsappNumber;
        if (city) extras['city'] = city;
        if (address) extras['address'] = address;
        await User.findByIdAndUpdate(result.user._id, { $set: extras });
      }

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
      const userDoc = await findUserWithProfile(req.params.id);
      if (!userDoc) throw new NotFoundError('Employee');

      // Attach projects assigned to this employee
      const empProfile = userDoc.employeeProfile;
      let projects: unknown[] = [];
      if (empProfile) {
        projects = await ProjectModel.find({
          'assignedEmployees.userId': new Types.ObjectId(req.params.id),
          projectStatus: { $nin: ['archived', 'cancelled'] },
        })
          .select('projectCode title projectStatus projectPriority clientId isOverdue expectedDeliveryDate createdAt')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .exec();
      }

      sendSuccess(res, { ...userDoc, projects }, { message: 'Employee detail loaded' });
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
      const { role: _r, passwordHash: _ph, password: _pw, ...safe } = req.body as Record<string, unknown>;

      // Split into user fields vs profile fields
      const userFields: Record<string, unknown> = {};
      const profileFields: Record<string, unknown> = {};

      const USER_FIELDS = ['firstName', 'lastName', 'phone', 'displayName', 'whatsappNumber', 'city', 'address'];
      const PROFILE_FIELDS = ['designation', 'department', 'specializations', 'assignedRegions', 'maxProjectCapacity', 'employeeCode', 'workEmail'];

      for (const [k, v] of Object.entries(safe)) {
        if (USER_FIELDS.includes(k)) userFields[k] = v;
        else if (PROFILE_FIELDS.includes(k)) profileFields[k] = v;
      }

      if (Object.keys(userFields).length > 0) {
        await updateUserProfile(req.params.id, userFields as Parameters<typeof updateUserProfile>[1]);
      }
      if (Object.keys(profileFields).length > 0) {
        await EmployeeProfile.findOneAndUpdate(
          { userId: new Types.ObjectId(req.params.id) },
          { $set: profileFields },
          { new: true }
        );
      }

      const fresh = await findUserWithProfile(req.params.id);
      sendSuccess(res, fresh, { message: 'Employee profile updated' });
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

/** DELETE /api/v1/users/employees/:id — archive (soft delete) */
userRouter.delete(
  '/employees/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            accountStatus: AccountStatus.Archived,
            deactivatedAt: new Date(),
            deactivatedBy: new Types.ObjectId(auth.userId),
          },
        },
        { new: true }
      );
      if (!user) throw new NotFoundError('Employee');
      // Also mark employee profile
      await EmployeeProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(req.params.id) },
        { $set: { employmentStatus: 'terminated' } }
      );
      sendSuccess(res, { id: req.params.id }, { message: 'Employee archived' });
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
      const search    = typeof req.query.search    === 'string' ? req.query.search.trim()    : undefined;
      const status    = typeof req.query.status    === 'string' ? req.query.status.trim()    : undefined;
      const payStatus = typeof req.query.payStatus === 'string' ? req.query.payStatus.trim() : undefined;

      const filter: Record<string, unknown> = { role: Role.Client };
      if (status) filter['accountStatus'] = status;

      let users: unknown[] = [];
      let total = 0;

      if (search || payStatus) {
        const pipeline: unknown[] = [
          { $match: filter },
          {
            $lookup: {
              from: 'clientprofiles',
              localField: '_id',
              foreignField: 'userId',
              as: 'profile',
            },
          },
          { $unwind: { path: '$profile', preserveNullAndEmpty: true } },
        ];

        const andConds: unknown[] = [];
        if (search) {
          andConds.push({
            $or: [
              { firstName: { $regex: search, $options: 'i' } },
              { lastName:  { $regex: search, $options: 'i' } },
              { email:     { $regex: search, $options: 'i' } },
              { phone:     { $regex: search, $options: 'i' } },
              { 'profile.organizationName': { $regex: search, $options: 'i' } },
            ],
          });
        }
        if (payStatus) {
          andConds.push({ 'profile.paymentStatus': payStatus });
        }
        if (andConds.length > 0) {
          pipeline.push({ $match: { $and: andConds } });
        }
        pipeline.push({ $sort: { createdAt: -1 } });

        const countPipeline = [...pipeline, { $count: 'total' }];
        const [countRes, docs] = await Promise.all([
          User.aggregate(countPipeline as never[]),
          User.aggregate([...pipeline as never[], { $skip: (page - 1) * limit }, { $limit: limit }] as never[]),
        ]);
        total = (countRes[0] as { total?: number } | undefined)?.total ?? 0;
        users = docs;
      } else {
        const result = await listUsers({ role: Role.Client, page, limit });
        users = result.users;
        total = result.total;
      }

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
      const {
        firstName, lastName, email, password, phone, whatsappNumber,
        organizationName, city, address,
        serviceName, serviceNotes,
        workStatus, followUpDate,
        totalAmount, paidAmount, paymentStatus,
        remarks, category,
      } = req.body as Record<string, unknown>;

      if (typeof firstName !== 'string' || !firstName.trim()) throw new ValidationError('firstName is required');
      if (typeof email     !== 'string' || !email.trim())     throw new ValidationError('email is required');
      if (typeof password  !== 'string' || password.length < 8) throw new ValidationError('password must be at least 8 characters');

      const passwordHash = await bcrypt.hash(password, 12);

      const input: CreateClientInput = {
        firstName:        firstName.trim(),
        lastName:         typeof lastName === 'string' ? lastName.trim() : '',
        email:            email.toLowerCase().trim(),
        passwordHash,
        phone:            typeof phone === 'string' ? phone.trim() : undefined,
        organizationName: typeof organizationName === 'string' ? organizationName.trim() : undefined,
        category:         typeof category === 'string' ? (category as CreateClientInput['category']) : undefined,
      };

      const result = await createClientUser(input);

      // Patch user with extra fields
      const userExtras: Record<string, unknown> = {};
      if (whatsappNumber) userExtras['whatsappNumber'] = whatsappNumber;
      if (city)           userExtras['city'] = city;
      if (address)        userExtras['address'] = address;
      if (Object.keys(userExtras).length > 0) {
        await User.findByIdAndUpdate(result.user._id, { $set: userExtras });
      }

      // Patch profile with CRM-specific fields
      const profileExtras: Record<string, unknown> = {};
      if (serviceName)   profileExtras['serviceName']   = serviceName;
      if (serviceNotes)  profileExtras['serviceNotes']  = serviceNotes;
      if (workStatus)    profileExtras['workStatus']    = workStatus;
      if (followUpDate)  profileExtras['followUpDate']  = new Date(followUpDate as string);
      if (totalAmount !== undefined)  profileExtras['totalAmount']  = Number(totalAmount);
      if (paidAmount  !== undefined)  profileExtras['paidAmount']   = Number(paidAmount);
      if (paymentStatus) profileExtras['paymentStatus'] = paymentStatus;
      if (remarks)       profileExtras['remarks']       = remarks;

      if (Object.keys(profileExtras).length > 0) {
        await ClientProfile.findByIdAndUpdate(result.profile._id, { $set: profileExtras });
      }

      // Return enriched
      const fresh = await findUserWithProfile(result.user._id as Types.ObjectId);
      sendSuccess(res, fresh ?? result, { statusCode: 201, message: 'Client account created successfully' });
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
      const userDoc = await findUserWithProfile(req.params.id);
      if (!userDoc) throw new NotFoundError('Client');

      // Attach projects
      const profile = userDoc.clientProfile;
      let projects: unknown[] = [];
      if (profile) {
        projects = await ProjectModel.find({
          clientId: profile._id,
        })
          .select('projectCode title projectStatus projectPriority isOverdue isStalled expectedDeliveryDate createdAt assignedEmployees')
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
          .exec();
      }

      sendSuccess(res, { ...userDoc, projects }, { message: 'Client detail loaded' });
    } catch (err) {
      next(err);
    }
  }
);

/** PATCH /api/v1/users/clients/:id — update client fields */
userRouter.patch(
  '/clients/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role: _r, passwordHash: _ph, password: _pw, ...safe } = req.body as Record<string, unknown>;

      const USER_FIELDS = ['firstName', 'lastName', 'phone', 'displayName', 'whatsappNumber', 'city', 'address'];
      const PROFILE_FIELDS = [
        'organizationName', 'category', 'serviceName', 'serviceNotes',
        'workStatus', 'followUpDate', 'totalAmount', 'paidAmount', 'paymentStatus', 'remarks',
      ];

      const userFields: Record<string, unknown> = {};
      const profileFields: Record<string, unknown> = {};

      for (const [k, v] of Object.entries(safe)) {
        if (USER_FIELDS.includes(k)) userFields[k] = v;
        else if (PROFILE_FIELDS.includes(k)) profileFields[k] = v;
      }

      if (Object.keys(userFields).length > 0) {
        await updateUserProfile(req.params.id, userFields as Parameters<typeof updateUserProfile>[1]);
      }
      if (Object.keys(profileFields).length > 0) {
        if (profileFields['followUpDate']) {
          profileFields['followUpDate'] = new Date(profileFields['followUpDate'] as string);
        }
        const clientProfile = await findClientProfileByUserId(new Types.ObjectId(req.params.id));
        if (clientProfile) {
          await ClientProfile.findByIdAndUpdate(clientProfile._id, { $set: profileFields }, { new: true });
        }
      }

      const fresh = await findUserWithProfile(req.params.id);
      sendSuccess(res, fresh, { message: 'Client profile updated' });
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

/** PATCH /api/v1/users/clients/:id/reactivate */
userRouter.patch(
  '/clients/:id/reactivate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reactivateUser(req.params.id);
      sendSuccess(res, { id: req.params.id }, { message: 'Client reactivated' });
    } catch (err) {
      next(err);
    }
  }
);

/** DELETE /api/v1/users/clients/:id — archive (soft delete) */
userRouter.delete(
  '/clients/:id',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            accountStatus: AccountStatus.Archived,
            deactivatedAt: new Date(),
            deactivatedBy: new Types.ObjectId(auth.userId),
          },
        },
        { new: true }
      );
      if (!user) throw new NotFoundError('Client');
      sendSuccess(res, { id: req.params.id }, { message: 'Client archived' });
    } catch (err) {
      next(err);
    }
  }
);
