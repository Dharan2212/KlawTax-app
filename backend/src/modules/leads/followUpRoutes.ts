/**
 * Follow-Up Center Routes — Batch 2
 *
 * Dedicated routes for CRM follow-up management:
 *   GET  /api/v1/followups              — list follow-ups (today / upcoming / overdue)
 *   GET  /api/v1/followups/counts       — KPI counts for dashboard badges
 *   PATCH /api/v1/followups/:id/snooze  — push follow-up date forward
 *   PATCH /api/v1/followups/:id/done    — mark follow-up as completed (clear date)
 *
 * Uses the existing Lead model's `followUpDate` field.
 * No schema changes required.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth';
import { requireEmployee } from '../../middlewares/rbac';
import { sendSuccess, parsePagination } from '../../utils/response';
import { Lead } from '../../models/lead';
import { ACTIVE_LEAD_STATUSES } from '../../models/leadEnums';
import { Types } from 'mongoose';
import { logger } from '../../utils/logger';

export const followUpRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ─── GET /api/v1/followups — paginated follow-up list ─────────────────────────

followUpRouter.get(
  '/',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = parsePagination(req.query.page, req.query.limit, 50);
      const bucket = (req.query.bucket as string) || 'all'; // today | upcoming | overdue | all
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

      const now = new Date();
      const todayStart = startOfDay(now);
      const todayEnd   = endOfDay(now);

      // Base: active leads with a followUpDate set
      const baseMatch: Record<string, unknown> = {
        status:      { $in: ACTIVE_LEAD_STATUSES },
        followUpDate: { $exists: true, $ne: null },
      };

      // Bucket filters
      if (bucket === 'overdue') {
        baseMatch.followUpDate = { $lt: todayStart };
      } else if (bucket === 'today') {
        baseMatch.followUpDate = { $gte: todayStart, $lte: todayEnd };
      } else if (bucket === 'upcoming') {
        baseMatch.followUpDate = { $gt: todayEnd, $lte: daysFromNow(7) };
      }
      // 'all' → no date restriction beyond $exists

      // Search overlay
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const r = { $regex: escaped, $options: 'i' };
        baseMatch.$or = [
          { fullName: r }, { phone: r }, { email: r }, { organisationName: r },
        ];
      }

      const [docs, total] = await Promise.all([
        Lead.find(baseMatch)
          .select('fullName phone email organisationName status priority followUpDate lastContactedAt internalNotes notes assignedTo createdAt')
          .sort({ followUpDate: bucket === 'upcoming' ? 1 : -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Lead.countDocuments(baseMatch),
      ]);

      const totalPages = Math.ceil(total / limit);
      sendSuccess(res, { followUps: docs, total }, {
        meta: { page, limit, totalPages, total, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /api/v1/followups/counts — KPI badge counts ─────────────────────────

followUpRouter.get(
  '/counts',
  authenticate,
  requireEmployee,
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now        = new Date();
      const todayStart = startOfDay(now);
      const todayEnd   = endOfDay(now);

      const baseActive = {
        status:      { $in: ACTIVE_LEAD_STATUSES },
        followUpDate: { $exists: true, $ne: null },
      };

      const [overdue, today, upcoming] = await Promise.all([
        Lead.countDocuments({ ...baseActive, followUpDate: { $lt: todayStart } }),
        Lead.countDocuments({ ...baseActive, followUpDate: { $gte: todayStart, $lte: todayEnd } }),
        Lead.countDocuments({ ...baseActive, followUpDate: { $gt: todayEnd, $lte: daysFromNow(7) } }),
      ]);

      sendSuccess(res, { overdue, today, upcoming, total: overdue + today + upcoming });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/v1/followups/:id/snooze — push date forward ──────────────────

followUpRouter.patch(
  '/:id/snooze',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid lead ID.' });
        return;
      }

      // days: how many days to push forward (default 1, max 30)
      const rawDays = parseInt(String(req.body.days ?? '1'), 10);
      const days    = Math.min(Math.max(1, isNaN(rawDays) ? 1 : rawDays), 30);

      const lead = await Lead.findById(id).exec();
      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found.' });
        return;
      }

      const base = lead.followUpDate instanceof Date && !isNaN(lead.followUpDate.getTime())
        ? new Date(lead.followUpDate)
        : new Date();

      base.setDate(base.getDate() + days);
      lead.followUpDate = base;
      await lead.save();

      logger.info('[FollowUp] Snoozed', { leadId: String(lead._id), newDate: base.toISOString(), days });
      sendSuccess(res, { leadId: id, newFollowUpDate: base.toISOString(), days }, { message: `Follow-up snoozed by ${days} day(s).` });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /api/v1/followups/:id/done — clear follow-up date ─────────────────

followUpRouter.patch(
  '/:id/done',
  authenticate,
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid lead ID.' });
        return;
      }

      const note = typeof req.body.note === 'string' ? req.body.note.trim() : undefined;

      const lead = await Lead.findById(id).exec();
      if (!lead) {
        res.status(404).json({ success: false, message: 'Lead not found.' });
        return;
      }

      lead.followUpDate     = undefined;
      lead.lastContactedAt  = new Date();
      if (note) {
        lead.internalNotes = note;
      }
      await lead.save();

      logger.info('[FollowUp] Marked done', { leadId: String(lead._id) });
      sendSuccess(res, { leadId: id }, { message: 'Follow-up marked as done.' });
    } catch (err) {
      next(err);
    }
  }
);
