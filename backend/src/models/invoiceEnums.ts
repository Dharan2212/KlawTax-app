/**
 * Invoice & Payment lifecycle enums.
 * Centralised here to be shared across models, services, and validators.
 */

// ─── Invoice ──────────────────────────────────────────────────────────────────

export enum InvoiceStatus {
  Draft         = 'draft',
  Issued        = 'issued',
  PartiallyPaid = 'partially_paid',
  Paid          = 'paid',
  Overdue       = 'overdue',
  Cancelled     = 'cancelled',
  Disputed      = 'disputed',
  Refunded      = 'refunded',
  Overpaid      = 'overpaid',
}

export enum InvoiceType {
  Service  = 'service',   // Single service
  Bundle   = 'bundle',    // Package/bundle purchase
  Advance  = 'advance',   // 50% advance invoice
  Balance  = 'balance',   // Remaining balance invoice
  Manual   = 'manual',    // Admin-created manual invoice
}

export enum InvoiceCurrency {
  INR = 'INR',
}

/**
 * Allowed invoice status transitions.
 * Key = current status, Value = allowed next statuses.
 */
export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.Draft]:         [InvoiceStatus.Issued, InvoiceStatus.Cancelled],
  [InvoiceStatus.Issued]:        [InvoiceStatus.PartiallyPaid, InvoiceStatus.Paid, InvoiceStatus.Overdue, InvoiceStatus.Cancelled, InvoiceStatus.Disputed],
  [InvoiceStatus.PartiallyPaid]: [InvoiceStatus.Paid, InvoiceStatus.Overdue, InvoiceStatus.Overpaid, InvoiceStatus.Disputed],
  [InvoiceStatus.Paid]:          [InvoiceStatus.Refunded, InvoiceStatus.Disputed],
  [InvoiceStatus.Overdue]:       [InvoiceStatus.Paid, InvoiceStatus.PartiallyPaid, InvoiceStatus.Cancelled, InvoiceStatus.Disputed],
  [InvoiceStatus.Overpaid]:      [InvoiceStatus.Refunded, InvoiceStatus.Disputed],
  [InvoiceStatus.Disputed]:      [InvoiceStatus.Paid, InvoiceStatus.Refunded, InvoiceStatus.Cancelled],
  [InvoiceStatus.Cancelled]:     [],  // Terminal — no transitions allowed
  [InvoiceStatus.Refunded]:      [],  // Terminal — no transitions allowed
};

// ─── Payment ──────────────────────────────────────────────────────────────────

export enum PaymentStatus {
  Created    = 'created',
  Pending    = 'pending',
  Authorized = 'authorized',
  Captured   = 'captured',
  Failed     = 'failed',
  Refunded   = 'refunded',
  Disputed   = 'disputed',
}

export enum PaymentMethod {
  UPI         = 'upi',
  Card        = 'card',
  NetBanking  = 'netbanking',
  Wallet      = 'wallet',
  NEFT        = 'neft',
  RTGS        = 'rtgs',
  Manual      = 'manual',  // Admin-recorded offline payment
  Unknown     = 'unknown',
}

export enum VerificationSource {
  FrontendCallback = 'frontend_callback',
  Webhook          = 'webhook',
  ManualAdmin      = 'manual_admin',
}

export enum PaymentGateway {
  Razorpay = 'razorpay',
  Manual   = 'manual',
}
