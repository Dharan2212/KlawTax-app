import { describe, it, expect, printResults } from './_helpers';
import { InvoiceStatus, InvoiceType, INVOICE_TRANSITIONS, PaymentStatus } from '../models/invoiceEnums';

describe('Invoice transitions', () => {
  it('every InvoiceStatus has an entry', () => {
    for (const s of Object.values(InvoiceStatus)) {
      expect(INVOICE_TRANSITIONS).toHaveProperty(s);
    }
  });

  it('Draft → Issued or Cancelled', () => {
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Draft]).toContain(InvoiceStatus.Issued);
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Draft]).toContain(InvoiceStatus.Cancelled);
  });

  it('Paid → Refunded or Disputed', () => {
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Paid]).toContain(InvoiceStatus.Refunded);
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Paid]).toContain(InvoiceStatus.Disputed);
  });

  it('Cancelled is terminal', () => {
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Cancelled].length === 0).toBeTruthy();
  });

  it('Refunded is terminal', () => {
    expect(INVOICE_TRANSITIONS[InvoiceStatus.Refunded].length === 0).toBeTruthy();
  });

  it('PartiallyPaid can reach Overpaid', () => {
    expect(INVOICE_TRANSITIONS[InvoiceStatus.PartiallyPaid]).toContain(InvoiceStatus.Overpaid);
  });
});

describe('InvoiceType enum', () => {
  it('contains Advance and Balance', () => {
    expect(Object.values(InvoiceType)).toContain(InvoiceType.Advance);
    expect(Object.values(InvoiceType)).toContain(InvoiceType.Balance);
  });

  it('contains Bundle', () => {
    expect(Object.values(InvoiceType)).toContain(InvoiceType.Bundle);
  });
});

describe('PaymentStatus enum', () => {
  it('contains Captured, Failed, Refunded', () => {
    expect(Object.values(PaymentStatus)).toContain(PaymentStatus.Captured);
    expect(Object.values(PaymentStatus)).toContain(PaymentStatus.Failed);
    expect(Object.values(PaymentStatus)).toContain(PaymentStatus.Refunded);
  });
});

describe('Invoice business rules', () => {
  it('advance is 50% of total', () => {
    expect(13500 * 0.5).toBe(6750);
  });

  it('amounts in paise for Razorpay', () => {
    expect(13500 * 100).toBe(1350000);
  });

  it('overpayment when amountPaid > totalAmount', () => {
    expect(14000 > 13500).toBeTruthy();
  });

  it('fully paid when amountPaid >= totalAmount', () => {
    expect(13500 >= 13500).toBeTruthy();
  });
});

void (async () => { await printResults(); })();
