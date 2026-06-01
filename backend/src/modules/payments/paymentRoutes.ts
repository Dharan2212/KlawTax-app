import { Router } from 'express';
import { authenticate, getAuthContext } from '../../middlewares/auth';
import { allowRoles } from '../../middlewares/rbac';
import { Role } from '../../utils/permissions';
import { sendSuccess } from '../../utils/response';
import { ValidationError } from '../../middlewares/errorHandler';
import {
  createPaymentOrder,
  verifyAndCapturePayment,
  listPayments,
} from './paymentService';
import {
  guestCheckout,
  guestVerifyPayment,
} from './checkoutService';
import { PaymentStatus } from '../../models/invoiceEnums';
import { invalidateAdminDashboard } from '../../utils/cache/index';

export const paymentRouter = Router();

// ─── POST /payments/checkout — PUBLIC guest checkout ─────────────────────────
// Creates client account, invoice, project, and Razorpay order in one shot.
// No JWT required — guest flow per v1.5 spec section 9.2.6.
paymentRouter.post('/checkout', async (req, res, next) => {
  try {
    const { serviceId, serviceName, amount, paymentType, customer } = req.body;

    if (!serviceName?.trim())      throw new ValidationError('serviceName is required');
    if (!amount || amount <= 0)    throw new ValidationError('amount must be a positive number');
    if (!customer?.name?.trim())   throw new ValidationError('customer.name is required');
    if (!customer?.email?.trim())  throw new ValidationError('customer.email is required');
    if (!customer?.phone?.trim())  throw new ValidationError('customer.phone is required');

    const result = await guestCheckout({
      serviceId:   serviceId || serviceName,
      serviceName,
      amount,
      paymentType: paymentType === 'advance' ? 'advance' : 'full',
      customer: {
        name:  customer.name.trim(),
        email: customer.email.trim(),
        phone: customer.phone.trim(),
        city:  customer.city?.trim(),
      },
    });

    sendSuccess(res, result, { statusCode: 201, message: 'Checkout initiated' });
  } catch (err) { next(err); }
});

// ─── POST /payments/verify-guest — PUBLIC payment verification ───────────────
// Verifies Razorpay signature and captures payment without requiring JWT.
paymentRouter.post('/verify-guest', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      clientId,
    } = req.body;

    if (!razorpay_order_id)   throw new ValidationError('razorpay_order_id is required');
    if (!razorpay_payment_id) throw new ValidationError('razorpay_payment_id is required');
    if (!razorpay_signature)  throw new ValidationError('razorpay_signature is required');
    if (!invoiceId?.trim())   throw new ValidationError('invoiceId is required');

    const result = await guestVerifyPayment({
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      invoiceId,
      clientId,
    });

    sendSuccess(res, result, { message: 'Payment verified successfully' });
  } catch (err) { next(err); }
});

// ─── POST /payments/create-order — Authenticated existing-client order ────────
paymentRouter.post('/create-order', authenticate, async (req, res, next) => {
  try {
    const auth = getAuthContext(req);
    const { invoiceId, clientId, projectId } = req.body;

    if (!invoiceId?.trim()) throw new ValidationError('invoiceId is required');
    if (!clientId?.trim()) throw new ValidationError('clientId is required');

    if (auth.role === 'client' && auth.clientProfileId !== clientId) {
      throw new ValidationError('You can only create orders for your own invoices');
    }

    const result = await createPaymentOrder({
      invoiceId,
      clientId,
      projectId,
      actorId: auth.userId,
    });

    sendSuccess(res, result, { statusCode: 201, message: 'Razorpay order created' });
  } catch (err) { next(err); }
});

// ─── POST /payments/verify — Authenticated payment verification ───────────────
paymentRouter.post('/verify', authenticate, async (req, res, next) => {
  try {
    const auth = getAuthContext(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clientId } = req.body;

    if (!razorpay_order_id)   throw new ValidationError('razorpay_order_id is required');
    if (!razorpay_payment_id) throw new ValidationError('razorpay_payment_id is required');
    if (!razorpay_signature)  throw new ValidationError('razorpay_signature is required');
    if (!clientId?.trim())    throw new ValidationError('clientId is required');

    const result = await verifyAndCapturePayment({
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      clientId,
      actorId: auth.userId,
    });

    sendSuccess(res, {
      verified:      true,
      invoiceStatus: result.invoiceStatus,
      redirectUrl:   result.redirectUrl,
    }, { message: 'Payment verified successfully' });

    // Invalidate admin dashboard — revenue/payment aggregates have changed
    invalidateAdminDashboard().catch(() => {});
  } catch (err) { next(err); }
});

// ─── GET /payments ────────────────────────────────────────────────────────────
paymentRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const auth = getAuthContext(req);
    const scopedClientId = auth.role === 'client' ? auth.clientProfileId : undefined;

    const rawStatus = req.query['paymentStatus'] as string | undefined;
    const paymentStatus = rawStatus && Object.values(PaymentStatus).includes(rawStatus as PaymentStatus)
      ? (rawStatus as PaymentStatus)
      : undefined;

    const result = await listPayments(
      {
        invoiceId: req.query['invoiceId'] as string | undefined,
        clientId:  req.query['clientId']  as string | undefined,
        paymentStatus,
        page:      req.query['page']  as string | undefined,
        limit:     req.query['limit'] as string | undefined,
      },
      scopedClientId,
    );

    sendSuccess(res, result.payments, { meta: result.meta });
  } catch (err) { next(err); }
});

// ─── GET /payments/anomalies — Admin only ─────────────────────────────────────
paymentRouter.get('/anomalies', authenticate, allowRoles(Role.Admin), async (_req, res, next) => {
  try {
    const { Payment } = await import('../../models/payment');
    const payments = await Payment.find({
      $or: [{ overpayment: true }, { duplicatePayment: true }, { disputedPayment: true }],
      manuallyReviewed: false,
    }).sort({ createdAt: -1 }).limit(50).lean();

    sendSuccess(res, payments);
  } catch (err) { next(err); }
});
