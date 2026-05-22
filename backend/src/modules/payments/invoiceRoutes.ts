import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, type AuthenticatedRequest } from '../../middlewares/auth';
import { allowRoles }  from '../../middlewares/rbac';
import { Role }         from '../../utils/permissions';
import { sendSuccess }   from '../../utils/response';
import { ValidationError } from '../../middlewares/errorHandler';
import {
  createInvoice,
  issueInvoice,
  transitionInvoiceStatus,
  markInvoiceDisputed,
  getInvoiceById,
  listInvoices,
  getOverdueInvoices,
} from './invoiceService';
import { InvoiceStatus, InvoiceType } from '../../models/invoiceEnums';

// ─── Router ───────────────────────────────────────────────────────────────────

export const invoiceRouter = Router();

// ─── Admin: Create Invoice ────────────────────────────────────────────────────

invoiceRouter.post(
  '/',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;

      const { title, description, clientId, projectId, invoiceType, lineItems, dueDate, discountAmount } = req.body as {
        title:          string;
        description?:   string;
        clientId:       string;
        projectId?:     string;
        invoiceType?:   InvoiceType;
        lineItems:      Array<{
          serviceSlug?:  string;
          description:   string;
          quantity:      number;
          unitPrice:     number;
          taxRate?:      number;
        }>;
        dueDate?:       string;
        discountAmount?: number;
      };

      if (!title?.trim())    throw new ValidationError('title is required');
      if (!clientId?.trim()) throw new ValidationError('clientId is required');
      if (!lineItems?.length) throw new ValidationError('lineItems are required');

      const invoice = await createInvoice({
        title,
        description,
        clientId,
        projectId,
        invoiceType:    invoiceType ?? InvoiceType.Service,
        lineItems,
        dueDate:        dueDate ? new Date(dueDate) : undefined,
        discountAmount: discountAmount ?? 0,
        generatedBy:    auth.userId,
      });

      sendSuccess(res, { invoice }, { statusCode: 201, message: 'Invoice created' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── List Invoices ────────────────────────────────────────────────────────────

invoiceRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;

      // Clients only see own invoices
      const scopedClientId =
        auth.role === 'client' ? auth.clientProfileId : undefined;

      const result = await listInvoices(
        {
          clientId:      req.query['clientId'] as string | undefined,
          projectId:     req.query['projectId'] as string | undefined,
          invoiceStatus: req.query['invoiceStatus'] as InvoiceStatus | undefined,
          page:          req.query['page'],
          limit:         req.query['limit'],
          dateFrom:      req.query['dateFrom'] as string | undefined,
          dateTo:        req.query['dateTo'] as string | undefined,
        },
        scopedClientId
      );

      sendSuccess(res, result.invoices, { meta: result.meta });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get Overdue Invoices (Admin) ─────────────────────────────────────────────

invoiceRouter.get(
  '/overdue',
  authenticate,
  allowRoles(Role.Admin),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await getOverdueInvoices();
      sendSuccess(res, invoices);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Get Single Invoice ───────────────────────────────────────────────────────

invoiceRouter.get(
  '/:invoiceId',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = (req as AuthenticatedRequest).auth;
      const scopedClientId = auth.role === 'client' ? auth.clientProfileId : undefined;

      const invoice = await getInvoiceById(req.params['invoiceId']!, scopedClientId);
      sendSuccess(res, { invoice });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Issue Invoice (Admin) ────────────────────────────────────────────────────

invoiceRouter.patch(
  '/:invoiceId/issue',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth    = (req as AuthenticatedRequest).auth;
      const invoice = await issueInvoice(req.params['invoiceId']!, auth.userId);
      sendSuccess(res, { invoice }, { message: 'Invoice issued' });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Transition Invoice Status (Admin) ────────────────────────────────────────

invoiceRouter.patch(
  '/:invoiceId/status',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth   = (req as AuthenticatedRequest).auth;
      const { status } = req.body as { status: InvoiceStatus };

      if (!status) throw new ValidationError('status is required');

      const invoice = await transitionInvoiceStatus(
        req.params['invoiceId']!,
        status,
        auth.userId
      );

      sendSuccess(res, { invoice }, { message: `Invoice status changed to ${status}` });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Mark Invoice Disputed (Admin) ───────────────────────────────────────────

invoiceRouter.patch(
  '/:invoiceId/dispute',
  authenticate,
  allowRoles(Role.Admin),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth    = (req as AuthenticatedRequest).auth;
      const invoice = await markInvoiceDisputed(req.params['invoiceId']!, auth.userId);
      sendSuccess(res, { invoice }, { message: 'Invoice marked as disputed' });
    } catch (err) {
      next(err);
    }
  }
);
