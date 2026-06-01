import crypto from 'crypto';
import https from 'https';
import { getConfig } from '../../config/env';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RazorpayOrderOptions {
  amount:   number;   // paise
  currency: string;   // 'INR'
  receipt:  string;   // internal invoice/order reference
  notes?:   Record<string, string>;
}

export interface RazorpayOrder {
  id:         string;
  entity:     string;
  amount:     number;
  currency:   string;
  receipt:    string;
  status:     string;
  created_at: number;
}

export interface RazorpayPaymentVerificationPayload {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
}

export interface RazorpayWebhookVerificationPayload {
  rawBody:   Buffer | string;
  signature: string;
}

// ─── Signature Helpers ────────────────────────────────────────────────────────

/**
 * Verify the Razorpay payment signature sent from the client-side callback.
 * Signature = HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
export function verifyPaymentSignature(
  payload: RazorpayPaymentVerificationPayload
): boolean {
  const cfg = getConfig();
  const body = `${payload.razorpay_order_id}|${payload.razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac('sha256', cfg.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(payload.razorpay_signature, 'hex');

  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

/**
 * Verify the Razorpay webhook signature.
 * Signature = HMAC-SHA256(rawBody, WEBHOOK_SECRET)
 */
export function verifyWebhookSignature(
  payload: RazorpayWebhookVerificationPayload
): boolean {
  const cfg = getConfig();

  if (!cfg.RAZORPAY_WEBHOOK_SECRET) {
    logger.warn('[Razorpay] RAZORPAY_WEBHOOK_SECRET is not configured');
    return false;
  }

  const rawBody = typeof payload.rawBody === 'string'
    ? payload.rawBody
    : payload.rawBody.toString('utf-8');

  const expectedSignature = crypto
    .createHmac('sha256', cfg.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(payload.signature, 'hex');

  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

// ─── Razorpay API Client ──────────────────────────────────────────────────────

/**
 * Minimal Razorpay REST API client.
 * Uses Node's built-in https to avoid heavy SDK dependency for critical path.
 */
function razorpayApiRequest<T>(
  method: 'POST' | 'GET',
  path:   string,
  body?:  Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const cfg      = getConfig();
    const auth     = Buffer.from(`${cfg.RAZORPAY_KEY_ID}:${cfg.RAZORPAY_KEY_SECRET}`).toString('base64');
    const bodyStr  = body ? JSON.stringify(body) : '';

    const options: https.RequestOptions = {
      hostname: 'api.razorpay.com',
      path:     `/v1${path}`,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type':  'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as T;
          if ((res.statusCode ?? 0) >= 400) {
            const err = parsed as { error?: { description?: string } };
            reject(new Error(err?.error?.description ?? `Razorpay API error: ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Razorpay response parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) req.write(bodyStr);
    req.end();
  });
}

/**
 * Create a Razorpay order.
 * Returns the Razorpay order object with its `id` for use in frontend checkout.
 */
export async function createRazorpayOrder(
  options: RazorpayOrderOptions
): Promise<RazorpayOrder> {
  logger.info('[Razorpay] Creating order', {
    amount:  options.amount,
    receipt: options.receipt,
  });

  const order = await razorpayApiRequest<RazorpayOrder>('POST', '/orders', {
    amount:   options.amount,
    currency: options.currency,
    receipt:  options.receipt,
    notes:    options.notes ?? {},
  });

  logger.info('[Razorpay] Order created', { orderId: order.id });
  return order;
}

/**
 * Fetch a Razorpay payment record by payment ID.
 * Used for server-side reconciliation after frontend callback.
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<Record<string, unknown>> {
  return razorpayApiRequest<Record<string, unknown>>('GET', `/payments/${paymentId}`);
}

/**
 * Determine the PaymentMethod enum value from a Razorpay method string.
 */
export function mapRazorpayMethod(method?: string): string {
  switch (method?.toLowerCase()) {
    case 'card':        return 'card';
    case 'netbanking':  return 'netbanking';
    case 'wallet':      return 'wallet';
    case 'upi':         return 'upi';
    default:            return 'unknown';
  }
}
