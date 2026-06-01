/**
 * KlawTax Services Catalog — Canonical Seed Data
 *
 * Architecture v1.5 specifies exactly 26 DB records:
 *   - 10 standalone NGO services
 *   - 8  standalone Business & Compliance services
 *   - 1  standalone Audit service (Social Audit Report)
 *   - 4  standalone Digital services
 *   - 2  inactive standalone services (DIN, DSC)
 *   - 1  bundle (Section 8 NGO Complete Package)
 *
 * Cross-category display is handled via displayCategories[].
 * ONE canonical record per service — never duplicate documents.
 *
 * Pricing (INR) sourced from frontend design document v1.0 Appendix.
 */

import {
  ServicePrimaryCategory,
  ServiceDisplayCategory,
  ServiceDeliveryType,
  ServicePriceType,
} from '../models/serviceEnums';

// Shorthand aliases for readability
const {
  NgoRegistration: NGO,
  BusinessCompliance: BIZ,
  AuditsReports: AUDIT,
  Digital: DIGITAL,
} = ServicePrimaryCategory;

const {
  NgoServices: TAB_NGO,
  BusinessCompliance: TAB_BIZ,
  AuditsReports: TAB_AUDIT,
  DigitalCrowdfunding: TAB_DIGITAL,
} = ServiceDisplayCategory;

const {
  Registration: REG,
  Compliance: COMP,
  Audit: AUD,
  Reporting: RPT,
  Digital: DIG,
  Hosting: HOST,
  Marketing: MKT,
} = ServiceDeliveryType;

const { Fixed: FIXED, Range: RANGE } = ServicePriceType;

// ─── Seed Record Type (subset of IService fields, _id auto-generated) ────────

interface ServiceSeed {
  name: string;
  slug: string;
  shortName: string;
  description: string;
  shortDescription: string;
  primaryCategory: ServicePrimaryCategory;
  displayCategories: ServiceDisplayCategory[];
  tags: string[];
  serviceDeliveryType: ServiceDeliveryType;
  isBundle: boolean;
  bundledServiceSlugs: string[];
  parentServiceSlug: string | null;
  priceType: ServicePriceType;
  basePrice: number;
  maxPrice: number | null;
  advancePrice: number | null;
  currency: string;
  pricingNotes: string;
  estimatedDeliveryDays: number | null;
  requiresDocuments: boolean;
  requiresApproval: boolean;
  requiresManualReview: boolean;
  isActive: boolean;
  isFeatured: boolean;
  isPublic: boolean;
  seoTitle: string;
  seoDescription: string;
  iconKey: string;
  displayOrder: number;
  popularityScore: number;
  archivedAt: null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — NGO SERVICES (10 standalone records)
// ─────────────────────────────────────────────────────────────────────────────

const NGO_SERVICES: ServiceSeed[] = [
  // 1. 12A Registration
  {
    name: '12A Income Tax Exemption',
    slug: '12a-registration',
    shortName: '12A Registration',
    description:
      'Section 12A registration grants income tax exemption to NGOs, trusts, and charitable institutions under the Income Tax Act. Essential for all nonprofit organisations to avoid paying income tax on received donations and grants.',
    shortDescription:
      'Income tax exemption certificate for NGOs and charitable institutions under Section 12A.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_BIZ],
    tags: ['12a', 'income tax', 'exemption', 'ngo', 'trust', 'charitable'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Included in Section 8 Complete Package',
    estimatedDeliveryDays: 30,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: '12A Registration Online | Income Tax Exemption for NGOs | KlawTax',
    seoDescription:
      'Get Section 12A income tax exemption for your NGO online. Expert CA/CS team. ₹2,500. Fast processing.',
    iconKey: 'tax-exemption',
    displayOrder: 11,
    popularityScore: 75,
    archivedAt: null,
  },

  // 2. 80G Registration
  {
    name: '80G Donor Tax Deduction Certificate',
    slug: '80g-registration',
    shortName: '80G Registration',
    description:
      'Section 80G certification enables your donors to claim tax deductions on contributions made to your NGO. A critical credential for attracting CSR funding and individual donations from tax-paying individuals and companies.',
    shortDescription:
      'Enable donors to claim tax deductions on their contributions under Section 80G.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_BIZ],
    tags: ['80g', 'donor deduction', 'tax benefit', 'csr', 'ngo funding'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Often processed together with 12A. Included in Section 8 Complete Package.',
    estimatedDeliveryDays: 30,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: '80G Registration Online | Donor Tax Deduction Certificate | KlawTax',
    seoDescription:
      'Get 80G certification for your NGO. Allow donors to claim tax deductions. Expert team. ₹2,500.',
    iconKey: 'donor-certificate',
    displayOrder: 12,
    popularityScore: 72,
    archivedAt: null,
  },

  // 3. CSR-1 Registration
  {
    name: 'CSR-1 Registration (MCA Portal)',
    slug: 'csr1-registration',
    shortName: 'CSR-1 Registration',
    description:
      'CSR-1 registration is mandatory for NGOs and implementing agencies that wish to receive Corporate Social Responsibility funds from Indian companies. Filed on the MCA portal, it enables your organisation to appear on the CSR database for corporate donors.',
    shortDescription:
      'Mandatory MCA registration for NGOs seeking to receive CSR funds from corporates.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO],
    tags: ['csr', 'csr-1', 'mca', 'corporate social responsibility', 'corporate funding'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Government fee included.',
    estimatedDeliveryDays: 14,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'CSR-1 Registration Online | MCA Portal Filing | KlawTax',
    seoDescription:
      'Register your NGO on MCA CSR-1 portal to receive corporate CSR funds. CA/CS experts. ₹2,000.',
    iconKey: 'csr',
    displayOrder: 13,
    popularityScore: 55,
    archivedAt: null,
  },

  // 4. NGO DARPAN
  {
    name: 'NGO DARPAN Registration',
    slug: 'ngo-darpan-registration',
    shortName: 'NGO DARPAN',
    description:
      'NGO DARPAN is a government portal managed by NITI Aayog for registration of voluntary organisations. DARPAN registration is mandatory for all NGOs seeking government grants, central schemes, and E-Anudan funding. It provides a unique DARPAN ID to your organisation.',
    shortDescription:
      'NITI Aayog DARPAN portal registration — mandatory for government grants and E-Anudan.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO],
    tags: ['darpan', 'niti aayog', 'government grants', 'ngo registration', 'darpan id'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Included in Section 8 Complete Package.',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'NGO DARPAN Registration | NITI Aayog Portal | KlawTax',
    seoDescription:
      'Register your NGO on NITI Aayog DARPAN portal. Get DARPAN ID for government grants. ₹1,500.',
    iconKey: 'darpan',
    displayOrder: 14,
    popularityScore: 68,
    archivedAt: null,
  },

  // 5. E-Anudan Registration
  {
    name: 'E-Anudan Portal Registration',
    slug: 'e-anudan-registration',
    shortName: 'E-Anudan',
    description:
      `E-Anudan is the Government of India's online grant disbursement portal for voluntary organisations. Registration enables your NGO to apply for and receive central government grants directly. Requires prior NGO DARPAN registration.`,
    shortDescription:
      'Government of India grant portal registration for receiving central scheme funding.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO],
    tags: ['e-anudan', 'government grants', 'grant portal', 'central scheme', 'ministry grants'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Requires NGO DARPAN registration. Included in Section 8 Complete Package.',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'E-Anudan Registration | Government Grant Portal | KlawTax',
    seoDescription:
      'Register on E-Anudan portal for government grants. Expert-managed filing. ₹1,000.',
    iconKey: 'e-anudan',
    displayOrder: 15,
    popularityScore: 58,
    archivedAt: null,
  },

  // 6. Udyam (MSME) Registration
  {
    name: 'Udyam (MSME) Registration',
    slug: 'udyam-registration',
    shortName: 'Udyam Registration',
    description:
      'Udyam registration (formerly MSME registration) provides your NGO or business with official Micro, Small & Medium Enterprise status. Unlocks government schemes, priority sector lending, tender preferences, and credit guarantee benefits.',
    shortDescription:
      'Official MSME registration for NGOs and businesses — access government schemes and benefits.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_BIZ],
    tags: ['udyam', 'msme', 'udyam certificate', 'msme registration', 'small business'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Included in Section 8 Complete Package.',
    estimatedDeliveryDays: 3,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Udyam MSME Registration Online | KlawTax',
    seoDescription:
      'Get Udyam MSME certificate for your NGO or business. ₹1,000 all-inclusive. 3-day processing.',
    iconKey: 'msme',
    displayOrder: 16,
    popularityScore: 60,
    archivedAt: null,
  },

  // 7. ITR Filing (NGO)
  {
    name: 'Income Tax Return Filing (NGO / Trust)',
    slug: 'itr-filing-ngo',
    shortName: 'ITR Filing (NGO)',
    description:
      'Annual Income Tax Return filing for NGOs, trusts, and Section 8 companies under Forms ITR-5 and ITR-7. Ensures compliance with Income Tax Act requirements and maintains 12A / 80G exemption status.',
    shortDescription:
      'Annual ITR filing for NGOs and trusts — ITR-5 / ITR-7 with expert CA handling.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_AUDIT],
    tags: ['itr', 'income tax return', 'ngo itr', 'trust itr', 'itr-7', 'itr-5', 'compliance'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'NGO ITR Filing Online | Trust Income Tax Return | KlawTax',
    seoDescription:
      'File income tax returns for your NGO or trust. ITR-5/ITR-7. CA-managed. ₹1,500.',
    iconKey: 'itr',
    displayOrder: 17,
    popularityScore: 50,
    archivedAt: null,
  },

  // 8. Audit + UDIN + Balance Sheet
  {
    name: 'Statutory Audit with UDIN & Balance Sheet',
    slug: 'audit-udin-balance-sheet',
    shortName: 'Audit + UDIN',
    description:
      'Comprehensive statutory audit for NGOs, trusts, and Section 8 companies including preparation of audited financial statements, Balance Sheet, Income & Expenditure Account, and generation of Unique Document Identification Number (UDIN) by a qualified CA.',
    shortDescription:
      'Full statutory audit with UDIN generation and audited financials for NGOs and trusts.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_AUDIT],
    tags: ['audit', 'udin', 'balance sheet', 'statutory audit', 'chartered accountant', 'ngo audit'],
    serviceDeliveryType: AUD,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 3000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 21,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'NGO Statutory Audit with UDIN | Balance Sheet | KlawTax',
    seoDescription:
      'Statutory audit for NGOs and trusts with UDIN and audited financials. CA-certified. ₹3,000.',
    iconKey: 'audit',
    displayOrder: 18,
    popularityScore: 45,
    archivedAt: null,
  },

  // 9. Project Report
  {
    name: 'Project Report Preparation',
    slug: 'project-report',
    shortName: 'Project Report',
    description:
      'Professional project report preparation for NGOs, startups, and businesses applying for bank loans, government grants, or investor funding. Includes executive summary, financial projections, implementation plan, and compliance notes.',
    shortDescription:
      'Professional project reports for loan applications, grants, and investor funding.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_AUDIT],
    tags: ['project report', 'bank loan', 'grant application', 'financial projections', 'startup report'],
    serviceDeliveryType: RPT,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Project Report Preparation Online | Bank Loan & Grants | KlawTax',
    seoDescription:
      'Get professional project reports for loan or grant applications. CA/CS team. ₹2,000.',
    iconKey: 'project-report',
    displayOrder: 19,
    popularityScore: 40,
    archivedAt: null,
  },

  // 10. Annual Report
  {
    name: 'Annual Report Preparation',
    slug: 'annual-report',
    shortName: 'Annual Report',
    description:
      `Preparation of annual report for NGOs, Section 8 companies, and businesses as required by MCA and donors. Includes Directors' Report, Board Report, audited financial statements, and activity summary.`,
    shortDescription:
      'Complete annual report preparation for NGOs and companies — MCA-compliant.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO, TAB_BIZ, TAB_AUDIT],
    tags: ['annual report', 'board report', 'directors report', 'mca compliance', 'company annual report'],
    serviceDeliveryType: RPT,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 14,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Annual Report Preparation | NGO & Company | KlawTax',
    seoDescription:
      'Professional annual report preparation for NGOs and companies. MCA-compliant. ₹2,500.',
    iconKey: 'annual-report',
    displayOrder: 20,
    popularityScore: 42,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — BUSINESS & COMPLIANCE SERVICES (8 standalone records)
// ─────────────────────────────────────────────────────────────────────────────

const BUSINESS_SERVICES: ServiceSeed[] = [
  // 11. Section 8 Company Registration (standalone)
  {
    name: 'Section 8 Company Registration',
    slug: 'section-8-registration',
    shortName: 'Section 8 Company',
    description:
      'Section 8 Company registration under the Companies Act 2013 for NGOs, nonprofits, and charitable organisations. A company limited by guarantee — the most credible legal structure for Indian nonprofits. Includes MOA/AOA drafting, DSC, DIN, name approval, and ROC filing.',
    shortDescription:
      'Incorporate your NGO as a Section 8 Company — includes DSC, DIN, PAN, TAN, and ROC filing.',
    primaryCategory: BIZ,
    displayCategories: [TAB_NGO, TAB_BIZ],
    tags: ['section 8', 'ngo registration', 'nonprofit', 'company registration', 'roc', 'mca'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 8000,
    maxPrice: null,
    advancePrice: 4000,
    currency: 'INR',
    pricingNotes: 'All-inclusive: MOA/AOA, DSC (×2), DIN (×2), PAN, TAN, name approval, ROC filing.',
    estimatedDeliveryDays: 21,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Section 8 NGO Registration Online | ₹8,000 | KlawTax',
    seoDescription:
      'Register your Section 8 NGO company online. Includes DSC, DIN, PAN, TAN. ₹8,000 all-inclusive. 500+ NGOs registered.',
    iconKey: 'section-8',
    displayOrder: 10,
    popularityScore: 90,
    archivedAt: null,
  },

  // 12. Private Limited Company
  {
    name: 'Private Limited Company Registration',
    slug: 'private-limited-company',
    shortName: 'Pvt Ltd Company',
    description:
      'Register a Private Limited Company under the Companies Act 2013. Ideal for startups and growing businesses. Includes DSC, DIN, name approval (SPICe+), MOA/AOA drafting, PAN, TAN, and Certificate of Incorporation.',
    shortDescription:
      'Register a Pvt Ltd company with full MCA compliance — SPICe+ filing, PAN, TAN included.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['pvt ltd', 'private limited', 'startup', 'company registration', 'spice+', 'mca'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 7500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'All-inclusive. Government fees included.',
    estimatedDeliveryDays: 15,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Private Limited Company Registration Online | ₹7,500 | KlawTax',
    seoDescription:
      'Register your Pvt Ltd company online. SPICe+ filing, DSC, DIN, PAN, TAN. ₹7,500 all-inclusive.',
    iconKey: 'pvt-ltd',
    displayOrder: 21,
    popularityScore: 70,
    archivedAt: null,
  },

  // 13. One Person Company (OPC)
  {
    name: 'One Person Company (OPC) Registration',
    slug: 'opc-registration',
    shortName: 'OPC Registration',
    description:
      'Register a One Person Company under Section 2(62) of the Companies Act 2013. Perfect for sole proprietors seeking limited liability protection. Includes DSC, DIN, name approval, MOA/AOA, PAN, and TAN.',
    shortDescription:
      'One Person Company registration with limited liability — ideal for solo entrepreneurs.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['opc', 'one person company', 'sole proprietor', 'company registration', 'limited liability'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 7500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'All-inclusive. Government fees included.',
    estimatedDeliveryDays: 15,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'OPC Registration Online | One Person Company | ₹7,500 | KlawTax',
    seoDescription:
      'Register your One Person Company (OPC) online. DSC, DIN, PAN, TAN included. ₹7,500.',
    iconKey: 'opc',
    displayOrder: 22,
    popularityScore: 52,
    archivedAt: null,
  },

  // 14. LLP Registration
  {
    name: 'LLP Registration (Limited Liability Partnership)',
    slug: 'llp-registration',
    shortName: 'LLP Registration',
    description:
      'Register a Limited Liability Partnership under the LLP Act 2008. Combines partnership flexibility with limited liability protection. Includes DSC, DPIN, LLP Agreement drafting, name reservation, PAN, and TAN.',
    shortDescription:
      'LLP registration with limited liability and flexible management structure.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['llp', 'limited liability partnership', 'partnership firm', 'company registration'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 7000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'All-inclusive. Government fees included.',
    estimatedDeliveryDays: 15,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'LLP Registration Online | Limited Liability Partnership | ₹7,000 | KlawTax',
    seoDescription:
      'Register your LLP online. DSC, DPIN, LLP Agreement, PAN, TAN included. ₹7,000.',
    iconKey: 'llp',
    displayOrder: 23,
    popularityScore: 55,
    archivedAt: null,
  },

  // 15. GST Registration
  {
    name: 'GST Registration',
    slug: 'gst-registration',
    shortName: 'GST Registration',
    description:
      'Goods and Services Tax registration for businesses, NGOs, and freelancers. Mandatory for businesses with turnover above the GST threshold. Includes application preparation, document submission, and GSTIN procurement.',
    shortDescription:
      'GSTIN registration for businesses and NGOs. Expert-managed application. Quick turnaround.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['gst', 'gstin', 'gst registration', 'tax registration', 'indirect tax'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'GST Registration Online | GSTIN | ₹1,000 | KlawTax',
    seoDescription:
      'Get your GST registration (GSTIN) online. Expert filing. ₹1,000 all-inclusive.',
    iconKey: 'gst',
    displayOrder: 24,
    popularityScore: 65,
    archivedAt: null,
  },

  // 16. ISO Certification
  {
    name: 'ISO Certification',
    slug: 'iso-certification',
    shortName: 'ISO Certification',
    description:
      'ISO certification for businesses seeking international quality management recognition. Available for ISO 9001 (Quality), ISO 14001 (Environment), ISO 45001 (Occupational Health & Safety), and other standards. Includes documentation, gap analysis, and certification support.',
    shortDescription:
      'ISO 9001, 14001, and other ISO certifications for businesses and NGOs.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['iso', 'iso 9001', 'quality management', 'iso certification', 'international standard'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: RANGE,
    basePrice: 1500,
    maxPrice: 2500,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Price varies by ISO standard and scope.',
    estimatedDeliveryDays: 30,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'ISO Certification Online | ISO 9001, 14001 | KlawTax',
    seoDescription:
      'Get ISO certified for your business. ISO 9001, 14001, 45001 and more. ₹1,500–₹2,500.',
    iconKey: 'iso',
    displayOrder: 25,
    popularityScore: 48,
    archivedAt: null,
  },

  // 17. FSSAI Registration
  {
    name: 'FSSAI Food License Registration',
    slug: 'fssai-registration',
    shortName: 'FSSAI License',
    description:
      'Food Safety and Standards Authority of India (FSSAI) registration for food businesses, restaurants, cloud kitchens, food manufacturers, and traders. Mandatory under the Food Safety and Standards Act 2006.',
    shortDescription:
      'FSSAI food license for restaurants, food businesses, and cloud kitchens.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['fssai', 'food license', 'food safety', 'food business', 'restaurant license'],
    serviceDeliveryType: COMP,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 999,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 10,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'FSSAI Registration Online | Food License | ₹999 | KlawTax',
    seoDescription:
      'Get FSSAI food license for your food business. Expert filing. ₹999 all-inclusive.',
    iconKey: 'fssai',
    displayOrder: 26,
    popularityScore: 58,
    archivedAt: null,
  },

  // 18. IEC (Import Export Code)
  {
    name: 'IEC — Import Export Code Registration',
    slug: 'iec-registration',
    shortName: 'IEC Registration',
    description:
      'Import Export Code (IEC) is a mandatory 10-digit code issued by DGFT for businesses and individuals engaged in import/export of goods and services from India. Required for customs clearance and foreign remittance.',
    shortDescription:
      'DGFT Import Export Code for businesses involved in international trade.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['iec', 'import export code', 'dgft', 'export business', 'import license'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'IEC Registration Online | Import Export Code | DGFT | KlawTax',
    seoDescription:
      'Get your Import Export Code (IEC) from DGFT. Expert filing. ₹1,500.',
    iconKey: 'iec',
    displayOrder: 27,
    popularityScore: 42,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — AUDITS & REPORTS (1 standalone — Social Audit)
// Other audit/report services are under NGO (category: audit) and displayed
// in the Audits & Reports tab via displayCategories — per v1.5 Part 10 note.
// ─────────────────────────────────────────────────────────────────────────────

const AUDIT_SERVICES: ServiceSeed[] = [
  // 19. Social Audit Report
  {
    name: 'Social Audit Report',
    slug: 'social-audit-report',
    shortName: 'Social Audit',
    description:
      'Social Audit Report preparation for NGOs and implementing agencies required for government schemes including MGNREGS, Smart Cities, and other centrally-sponsored programmes. Includes field-level data compilation, stakeholder interviews, and certified audit report.',
    shortDescription:
      'Social audit reports for government schemes — MGNREGS, Smart Cities, and CSR compliance.',
    primaryCategory: AUDIT,
    displayCategories: [TAB_AUDIT],
    tags: ['social audit', 'mgnregs', 'social audit report', 'government schemes', 'csr audit'],
    serviceDeliveryType: AUD,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 3000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Price may vary based on programme scope.',
    estimatedDeliveryDays: 21,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Social Audit Report | MGNREGS & Govt Schemes | KlawTax',
    seoDescription:
      'Social audit reports for government schemes and CSR compliance. Expert CA team. ₹3,000.',
    iconKey: 'social-audit',
    displayOrder: 30,
    popularityScore: 30,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — DIGITAL & CROWDFUNDING SERVICES (4 standalone records)
// ─────────────────────────────────────────────────────────────────────────────

const DIGITAL_SERVICES: ServiceSeed[] = [
  // 20. Website Development
  {
    name: 'Website Development',
    slug: 'website-development',
    shortName: 'Website Development',
    description:
      'Professional website design and development for NGOs, startups, and businesses. Includes responsive design, CMS setup, contact forms, donation/payment gateway integration, and basic SEO setup.',
    shortDescription:
      'Professional website development for NGOs and businesses with payment integration.',
    primaryCategory: DIGITAL,
    displayCategories: [TAB_DIGITAL],
    tags: ['website', 'web development', 'ngo website', 'cms', 'responsive design'],
    serviceDeliveryType: DIG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 8000,
    maxPrice: null,
    advancePrice: 4000,
    currency: 'INR',
    pricingNotes: 'Price varies based on complexity. Advance: ₹4,000.',
    estimatedDeliveryDays: 21,
    requiresDocuments: false,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Website Development for NGOs & Businesses | KlawTax',
    seoDescription:
      'Professional website development for NGOs and businesses. Responsive design, CMS, payment integration.',
    iconKey: 'website',
    displayOrder: 40,
    popularityScore: 38,
    archivedAt: null,
  },

  // 21. Digital Marketing & SEO
  {
    name: 'Digital Marketing & SEO',
    slug: 'digital-marketing-seo',
    shortName: 'Digital Marketing',
    description:
      'Comprehensive digital marketing services for NGOs and businesses including Search Engine Optimisation (SEO), Google Ads, Meta Ads, content marketing, and social media management to improve online visibility and reach.',
    shortDescription:
      'SEO, Google Ads, Meta Ads, and social media management for NGOs and businesses.',
    primaryCategory: DIGITAL,
    displayCategories: [TAB_DIGITAL],
    tags: ['seo', 'digital marketing', 'google ads', 'meta ads', 'social media', 'content marketing'],
    serviceDeliveryType: MKT,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 5000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Monthly retainer available. Price varies by scope.',
    estimatedDeliveryDays: 30,
    requiresDocuments: false,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Digital Marketing & SEO Services | NGOs & Businesses | KlawTax',
    seoDescription:
      'Digital marketing, SEO, Google Ads, and social media for NGOs and businesses.',
    iconKey: 'digital-marketing',
    displayOrder: 41,
    popularityScore: 32,
    archivedAt: null,
  },

  // 22. Crowdfunding Registration
  {
    name: 'Crowdfunding Platform Registration',
    slug: 'crowdfunding-registration',
    shortName: 'Crowdfunding',
    description:
      'Setup and registration on leading Indian crowdfunding platforms (Milaap, Ketto, GiveIndia, ImpactGuru) for NGOs seeking to raise funds online. Includes profile setup, campaign creation support, and payment gateway verification.',
    shortDescription:
      'Crowdfunding platform setup for NGOs on Milaap, Ketto, GiveIndia, and ImpactGuru.',
    primaryCategory: DIGITAL,
    displayCategories: [TAB_DIGITAL, TAB_NGO],
    tags: ['crowdfunding', 'milaap', 'ketto', 'giveindia', 'online fundraising', 'ngo fundraising'],
    serviceDeliveryType: DIG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 2000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: '',
    estimatedDeliveryDays: 7,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'Crowdfunding Registration for NGOs | Milaap, Ketto | KlawTax',
    seoDescription:
      'Set up crowdfunding campaigns for your NGO on Milaap, Ketto, GiveIndia. ₹2,000.',
    iconKey: 'crowdfunding',
    displayOrder: 42,
    popularityScore: 35,
    archivedAt: null,
  },

  // 23. AWS Hosting
  {
    name: 'AWS Cloud Hosting Setup',
    slug: 'aws-hosting',
    shortName: 'AWS Hosting',
    description:
      'Professional AWS cloud hosting setup for NGO and business websites and applications. Includes EC2 or Amplify setup, S3 storage, CloudFront CDN, SSL configuration, domain setup, and basic monitoring configuration.',
    shortDescription:
      'Professional AWS cloud hosting setup with SSL, CDN, and monitoring for NGOs and businesses.',
    primaryCategory: DIGITAL,
    displayCategories: [TAB_DIGITAL],
    tags: ['aws', 'cloud hosting', 'ec2', 'cloudfront', 'ssl', 'web hosting'],
    serviceDeliveryType: HOST,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 3000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'AWS usage charges billed separately by AWS.',
    estimatedDeliveryDays: 5,
    requiresDocuments: false,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: false,
    isPublic: true,
    seoTitle: 'AWS Cloud Hosting Setup | NGOs & Businesses | KlawTax',
    seoDescription:
      'Professional AWS hosting setup for NGOs and businesses. EC2, S3, CloudFront, SSL. ₹3,000.',
    iconKey: 'aws',
    displayOrder: 43,
    popularityScore: 25,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — INACTIVE STANDALONE SERVICES (2 records, isActive: false)
// DIN and DSC are components of Section 8 / company registration packages.
// They are seeded as inactive until unbundled individual sales are introduced.
// ─────────────────────────────────────────────────────────────────────────────

const INACTIVE_SERVICES: ServiceSeed[] = [
  // 24. DIN Registration (inactive)
  {
    name: 'Director Identification Number (DIN)',
    slug: 'din-registration',
    shortName: 'DIN Registration',
    description:
      'Director Identification Number registration for company directors. Required before a person can be appointed as a director of any Indian company. Included within Section 8 and company registration packages.',
    shortDescription:
      'DIN registration for company directors — included in all company registration packages.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['din', 'director identification number', 'company director', 'mca'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1000,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Included in all company registration packages. Not available as standalone.',
    estimatedDeliveryDays: 3,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: false,   // ← Inactive per architecture v1.5 Part 10
    isFeatured: false,
    isPublic: false,
    seoTitle: 'DIN Registration | Director Identification Number | KlawTax',
    seoDescription: 'Director Identification Number registration included in company registration packages.',
    iconKey: 'din',
    displayOrder: 90,
    popularityScore: 0,
    archivedAt: null,
  },

  // 25. DSC Registration (inactive)
  {
    name: 'Digital Signature Certificate (DSC)',
    slug: 'dsc-registration',
    shortName: 'DSC',
    description:
      'Digital Signature Certificate required for MCA filings, income tax returns, and tender submissions. Class-3 DSC for company directors and authorised signatories. Included in all company and NGO registration packages.',
    shortDescription:
      'Class-3 Digital Signature Certificate for directors — included in company registration packages.',
    primaryCategory: BIZ,
    displayCategories: [TAB_BIZ],
    tags: ['dsc', 'digital signature', 'class 3', 'mca filing', 'e-sign'],
    serviceDeliveryType: REG,
    isBundle: false,
    bundledServiceSlugs: [],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 1500,
    maxPrice: null,
    advancePrice: null,
    currency: 'INR',
    pricingNotes: 'Included in all company registration packages. Not available as standalone.',
    estimatedDeliveryDays: 3,
    requiresDocuments: true,
    requiresApproval: false,
    requiresManualReview: false,
    isActive: false,   // ← Inactive per architecture v1.5 Part 10
    isFeatured: false,
    isPublic: false,
    seoTitle: 'DSC Registration | Digital Signature Certificate | KlawTax',
    seoDescription: 'Class-3 DSC for directors and company filings. Included in registration packages.',
    iconKey: 'dsc',
    displayOrder: 91,
    popularityScore: 0,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — BUNDLE SERVICE (1 record)
// ─────────────────────────────────────────────────────────────────────────────

const BUNDLE_SERVICES: ServiceSeed[] = [
  // 26. Section 8 NGO Complete Package (bundle)
  {
    name: 'Section 8 NGO Complete Package',
    slug: 'section-8-complete-package',
    shortName: 'NGO Complete Package',
    description:
      'The all-in-one package for NGO founders. Combines Section 8 Company Registration, 12A Income Tax Exemption, 80G Donor Deduction, NGO DARPAN, E-Anudan, and Udyam (MSME) into a single fully-managed engagement. PAN, TAN, DSC, and DIN are included. Saves ₹3,500+ vs purchasing individually.',
    shortDescription:
      '7 services in 1 bundle: Section 8 + 12A + 80G + DARPAN + E-Anudan + Udyam + PAN/TAN/DSC.',
    primaryCategory: NGO,
    displayCategories: [TAB_NGO],
    tags: ['section 8 package', 'ngo bundle', 'complete ngo setup', '12a 80g', 'ngo registration package'],
    serviceDeliveryType: REG,
    isBundle: true,
    bundledServiceSlugs: [
      'section-8-registration',
      '12a-registration',
      '80g-registration',
      'ngo-darpan-registration',
      'e-anudan-registration',
      'udyam-registration',
    ],
    parentServiceSlug: null,
    priceType: FIXED,
    basePrice: 13500,
    maxPrice: null,
    advancePrice: 6750,
    currency: 'INR',
    pricingNotes: 'All-inclusive. Government fees included. Pay ₹6,750 advance to start.',
    estimatedDeliveryDays: 45,
    requiresDocuments: true,
    requiresApproval: true,
    requiresManualReview: true,
    isActive: true,
    isFeatured: true,   // ← Featured — hero card in frontend
    isPublic: true,
    seoTitle: 'Section 8 NGO Complete Package | ₹13,500 | 7 Services | KlawTax',
    seoDescription:
      'Complete NGO setup: Section 8 + 12A + 80G + DARPAN + E-Anudan + Udyam + PAN/TAN/DSC. ₹13,500 all-inclusive. 500+ NGOs registered.',
    iconKey: 'ngo-package',
    displayOrder: 1,    // ← Always first in listings
    popularityScore: 100,
    archivedAt: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL SEED EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const SERVICE_SEED_DATA: ServiceSeed[] = [
  ...BUNDLE_SERVICES,      // Bundle first (displayOrder: 1)
  ...BUSINESS_SERVICES,    // Section 8 standalone first in business (displayOrder: 10)
  ...NGO_SERVICES,         // NGO services (displayOrder: 11–20)
  ...AUDIT_SERVICES,       // Audit services (displayOrder: 30)
  ...DIGITAL_SERVICES,     // Digital services (displayOrder: 40–43)
  ...INACTIVE_SERVICES,    // Inactive last (displayOrder: 90–91)
];

// Verify canonical count at module load time (dev-time assertion)
const EXPECTED_COUNT = 26;
if (SERVICE_SEED_DATA.length !== EXPECTED_COUNT) {
  throw new Error(
    `[services.seed] Expected ${EXPECTED_COUNT} service records, got ${SERVICE_SEED_DATA.length}. ` +
      `Check architecture v1.5 Part 10.2.`
  );
}

// Verify slug uniqueness at module load time
const slugSet = new Set<string>();
for (const svc of SERVICE_SEED_DATA) {
  if (slugSet.has(svc.slug)) {
    throw new Error(`[services.seed] Duplicate slug detected: "${svc.slug}"`);
  }
  slugSet.add(svc.slug);
}
