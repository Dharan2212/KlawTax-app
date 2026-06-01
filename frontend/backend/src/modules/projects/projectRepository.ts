/**
 * Project Repository — Batch 3.1
 *
 * All MongoDB operations for the Project collection.
 * No business logic here — that lives in projectService / projectWorkflow.
 * All query functions return plain objects (lean) unless documents are needed.
 */

import { Types, FilterQuery, SortOrder } from 'mongoose';
import { ProjectModel, IProject } from '../../models/project';
import { ProjectStatus, ProjectPriority } from '../../models/projectEnums';

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface ProjectFilter {
  clientId?:           string;
  projectStatus?:      ProjectStatus | ProjectStatus[];
  projectPriority?:    ProjectPriority;
  assignedEmployeeId?: string;  // userId of assigned employee
  primaryManagerId?:   string;
  isOverdue?:          boolean;
  isStalled?:          boolean;
  isBlocked?:          boolean;
  requiresClientInput?: boolean;
  primaryServiceSlug?: string;
  serviceDeliveryType?: string;
  billingAnchorProjectId?: string;
  isBundleAnchor?:     boolean;
  search?:             string;  // Matches projectCode or title
}

export interface ProjectSortOptions {
  field:     'createdAt' | 'updatedAt' | 'projectPriority' | 'lastActivityAt' | 'expectedDeliveryDate' | 'projectCode';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page:  number;
  limit: number;
  skip:  number;
}

// ─── Query Builder ────────────────────────────────────────────────────────────

function buildFilterQuery(filter: ProjectFilter): FilterQuery<IProject> {
  const query: FilterQuery<IProject> = {};

  if (filter.clientId) {
    query.clientId = new Types.ObjectId(filter.clientId);
  }

  if (filter.projectStatus) {
    if (Array.isArray(filter.projectStatus)) {
      query.projectStatus = { $in: filter.projectStatus };
    } else {
      query.projectStatus = filter.projectStatus;
    }
  }

  if (filter.projectPriority) {
    query.projectPriority = filter.projectPriority;
  }

  if (filter.assignedEmployeeId) {
    query['assignedEmployees.userId']   = new Types.ObjectId(filter.assignedEmployeeId);
    query['assignedEmployees.isActive'] = true;
  }

  if (filter.primaryManagerId) {
    query.primaryManagerId = new Types.ObjectId(filter.primaryManagerId);
  }

  if (filter.isOverdue !== undefined) {
    query.isOverdue = filter.isOverdue;
  }

  if (filter.isStalled !== undefined) {
    query.isStalled = filter.isStalled;
  }

  if (filter.isBlocked !== undefined) {
    query.isBlocked = filter.isBlocked;
  }

  if (filter.requiresClientInput !== undefined) {
    query.requiresClientInput = filter.requiresClientInput;
  }

  if (filter.primaryServiceSlug) {
    query.primaryServiceSlug = filter.primaryServiceSlug;
  }

  if (filter.serviceDeliveryType) {
    query.serviceDeliveryTypes = filter.serviceDeliveryType;
  }

  if (filter.billingAnchorProjectId) {
    query.billingAnchorProjectId = new Types.ObjectId(filter.billingAnchorProjectId);
  }

  if (filter.isBundleAnchor !== undefined) {
    query.isBundleAnchor = filter.isBundleAnchor;
  }

  if (filter.search) {
    const escaped = filter.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(escaped, 'i');
    query.$or     = [{ projectCode: regex }, { title: regex }];
  }

  return query;
}

// ─── Read Operations ──────────────────────────────────────────────────────────

/**
 * Find a project by its MongoDB _id.
 * Returns a full Mongoose document (for mutation operations).
 */
export async function findProjectById(id: Types.ObjectId): Promise<IProject | null> {
  return ProjectModel.findById(id).exec();
}

/**
 * Find a project by its auto-generated projectCode (e.g. KT-00001).
 */
export async function findProjectByCode(code: string): Promise<IProject | null> {
  return ProjectModel.findOne({ projectCode: code.toUpperCase() }).exec();
}

/**
 * List projects with filtering, sorting, and pagination.
 * Returns lean objects for read operations (lighter weight).
 */
export async function listProjects(
  filter: ProjectFilter,
  sort:   ProjectSortOptions,
  pagination: PaginationOptions
): Promise<{ projects: IProject[]; total: number }> {
  const query = buildFilterQuery(filter);

  const sortQuery: Record<string, SortOrder> = {
    [sort.field]: sort.direction === 'asc' ? 1 : -1,
  };
  // Secondary sort by _id for consistent pagination
  if (sort.field !== 'createdAt') {
    sortQuery['_id'] = -1;
  }

  const [projects, total] = await Promise.all([
    ProjectModel.find(query)
      .sort(sortQuery)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean<IProject[]>()
      .exec(),
    ProjectModel.countDocuments(query).exec(),
  ]);

  return { projects, total };
}

/**
 * List projects assigned to a specific employee.
 * Used for the employee workbench dashboard.
 */
export async function listProjectsByEmployee(
  userId: Types.ObjectId,
  filter: Omit<ProjectFilter, 'assignedEmployeeId'>,
  sort: ProjectSortOptions,
  pagination: PaginationOptions
): Promise<{ projects: IProject[]; total: number }> {
  return listProjects({ ...filter, assignedEmployeeId: userId.toString() }, sort, pagination);
}

/**
 * Find all sub-projects of a bundle anchor project.
 */
export async function findSubProjects(
  billingAnchorProjectId: Types.ObjectId
): Promise<IProject[]> {
  return ProjectModel.find({ billingAnchorProjectId }).lean<IProject[]>().exec();
}

/**
 * Count projects matching a filter — used for dashboard metrics.
 */
export async function countProjects(filter: ProjectFilter): Promise<number> {
  return ProjectModel.countDocuments(buildFilterQuery(filter)).exec();
}

// ─── Write Operations ─────────────────────────────────────────────────────────

/**
 * Create a new project.
 * Returns the saved document with the auto-generated projectCode.
 */
export async function createProject(
  data: Partial<IProject>
): Promise<IProject> {
  const project = new ProjectModel(data);
  return project.save();
}

/**
 * Apply a partial update to a project by ID.
 * Returns the updated document (after update).
 */
export async function updateProject(
  id: Types.ObjectId,
  update: Partial<IProject>
): Promise<IProject | null> {
  return ProjectModel.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  ).exec();
}

/**
 * Append a status history entry to a project.
 */
export async function pushStatusHistory(
  id: Types.ObjectId,
  entry: IProject['statusHistory'][number]
): Promise<void> {
  await ProjectModel.findByIdAndUpdate(
    id,
    { $push: { statusHistory: entry } }
  ).exec();
}

/**
 * Add a sub-project ID reference to a bundle anchor's subProjectIds array.
 */
export async function addSubProjectReference(
  anchorId: Types.ObjectId,
  subProjectId: Types.ObjectId
): Promise<void> {
  await ProjectModel.findByIdAndUpdate(
    anchorId,
    { $addToSet: { subProjectIds: subProjectId } }
  ).exec();
}

/**
 * Bulk-update isOverdue flag for a set of project IDs.
 * Used by the overdue-detector scheduled job.
 */
export async function bulkSetOverdue(
  projectIds: Types.ObjectId[],
  isOverdue: boolean
): Promise<number> {
  const result = await ProjectModel.updateMany(
    { _id: { $in: projectIds } },
    { $set: { isOverdue, lastOverdueFlaggedAt: isOverdue ? new Date() : undefined } }
  ).exec();
  return result.modifiedCount;
}

/**
 * Bulk-update isStalled flag for a set of project IDs.
 * Used by the stalled-project-detector scheduled job.
 */
export async function bulkSetStalled(
  projectIds: Types.ObjectId[],
  isStalled: boolean
): Promise<number> {
  const result = await ProjectModel.updateMany(
    { _id: { $in: projectIds } },
    { $set: { isStalled, lastStalledAt: isStalled ? new Date() : undefined } }
  ).exec();
  return result.modifiedCount;
}

/**
 * Clear isStalled flag when a new activity is recorded on a project.
 */
export async function clearStalledFlag(id: Types.ObjectId): Promise<void> {
  await ProjectModel.findByIdAndUpdate(
    id,
    { $set: { isStalled: false, lastActivityAt: new Date() } }
  ).exec();
}

/**
 * Fetch all active projects with expectedDeliveryDate in the past.
 * Used by the overdue-detector scheduled job.
 */
export async function findCandidateOverdueProjects(): Promise<IProject[]> {
  return ProjectModel.find({
    expectedDeliveryDate: { $lt: new Date() },
    isOverdue: false,
    projectStatus: {
      $in: [
        ProjectStatus.Onboarding,
        ProjectStatus.Active,
        ProjectStatus.WaitingClient,
        ProjectStatus.InReview,
      ],
    },
  })
    .select('_id projectCode projectStatus expectedDeliveryDate')
    .lean<IProject[]>()
    .exec();
}

/**
 * Fetch all active projects that have been inactive beyond the stall threshold.
 * Used by the stalled-project-detector scheduled job.
 */
export async function findCandidateStalledProjects(
  thresholdDate: Date
): Promise<IProject[]> {
  return ProjectModel.find({
    lastActivityAt: { $lt: thresholdDate },
    isStalled: false,
    projectStatus: {
      $in: [
        ProjectStatus.Onboarding,
        ProjectStatus.Active,
        ProjectStatus.InReview,
      ],
    },
  })
    .select('_id projectCode projectStatus lastActivityAt')
    .lean<IProject[]>()
    .exec();
}
