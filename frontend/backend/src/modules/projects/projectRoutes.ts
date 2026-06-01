/**
 * Project routes — Batch 3.1
 *
 * CRM project lifecycle API.
 *
 * Admin routes (full access):
 *   POST   /api/v1/projects                              — create project
 *   GET    /api/v1/projects                              — list all projects
 *   GET    /api/v1/projects/overdue                      — list overdue projects
 *   GET    /api/v1/projects/stalled                      — list stalled projects
 *   GET    /api/v1/projects/:id                          — get project detail
 *   PATCH  /api/v1/projects/:id                          — update project fields
 *   PATCH  /api/v1/projects/:id/status                   — lifecycle transition
 *   POST   /api/v1/projects/:id/assign                   — assign employee
 *   DELETE /api/v1/projects/:id/employees/:profileId     — remove employee
 *   PATCH  /api/v1/projects/:id/primary-manager          — set primary manager
 *   PATCH  /api/v1/projects/:id/checklist                — update checklist item
 *   GET    /api/v1/projects/:id/sub-projects             — list sub-projects
 *
 * Employee routes (assigned scope only):
 *   GET    /api/v1/projects                              — own assigned projects
 *   GET    /api/v1/projects/:id                          — assigned project detail
 *   PATCH  /api/v1/projects/:id                          — update fields (limited)
 *   PATCH  /api/v1/projects/:id/status                   — limited transitions
 *   PATCH  /api/v1/projects/:id/checklist                — update checklist item
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin, requireEmployee, requirePermissions } from '../../middlewares/rbac';
import { Permission, Role } from '../../utils/permissions';
import { sendSuccess, parsePagination, buildPaginationMeta } from '../../utils/response';
import { ValidationError, ForbiddenError } from '../../middlewares/errorHandler';

import {
  createProjectRecord,
  getProjectById,
  listProjectsWithMeta,
  updateProjectFields,
  transitionProjectStatus,
  assignEmployee,
  removeEmployee,
  setPrimaryManager,
  updateChecklistItem,
  getProjectWithSubProjects,
  buildProjectSummary,
} from './projectService';

import {
  validateCreateProject,
  validateUpdateProject,
  validateTransitionStatus,
  validateUpdateChecklistItem,
  validateSetPrimaryManager,
  parseProjectListQuery,
} from '../../validators/projectValidators';




// ─── Helper: validate and extract ObjectId param ──────────────────────────────

function requireIdParam(req: Request, paramName = 'id'): Types.ObjectId {
  const raw = req.params[paramName];
  if (!raw || !/^[0-9a-fA-F]{24}$/.test(raw)) {
    throw new ValidationError(`Route parameter "${paramName}" must be a valid 24-character ObjectId.`);
  }
  return new Types.ObjectId(raw);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const projectRouter = Router();

// All project routes require authentication
projectRouter.use(authenticate);

// ─── LIST PROJECTS ────────────────────────────────────────────────────────────

projectRouter.get(
  '/',
  requireEmployee, // Both admin and employee can list
  requirePermissions(Permission.PROJECTS_READ_ALL),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = getAuthContext(req);
      const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 100);
      const { filter, sortField, sortDirection } = parseProjectListQuery(
        req.query as Record<string, unknown>
      );

      // Employees can only see their assigned projects
      if (auth.role === Role.Employee && auth.employeeProfileId) {
        // If they didn't specify a specific assignedTo filter, scope to self
        if (!filter.assignedEmployeeId) {
          filter.assignedEmployeeId = auth.userId;
        } else if (filter.assignedEmployeeId !== auth.userId) {
          // Employees cannot list other employees' projects
          filter.assignedEmployeeId = auth.userId;
        }
      }

      const { projects, total } = await listProjectsWithMeta(
        filter,
        { field: sortField, direction: sortDirection },
        { page, limit, skip }
      );

      sendSuccess(res, projects.map(buildProjectSummary), {
        meta: buildPaginationMeta(page, limit, total),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── LIST OVERDUE PROJECTS ────────────────────────────────────────────────────

projectRouter.get(
  '/overdue',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 100);

      const { projects, total } = await listProjectsWithMeta(
        { isOverdue: true },
        { field: 'expectedDeliveryDate', direction: 'asc' },
        { page, limit, skip }
      );

      sendSuccess(res, projects.map(buildProjectSummary), {
        meta: buildPaginationMeta(page, limit, total),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── LIST STALLED PROJECTS ────────────────────────────────────────────────────

projectRouter.get(
  '/stalled',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 100);

      const { projects, total } = await listProjectsWithMeta(
        { isStalled: true },
        { field: 'lastActivityAt', direction: 'asc' },
        { page, limit, skip }
      );

      sendSuccess(res, projects.map(buildProjectSummary), {
        meta: buildPaginationMeta(page, limit, total),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── CREATE PROJECT ───────────────────────────────────────────────────────────

projectRouter.post(
  '/',
  requireAdmin,
  requirePermissions(Permission.PROJECTS_CREATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth    = getAuthContext(req);
      const payload = validateCreateProject(req.body);

      const project = await createProjectRecord({
        payload,
        createdBy: new Types.ObjectId(auth.userId),
      });

      sendSuccess(res, buildProjectSummary(project), {
        message:    'Project created successfully.',
        statusCode: 201,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET PROJECT DETAIL ───────────────────────────────────────────────────────

projectRouter.get(
  '/:id',
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);
      const { project, subProjects } = await getProjectWithSubProjects(projectId);

      // Employees can only view assigned projects
      if (auth.role === Role.Employee) {
        const isAssigned = project.assignedEmployees.some(
          (ae) => ae.isActive && ae.userId.toString() === auth.userId
        );
        if (!isAssigned) {
          throw new ForbiddenError('You are not assigned to this project.');
        }
      }

      sendSuccess(res, {
        ...buildProjectSummary(project),
        completionChecklist: project.completionChecklist,
        statusHistory:       project.statusHistory,
        internalNotes:       project.internalNotes,
        subProjects:         subProjects.map(buildProjectSummary),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── UPDATE PROJECT FIELDS ────────────────────────────────────────────────────

projectRouter.patch(
  '/:id',
  requireEmployee,
  requirePermissions(Permission.PROJECTS_UPDATE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);
      const payload   = validateUpdateProject(req.body);

      // Employees can only update assigned projects
      if (auth.role === Role.Employee) {
        const project = await getProjectById(projectId);
        const isAssigned = project.assignedEmployees.some(
          (ae) => ae.isActive && ae.userId.toString() === auth.userId
        );
        if (!isAssigned) {
          throw new ForbiddenError('You are not assigned to this project.');
        }
      }

      const updated = await updateProjectFields(
        projectId,
        payload,
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, buildProjectSummary(updated), {
        message: 'Project updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── STATUS TRANSITION ────────────────────────────────────────────────────────

projectRouter.patch(
  '/:id/status',
  requireEmployee,
  requirePermissions(Permission.PROJECTS_STATUS_CHANGE),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);

      // Load project first to get current status for validator
      const project = await getProjectById(projectId);

      // Employees can only transition assigned projects
      if (auth.role === Role.Employee) {
        const isAssigned = project.assignedEmployees.some(
          (ae) => ae.isActive && ae.userId.toString() === auth.userId
        );
        if (!isAssigned) {
          throw new ForbiddenError('You are not assigned to this project.');
        }
      }

      const payload = validateTransitionStatus(project.projectStatus, req.body);

      const updated = await transitionProjectStatus(
        projectId,
        payload,
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, buildProjectSummary(updated), {
        message: `Project status changed to "${payload.status}".`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── ASSIGN EMPLOYEE ──────────────────────────────────────────────────────────

projectRouter.post(
  '/:id/assign',
  requireAdmin,
  requirePermissions(Permission.PROJECTS_ASSIGN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);

      const updated = await assignEmployee(
        projectId,
        req.body,
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, buildProjectSummary(updated), {
        message: 'Employee assigned to project.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── REMOVE EMPLOYEE ──────────────────────────────────────────────────────────

projectRouter.delete(
  '/:id/employees/:profileId',
  requireAdmin,
  requirePermissions(Permission.PROJECTS_ASSIGN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth              = getAuthContext(req);
      const projectId         = requireIdParam(req);
      const employeeProfileId = requireIdParam(req, 'profileId');

      const updated = await removeEmployee(
        projectId,
        employeeProfileId,
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, buildProjectSummary(updated), {
        message: 'Employee removed from project.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── SET PRIMARY MANAGER ──────────────────────────────────────────────────────

projectRouter.patch(
  '/:id/primary-manager',
  requireAdmin,
  requirePermissions(Permission.PROJECTS_ASSIGN),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);
      const payload   = validateSetPrimaryManager(req.body);

      const updated = await setPrimaryManager(
        projectId,
        new Types.ObjectId(payload.employeeProfileId),
        new Types.ObjectId(payload.userId),
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, buildProjectSummary(updated), {
        message: 'Primary manager updated.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── UPDATE CHECKLIST ITEM ────────────────────────────────────────────────────

projectRouter.patch(
  '/:id/checklist',
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth      = getAuthContext(req);
      const projectId = requireIdParam(req);
      const payload   = validateUpdateChecklistItem(req.body);

      // Employees can only update checklist on assigned projects
      if (auth.role === Role.Employee) {
        const project = await getProjectById(projectId);
        const isAssigned = project.assignedEmployees.some(
          (ae) => ae.isActive && ae.userId.toString() === auth.userId
        );
        if (!isAssigned) {
          throw new ForbiddenError('You are not assigned to this project.');
        }
      }

      const updated = await updateChecklistItem(
        projectId,
        payload,
        new Types.ObjectId(auth.userId)
      );

      sendSuccess(res, {
        completionChecklist: updated.completionChecklist,
        progressPercentage:  updated.progressPercentage,
      }, {
        message: 'Checklist item updated.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET SUB-PROJECTS ─────────────────────────────────────────────────────────

projectRouter.get(
  '/:id/sub-projects',
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = requireIdParam(req);
      const { project, subProjects } = await getProjectWithSubProjects(projectId);

      sendSuccess(res, {
        projectCode:   project.projectCode,
        isBundleAnchor: project.isBundleAnchor,
        subProjects:   subProjects.map(buildProjectSummary),
      });
    } catch (err) {
      next(err);
    }
  }
);
