import { Schema, model, models, Document, Types, Model } from 'mongoose';
import {
  PaymentStatus,
  PaymentMethod,
  VerificationSource,
  PaymentGateway,
} from './invoiceEnums';

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IPayment {
  // Relationships
  invoiceId:  Types.ObjectId;
  clientId:   Types.ObjectId;
  projectId?: Types.ObjectId;

  // Gateway
  gateway: PaymentGateway;

  // Razorpay Metadata (nullable for manual payments)
  razorpayOrderId?:   string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  webhookEventId?:    Types.ObjectId;

  // Financials — stored in paise
  amount:         number;   // paise
  currency:       string;   // 'INR'
  fees:           number;   // gateway fees in paise
  tax:            number;   // GST on fees in paise
  refundedAmount: number;   // paise refunded so far

  // Lifecycle
  paymentStatus:  PaymentStatus;
  paymentMethod:  PaymentMethod;
  initiatedAt:    Date;
  verifiedAt?:    Date;
  failedAt?:      Date;
  refundedAt?:    Date;

  // Operational Flags
  duplicatePayment: boolean;
  disputedPayment:  boolean;
  overpayment:      boolean;
  manuallyReviewed: boolean;

  // Verification
  verified:            boolean;
  verificationSource?: VerificationSource;
  verificationNotes?:  string;

  // Failure details
  failureCode?:    string;
  failureReason?:  string;

  // Audit
  createdBy?:  Types.ObjectId;
  updatedBy?:  Types.ObjectId;
  createdAt:   Date;
  updatedAt:   Date;
}

export type IPaymentDocument = IPayment & Document;
export type IPaymentModel    = Model<IPaymentDocument>;

// ─── Schema ───────────────────────────────────────────────────────────────────

const paymentSchema = new Schema<IPaymentDocument>(
  {
    // ── Relationships ──────────────────────────────────────────────────────
    invoiceId: {
      type:     Schema.Types.ObjectId,
      ref:      'Invoice',
      required: true,
      index:    true,
    },

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

    // ── Gateway ────────────────────────────────────────────────────────────
    gateway: {
      type:    String,
      enum:    Object.values(PaymentGateway),
      default: PaymentGateway.Razorpay,
    },

    // ── Razorpay ───────────────────────────────────────────────────────────
    razorpayOrderId: {
      type:   String,
      sparse: true,
      index:  true,
    },

    razorpayPaymentId: {
      type:   String,
      sparse: true,
      index:  true,
    },

    razorpaySignature: {
      type: String,
    },

    webhookEventId: {
      type: Schema.Types.ObjectId,
      ref:  'WebhookEvent',
    },

    // ── Financials ─────────────────────────────────────────────────────────
    amount: {
      type:     Number,
      required: true,
      min:      1,   // must be at least 1 paise
    },

    currency: {
      type:    String,
      default: 'INR',
      trim:    true,
    },

    fees: {
      type:    Number,
      default: 0,
      min:     0,
    },

    tax: {
      type:    Number,
      default: 0,
      min:     0,
    },

    refundedAmount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Lifecycle ──────────────────────────────────────────────────────────
    paymentStatus: {
      type:    String,
      enum:    Object.values(PaymentStatus),
      default: PaymentStatus.Created,
      index:   true,
    },

    paymentMethod: {
      type:    String,
      enum:    Object.values(PaymentMethod),
      default: PaymentMethod.Unknown,
    },

    initiatedAt: {
      type:    Date,
      default: () => new Date(),
    },

    verifiedAt:  { type: Date },
    failedAt:    { type: Date },
    refundedAt:  { type: Date },

    // ── Operational Flags ──────────────────────────────────────────────────
    duplicatePayment: { type: Boolean, default: false, index: true },
    disputedPayment:  { type: Boolean, default: false, index: true },
    overpayment:      { type: Boolean, default: false, index: true },
    manuallyReviewed: { type: Boolean, default: false },

    // ── Verification ───────────────────────────────────────────────────────
    verified: {
      type:    Boolean,
      default: false,
    },

    verificationSource: {
      type: String,
      enum: Object.values(VerificationSource),
    },

    verificationNotes: {
      type:      String,
      maxlength: 1000,
    },

    // ── Failure ────────────────────────────────────────────────────────────
    failureCode:   { type: String, trim: true },
    failureReason: { type: String, trim: true, maxlength: 500 },

    // ── Audit ──────────────────────────────────────────────────────────────
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    collection: 'payments',
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Duplicate payment detection
paymentSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, sparse: true }
);

// Finance dashboard
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });
paymentSchema.index({ clientId: 1, paymentStatus: 1 });
paymentSchema.index({ invoiceId: 1, paymentStatus: 1 });

// Reconciliation
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ verifiedAt: -1 });

// Anomaly flags
paymentSchema.index({ overpayment: 1, manuallyReviewed: 1 });
paymentSchema.index({ duplicatePayment: 1, createdAt: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────

export const Payment: IPaymentModel =
  (models['Payment'] as IPaymentModel | undefined) ??
  model<IPaymentDocument>('Payment', paymentSchema);
