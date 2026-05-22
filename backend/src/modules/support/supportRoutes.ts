import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { requireEmployee } from '../../middlewares/rbac';
import { sendSuccess } from '../../utils/response';
import { SupportService } from './supportService';
import { AppError } from '../../middlewares/errorHandler';
import type { ISupportMessage } from '../../models/supportTicket';
import {
  createTicketSchema,
  addMessageSchema,
  updateTicketSchema,
  ticketListQuerySchema,
} from './supportValidators';

export const supportRouter = Router();

supportRouter.use(authenticate);

// ─── POST /support/tickets ────────────────────────────────────────────────────

supportRouter.post(
  '/tickets',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const parsed = createTicketSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Validation error', 400);
      }

      const ticket = await SupportService.createTicket(
        parsed.data,
        auth.userId,
        auth.role,
        { clientId: auth.role === 'client' ? auth.userId : undefined }
      );

      sendSuccess(res, ticket, { statusCode: 201, message: 'Support ticket created' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /support/tickets ─────────────────────────────────────────────────────

supportRouter.get(
  '/tickets',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const parsed = ticketListQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        throw new AppError('Invalid query parameters', 400);
      }

      const { tickets, meta } = await SupportService.listTickets(
        parsed.data,
        auth.userId,
        auth.role
      );

      sendSuccess(res, tickets, { meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /support/tickets/:id ─────────────────────────────────────────────────

supportRouter.get(
  '/tickets/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const ticket = await SupportService.getTicketById(req.params.id, auth.userId, auth.role);

      // Strip internal-only messages and notes for clients
      if (auth.role === 'client') {
        ticket.messages = ticket.messages.filter(
          (msg: ISupportMessage) => !msg.internalOnly
        );
        ticket.internalNotes = undefined;
      }

      sendSuccess(res, ticket);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /support/tickets/:id — Admin/Employee only ────────────────────────

supportRouter.patch(
  '/tickets/:id',
  requireEmployee,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const parsed = updateTicketSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Validation error', 400);
      }

      const ticket = await SupportService.updateTicket(
        req.params.id,
        parsed.data,
        auth.userId,
        auth.role
      );

      sendSuccess(res, ticket, { message: 'Ticket updated' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /support/tickets/:id/messages ──────────────────────────────────────

supportRouter.post(
  '/tickets/:id/messages',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = getAuthContext(req);
      const parsed = addMessageSchema.safeParse(req.body);

      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Validation error', 400);
      }

      const ticket = await SupportService.addMessage(
        req.params.id,
        parsed.data,
        auth.userId,
        auth.role
      );

      sendSuccess(res, ticket, { statusCode: 201, message: 'Message added' });
    } catch (err) {
      next(err);
    }
  }
);
