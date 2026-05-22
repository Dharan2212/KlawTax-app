/**
 * Task Routes — Batch 3.2
 *
 * CRM routes (auth-protected):
 *   GET    /api/v1/tasks                    — list tasks (Admin + Employee)
 *   POST   /api/v1/tasks                    — create task (Admin + Employee)
 *   GET    /api/v1/tasks/:id                — get task (Admin + Employee)
 *   PATCH  /api/v1/tasks/:id                — update task (Admin + Employee)
 *   DELETE /api/v1/tasks/:id                — delete task (Admin only)
 *   PATCH  /api/v1/tasks/:id/status         — transition status (Admin + Employee)
 *   POST   /api/v1/tasks/:id/dependencies   — add dependency (Admin + Employee)
 *   DELETE /api/v1/tasks/:id/dependencies/:depId — remove dependency (Admin + Employee)
 *   PATCH  /api/v1/tasks/:id/checklist      — update checklist item (Admin + Employee)
 *   POST   /api/v1/tasks/:id/archive        — archive task (Admin only)
 *   GET    /api/v1/tasks/:id/children       — list child tasks (Admin + Employee)
 *   GET    /api/v1/tasks/project/:projectId/summary — project task summary
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin, requireEmployee } from '../../middlewares/rbac';
import { sendSuccess } from '../../utils/response';
import { Role } from '../../utils/permissions';
import { TimelineActorRole } from '../../models/taskEnums';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatusTransition,
  validateAddDependency,
  validateUpdateChecklistItem,
  validateTaskQuery,
} from '../../validators/taskValidators';
import * as TaskService from './taskService';
import type { TimelineActorContext } from '../timeline/timelineService';

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildActor(req: Request): TimelineActorContext {
  const auth = getAuthContext(req);
  const roleMap: Record<string, TimelineActorRole> = {
    [Role.Admin]:    TimelineActorRole.Admin,
    [Role.Employee]: TimelineActorRole.Employee,
    [Role.Client]:   TimelineActorRole.Client,
  };

  return {
    actorId:          auth.userId,
    actorRole:        roleMap[auth.role] ?? TimelineActorRole.System,
    actorDisplayName: auth.email,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const taskRouter = Router();

// ── List tasks ────────────────────────────────────────────────────────────────
taskRouter.get(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = validateTaskQuery(req.query);
      const result  = await TaskService.listTasks(filters);

      sendSuccess(res, result.tasks, {
        message: 'Tasks retrieved',
        meta:    result.meta,
      });
    } catch (err) { next(err); }
  }
);

// ── Create task ───────────────────────────────────────────────────────────────
taskRouter.post(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateCreateTask(req.body);
      const actor = buildActor(req);
      const task  = await TaskService.createTask(dto, actor);

      sendSuccess(res, task, {
        message:    'Task created',
        statusCode: 201,
      });
    } catch (err) { next(err); }
  }
);

// ── Project task summary ──────────────────────────────────────────────────────
taskRouter.get(
  '/project/:projectId/summary',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await TaskService.getTaskSummaryForProject(req.params.projectId);
      sendSuccess(res, summary, { message: 'Task summary retrieved' });
    } catch (err) { next(err); }
  }
);

// ── Get task by ID ────────────────────────────────────────────────────────────
taskRouter.get(
  '/:id',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await TaskService.getTaskById(req.params.id);
      sendSuccess(res, task);
    } catch (err) { next(err); }
  }
);

// ── Get child tasks ───────────────────────────────────────────────────────────
taskRouter.get(
  '/:id/children',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const children = await TaskService.getTaskChildren(req.params.id);
      sendSuccess(res, children, { message: 'Child tasks retrieved' });
    } catch (err) { next(err); }
  }
);

// ── Update task ───────────────────────────────────────────────────────────────
taskRouter.patch(
  '/:id',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateUpdateTask(req.body);
      const actor = buildActor(req);
      const task  = await TaskService.updateTask(req.params.id, dto, actor);

      sendSuccess(res, task, { message: 'Task updated' });
    } catch (err) { next(err); }
  }
);

// ── Status transition ─────────────────────────────────────────────────────────
taskRouter.patch(
  '/:id/status',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateTaskStatusTransition(req.body);
      const actor = buildActor(req);
      const task  = await TaskService.transitionTaskStatus(req.params.id, dto, actor);

      sendSuccess(res, task, { message: `Task status updated to "${dto.status}"` });
    } catch (err) { next(err); }
  }
);

// ── Add dependency ────────────────────────────────────────────────────────────
taskRouter.post(
  '/:id/dependencies',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateAddDependency(req.body);
      const actor = buildActor(req);
      const task  = await TaskService.addTaskDependency(
        req.params.id,
        dto.dependencyTaskId,
        actor
      );

      sendSuccess(res, task, { message: 'Dependency added', statusCode: 201 });
    } catch (err) { next(err); }
  }
);

// ── Remove dependency ─────────────────────────────────────────────────────────
taskRouter.delete(
  '/:id/dependencies/:depId',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = buildActor(req);
      const task  = await TaskService.removeTaskDependency(
        req.params.id,
        req.params.depId,
        actor
      );

      sendSuccess(res, task, { message: 'Dependency removed' });
    } catch (err) { next(err); }
  }
);

// ── Update checklist item ─────────────────────────────────────────────────────
taskRouter.patch(
  '/:id/checklist',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateUpdateChecklistItem(req.body);
      const actor = buildActor(req);
      const task  = await TaskService.updateChecklistItem(
        req.params.id,
        dto.checklistItemId,
        dto.isCompleted,
        actor
      );

      sendSuccess(res, task, { message: 'Checklist item updated' });
    } catch (err) { next(err); }
  }
);

// ── Archive task (Admin only) ─────────────────────────────────────────────────
taskRouter.post(
  '/:id/archive',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = buildActor(req);
      const task  = await TaskService.archiveTask(req.params.id, actor);

      sendSuccess(res, task, { message: 'Task archived' });
    } catch (err) { next(err); }
  }
);

// ── Delete task (Admin only) ──────────────────────────────────────────────────
taskRouter.delete(
  '/:id',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await TaskService.deleteTask(req.params.id);
      sendSuccess(res, null, { message: 'Task deleted' });
    } catch (err) { next(err); }
  }
);
