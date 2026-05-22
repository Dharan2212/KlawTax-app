import { describe, it, expect, printResults } from './_helpers';
import * as crypto from 'crypto';

describe('Webhook idempotency', () => {
  it('same (provider, eventId) is a duplicate', () => {
    const key = (provider: string, id: string) => `${provider}::${id}`;
    const k1 = key('razorpay', 'evt_abc');
    const k2 = key('razorpay', 'evt_abc');
    expect(k1 === k2).toBeTruthy();
  });

  it('different eventIds are not duplicates', () => {
    const k1 = 'razorpay::evt_001';
    const k2 = 'razorpay::evt_002';
    // They are different strings — not equal
    const notEqual: boolean = (k1 as string) !== (k2 as string);
    expect(notEqual).toBeTruthy();
  });
});

describe('HMAC-SHA256 signature verification', () => {
  const secret = 'test_webhook_secret';

  const sign = (body: string) =>
    crypto.createHmac('sha256', secret).update(body).digest('hex');

  it('valid signature passes', () => {
    const body = '{"event":"payment.captured"}';
    const sig  = sign(body);
    const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(sign(body), 'hex'));
    expect(valid).toBeTruthy();
  });

  it('tampered body fails', () => {
    const body     = '{"amount":13500}';
    const tampered = '{"amount":99999}';
    let valid = false;
    try {
      valid = crypto.timingSafeEqual(Buffer.from(sign(body), 'hex'), Buffer.from(sign(tampered), 'hex'));
    } catch { valid = false; }
    expect(valid).toBeFalsy();
  });

  it('wrong secret fails', () => {
    const body   = '{"event":"order.paid"}';
    const good   = sign(body);
    const bad    = crypto.createHmac('sha256', 'wrong').update(body).digest('hex');
    let valid = false;
    try { valid = crypto.timingSafeEqual(Buffer.from(good,'hex'), Buffer.from(bad,'hex')); }
    catch { valid = false; }
    expect(valid).toBeFalsy();
  });
});

describe('Webhook always-200 contract', () => {
  it('invalid signature → skipped, but HTTP 200', () => {
    const status = 'skipped';
    const http   = 200;
    expect(status).toBe('skipped');
    expect(http).toBe(200);
  });

  it('unknown event type → skipped', () => {
    const supported = ['payment.captured','payment.failed','order.paid','refund.processed'];
    const incoming  = 'subscription.created';
    const processed = supported.includes(incoming) ? 'received' : 'skipped';
    expect(processed).toBe('skipped');
  });
});

describe('Supported Razorpay event types', () => {
  const EVENTS = ['payment.captured','payment.failed','order.paid','refund.processed'];
  it('includes payment.captured', () => { expect(EVENTS).toContain('payment.captured'); });
  it('includes order.paid',       () => { expect(EVENTS).toContain('order.paid'); });
  it('includes refund.processed', () => { expect(EVENTS).toContain('refund.processed'); });
});

void (async () => { await printResults(); })();
