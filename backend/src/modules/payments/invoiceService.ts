import { Types, FilterQuery } from 'mongoose';
import {
  Invoice,
  IInvoiceDocument,
  isValidInvoiceTransition,
  generateInvoiceNumber,
  computeLineItemTotal,
} from '../../models/invoice';
import {
  InvoiceStatus,
  InvoiceType,
  InvoiceCurrency,
} from '../../models/invoiceEnums';
import type { ILineItem } from '../../models/invoice';
import { AppError, NotFoundError, ValidationError } from '../../middlewares/errorHandler';
import { buildPaginationMeta, parsePagination } from '../../utils/response';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateInvoiceInput {
  title:          string;
  description?:   string;
  clientId:       string;
  projectId?:     string;
  invoiceType:    InvoiceType;
  lineItems:      Array<{
    serviceSlug?:  string;
    description:   string;
    quantity:      number;
    unitPrice:     number;  // paise
    taxRate?:      number;
  }>;
  dueDate?:       Date;
  generatedBy:    string;
  discountAmount?: number;  // paise
}

export interface InvoiceListQuery {
  clientId?:      string;
  projectId?:     string;
  invoiceStatus?: InvoiceStatus;
  page?:          unknown;
  limit?:         unknown;
  dateFrom?:      string;
  dateTo?:        string;
}

// ─── Invoice Sequence Counter ─────────────────────────────────────────────────
// Simple in-memory seed; production should use a MongoDB counter document.

async function getNextInvoiceSequence(): Promise<number> {
  const last = await Invoice.findOne({}, { invoiceNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (!last?.invoiceNumber) return 1;

  // Extract numeric suffix from KT-YYYY-NNNNNN
  const match = last.invoiceNumber.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) + 1 : 1;
}

// ─── Create Invoice ───────────────────────────────────────────────────────────

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<IInvoiceDocument> {
  if (!input.lineItems?.length) {
    throw new ValidationError('At least one line item is required');
  }

  // Compute line item totals
  const lineItems: ILineItem[] = input.lineItems.map((li) => {
    const taxRate = li.taxRate ?? 0;
    const total   = computeLineItemTotal(li.quantity, li.unitPrice, taxRate);
    return {
      serviceSlug: li.serviceSlug,
      description: li.description,
      quantity:    li.quantity,
      unitPrice:   li.unitPrice,
      taxRate,
      total,
    };
  });

  // Aggregate totals
  const subtotal       = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const taxAmount      = lineItems.reduce((s, li) => s + (li.total - li.quantity * li.unitPrice), 0);
  const discountAmount = input.discountAmount ?? 0;
  const totalAmount    = subtotal + taxAmount - discountAmount;

  if (totalAmount < 0) {
    throw new ValidationError('Total amount cannot be negative after discount');
  }

  const sequence      = await getNextInvoiceSequence();
  const invoiceNumber = generateInvoiceNumber(sequence);

  const invoice = await Invoice.create({
    invoiceNumber,
    title:          input.title,
    description:    input.description,
    clientId:       new Types.ObjectId(input.clientId),
    projectId:      input.projectId ? new Types.ObjectId(input.projectId) : undefined,
    generatedBy:    new Types.ObjectId(input.generatedBy),
    invoiceType:    input.invoiceType,
    invoiceStatus:  InvoiceStatus.Draft,
    lineItems,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    amountPaid:     0,
    amountDue:      totalAmount,
    currency:       InvoiceCurrency.INR,
    invoiceDate:    new Date(),
    dueDate:        input.dueDate,
    createdBy:      new Types.ObjectId(input.generatedBy),
  });

  logger.info('[InvoiceService] Invoice created', {
    invoiceNumber,
    clientId:    input.clientId,
    totalAmount,
  });

  return invoice;
}

// ─── Issue Invoice ────────────────────────────────────────────────────────────

export async function issueInvoice(
  invoiceId: string,
  approvedBy: string
): Promise<IInvoiceDocument> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (!isValidInvoiceTransition(invoice.invoiceStatus, InvoiceStatus.Issued)) {
    throw new AppError(
      `Cannot issue invoice in status "${invoice.invoiceStatus}"`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  invoice.invoiceStatus = InvoiceStatus.Issued;
  invoice.issuedAt      = new Date();
  invoice.approvedBy    = new Types.ObjectId(approvedBy);
  invoice.updatedBy     = new Types.ObjectId(approvedBy);
  await invoice.save();

  logger.info('[InvoiceService] Invoice issued', { invoiceId, invoiceNumber: invoice.invoiceNumber });
  return invoice;
}

// ─── Transition Invoice Status ────────────────────────────────────────────────

export async function transitionInvoiceStatus(
  invoiceId:  string,
  newStatus:  InvoiceStatus,
  actorId:    string
): Promise<IInvoiceDocument> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (!isValidInvoiceTransition(invoice.invoiceStatus, newStatus)) {
    throw new AppError(
      `Transition from "${invoice.invoiceStatus}" to "${newStatus}" is not allowed`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  invoice.invoiceStatus = newStatus;
  invoice.updatedBy     = new Types.ObjectId(actorId);

  if (newStatus === InvoiceStatus.Cancelled) invoice.cancelledAt = new Date();
  if (newStatus === InvoiceStatus.Paid)      invoice.paidAt      = new Date();

  await invoice.save();

  logger.info('[InvoiceService] Invoice status changed', {
    invoiceId,
    newStatus,
    actorId,
  });

  return invoice;
}

// ─── Record Payment on Invoice ────────────────────────────────────────────────

export async function applyPaymentToInvoice(
  invoiceId:  string,
  paymentId:  Types.ObjectId,
  amountPaid: number,           // paise
  actorId:    string
): Promise<IInvoiceDocument> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (
    invoice.invoiceStatus === InvoiceStatus.Cancelled ||
    invoice.invoiceStatus === InvoiceStatus.Refunded
  ) {
    throw new AppError(
      'Cannot apply payment to a cancelled or refunded invoice',
      422,
      'INVOICE_NOT_PAYABLE'
    );
  }

  // Update running totals
  invoice.amountPaid += amountPaid;
  invoice.amountDue   = Math.max(0, invoice.totalAmount - invoice.amountPaid);

  // Push payment ID reference
  if (!invoice.paymentIds.some((id) => id.equals(paymentId))) {
    invoice.paymentIds.push(paymentId);
  }

  // Determine new status
  if (invoice.amountPaid >= invoice.totalAmount) {
    if (invoice.amountPaid > invoice.totalAmount) {
      invoice.invoiceStatus = InvoiceStatus.Overpaid;
      invoice.overpaid      = true;
      logger.warn('[InvoiceService] Overpayment detected', {
        invoiceId,
        expected:  invoice.totalAmount,
        received:  invoice.amountPaid,
        excess:    invoice.amountPaid - invoice.totalAmount,
      });
    } else {
      invoice.invoiceStatus = InvoiceStatus.Paid;
      invoice.paidAt        = new Date();
      invoice.partiallyPaid = false;
    }
  } else {
    invoice.invoiceStatus = InvoiceStatus.PartiallyPaid;
    invoice.partiallyPaid = true;
  }

  invoice.updatedBy = new Types.ObjectId(actorId);
  await invoice.save();

  return invoice;
}

// ─── Mark Invoice Disputed ────────────────────────────────────────────────────

export async function markInvoiceDisputed(
  invoiceId: string,
  actorId:   string
): Promise<IInvoiceDocument> {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (!isValidInvoiceTransition(invoice.invoiceStatus, InvoiceStatus.Disputed)) {
    throw new AppError(
      `Cannot dispute invoice in status "${invoice.invoiceStatus}"`,
      422,
      'INVALID_STATUS_TRANSITION'
    );
  }

  invoice.invoiceStatus = InvoiceStatus.Disputed;
  invoice.disputed      = true;
  invoice.updatedBy     = new Types.ObjectId(actorId);
  await invoice.save();

  logger.info('[InvoiceService] Invoice disputed', { invoiceId });
  return invoice;
}

// ─── Get Invoice ──────────────────────────────────────────────────────────────

export async function getInvoiceById(
  invoiceId: string,
  clientId?: string    // If provided, enforces ownership check
): Promise<IInvoiceDocument> {
  const invoice = await Invoice.findById(invoiceId)
    .populate('clientId', 'displayName email')
    .populate('projectId', 'projectNumber title')
    .populate('generatedBy', 'email')
    .populate('paymentIds');

  if (!invoice) throw new NotFoundError('Invoice');

  // Client scoping — client can only view own invoices
  if (clientId && !invoice.clientId.equals(new Types.ObjectId(clientId))) {
    throw new NotFoundError('Invoice');
  }

  return invoice;
}

// ─── List Invoices ────────────────────────────────────────────────────────────

export async function listInvoices(
  query:    InvoiceListQuery,
  clientId?: string   // If provided, enforces client-scope filtering
) {
  const { page, limit, skip } = parsePagination(query.page, query.limit, 50);

  const filter: FilterQuery<IInvoiceDocument> = {};

  // Enforce client scope
  const effectiveClientId = clientId ?? query.clientId;
  if (effectiveClientId) {
    filter.clientId = new Types.ObjectId(effectiveClientId);
  }

  if (query.projectId) {
    filter.projectId = new Types.ObjectId(query.projectId);
  }

  if (query.invoiceStatus) {
    filter.invoiceStatus = query.invoiceStatus;
  }

  if (query.dateFrom || query.dateTo) {
    filter.invoiceDate = {};
    if (query.dateFrom) filter.invoiceDate.$gte = new Date(query.dateFrom);
    if (query.dateTo)   filter.invoiceDate.$lte = new Date(query.dateTo);
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('clientId', 'displayName email')
      .populate('projectId', 'projectNumber title')
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    meta: buildPaginationMeta(page, limit, total),
  };
}

// ─── Get Overdue Invoices ─────────────────────────────────────────────────────

export async function getOverdueInvoices(): Promise<IInvoiceDocument[]> {
  return Invoice.find({
    invoiceStatus: {
      $in: [InvoiceStatus.Issued, InvoiceStatus.PartiallyPaid],
    },
    dueDate: { $lt: new Date() },
  }).populate('clientId', 'displayName email');
}
