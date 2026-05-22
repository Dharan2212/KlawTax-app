import { Types, FilterQuery } from 'mongoose';
import { User, IUserDocument, AccountStatus } from '../../models/user';
import { ClientProfile, IClientProfileDocument } from '../../models/clientProfile';
import { EmployeeProfile, IEmployeeProfileDocument } from '../../models/employeeProfile';
import { Role } from '../../utils/permissions';

// ─── Lookup Helpers ───────────────────────────────────────────────────────────

/**
 * Find a user by their MongoDB ObjectId.
 * Returns null if not found.
 * `includePasswordHash` defaults to false — only enable for auth flows.
 */
export async function findUserById(
  id: string | Types.ObjectId,
  includePasswordHash = false
): Promise<IUserDocument | null> {
  const query = User.findById(id);
  if (includePasswordHash) {
    query.select('+passwordHash');
  }
  return query.lean<IUserDocument>({ virtuals: true }).exec();
}

/**
 * Find a user by email address (case-insensitive).
 * Used in auth flows and duplicate-check guards.
 */
export async function findUserByEmail(
  email: string,
  includePasswordHash = false
): Promise<IUserDocument | null> {
  const query = User.findOne({ email: email.toLowerCase().trim() });
  if (includePasswordHash) {
    query.select('+passwordHash');
  }
  return query.lean<IUserDocument>({ virtuals: true }).exec();
}

/**
 * Checks if a user with the given email already exists.
 * Cheaper than `findUserByEmail` — no full document hydration.
 */
export async function emailExists(email: string): Promise<boolean> {
  const count = await User.countDocuments({
    email: email.toLowerCase().trim(),
  });
  return count > 0;
}

// ─── Active/Status Aware Lookups ──────────────────────────────────────────────

/**
 * Find an active (non-deactivated, non-archived) user by ID.
 * Used for authenticated request validation — excludes inactive accounts.
 */
export async function findActiveUserById(
  id: string | Types.ObjectId
): Promise<IUserDocument | null> {
  return User.findOne({
    _id: id,
    accountStatus: { $in: [AccountStatus.Active, AccountStatus.Locked] },
  })
    .lean<IUserDocument>({ virtuals: true })
    .exec();
}

// ─── Role-Scoped Listings ─────────────────────────────────────────────────────

export interface UserListOptions {
  role?:           Role;
  accountStatus?:  AccountStatus;
  page?:           number;
  limit?:          number;
  sortBy?:         string;
  sortOrder?:      'asc' | 'desc';
}

/**
 * Returns a paginated list of users, scoped by optional role and status filters.
 * Used by admin user management endpoints.
 */
export async function listUsers(options: UserListOptions = {}): Promise<{
  users: IUserDocument[];
  total: number;
}> {
  const {
    role,
    accountStatus,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const filter: FilterQuery<IUserDocument> = {};
  if (role)          filter['role'] = role;
  if (accountStatus) filter['accountStatus'] = accountStatus;

  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean<IUserDocument[]>({ virtuals: true })
      .exec(),
    User.countDocuments(filter),
  ]);

  return { users, total };
}

// ─── Profile Lookups ──────────────────────────────────────────────────────────

/**
 * Find a client profile by userId.
 */
export async function findClientProfileByUserId(
  userId: string | Types.ObjectId
): Promise<IClientProfileDocument | null> {
  return ClientProfile.findOne({ userId })
    .lean<IClientProfileDocument>()
    .exec();
}

/**
 * Find a client profile by its own ObjectId.
 */
export async function findClientProfileById(
  profileId: string | Types.ObjectId
): Promise<IClientProfileDocument | null> {
  return ClientProfile.findById(profileId)
    .lean<IClientProfileDocument>()
    .exec();
}

/**
 * Find an employee profile by userId.
 */
export async function findEmployeeProfileByUserId(
  userId: string | Types.ObjectId
): Promise<IEmployeeProfileDocument | null> {
  return EmployeeProfile.findOne({ userId })
    .lean<IEmployeeProfileDocument>()
    .exec();
}

/**
 * Find an employee profile by its own ObjectId.
 */
export async function findEmployeeProfileById(
  profileId: string | Types.ObjectId
): Promise<IEmployeeProfileDocument | null> {
  return EmployeeProfile.findById(profileId)
    .lean<IEmployeeProfileDocument>()
    .exec();
}

// ─── Composite Lookup ─────────────────────────────────────────────────────────

export interface UserWithProfile {
  user:            IUserDocument;
  clientProfile?:  IClientProfileDocument;
  employeeProfile?: IEmployeeProfileDocument;
}

/**
 * Fetch a user together with their associated profile (client or employee).
 * Returns the combined object for use in rich dashboard/detail views.
 */
export async function findUserWithProfile(
  userId: string | Types.ObjectId
): Promise<UserWithProfile | null> {
  const user = await findActiveUserById(userId);
  if (!user) return null;

  const result: UserWithProfile = { user };

  if (user.role === Role.Client) {
    result.clientProfile = await findClientProfileByUserId(user._id as Types.ObjectId) ?? undefined;
  } else if (user.role === Role.Employee) {
    result.employeeProfile = await findEmployeeProfileByUserId(user._id as Types.ObjectId) ?? undefined;
  }

  return result;
}

// ─── Workload Helpers ─────────────────────────────────────────────────────────

/**
 * Increment or decrement an employee's active project count.
 * Called by the project service — not for direct API use.
 */
export async function adjustEmployeeWorkload(
  userId: string | Types.ObjectId,
  delta: 1 | -1
): Promise<void> {
  await EmployeeProfile.updateOne(
    { userId },
    { $inc: { activeProjectCount: delta } }
  );
}

/**
 * Returns a list of employees sorted by workload (ascending), filtered by
 * optional specialization tags and employment status.
 * Used by the assignment engine.
 */
export async function findAvailableEmployees(options?: {
  specializations?: string[];
  maxCount?: number;
}): Promise<IEmployeeProfileDocument[]> {
  const { specializations, maxCount = 10 } = options ?? {};

  const filter: FilterQuery<IEmployeeProfileDocument> = {
    employmentStatus: 'active',
  };

  if (specializations && specializations.length > 0) {
    filter['specializations'] = { $in: specializations };
  }

  return EmployeeProfile.find(filter)
    .sort({ activeProjectCount: 1 })
    .limit(maxCount)
    .lean<IEmployeeProfileDocument[]>()
    .exec();
}
