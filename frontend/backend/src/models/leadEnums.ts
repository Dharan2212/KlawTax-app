/**
 * Lead lifecycle enums.
 * Centralised here so models, services, and validators share a single source of truth.
 */

// ─── Lead Status ──────────────────────────────────────────────────────────────

export enum LeadStatus {
  New = 'new',
  Contacted = 'contacted',
  Qualified = 'qualified',
  ProposalSent = 'proposal_sent',
  Onboarding = 'onboarding',
  Converted = 'converted',
  Lost = 'lost',
  Archived = 'archived',
}

// ─── Valid Status Transitions ─────────────────────────────────────────────────
// Maps each status to the statuses it may transition INTO (admin-driven).

export const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  [LeadStatus.New]: [LeadStatus.Contacted, LeadStatus.Qualified, LeadStatus.Lost, LeadStatus.Archived],
  [LeadStatus.Contacted]: [LeadStatus.Qualified, LeadStatus.ProposalSent, LeadStatus.Lost, LeadStatus.Archived],
  [LeadStatus.Qualified]: [LeadStatus.ProposalSent, LeadStatus.Onboarding, LeadStatus.Lost, LeadStatus.Archived],
  [LeadStatus.ProposalSent]: [LeadStatus.Onboarding, LeadStatus.Qualified, LeadStatus.Lost, LeadStatus.Archived],
  [LeadStatus.Onboarding]: [LeadStatus.Converted, LeadStatus.Lost],
  [LeadStatus.Converted]: [], // Terminal — no further transitions
  [LeadStatus.Lost]: [LeadStatus.New, LeadStatus.Archived], // Allow re-activation
  [LeadStatus.Archived]: [LeadStatus.New], // Allow re-activation
};

// Active statuses (non-terminal, non-archived) — used in dashboard filters.
export const ACTIVE_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.New,
  LeadStatus.Contacted,
  LeadStatus.Qualified,
  LeadStatus.ProposalSent,
  LeadStatus.Onboarding,
];

// ─── Lead Priority ────────────────────────────────────────────────────────────

export enum LeadPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

// ─── Lead Source ──────────────────────────────────────────────────────────────

export enum LeadSource {
  Website = 'website',             // Contact / enquiry form
  WhatsApp = 'whatsapp',
  Referral = 'referral',
  SocialMedia = 'social_media',
  GoogleAds = 'google_ads',
  OrganicSearch = 'organic_search',
  DirectCall = 'direct_call',
  Email = 'email',
  Other = 'other',
}

// ─── Organisation Type ────────────────────────────────────────────────────────

export enum OrganisationType {
  Ngo = 'ngo',
  Section8Company = 'section8_company',
  Trust = 'trust',
  Society = 'society',
  PrivateLimited = 'private_limited',
  Opc = 'opc',
  Llp = 'llp',
  Partnership = 'partnership',
  Proprietorship = 'proprietorship',
  Individual = 'individual',
  Other = 'other',
}

// ─── Contact Method Preference ────────────────────────────────────────────────

export enum PreferredContactMethod {
  WhatsApp = 'whatsapp',
  Phone = 'phone',
  Email = 'email',
  Any = 'any',
}

// ─── Urgency Level ────────────────────────────────────────────────────────────

export enum UrgencyLevel {
  NotUrgent = 'not_urgent',
  WithinMonth = 'within_month',
  WithinWeek = 'within_week',
  Immediate = 'immediate',
}

// ─── Archive Reason ───────────────────────────────────────────────────────────

export enum LeadArchiveReason {
  AutoInactivity = 'auto_inactivity',
  AdminDecision = 'admin_decision',
  Duplicate = 'duplicate',
  NotQualified = 'not_qualified',
}

// ─── Loss Reason ──────────────────────────────────────────────────────────────

export enum LeadLossReason {
  PriceToHigh = 'price_too_high',
  ChoseCompetitor = 'chose_competitor',
  NoLongerNeeded = 'no_longer_needed',
  Unresponsive = 'unresponsive',
  OutOfScope = 'out_of_scope',
  Other = 'other',
}
