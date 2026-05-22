/**
 * Onboarding foundational types.
 *
 * This module defines the data structures for the lead → client → project
 * onboarding pipeline. Business logic (project creation, invoice generation)
 * lives in future batches. This file provides the type contracts that
 * onboarding helpers, conversion flows, and future CRM modules share.
 */

// ─── Onboarding Stage ────────────────────────────────────────────────────────

/**
 * Sequential stages of the KlawTax client onboarding lifecycle.
 * Maps to v1.5 architecture: Section 3 — Client Onboarding.
 */
export enum OnboardingStage {
  /** Lead submitted payment — account being created. */
  PaymentReceived = 'payment_received',

  /** Client account created, awaiting document upload. */
  PendingDocuments = 'pending_documents',

  /** Documents uploaded, under team review. */
  DocumentsUnderReview = 'documents_under_review',

  /** Documents accepted — project work initiated. */
  ProjectInitiated = 'project_initiated',

  /** All services in an order are complete. */
  Completed = 'completed',
}

// ─── Onboarding Source ────────────────────────────────────────────────────────

/**
 * How the onboarding was initiated.
 * Determines which fields are pre-populated and which are required.
 */
export enum OnboardingSource {
  /** Originated from a lead conversion (CRM-initiated). */
  LeadConversion = 'lead_conversion',

  /** Direct checkout — no prior lead record. */
  DirectCheckout = 'direct_checkout',

  /** Admin manually initiated onboarding for an existing client. */
  AdminInitiated = 'admin_initiated',
}

// ─── Onboarding Init Request ──────────────────────────────────────────────────

/**
 * Data required to initialise a new onboarding flow.
 * Produced by the payment handler or lead conversion service.
 * Consumed by OnboardingService.initiate() (future batch).
 */
export interface OnboardingInitRequest {
  /** Source of the onboarding flow. */
  source: OnboardingSource;

  /** The lead that was converted, if applicable. */
  leadId?: string;

  /** Service slugs the client is onboarding for. */
  serviceSlugsPurchased: string[];

  /** Client contact information (pre-populated from lead or checkout form). */
  client: {
    fullName: string;
    email: string;
    phone: string;
    organisationName?: string;
  };

  /**
   * Payment reference — set after a successful Razorpay transaction.
   * Required for DirectCheckout source; optional for AdminInitiated.
   */
  razorpayOrderId?: string;

  /** Amount paid at initiation (may be 50% advance). */
  amountPaid?: number;

  /** Total order value. */
  totalAmount?: number;
}

// ─── Onboarding State ────────────────────────────────────────────────────────

/**
 * Snapshot of the current onboarding state for a client order.
 * Produced by OnboardingService.getState() (future batch).
 */
export interface OnboardingState {
  onboardingId: string;
  clientProfileId: string;
  stage: OnboardingStage;
  source: OnboardingSource;
  leadId?: string;
  serviceSlugsPurchased: string[];
  documentsRequired: string[];
  documentsReceived: string[];
  documentsApproved: string[];
  projectIds: string[];
  billingAnchorProjectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Onboarding Result ────────────────────────────────────────────────────────

/**
 * Returned by OnboardingService.initiate() once the flow is bootstrapped.
 */
export interface OnboardingInitResult {
  clientProfileId: string;
  onboardingStage: OnboardingStage;
  /** Pre-signed WhatsApp link for document submission. */
  whatsappRedirectUrl?: string;
  /** Portal URL for document upload. */
  documentUploadUrl?: string;
}

// ─── Onboarding Event ─────────────────────────────────────────────────────────

/**
 * Events emitted during the onboarding lifecycle.
 * Used by the notification trigger layer.
 */
export enum OnboardingEvent {
  Initiated = 'onboarding.initiated',
  DocumentsSubmitted = 'onboarding.documents_submitted',
  DocumentsApproved = 'onboarding.documents_approved',
  DocumentsRejected = 'onboarding.documents_rejected',
  ProjectCreated = 'onboarding.project_created',
  Completed = 'onboarding.completed',
  Stalled = 'onboarding.stalled',
}
