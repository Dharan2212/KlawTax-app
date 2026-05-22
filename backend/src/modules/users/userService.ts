import { Types } from 'mongoose';
import { User, IUserDocument, AccountStatus } from '../../models/user';
import { ClientProfile, IClientProfileDocument, ClientCategory, OnboardingStatus } from '../../models/clientProfile';
import { EmployeeProfile, IEmployeeProfileDocument, Department, EmploymentStatus } from '../../models/employeeProfile';
import { Role, PermissionValue } from '../../utils/permissions';
import {
  findUserById,
  findUserByEmail,
  emailExists,
  findUserWithProfile,
  listUsers,
  UserListOptions,
  UserWithProfile,
} from './userRepository';
import {
  ConflictError,
  NotFoundError,
  BusinessRuleError,
} from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateClientInput {
  firstName:  string;
  lastName:   string;
  email:      string;
  phone?:     string;
  /**
   * Pre-hashed password. Hashing is the caller's responsibility
   * (will be done in the auth service, Batch 1.4).
   */
  passwordHash: string;

  // Profile fields
  organizationName?:  string;
  category?:          ClientCategory;
  acquisitionSource?: string;
  communicationPreference?: string;
}

export interface CreateEmployeeInput {
  firstName:   string;
  lastName:    string;
  email:       string;
  phone?:      string;
  passwordHash: string;

  // Profile fields
  designation:   string;
  department:    Department;
  reportingManagerId?: string;
  specializations?:   string[];
  assignedRegions?:   string[];
  maxProjectCapacity?: number;
  employeeCode?:      string;
  joiningDate?:       Date;
  createdBy:          string; // Admin userId who created this employee
}

export interface UpdateUserInput {
  firstName?:    string;
  lastName?:     string;
  displayName?:  string;
  phone?:        string;
  avatarUrl?:    string;
  timezone?:     string;
  locale?:       string;
}

// ─── Client User Creation ─────────────────────────────────────────────────────

/**
 * Create a new client user + client profile atomically.
 * Called by:
 *   - Public checkout flow (Batch 3.x)
 *   - Admin "add client" CRM action
 *
 * Returns both the user and profile documents.
 */
export async function createClientUser(
  input: CreateClientInput
): Promise<{ user: IUserDocument; profile: IClientProfileDocument }> {
  if (await emailExists(input.email)) {
    throw new ConflictError(`An account with email "${input.email}" already exists`);
  }

  const user = await User.create({
    firstName:    input.firstName,
    lastName:     input.lastName,
    email:        input.email,
    phone:        input.phone,
    passwordHash: input.passwordHash,
    role:         Role.Client,
    accountStatus: AccountStatus.Pending, // Pending until email verified
    isEmailVerified: false,
  });

  const profile = await ClientProfile.create({
    userId:              user._id,
    organizationName:    input.organizationName,
    category:            input.category ?? ClientCategory.Individual,
    acquisitionSource:   input.acquisitionSource,
    onboardingStatus:    OnboardingStatus.Registered,
    communicationPreference: input.communicationPreference ?? 'whatsapp',
  });

  logger.info('[UserService] Client user created', {
    userId: user._id,
    email:  user.email,
  });

  return { user, profile };
}

// ─── Employee User Creation ───────────────────────────────────────────────────

/**
 * Create a new employee user + employee profile.
 * Admin-only operation.
 */
export async function createEmployeeUser(
  input: CreateEmployeeInput
): Promise<{ user: IUserDocument; profile: IEmployeeProfileDocument }> {
  if (await emailExists(input.email)) {
    throw new ConflictError(`An account with email "${input.email}" already exists`);
  }

  const user = await User.create({
    firstName:    input.firstName,
    lastName:     input.lastName,
    email:        input.email,
    phone:        input.phone,
    passwordHash: input.passwordHash,
    role:         Role.Employee,
    accountStatus: AccountStatus.Active, // Admin-created employees are active immediately
    isEmailVerified: false,
    createdBy: new Types.ObjectId(input.createdBy),
  });

  const profile = await EmployeeProfile.create({
    userId:             user._id,
    designation:        input.designation,
    department:         input.department,
    reportingManagerId: input.reportingManagerId
      ? new Types.ObjectId(input.reportingManagerId)
      : undefined,
    specializations:    input.specializations ?? [],
    assignedRegions:    input.assignedRegions ?? [],
    maxProjectCapacity: input.maxProjectCapacity ?? 20,
    employeeCode:       input.employeeCode,
    joiningDate:        input.joiningDate,
    employmentStatus:   EmploymentStatus.Active,
  });

  logger.info('[UserService] Employee user created', {
    userId:      user._id,
    email:       user.email,
    designation: input.designation,
    department:  input.department,
  });

  return { user, profile };
}

// ─── Profile Updates ──────────────────────────────────────────────────────────

/**
 * Update basic user profile fields (safe fields only — no role/password changes).
 */
export async function updateUserProfile(
  userId: string | Types.ObjectId,
  input: UpdateUserInput
): Promise<IUserDocument> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: input },
    { new: true, runValidators: true }
  )
    .lean<IUserDocument>({ virtuals: true })
    .exec();

  if (!user) throw new NotFoundError('User');

  return user;
}

// ─── Account Status Management ────────────────────────────────────────────────

/**
 * Deactivate a user account.
 *
 * Guards:
 *   - Cannot deactivate an employee with active projects (check is caller's responsibility
 *     for now; the project service will enforce EC-P2 in Batch 2.x).
 *   - Cannot deactivate an admin account.
 */
export async function deactivateUser(
  targetUserId: string | Types.ObjectId,
  performedBy:  string | Types.ObjectId
): Promise<IUserDocument> {
  const user = await findUserById(targetUserId);
  if (!user) throw new NotFoundError('User');

  if (user.role === Role.Admin) {
    throw new BusinessRuleError('Admin accounts cannot be deactivated via this endpoint');
  }

  if (user.accountStatus === AccountStatus.Archived) {
    throw new BusinessRuleError('This account is already archived');
  }

  const updated = await User.findByIdAndUpdate(
    targetUserId,
    {
      $set: {
        accountStatus: AccountStatus.Inactive,
        deactivatedAt: new Date(),
        deactivatedBy: new Types.ObjectId(performedBy.toString()),
      },
    },
    { new: true }
  )
    .lean<IUserDocument>({ virtuals: true })
    .exec();

  if (!updated) throw new NotFoundError('User');

  logger.info('[UserService] User deactivated', {
    userId:      targetUserId,
    performedBy,
  });

  return updated;
}

/**
 * Reactivate a previously deactivated user.
 */
export async function reactivateUser(
  targetUserId: string | Types.ObjectId
): Promise<IUserDocument> {
  const updated = await User.findByIdAndUpdate(
    targetUserId,
    {
      $set:   { accountStatus: AccountStatus.Active },
      $unset: { deactivatedAt: '', deactivatedBy: '' },
    },
    { new: true }
  )
    .lean<IUserDocument>({ virtuals: true })
    .exec();

  if (!updated) throw new NotFoundError('User');

  logger.info('[UserService] User reactivated', { userId: targetUserId });

  return updated;
}

// ─── Permission Management ────────────────────────────────────────────────────

/**
 * Grant additional per-user permissions beyond the base role set.
 * Admin-only operation.
 */
export async function grantPermissions(
  userId: string | Types.ObjectId,
  permissions: PermissionValue[]
): Promise<IUserDocument> {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { additionalPermissions: { $each: permissions } } },
    { new: true }
  )
    .lean<IUserDocument>({ virtuals: true })
    .exec();

  if (!updated) throw new NotFoundError('User');

  logger.info('[UserService] Permissions granted', { userId, permissions });

  return updated;
}

/**
 * Revoke specific additional permissions from a user.
 */
export async function revokePermissions(
  userId: string | Types.ObjectId,
  permissions: PermissionValue[]
): Promise<IUserDocument> {
  const updated = await User.findByIdAndUpdate(
    userId,
    { $pull: { additionalPermissions: { $in: permissions } } },
    { new: true }
  )
    .lean<IUserDocument>({ virtuals: true })
    .exec();

  if (!updated) throw new NotFoundError('User');

  logger.info('[UserService] Permissions revoked', { userId, permissions });

  return updated;
}

// ─── Re-exports for convenience ───────────────────────────────────────────────

export {
  findUserById,
  findUserByEmail,
  emailExists,
  findUserWithProfile,
  listUsers,
};

export type { UserListOptions, UserWithProfile };
