/**
 * Project Service — Batch 3.1
 *
 * Business logic layer for all project operations.
 * Coordinates between:
 *   - projectRepository (DB)
 *   - projectWorkflow (lifecycle rules)
 *   - assignmentEngine (assignment rules)
 *   - projectLifecycle (overdue/stalled utilities)
 *
 * Throws AppError subclasses for all domain errors.
 * Never throws raw Mongoose errors to callers.
 */

import { Types } from 'mongoose';
import { NotFoundError, BusinessRuleError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';

import {
  createProject,
  findProjectById,
  findProjectByCode,
  listProjects,
  updateProject,
  pushStatusHistory,
  addSubProjectReference,
  findSubProjects,
  countProjects,
  findCandidateOverdueProjects,
  findCandidateStalledProjects,
  bulkSetOverdue,
  bulkSetStalled,
  clearStalledFlag,
} from './projectRepository';
import type { ProjectFilter, ProjectSortOptions, PaginationOptions } from './projectRepository';

import {
  validateProjectTransition,
  buildLifecycleTimestamps,
  buildStatusHistoryEntry,
  evaluateCompletionGate,
  buildDefaultChecklist,
  calculateProgressFromChecklist,
  guardNotTerminal,
} from './projectWorkflow';

import {
  applyAssignEmployee,
  applyRemoveEmployee,
  applySetPrimaryManager,
  getActiveAssignees,
  validateAssignEmployeeInput,
} from './assignmentEngine';

import {
  evaluateLifecycleFlags,
} from './projectLifecycle';

import {
  ProjectStatus,
  ProjectPriority,
  DEFAULT_STALL_THRESHOLD_DAYS,
} from '../../models/projectEnums';
import type { IProject } from '../../models/project';

import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  TransitionProjectStatusPayload,
  UpdateChecklistItemPayload,
} from '../../validators/projectValidators';
import { ChecklistItemStatus } from '../../models/projectEnums';

// ─── Create Project ───────────────────────────────────────────────────────────

export interface CreateProjectOptions {
  payload:   CreateProjectPayload;
  createdBy: Types.ObjectId;
}

export async function createProjectRecord(opts: CreateProjectOptions): Promise<IProject> {
  const { payload, createdBy } = opts;

  const deliveryTypes = payload.serviceDeliveryTypes ?? [];
  const checklist     = buildDefaultChecklist(deliveryTypes);

  const projectData: Partial<IProject> = {
    clientId:           new Types.ObjectId(payload.clientId),
    primaryServiceSlug: payload.primaryServiceSlug,
    serviceSlugs:       payload.serviceSlugs,
    serviceDeliveryTypes: deliveryTypes,
    title:              payload.title,
    description:        payload.description,
    projectPriority:    payload.projectPriority ?? ProjectPriority.Medium,
    projectStatus:      ProjectStatus.Draft,
    statusHistory:      [],
    completionChecklist: checklist,
    progressPercentage:  0,
    lastActivityAt:     new Date(),
    isBundleAnchor:     payload.isBundleAnchor ?? false,
    subProjectIds:      [],
    assignedEmployees:  [],
    isBlocked:          false,
    isStalled:          false,
    isOverdue:          false,
    requiresClientInput: false,
    requiresManualReview: false,
    createdFromLead:    !!payload.leadId,
    tags:               payload.tags ?? [],
    internalNotes:      payload.internalNotes,
    createdBy,
    updatedBy:          createdBy,
  };

  if (payload.leadId) {
    projectData.leadId = new Types.ObjectId(payload.leadId);
  }
  if (payload.targetStartDate) {
    projectData.targetStartDate = new Date(payload.targetStartDate);
  }
  if (payload.targetCompletionDate) {
    projectData.targetCompletionDate = new Date(payload.targetCompletionDate);
  }
  if (payload.expectedDeliveryDate) {
    projectData.expectedDeliveryDate = new Date(payload.expectedDeliveryDate);
  }
  if (payload.billingAnchorProjectId) {
    projectData.billingAnchorProjectId = new Types.ObjectId(payload.billingAnchorProjectId);
  }

  const project = await createProject(projectData);

  // If this is a sub-project, register it on the billing anchor
  if (payload.billingAnchorProjectId) {
    await addSubProjectReference(
      new Types.ObjectId(payload.billingAnchorProjectId),
      project._id as Types.ObjectId
    );
  }

  logger.info('[ProjectService] Project created', {
    projectCode: project.projectCode,
    clientId:    payload.clientId,
    createdBy:   createdBy.toString(),
  });

  return project;
}

// ─── Get Project ──────────────────────────────────────────────────────────────

export async function getProjectById(id: Types.ObjectId): Promise<IProject> {
  const project = await findProjectById(id);
  if (!project) throw new NotFoundError('Project');
  return project;
}

export async function getProjectByCode(code: string): Promise<IProject> {
  const project = await findProjectByCode(code);
  if (!project) throw new NotFoundError('Project');
  return project;
}

export async function getProjectWithSubProjects(id: Types.ObjectId): Promise<{
  project: IProject;
  subProjects: IProject[];
}> {
  const project = await getProjectById(id);
  const subProjects = project.isBundleAnchor
    ? await findSubProjects(project._id as Types.ObjectId)
    : [];
  return { project, subProjects };
}

// ─── List Projects ────────────────────────────────────────────────────────────

export async function listProjectsWithMeta(
  filter:     ProjectFilter,
  sort:       ProjectSortOptions,
  pagination: PaginationOptions
): Promise<{ projects: IProject[]; total: number }> {
  return listProjects(filter, sort, pagination);
}

export async function getProjectCounts(filter: ProjectFilter): Promise<number> {
  return countProjects(filter);
}

// ─── Update Project Fields ────────────────────────────────────────────────────

export async function updateProjectFields(
  id:        Types.ObjectId,
  payload:   UpdateProjectPayload,
  updatedBy: Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(id);
  guardNotTerminal(project, 'Updating project fields');

  const updateData: Partial<IProject> = {
    updatedBy,
    lastActivityAt: new Date(),
  };

  if (payload.title !== undefined)              updateData.title              = payload.title;
  if (payload.description !== undefined)        updateData.description        = payload.description;
  if (payload.projectPriority !== undefined)    updateData.projectPriority    = payload.projectPriority;
  if (payload.internalNotes !== undefined)      updateData.internalNotes      = payload.internalNotes;
  if (payload.tags !== undefined)               updateData.tags               = payload.tags;
  if (payload.requiresClientInput !== undefined) updateData.requiresClientInput = payload.requiresClientInput;
  if (payload.requiresManualReview !== undefined) updateData.requiresManualReview = payload.requiresManualReview;
  if (payload.isBlocked !== undefined) {
    updateData.isBlocked  = payload.isBlocked;
    updateData.blockReason = payload.isBlocked ? payload.blockReason : undefined;
  }
  if (payload.progressPercentage !== undefined) updateData.progressPercentage = payload.progressPercentage;
  if (payload.expectedDeliveryDate)  updateData.expectedDeliveryDate  = new Date(payload.expectedDeliveryDate);
  if (payload.targetStartDate)       updateData.targetStartDate       = new Date(payload.targetStartDate);
  if (payload.targetCompletionDate)  updateData.targetCompletionDate  = new Date(payload.targetCompletionDate);

  // Re-evaluate lifecycle flags after update
  const flags = evaluateLifecycleFlags({
    projectStatus:       project.projectStatus,
    expectedDeliveryDate: updateData.expectedDeliveryDate ?? project.expectedDeliveryDate,
    lastActivityAt:      updateData.lastActivityAt ?? project.lastActivityAt,
  });
  updateData.isOverdue = flags.isOverdue;
  updateData.isStalled = flags.isStalled;
  if (!flags.isStalled) {
    updateData.lastActivityAt = new Date();
  }

  const updated = await updateProject(id, updateData);
  if (!updated) throw new NotFoundError('Project');
  return updated;
}

// ─── Status Transition ────────────────────────────────────────────────────────

export async function transitionProjectStatus(
  id:        Types.ObjectId,
  payload:   TransitionProjectStatusPayload,
  changedBy: Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(id);

  // Validate transition — throws on invalid
  validateProjectTransition(project.projectStatus, payload.status);

  // If transitioning to Completed — check completion gate
  if (payload.status === ProjectStatus.Completed) {
    const gate = evaluateCompletionGate(project);
    if (!gate.canComplete) {
      throw new BusinessRuleError(
        'Project cannot be completed — outstanding requirements must be satisfied.',
        {
          blockedByRequirements: gate.blockedByRequirements,
          pendingChecklistItems: gate.pendingChecklistItems,
        }
      );
    }
  }

  // Build lifecycle timestamp updates
  const timestamps = buildLifecycleTimestamps(payload.status);

  // Set startedAt on first entry to an active state
  const setStarted =
    !project.startedAt &&
    (payload.status === ProjectStatus.Active || payload.status === ProjectStatus.Onboarding);

  const historyEntry = buildStatusHistoryEntry(payload.status, changedBy, payload.note);

  const updateData: Partial<IProject> = {
    projectStatus:   payload.status,
    previousStatus:  project.projectStatus,
    updatedBy:       changedBy,
    lastActivityAt:  new Date(),
    isStalled:       false, // Any status change clears stalled flag
    ...timestamps,
  };

  if (setStarted) {
    updateData.startedAt = new Date();
  }

  if (payload.status === ProjectStatus.Cancelled) {
    updateData.cancellationReason = payload.cancellationReason;
    updateData.cancellationNote   = payload.cancellationNote;
  }

  // Re-evaluate lifecycle flags
  const flags = evaluateLifecycleFlags({
    projectStatus:       payload.status,
    expectedDeliveryDate: project.expectedDeliveryDate,
    lastActivityAt:      new Date(),
  });
  updateData.isOverdue = flags.isOverdue;

  // Push status history entry and update
  await pushStatusHistory(id, historyEntry);
  const updated = await updateProject(id, updateData);
  if (!updated) throw new NotFoundError('Project');

  logger.info('[ProjectService] Status transition', {
    projectCode: project.projectCode,
    from:        project.projectStatus,
    to:          payload.status,
    changedBy:   changedBy.toString(),
  });

  return updated;
}

// ─── Employee Assignment ──────────────────────────────────────────────────────

export async function assignEmployee(
  projectId: Types.ObjectId,
  body:      unknown,
  assignedBy: Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(projectId);

  const input = validateAssignEmployeeInput(body);

  const updatedEmployees = applyAssignEmployee(project, {
    userId:            new Types.ObjectId(input.userId),
    employeeProfileId: new Types.ObjectId(input.employeeProfileId),
    assignedBy,
    isPrimary:         input.isPrimary,
  });

  const updateData: Partial<IProject> = {
    assignedEmployees: updatedEmployees,
    updatedBy:         assignedBy,
    lastActivityAt:    new Date(),
  };

  if (input.isPrimary) {
    updateData.primaryManagerId = new Types.ObjectId(input.userId);
  }

  const updated = await updateProject(projectId, updateData);
  if (!updated) throw new NotFoundError('Project');

  logger.info('[ProjectService] Employee assigned', {
    projectCode:       project.projectCode,
    employeeProfileId: input.employeeProfileId,
    isPrimary:         input.isPrimary,
  });

  return updated;
}

export async function removeEmployee(
  projectId:         Types.ObjectId,
  employeeProfileId: Types.ObjectId,
  removedBy:         Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(projectId);

  const { employees, primaryManagerId } = applyRemoveEmployee(project, {
    employeeProfileId,
    removedBy,
  });

  const updateData: Partial<IProject> = {
    assignedEmployees: employees,
    primaryManagerId,
    updatedBy:         removedBy,
    lastActivityAt:    new Date(),
  };

  const updated = await updateProject(projectId, updateData);
  if (!updated) throw new NotFoundError('Project');
  return updated;
}

export async function setPrimaryManager(
  projectId: Types.ObjectId,
  employeeProfileId: Types.ObjectId,
  _userId:   Types.ObjectId,
  updatedBy: Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(projectId);

  const { employees, primaryManagerId } = applySetPrimaryManager(project, {
    employeeProfileId,
    updatedBy,
  });

  const updated = await updateProject(projectId, {
    assignedEmployees: employees,
    primaryManagerId,
    updatedBy,
    lastActivityAt: new Date(),
  });

  if (!updated) throw new NotFoundError('Project');
  return updated;
}

// ─── Checklist Management ─────────────────────────────────────────────────────

export async function updateChecklistItem(
  projectId: Types.ObjectId,
  payload:   UpdateChecklistItemPayload,
  updatedBy: Types.ObjectId
): Promise<IProject> {
  const project = await getProjectById(projectId);
  guardNotTerminal(project, 'Updating checklist');

  const checklist = project.completionChecklist.map((item) => {
    if (item.key !== payload.key) return item;
    return {
      ...item,
      status:      payload.status,
      notes:       payload.notes ?? item.notes,
      completedAt: payload.status === ChecklistItemStatus.Completed ? new Date() : item.completedAt,
      completedBy: payload.status === ChecklistItemStatus.Completed ? updatedBy : item.completedBy,
    };
  });

  const progress = calculateProgressFromChecklist(checklist);

  const updated = await updateProject(projectId, {
    completionChecklist: checklist,
    progressPercentage:  progress,
    updatedBy,
    lastActivityAt:      new Date(),
  });

  if (!updated) throw new NotFoundError('Project');
  return updated;
}

// ─── Lifecycle Maintenance ────────────────────────────────────────────────────

/**
 * Mark overdue activity on a project and bump lastActivityAt.
 * Called after any meaningful external event (document uploaded, note added, etc.)
 */
export async function recordProjectActivity(projectId: Types.ObjectId): Promise<void> {
  await clearStalledFlag(projectId);
}

/**
 * Scheduled: detect and flag overdue projects.
 * Returns the number of projects newly flagged as overdue.
 */
export async function runOverdueDetector(): Promise<number> {
  const candidates = await findCandidateOverdueProjects();
  if (candidates.length === 0) return 0;

  const ids = candidates.map((p) => p._id as Types.ObjectId);
  const count = await bulkSetOverdue(ids, true);

  logger.info('[ProjectService] Overdue detector run', { flaggedCount: count });
  return count;
}

/**
 * Scheduled: detect and flag stalled projects.
 * Returns the number of projects newly flagged as stalled.
 */
export async function runStalledDetector(
  thresholdDays = DEFAULT_STALL_THRESHOLD_DAYS
): Promise<number> {
  const thresholdDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000);
  const candidates    = await findCandidateStalledProjects(thresholdDate);
  if (candidates.length === 0) return 0;

  const ids   = candidates.map((p) => p._id as Types.ObjectId);
  const count = await bulkSetStalled(ids, true);

  logger.info('[ProjectService] Stalled detector run', {
    thresholdDays,
    flaggedCount: count,
  });
  return count;
}

// ─── Summary / Query Helpers ──────────────────────────────────────────────────

/**
 * Build a project summary response (lighter than full document).
 */
export function buildProjectSummary(project: IProject): Record<string, unknown> {
  return {
    _id:               project._id,
    projectCode:       project.projectCode,
    title:             project.title,
    projectStatus:     project.projectStatus,
    previousStatus:    project.previousStatus,
    projectPriority:   project.projectPriority,
    clientId:          project.clientId,
    primaryServiceSlug: project.primaryServiceSlug,
    serviceSlugs:      project.serviceSlugs,
    serviceDeliveryTypes: project.serviceDeliveryTypes,
    primaryManagerId:  project.primaryManagerId,
    activeAssignees:   getActiveAssignees(project).map((ae) => ({
      userId:            ae.userId,
      employeeProfileId: ae.employeeProfileId,
      isPrimary:         ae.isPrimary,
      assignedAt:        ae.assignedAt,
    })),
    progressPercentage: project.progressPercentage,
    isOverdue:          project.isOverdue,
    isStalled:          project.isStalled,
    isBlocked:          project.isBlocked,
    requiresClientInput: project.requiresClientInput,
    isBundleAnchor:     project.isBundleAnchor,
    subProjectIds:      project.subProjectIds,
    expectedDeliveryDate: project.expectedDeliveryDate,
    lastActivityAt:      project.lastActivityAt,
    startedAt:           project.startedAt,
    completedAt:         project.completedAt,
    createdAt:           (project as unknown as { createdAt: Date }).createdAt,
    updatedAt:           (project as unknown as { updatedAt: Date }).updatedAt,
  };
}
