import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { sendSuccess } from '../../utils/response';
import { NotificationService } from './notificationService';
import { NotificationCategory, NotificationPriority } from '../../models/notificationEnums';
import { AppError } from '../../middlewares/errorHandler';

export const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(authenticate);

// ─── GET /notifications/unread-count ──────────────────────────────────────────

notificationRouter.get(
  '/unread-count',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const isClient = auth.role === 'client';

      const count = await NotificationService.getUnreadCount(auth.userId, {
        clientSafeOnly: isClient,
      });

      sendSuccess(res, { count });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /notifications ───────────────────────────────────────────────────────

notificationRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const isClient = auth.role === 'client';

      const { isRead, isDismissed, category, priority, page, limit } = req.query;

      const result = await NotificationService.getFeed({
        recipientId: auth.userId,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        isDismissed: isDismissed === 'true' ? true : isDismissed === 'false' ? false : undefined,
        category: category as NotificationCategory | undefined,
        priority: priority as NotificationPriority | undefined,
        clientSafeOnly: isClient,
        excludeInternal: !isClient && auth.role === 'employee',
        page,
        limit,
      });

      sendSuccess(res, { notifications: result.notifications, total: result.meta.total }, { meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /notifications/:id/read ────────────────────────────────────────────

notificationRouter.patch(
  '/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const updated = await NotificationService.markRead(req.params.id, auth.userId);

      if (!updated) {
        throw new AppError('Notification not found or already read', 404);
      }

      sendSuccess(res, null, { message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /notifications/read-all ────────────────────────────────────────────

notificationRouter.patch(
  '/read-all',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const { category } = req.query;

      const count = await NotificationService.markAllRead(auth.userId, {
        category: category as NotificationCategory | undefined,
      });

      sendSuccess(res, { updatedCount: count }, { message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /notifications/:id ────────────────────────────────────────────────

notificationRouter.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const dismissed = await NotificationService.dismiss(req.params.id, auth.userId);

      if (!dismissed) {
        throw new AppError('Notification not found', 404);
      }

      sendSuccess(res, null, { message: 'Notification dismissed' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /notifications (dismiss all) ─────────────────────────────────────

notificationRouter.delete(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const count = await NotificationService.dismissAll(auth.userId);

      sendSuccess(res, { dismissedCount: count }, { message: 'All notifications dismissed' });
    } catch (err) {
      next(err);
    }
  }
);
