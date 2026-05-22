/**
 * Service Catalog Enums
 *
 * Kept in a separate file from models/enums.ts to avoid circular imports.
 * These enums are used by:
 *   - service.ts (schema definition)
 *   - services.seed.ts (seed data)
 *   - serviceRepository.ts (query filters)
 *   - serviceQuery.validator.ts (API validation)
 *
 * Naming conventions:
 *   ServicePrimaryCategory — the canonical "owner" category in the database
 *   ServiceDisplayCategory — the frontend tab keys a service appears under
 *   ServiceDeliveryType    — how the service is fulfilled (workflow routing)
 *   ServicePriceType       — how the price is expressed to the client
 */

// ─── Primary Category ─────────────────────────────────────────────────────────
// Every service belongs to exactly one primary category in the database.

export enum ServicePrimaryCategory {
  NgoRegistration   = 'ngo_registration',
  BusinessCompliance = 'business_compliance',
  AuditsReports     = 'audits_reports',
  Digital           = 'digital',
}

// ─── Display Category (Frontend Tab Keys) ────────────────────────────────────
// A service may appear in multiple frontend tabs via displayCategories[].
// One canonical DB record — multiple display categories.
// These values map directly to frontend tab identifiers.

export enum ServiceDisplayCategory {
  NgoServices         = 'ngo_services',
  BusinessCompliance  = 'business_compliance',
  AuditsReports       = 'audits_reports',
  DigitalCrowdfunding = 'digital_crowdfunding',
}

// ─── Service Delivery Type ───────────────────────────────────────────────────
// Controls workflow routing in future CRM phases.
// Each type will eventually map to a specific task template and
// delivery-gate condition in the project lifecycle.

export enum ServiceDeliveryType {
  Registration = 'registration',  // Govt-issued cert / incorporation (ROC, MCA, etc.)
  Compliance   = 'compliance',    // Ongoing regulatory filing (GST, ITR, etc.)
  Audit        = 'audit',         // CA/CS audit with UDIN
  Reporting    = 'reporting',     // Report creation (project report, annual report)
  Digital      = 'digital',       // Website / software development
  Hosting      = 'hosting',       // Cloud / server hosting
  Marketing    = 'marketing',     // Digital marketing, SEO, campaigns
  Consulting   = 'consulting',    // Advisory and consulting engagements
}

// ─── Price Type ───────────────────────────────────────────────────────────────

export enum ServicePriceType {
  Fixed   = 'fixed',    // Single deterministic price (basePrice)
  Range   = 'range',    // Price range — basePrice (min) to maxPrice (max)
  Custom  = 'custom',   // Quote on request; no public price displayed
}
