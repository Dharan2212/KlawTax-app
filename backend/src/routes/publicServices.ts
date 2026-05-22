/**
 * Public Services Router
 *
 * All routes are unauthenticated — no JWT required.
 * These power the homepage, services listing, and service detail pages.
 *
 * Routes:
 *   GET /api/v1/services          List services (filtered, paginated)
 *   GET /api/v1/services/featured Featured services (hero card + homepage sections)
 *   GET /api/v1/services/:slug    Service detail (includes bundle sub-services + related)
 *
 * NOTE: /featured must be registered before /:slug to prevent Express from
 * treating the literal string "featured" as a slug parameter.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { serviceService } from '../modules/services';
import {
  validateServiceListQuery,
  validateServiceSlugParam,
} from '../validators/serviceQuery.validator';
import { sendSuccess } from '../utils/response';
import { AppError, NotFoundError } from '../middlewares/errorHandler';

export const publicServicesRouter = Router();

// ─── GET /api/v1/services ─────────────────────────────────────────────────────

publicServicesRouter.get(
  '/',
  validateServiceListQuery,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // req.validatedQuery is populated by validateServiceListQuery middleware
    // The global augmentation in serviceQuery.validator.ts guarantees the type
    const vq = req.validatedQuery!;

    try {
      const result = await serviceService.listServices(
        {
          displayCategory: vq.displayCategory,
          deliveryType: vq.deliveryType,
          featured: vq.featured,
          isBundle: vq.isBundle,
          search: vq.search,
        },
        {
          page: vq.page,
          limit: vq.limit,
          sortBy: vq.sortBy,
          sortOrder: vq.sortOrder,
        }
      );

      sendSuccess(res, result, { message: 'Services retrieved successfully' });
    } catch (err) {
      next(err instanceof AppError ? err : new AppError('Failed to retrieve services'));
    }
  }
);

// ─── GET /api/v1/services/featured ───────────────────────────────────────────

publicServicesRouter.get(
  '/featured',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await serviceService.getFeaturedServices();
      sendSuccess(res, { data }, { message: 'Featured services retrieved successfully' });
    } catch (err) {
      next(err instanceof AppError ? err : new AppError('Failed to retrieve featured services'));
    }
  }
);

// ─── GET /api/v1/services/:slug ───────────────────────────────────────────────

publicServicesRouter.get(
  '/:slug',
  validateServiceSlugParam,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { slug } = req.params;

    try {
      const result = await serviceService.getServiceBySlug(slug);

      if (!result) {
        next(new NotFoundError(`Service "${slug}"`));
        return;
      }

      sendSuccess(res, result, { message: 'Service retrieved successfully' });
    } catch (err) {
      next(err instanceof AppError ? err : new AppError('Failed to retrieve service'));
    }
  }
);
