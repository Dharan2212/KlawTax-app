/**
 * Timeline Routes — Batch 3.2
 *
 * Routes:
 *   GET  /api/v1/timeline           — paginated feed (Admin + Employee)
 *   GET  /api/v1/timeline/grouped   — grouped feed (Admin + Employee)
 *   GET  /api/v1/timeline/client    — client-visible feed (Client + Admin)
 *   POST /api/v1/timeline           — manual entry (Admin only)
 *   GET  /api/v1/timeline/task/:id  — task-level timeline (Admin + Employee)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin, requireEmployee, requireClient } from '../../middlewares/rbac';
import { sendSuccess } from '../../utils/response';
import { Role } from '../../utils/permissions';
import {
  TimelineActorRole,
  TimelineVisibility,
} from '../../models/taskEnums';
import {
  validateCreateManualTimelineEntry,
  validateTimelineQuery,
} from '../../validators/timelineValidators';
import {
  createTimelineEntry,
  getTimelineFeed,
  getGroupedTimelineFeed,
  resolveVisibilityFilter,
} from './timelineService';
import type { TimelineActorContext } from './timelineService';

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

function resolveRoleFilter(req: Request): TimelineVisibility[] {
  const auth = getAuthContext(req);
  const timelineRole =
    auth.role === Role.Admin    ? TimelineActorRole.Admin    :
    auth.role === Role.Employee ? TimelineActorRole.Employee :
                                  TimelineActorRole.Client;
  return resolveVisibilityFilter(timelineRole);
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const timelineRouter = Router();

// ── Client-visible feed ───────────────────────────────────────────────────────
timelineRouter.get(
  '/client',
  authenticate,
  requireClient,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = validateTimelineQuery(req.query);

      const { entries, meta } = await getTimelineFeed(
        {
          projectId:     query.projectId,
          taskId:        query.taskId,
          eventCategory: query.eventCategory,
          eventType:     query.eventType,
          since:         query.since ? new Date(query.since) : undefined,
          until:         query.until ? new Date(query.until) : undefined,
          page:          query.page,
          limit:         query.limit,
        },
        [TimelineVisibility.Client]
      );

      sendSuccess(res, entries, { message: 'Client timeline feed retrieved', meta });
    } catch (err) { next(err); }
  }
);

// ── Grouped timeline feed ─────────────────────────────────────────────────────
timelineRouter.get(
  '/grouped',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = validateTimelineQuery(req.query);
      const visibilityFilter = resolveRoleFilter(req);

      const groups = await getGroupedTimelineFeed(
        {
          projectId: query.projectId,
          taskId:    query.taskId,
          since:     query.since ? new Date(query.since) : undefined,
          until:     query.until ? new Date(query.until) : undefined,
          limit:     query.limit,
        },
        visibilityFilter
      );

      sendSuccess(res, groups, { message: 'Grouped timeline feed retrieved' });
    } catch (err) { next(err); }
  }
);

// ── Task-level timeline ───────────────────────────────────────────────────────
timelineRouter.get(
  '/task/:taskId',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = validateTimelineQuery(req.query);
      const visibilityFilter = resolveRoleFilter(req);

      const { entries, meta } = await getTimelineFeed(
        {
          taskId:        req.params.taskId,
          eventCategory: query.eventCategory,
          page:          query.page,
          limit:         query.limit,
          since:         query.since ? new Date(query.since) : undefined,
          until:         query.until ? new Date(query.until) : undefined,
        },
        visibilityFilter
      );

      sendSuccess(res, entries, { message: 'Task timeline retrieved', meta });
    } catch (err) { next(err); }
  }
);

// ── Full timeline feed (Admin + Employee) ─────────────────────────────────────
timelineRouter.get(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = validateTimelineQuery(req.query);
      const visibilityFilter = resolveRoleFilter(req);

      const { entries, meta } = await getTimelineFeed(
        {
          projectId:     query.projectId,
          taskId:        query.taskId,
          eventCategory: query.eventCategory,
          eventType:     query.eventType,
          since:         query.since ? new Date(query.since) : undefined,
          until:         query.until ? new Date(query.until) : undefined,
          page:          query.page,
          limit:         query.limit,
        },
        visibilityFilter
      );

      sendSuccess(res, entries, { message: 'Timeline feed retrieved', meta });
    } catch (err) { next(err); }
  }
);

// ── Create manual timeline entry (Admin only) ─────────────────────────────────
timelineRouter.post(
  '/',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto   = validateCreateManualTimelineEntry(req.body);
      const actor = buildActor(req);

      const entry = await createTimelineEntry({
        projectId:     dto.projectId,
        taskId:        dto.taskId,
        eventType:     dto.eventType,
        eventCategory: dto.eventCategory,
        title:         dto.title,
        description:   dto.description,
        visibility:    dto.visibility,
        actor,
        tags:          dto.tags,
        systemGenerated: false,
      });

      sendSuccess(res, entry, { message: 'Timeline entry created', statusCode: 201 });
    } catch (err) { next(err); }
  }
);
