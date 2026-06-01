/**
 * Onboarding helper utilities.
 *
 * Pure, stateless functions used across the onboarding flow.
 * No database access — no side effects.
 * These are shared by the payment handler, lead conversion service,
 * and the future OnboardingService implementation.
 */

import { OnboardingSource, OnboardingInitRequest } from './onboardingTypes';

// ─── WhatsApp Link Builder ────────────────────────────────────────────────────

/**
 * Builds a pre-filled WhatsApp redirect URL for post-payment document submission.
 *
 * @param phoneNumber  KlawTax WhatsApp business number (from config)
 * @param orderId      Internal order/project reference
 * @param clientName   Client's name (pre-fills the greeting)
 * @param serviceName  Human-readable service name
 */
export function buildWhatsAppRedirectUrl(params: {
  phoneNumber: string;
  orderId: string;
  clientName: string;
  serviceName: string;
}): string {
  const message = [
    `Hi KlawTax! I've completed payment for ${params.serviceName}.`,
    `Order reference: ${params.orderId}`,
    `Please guide me on the next steps.`,
  ].join('\n');

  const encoded = encodeURIComponent(message);
  const cleaned = params.phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

// ─── Document Checklist Builder ───────────────────────────────────────────────

/**
 * Returns the canonical list of required document types for a given set of
 * service slugs. This is a static lookup — the authoritative list lives in
 * the `services` collection (future batch). For the onboarding foundation,
 * we provide the common base documents shared across all KlawTax services.
 *
 * Future batch: replace with `ServiceRepository.getRequiredDocuments(slugs)`.
 */
export function getBaseRequiredDocuments(serviceSlugs: string[]): string[] {
  const base: string[] = [
    'aadhaar_card_directors',
    'pan_card_directors',
    'passport_photo_directors',
    'address_proof_directors',
  ];

  // Additional documents required when registering an office address
  const needsOfficeProof = serviceSlugs.some((s) =>
    ['section-8-registration', 'pvt-ltd-registration', 'opc-registration', 'llp-registration'].includes(s)
  );
  if (needsOfficeProof) {
    base.push('electricity_bill_registered_office', 'noc_property_owner');
  }

  // GST-specific
  if (serviceSlugs.includes('gst-registration')) {
    base.push('bank_statement_or_cancelled_cheque');
  }

  // Dedup and return
  return [...new Set(base)];
}

// ─── Onboarding Init Request Builder ─────────────────────────────────────────

/**
 * Builds a validated OnboardingInitRequest from a lead conversion event.
 * Called by LeadService.markConverted() when a lead is converted via CRM.
 */
export function buildOnboardingInitRequestFromLead(params: {
  leadId: string;
  fullName: string;
  email: string;
  phone: string;
  organisationName?: string;
  serviceSlugsPurchased: string[];
}): OnboardingInitRequest {
  return {
    source: OnboardingSource.LeadConversion,
    leadId: params.leadId,
    serviceSlugsPurchased: params.serviceSlugsPurchased,
    client: {
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      ...(params.organisationName ? { organisationName: params.organisationName } : {}),
    },
  };
}

/**
 * Builds a validated OnboardingInitRequest from a direct checkout payment.
 * Called by the payment verification handler (future Batch 2.x).
 */
export function buildOnboardingInitRequestFromCheckout(params: {
  fullName: string;
  email: string;
  phone: string;
  organisationName?: string;
  serviceSlugsPurchased: string[];
  razorpayOrderId: string;
  amountPaid: number;
  totalAmount: number;
}): OnboardingInitRequest {
  return {
    source: OnboardingSource.DirectCheckout,
    serviceSlugsPurchased: params.serviceSlugsPurchased,
    client: {
      fullName: params.fullName,
      email: params.email,
      phone: params.phone,
      ...(params.organisationName ? { organisationName: params.organisationName } : {}),
    },
    razorpayOrderId: params.razorpayOrderId,
    amountPaid: params.amountPaid,
    totalAmount: params.totalAmount,
  };
}

// ─── Stage Utilities ──────────────────────────────────────────────────────────

/**
 * Returns a human-readable label for an onboarding stage.
 * Used in admin dashboard copy and client-facing status messages.
 */
export function getOnboardingStageCopy(stage: string): { admin: string; client: string } {
  const map: Record<string, { admin: string; client: string }> = {
    payment_received: {
      admin: 'Payment received — account setup pending',
      client: 'Payment confirmed. Welcome aboard!',
    },
    pending_documents: {
      admin: 'Awaiting document upload from client',
      client: 'Please submit your documents to get started.',
    },
    documents_under_review: {
      admin: 'Documents uploaded — review in progress',
      client: 'Your documents are under review. We\'ll update you shortly.',
    },
    project_initiated: {
      admin: 'Registration work in progress',
      client: 'We\'re working on your registration. Sit tight!',
    },
    completed: {
      admin: 'Onboarding complete — all services delivered',
      client: 'Your registration is complete. 🎉',
    },
  };

  return map[stage] ?? { admin: stage, client: stage };
}
