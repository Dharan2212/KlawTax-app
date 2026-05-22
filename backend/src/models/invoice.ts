import { Schema, model, models, Document, Types, Model } from 'mongoose';
import {
  InvoiceStatus,
  InvoiceType,
  InvoiceCurrency,
  INVOICE_TRANSITIONS,
} from './invoiceEnums';

// ─── Sub-document Interfaces ─────────────────────────────────────────────────

export interface ILineItem {
  serviceSlug?: string;
  description:  string;
  quantity:     number;
  unitPrice:    number;   // stored in paise (integer)
  taxRate:      number;   // percentage e.g. 18 for 18%
  total:        number;   // computed: quantity * unitPrice + tax (paise)
}

// ─── Main Interface ───────────────────────────────────────────────────────────

export interface IInvoice {
  // Identity
  invoiceNumber:  string;
  title:          string;
  description?:   string;

  // Relationships
  clientId:     Types.ObjectId;
  projectId?:   Types.ObjectId;
  generatedBy:  Types.ObjectId;   // Admin/Employee who created the invoice
  approvedBy?:  Types.ObjectId;   // Admin who approved for dispatch

  // Financials — ALL amounts stored as integers in paise to avoid float issues
  subtotal:        number;  // sum of line item totals before tax/discount (paise)
  taxAmount:       number;  // total tax (paise)
  discountAmount:  number;  // discount applied (paise)
  totalAmount:     number;  // subtotal + taxAmount - discountAmount (paise)
  amountPaid:      number;  // cumulative amount paid so far (paise)
  amountDue:       number;  // totalAmount - amountPaid (paise)
  currency:        InvoiceCurrency;

  // Invoice Metadata
  invoiceType:   InvoiceType;
  invoiceStatus: InvoiceStatus;
  invoiceDate:   Date;
  dueDate?:      Date;
  paidAt?:       Date;
  cancelledAt?:  Date;
  issuedAt?:     Date;

  // Line Items
  lineItems: ILineItem[];

  // Razorpay Metadata
  razorpayOrderId?:  string;
  paymentIds:        Types.ObjectId[];  // refs to Payment collection

  // Workflow Flags
  partiallyPaid:    boolean;
  overpaid:         boolean;
  disputed:         boolean;
  manuallyAdjusted: boolean;

  // Audit
  createdBy?:  Types.ObjectId;
  updatedBy?:  Types.ObjectId;
  createdAt:   Date;
  updatedAt:   Date;
}

export type IInvoiceDocument = IInvoice & Document;
export type IInvoiceModel    = Model<IInvoiceDocument>;

// ─── Sub-Schemas ──────────────────────────────────────────────────────────────

const lineItemSchema = new Schema<ILineItem>(
  {
    serviceSlug: { type: String, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    quantity:    { type: Number, required: true, min: 1, default: 1 },
    unitPrice:   { type: Number, required: true, min: 0 },  // paise
    taxRate:     { type: Number, required: true, min: 0, max: 100, default: 0 },
    total:       { type: Number, required: true, min: 0 },  // paise
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const invoiceSchema = new Schema<IInvoiceDocument>(
  {
    invoiceNumber: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    title: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 200,
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: 1000,
    },

    // ── Relationships ──────────────────────────────────────────────────────
    clientId: {
      type:     Schema.Types.ObjectId,
      ref:      'ClientProfile',
      required: true,
      index:    true,
    },

    projectId: {
      type:  Schema.Types.ObjectId,
      ref:   'Project',
      index: true,
    },

    generatedBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },

    // ── Financials (paise) ─────────────────────────────────────────────────
    subtotal: {
      type:     Number,
      required: true,
      min:      0,
    },

    taxAmount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    discountAmount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    totalAmount: {
      type:     Number,
      required: true,
      min:      0,
    },

    amountPaid: {
      type:    Number,
      default: 0,
      min:     0,
    },

    amountDue: {
      type:    Number,
      default: 0,
    },

    currency: {
      type:    String,
      enum:    Object.values(InvoiceCurrency),
      default: InvoiceCurrency.INR,
    },

    // ── Metadata ───────────────────────────────────────────────────────────
    invoiceType: {
      type:     String,
      enum:     Object.values(InvoiceType),
      required: true,
      default:  InvoiceType.Service,
    },

    invoiceStatus: {
      type:    String,
      enum:    Object.values(InvoiceStatus),
      default: InvoiceStatus.Draft,
      index:   true,
    },

    invoiceDate: {
      type:    Date,
      default: () => new Date(),
    },

    dueDate:     { type: Date },
    paidAt:      { type: Date },
    cancelledAt: { type: Date },
    issuedAt:    { type: Date },

    // ── Line Items ─────────────────────────────────────────────────────────
    lineItems: {
      type:    [lineItemSchema],
      default: [],
    },

    // ── Razorpay ───────────────────────────────────────────────────────────
    razorpayOrderId: {
      type:   String,
      sparse: true,
      index:  true,
    },

    paymentIds: {
      type:    [Schema.Types.ObjectId],
      ref:     'Payment',
      default: [],
    },

    // ── Workflow Flags ─────────────────────────────────────────────────────
    partiallyPaid:    { type: Boolean, default: false },
    overpaid:         { type: Boolean, default: false, index: true },
    disputed:         { type: Boolean, default: false, index: true },
    manuallyAdjusted: { type: Boolean, default: false },

    // ── Audit ──────────────────────────────────────────────────────────────
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps:  true,
    collection:  'invoices',
    versionKey:  false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Finance dashboard queries
invoiceSchema.index({ invoiceStatus: 1, invoiceDate: -1 });
invoiceSchema.index({ clientId: 1, invoiceStatus: 1 });
invoiceSchema.index({ projectId: 1, invoiceStatus: 1 });

// Overdue detector job
invoiceSchema.index({ invoiceStatus: 1, dueDate: 1 });

// Reconciliation / accounting queries
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ paidAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────

invoiceSchema.virtual('isTerminal').get(function (this: IInvoiceDocument) {
  return (
    this.invoiceStatus === InvoiceStatus.Cancelled ||
    this.invoiceStatus === InvoiceStatus.Refunded
  );
});

// ─── Static Helpers ───────────────────────────────────────────────────────────

/**
 * Validate whether a status transition is permitted.
 */
export function isValidInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  const allowed = INVOICE_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

/**
 * Convert rupees (float) to paise (integer).
 * Rounds to nearest paise to avoid floating-point drift.
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise (integer) back to rupees.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Compute a line item total in paise.
 */
export function computeLineItemTotal(
  quantity:  number,
  unitPrice: number,  // paise
  taxRate:   number   // percentage
): number {
  const base = quantity * unitPrice;
  const tax  = Math.round((base * taxRate) / 100);
  return base + tax;
}

/**
 * Generate an invoice number.
 * Format: KT-YYYY-NNNNNN (e.g. KT-2025-000142)
 */
export function generateInvoiceNumber(sequence: number): string {
  const year   = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `KT-${year}-${padded}`;
}

// ─── Model ────────────────────────────────────────────────────────────────────

export const Invoice: IInvoiceModel =
  (models['Invoice'] as IInvoiceModel | undefined) ??
  model<IInvoiceDocument>('Invoice', invoiceSchema);
