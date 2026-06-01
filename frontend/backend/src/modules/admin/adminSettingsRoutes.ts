/**
 * Admin System Settings Routes
 *
 * Base path: /api/v1/admin/settings
 *
 * All routes are admin-only.
 *
 * Route map:
 *   GET    /             — list all settings (optionally filtered by category)
 *   GET    /:key         — get a single setting by key
 *   PATCH  /:key         — update a setting value
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Types }         from 'mongoose';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireAdmin }  from '../../middlewares/rbac';
import { sendSuccess }   from '../../utils/response';
import { NotFoundError, ValidationError } from '../../middlewares/errorHandler';
import { SystemSetting } from '../../models/systemSetting';
import { AuditService }  from '../audit/auditService';
import { AuditAction, AuditCategory, AuditSource } from '../../models/auditLogEnums';
import { logger }        from '../../utils/logger';

export const adminSettingsRouter = Router();

adminSettingsRouter.use(authenticate, requireAdmin);

// ─── List all settings ────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/settings
 * Optional query: ?category=<category>
 */
adminSettingsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: Record<string, unknown> = {};
      if (req.query.category) filter.category = req.query.category;
      const settings = await SystemSetting.find(filter).sort({ category: 1, key: 1 }).lean();
      sendSuccess(res, { settings }, { message: 'Settings loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get single setting ───────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/settings/:key
 */
adminSettingsRouter.get(
  '/:key',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const setting = await SystemSetting.findOne({ key: req.params.key }).lean();
      if (!setting) throw new NotFoundError(`Setting '${req.params.key}'`);
      sendSuccess(res, { setting }, { message: 'Setting loaded' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Update a setting ─────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/admin/settings/:key
 * Body: { value: <new value> }
 */
adminSettingsRouter.patch(
  '/:key',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.body.value === undefined) {
        throw new ValidationError('Request body must include a `value` field.');
      }

      const auth = getAuthContext(req);
      const existing = await SystemSetting.findOne({ key: req.params.key });
      if (!existing) throw new NotFoundError(`Setting '${req.params.key}'`);

      const oldValue = existing.value;
      existing.value = req.body.value as typeof existing.value;
      existing.lastUpdatedById = new Types.ObjectId(auth.userId);
      await existing.save();

      await AuditService.log({
        actorUserId: auth.userId,
        actorRole: auth.role,
        entityType: 'system_setting',
        entityId: existing._id as Types.ObjectId,
        action: AuditAction.SystemSettingUpdated,
        category: AuditCategory.System,
        source: AuditSource.Api,
        metadata: { key: req.params.key, oldValue, newValue: existing.value },
      });

      logger.info('[AdminSettings] Setting updated', {
        key: req.params.key,
        oldValue,
        newValue: existing.value,
        updatedBy: auth.userId,
      });

      sendSuccess(res, { setting: existing }, { message: 'Setting updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);
