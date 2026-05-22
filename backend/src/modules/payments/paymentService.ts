import { Types } from 'mongoose';
import { Payment, IPaymentDocument } from '../../models/payment';
import { Invoice }                   from '../../models/invoice';
import { WebhookEvent }              from '../../models/webhookEvent';
import {
  PaymentStatus,
  PaymentMethod,
  VerificationSource,
  PaymentGateway,
} from '../../models/invoiceEnums';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  fetchRazorpayPayment,
  mapRazorpayMethod,
} from './razorpayHelper';
import {
  applyPaymentToInvoice,
  issueInvoice,
} from './invoiceService';
import { AppError, NotFoundError } from '../../middlewares/errorHandler';
import { buildPaginationMeta, parsePagination } from '../../utils/response';
import { logger } from '../../utils/logger';
import { getConfig } from '../../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateOrderInput {
  invoiceId: string;
  clientId:  string;
  projectId?: string;
  actorId:   string;  // User making the request
}

export interface CreateOrderResult {
  razorpayOrderId: string;
  amount:          number;   // paise
  currency:        string;
  keyId:           string;   // Razorpay public key for frontend
}

export interface VerifyPaymentInput {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  clientId:          string;
  actorId:           string;
}

export interface VerifyPaymentResult {
  payment:         IPaymentDocument;
  invoiceStatus:   string;
  redirectUrl:     string;
}

// ─── Create Razorpay Order ────────────────────────────────────────────────────

export async function createPaymentOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const invoice = await Invoice.findById(input.invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');

  if (invoice.amountDue <= 0) {
    throw new AppError('Invoice is already fully paid', 422, 'INVOICE_ALREADY_PAID');
  }

  // Issue the invoice if still in draft
  if (invoice.invoiceStatus === 'draft') {
    await issueInvoice(input.invoiceId, input.actorId);
  }

  // Create Razorpay order for the outstanding balance
  const order = await createRazorpayOrder({
    amount:   invoice.amountDue,
    currency: invoice.currency,
    receipt:  invoice.invoiceNumber,
    notes: {
      invoiceId:  String(invoice._id),
      clientId:   input.clientId,
      ...(input.projectId ? { projectId: input.projectId } : {}),
    },
  });

  // Persist the Razorpay order ID on the invoice
  invoice.razorpayOrderId = order.id;
  await invoice.save();

  // Create a pending payment record
  await Payment.create({
    invoiceId:       invoice._id,
    clientId:        new Types.ObjectId(input.clientId),
    projectId:       input.projectId ? new Types.ObjectId(input.projectId) : undefined,
    gateway:         PaymentGateway.Razorpay,
    razorpayOrderId: order.id,
    amount:          invoice.amountDue,
    currency:        invoice.currency,
    fees:            0,
    tax:             0,
    refundedAmount:  0,
    paymentStatus:   PaymentStatus.Created,
    paymentMethod:   PaymentMethod.Unknown,
    initiatedAt:     new Date(),
    verified:        false,
    createdBy:       new Types.ObjectId(input.actorId),
  });

  const cfg = getConfig();

  return {
    razorpayOrderId: order.id,
    amount:          invoice.amountDue,
    currency:        invoice.currency,
    keyId:           cfg.RAZORPAY_KEY_ID,
  };
}

// ─── Verify Frontend Payment Callback ────────────────────────────────────────

/**
 * Called from the frontend after Razorpay checkout completes.
 * Verifies signature, marks payment captured, reconciles invoice.
 */
export async function verifyAndCapturePayment(
  input: VerifyPaymentInput
): Promise<VerifyPaymentResult> {
  // 1. Signature verification
  const signatureValid = verifyPaymentSignature({
    razorpay_order_id:   input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_signature:  input.razorpaySignature,
  });

  if (!signatureValid) {
    throw new AppError('Payment signature verification failed', 400, 'INVALID_PAYMENT_SIGNATURE');
  }

  // 2. Find the payment record by Razorpay order ID
  const payment = await Payment.findOne({
    razorpayOrderId: input.razorpayOrderId,
    clientId:        new Types.ObjectId(input.clientId),
  });

  if (!payment) {
    throw new NotFoundError('Payment record');
  }

  // 3. Duplicate detection — idempotent
  if (payment.verified && payment.razorpayPaymentId === input.razorpayPaymentId) {
    logger.info('[PaymentService] Duplicate verification attempt (idempotent)', {
      razorpayPaymentId: input.razorpayPaymentId,
    });
    const invoice = await Invoice.findById(payment.invoiceId);
    return {
      payment,
      invoiceStatus: invoice?.invoiceStatus ?? 'unknown',
      redirectUrl:   buildWhatsAppRedirectUrl(payment),
    };
  }

  // 4. Check for duplicate Razorpay payment ID in database
  const existingCapture = await Payment.findOne({
    razorpayPaymentId: input.razorpayPaymentId,
    _id: { $ne: payment._id },
  });

  if (existingCapture) {
    payment.duplicatePayment = true;
    await payment.save();
    logger.warn('[PaymentService] Duplicate payment ID detected', {
      razorpayPaymentId: input.razorpayPaymentId,
    });
    throw new AppError('Duplicate payment detected', 409, 'DUPLICATE_PAYMENT');
  }

  // 5. Fetch payment details from Razorpay for method info
  let razorpayData: Record<string, unknown> = {};
  try {
    razorpayData = await fetchRazorpayPayment(input.razorpayPaymentId);
  } catch (err) {
    logger.warn('[PaymentService] Could not fetch Razorpay payment details', { err });
  }

  const razorpayFees   = typeof razorpayData.fee     === 'number' ? razorpayData.fee     : 0;
  const razorpayTax    = typeof razorpayData.tax     === 'number' ? razorpayData.tax     : 0;
  const capturedAmount = typeof razorpayData.amount  === 'number' ? razorpayData.amount  : payment.amount;
  const method         = mapRazorpayMethod(razorpayData.method as string | undefined);

  // 6. Update payment record
  payment.razorpayPaymentId  = input.razorpayPaymentId;
  payment.razorpaySignature  = input.razorpaySignature;
  payment.paymentStatus      = PaymentStatus.Captured;
  payment.paymentMethod      = method as PaymentMethod;
  payment.verified           = true;
  payment.verificationSource = VerificationSource.FrontendCallback;
  payment.verifiedAt         = new Date();
  payment.fees               = razorpayFees;
  payment.tax                = razorpayTax;
  payment.updatedBy          = new Types.ObjectId(input.actorId);
  await payment.save();

  // 7. Reconcile the invoice
  const updatedInvoice = await applyPaymentToInvoice(
    String(payment.invoiceId),
    payment._id as Types.ObjectId,
    capturedAmount,
    input.actorId
  );

  logger.info('[PaymentService] Payment verified and captured', {
    razorpayPaymentId: input.razorpayPaymentId,
    invoiceStatus:     updatedInvoice.invoiceStatus,
    amountPaid:        capturedAmount,
  });

  return {
    payment,
    invoiceStatus: updatedInvoice.invoiceStatus,
    redirectUrl:   buildWhatsAppRedirectUrl(payment),
  };
}

// ─── Handle Webhook Payment Event ────────────────────────────────────────────

/**
 * Idempotent payment processing triggered by Razorpay webhooks.
 */
export async function processWebhookPaymentEvent(
  eventType:    string,
  eventPayload: Record<string, unknown>,
  webhookEvent: InstanceType<typeof WebhookEvent>
): Promise<void> {
  const paymentEntity = (eventPayload.payload as Record<string, unknown>)
    ?.payment as Record<string, unknown> | undefined;

  const entity = paymentEntity?.entity as Record<string, unknown> | undefined;

  if (!entity) {
    logger.warn('[PaymentService] Webhook payload missing payment entity', { eventType });
    return;
  }

  const razorpayOrderId   = entity.order_id   as string | undefined;
  const razorpayPaymentId = entity.id          as string | undefined;
  const capturedAmount    = entity.amount      as number | undefined;
  const method            = mapRazorpayMethod(entity.method as string | undefined);

  if (!razorpayOrderId || !razorpayPaymentId) {
    logger.warn('[PaymentService] Webhook missing order_id or payment_id', { eventType });
    return;
  }

  switch (eventType) {
    case 'payment.captured':
    case 'order.paid': {
      await handleWebhookCapture({
        razorpayOrderId,
        razorpayPaymentId,
        capturedAmount:  capturedAmount ?? 0,
        method,
        fees:            entity.fee  as number ?? 0,
        tax:             entity.tax  as number ?? 0,
        webhookEventId:  webhookEvent._id as Types.ObjectId,
      });
      break;
    }

    case 'payment.failed': {
      await handleWebhookPaymentFailed({
        razorpayOrderId,
        razorpayPaymentId,
        failureCode:   entity.error_code        as string | undefined,
        failureReason: entity.error_description as string | undefined,
        webhookEventId: webhookEvent._id as Types.ObjectId,
      });
      break;
    }

    case 'refund.processed': {
      const refundEntity = (eventPayload.payload as Record<string, unknown>)
        ?.refund as Record<string, unknown> | undefined;
      const re = refundEntity?.entity as Record<string, unknown> | undefined;

      if (re) {
        await handleWebhookRefund({
          razorpayPaymentId: re.payment_id as string,
          refundAmount:      re.amount     as number ?? 0,
          webhookEventId:    webhookEvent._id as Types.ObjectId,
        });
      }
      break;
    }

    case 'payment.dispute.created': {
      await handleWebhookDispute(razorpayPaymentId, webhookEvent._id as Types.ObjectId);
      break;
    }

    default:
      logger.info('[PaymentService] Unhandled webhook event type (skipped)', { eventType });
  }
}

// ─── Internal Webhook Handlers ────────────────────────────────────────────────

interface CaptureInput {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  capturedAmount:    number;
  method:            string;
  fees:              number;
  tax:               number;
  webhookEventId:    Types.ObjectId;
}

async function handleWebhookCapture(input: CaptureInput): Promise<void> {
  // Find payment by Razorpay order ID
  const payment = await Payment.findOne({ razorpayOrderId: input.razorpayOrderId });

  if (!payment) {
    logger.warn('[PaymentService] Webhook capture: no payment record for order', {
      razorpayOrderId: input.razorpayOrderId,
    });
    return;
  }

  // Idempotency: already captured
  if (
    payment.verified &&
    payment.paymentStatus === PaymentStatus.Captured &&
    payment.razorpayPaymentId === input.razorpayPaymentId
  ) {
    logger.info('[PaymentService] Webhook capture (already processed — skipped)', {
      razorpayPaymentId: input.razorpayPaymentId,
    });
    return;
  }

  // Duplicate razorpay payment ID detection
  if (
    input.razorpayPaymentId &&
    payment.razorpayPaymentId &&
    payment.razorpayPaymentId !== input.razorpayPaymentId
  ) {
    payment.duplicatePayment = true;
    await payment.save();
    logger.warn('[PaymentService] Webhook: duplicate payment ID for existing order', input);
    return;
  }

  payment.razorpayPaymentId  = input.razorpayPaymentId;
  payment.paymentStatus      = PaymentStatus.Captured;
  payment.paymentMethod      = input.method as PaymentMethod;
  payment.verified           = true;
  payment.verificationSource = VerificationSource.Webhook;
  payment.verifiedAt         = new Date();
  payment.fees               = input.fees;
  payment.tax                = input.tax;
  payment.webhookEventId     = input.webhookEventId;
  await payment.save();

  // Reconcile invoice — only if not already paid via frontend callback
  const invoice = await Invoice.findById(payment.invoiceId);
  if (invoice && invoice.invoiceStatus !== 'paid' && invoice.invoiceStatus !== 'overpaid') {
    await applyPaymentToInvoice(
      String(payment.invoiceId),
      payment._id as Types.ObjectId,
      input.capturedAmount,
      'system'
    );
  }

  logger.info('[PaymentService] Webhook capture processed', {
    razorpayPaymentId: input.razorpayPaymentId,
  });
}

interface FailedInput {
  razorpayOrderId:   string;
  razorpayPaymentId: string;
  failureCode?:      string;
  failureReason?:    string;
  webhookEventId:    Types.ObjectId;
}

async function handleWebhookPaymentFailed(input: FailedInput): Promise<void> {
  const payment = await Payment.findOne({ razorpayOrderId: input.razorpayOrderId });
  if (!payment) return;

  // Don't overwrite a successfully captured payment
  if (payment.paymentStatus === PaymentStatus.Captured) return;

  payment.paymentStatus      = PaymentStatus.Failed;
  payment.razorpayPaymentId  = input.razorpayPaymentId;
  payment.failureCode        = input.failureCode;
  payment.failureReason      = input.failureReason;
  payment.failedAt           = new Date();
  payment.webhookEventId     = input.webhookEventId;
  await payment.save();

  logger.info('[PaymentService] Payment failed (webhook)', {
    razorpayOrderId: input.razorpayOrderId,
    reason:          input.failureReason,
  });
}

interface RefundInput {
  razorpayPaymentId: string;
  refundAmount:      number;
  webhookEventId:    Types.ObjectId;
}

async function handleWebhookRefund(input: RefundInput): Promise<void> {
  const payment = await Payment.findOne({ razorpayPaymentId: input.razorpayPaymentId });
  if (!payment) return;

  payment.refundedAmount += input.refundAmount;
  payment.paymentStatus   = PaymentStatus.Refunded;
  payment.refundedAt      = new Date();
  payment.webhookEventId  = input.webhookEventId;
  await payment.save();

  logger.info('[PaymentService] Refund processed (webhook)', {
    razorpayPaymentId: input.razorpayPaymentId,
    refundAmount:      input.refundAmount,
  });
}

async function handleWebhookDispute(
  razorpayPaymentId: string,
  webhookEventId:    Types.ObjectId
): Promise<void> {
  const payment = await Payment.findOne({ razorpayPaymentId });
  if (!payment) return;

  payment.disputedPayment = true;
  payment.paymentStatus   = PaymentStatus.Disputed;
  payment.webhookEventId  = webhookEventId;
  await payment.save();

  logger.warn('[PaymentService] Payment disputed (webhook)', { razorpayPaymentId });
}

// ─── WhatsApp Redirect URL Builder ───────────────────────────────────────────

function buildWhatsAppRedirectUrl(payment: IPaymentDocument): string {
  const message = encodeURIComponent(
    `Hi KlawTax! I have completed my payment.\n` +
    `Payment ID: ${payment.razorpayPaymentId ?? 'pending'}\n` +
    `Order ID: ${payment.razorpayOrderId ?? 'N/A'}\n` +
    `Please guide me on the next steps.`
  );
  // Number configured via WHATSAPP_NUMBER env var; defaults to a safe fallback.
  const phone = process.env['WHATSAPP_NUMBER'] ?? '919999999999';
  return `https://wa.me/${phone}?text=${message}`;
}

// ─── List Payments ────────────────────────────────────────────────────────────

export async function listPayments(
  query: {
    invoiceId?:    string;
    clientId?:     string;
    paymentStatus?: PaymentStatus;
    page?:         unknown;
    limit?:        unknown;
  },
  scopedClientId?: string
) {
  const { page, limit, skip } = parsePagination(query.page, query.limit, 50);

  const filter: Record<string, unknown> = {};

  const effectiveClientId = scopedClientId ?? query.clientId;
  if (effectiveClientId) filter['clientId'] = new Types.ObjectId(effectiveClientId);
  if (query.invoiceId)   filter['invoiceId'] = new Types.ObjectId(query.invoiceId);
  if (query.paymentStatus) filter['paymentStatus'] = query.paymentStatus;

  const [payments, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    meta: buildPaginationMeta(page, limit, total),
  };
}
