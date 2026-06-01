// ============================================================
// KlawTax — Pricing Module
// Version: 4.0 (Batch A — Single Source of Truth)
//
// This file is the CANONICAL pricing re-export hub.
// All pricing data originates from services.ts.
// DO NOT define prices here — import and re-export only.
// ============================================================

// Re-export the canonical package definition from services.ts
export { COMPLETE_PACKAGE, featuredPackage } from "@/lib/services";

// ─── Pricing Plans (for PricingTable component) ──────────────
// These pull their price values from COMPLETE_PACKAGE where applicable.

import { COMPLETE_PACKAGE } from "@/lib/services";

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  advancePrice?: number;
  originalPrice?: number;
  popular?: boolean;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
  serviceCount?: number;
}

export const pricingPlans: PricingPlan[] = [
  {
    id: "standalone-section8",
    name: "Section 8 NGO Registration",
    description: "Incorporate your Section 8 Company — the gold-standard NGO structure in India.",
    price: 7999,
    advancePrice: 3999,
    features: [
      "Section 8 Incorporation",
      "MOA & AOA Drafting",
      "DSC for 2 Directors",
      "DIN for 2 Directors",
      "Name Approval (RUN)",
      "PAN & TAN Included",
      "Incorporation Certificate",
    ],
    cta: "Get Started",
    href: "/checkout?service=section-8-registration",
  },
  {
    id: "complete-ngo",
    name: "Complete NGO Package",
    description: "Everything your NGO needs from incorporation to CSR-eligibility — in one bundle.",
    price: COMPLETE_PACKAGE.price,
    advancePrice: COMPLETE_PACKAGE.advancePrice,
    originalPrice: COMPLETE_PACKAGE.originalPrice,
    popular: true,
    badge: "MOST POPULAR",
    serviceCount: 7,
    features: COMPLETE_PACKAGE.services,
    cta: "Get Complete Package",
    href: "/checkout?service=section8-complete",
  },
  {
    id: "ngo-compliance-bundle",
    name: "NGO Full Compliance Bundle",
    description: "Annual compliance for NGOs — audit, ITR, Form 10BD, and all mandatory filings.",
    price: 8999,
    features: [
      "Statutory Audit with UDIN",
      "ITR-7 Filing",
      "Form 10BD (Donation Return)",
      "Balance Sheet Preparation",
      "FCRA Compliance Check",
      "Annual Compliance Calendar",
    ],
    cta: "Get Compliance Bundle",
    href: "/checkout?service=ngo-full-compliance-bundle",
  },
];

// ─── All Price Items (for Pricing Page table) ────────────────
// Derived from services.ts — manually curated for the pricing table display.
// Prices MUST match services.ts priceNumeric values exactly.

export interface PriceItem {
  service: string;
  price: string;
  category: string;
  href: string;
  highlight?: boolean;
}

export const allPriceItems: PriceItem[] = [
  // NGO — Featured
  { service: "Section 8 Complete Package",    price: `₹${COMPLETE_PACKAGE.price.toLocaleString("en-IN")}`, category: "NGO", href: "/checkout?service=section8-complete", highlight: true },
  // NGO Registrations
  { service: "Section 8 Registration",        price: "₹7,999",         category: "NGO",        href: "/services/section-8-registration" },
  { service: "Society Registration",          price: "₹5,999",         category: "NGO",        href: "/services/society-registration" },
  { service: "Public Trust Registration",     price: "₹6,499",         category: "NGO",        href: "/services/public-trust-registration" },
  // NGO Certificates
  { service: "Provisional 12A Registration",  price: "₹1,500",         category: "NGO",        href: "/services/12a-registration" },
  { service: "Provisional 80G Certificate",   price: "₹1,500",         category: "NGO",        href: "/services/80g-registration" },
  { service: "CSR-1 Registration",            price: "₹3,500",         category: "NGO",        href: "/services/csr-registration" },
  { service: "NGO DARPAN Registration",       price: "₹1,500",         category: "NGO",        href: "/services/darpan-registration" },
  { service: "E-Anudan Registration",         price: "₹500",           category: "NGO",        href: "/services/e-anudan-registration" },
  { service: "Udyam Registration",            price: "₹500",           category: "NGO",        href: "/services/udyam-registration" },
  // NGO Compliance
  { service: "Audit + UDIN",                  price: "₹2,500",         category: "Compliance", href: "/services/ngo-audit-udin" },
  { service: "ITR Filing (NGO / Trust)",      price: "₹1,500",         category: "Compliance", href: "/services/ngo-itr-filing" },
  { service: "Form 10B + Audit",              price: "₹5,000",         category: "Compliance", href: "/services/form-10b-audit" },
  { service: "Form 10BB + Audit",             price: "₹4,500",         category: "Compliance", href: "/services/form-10bb-audit" },
  { service: "Form 10BD Donation Return",     price: "₹1,500",         category: "Compliance", href: "/services/form-10bd-donation-return" },
  // Annual Compliance
  { service: "Pvt Ltd Annual Compliance",     price: "₹9,999",         category: "Compliance", href: "/services/pvt-ltd-annual-compliance" },
  { service: "LLP Annual Compliance",         price: "₹7,999",         category: "Compliance", href: "/services/llp-annual-compliance" },
  { service: "GST Return Filing",             price: "₹999/month",     category: "Compliance", href: "/services/gst-return-filing" },
  { service: "ITR Filing (Individual)",       price: "₹799",           category: "Compliance", href: "/services/itr-filing-individual" },
  { service: "NGO Full Compliance Bundle",    price: "₹8,999",         category: "Compliance", href: "/services/ngo-full-compliance-bundle" },
  // Business Registrations
  { service: "Private Limited Company",       price: "₹7,500",         category: "Business",   href: "/services/private-limited-company" },
  { service: "LLP Registration",              price: "₹6,500",         category: "Business",   href: "/services/llp-registration" },
  { service: "OPC Registration",              price: "₹7,000",         category: "Business",   href: "/services/opc-registration" },
  { service: "FPC Registration",              price: "₹6,500",         category: "Business",   href: "/services/fpc-registration" },
  { service: "Partnership Firm",              price: "₹3,500",         category: "Business",   href: "/services/partnership-firm-registration" },
  // Licenses
  { service: "FSSAI Basic Registration",      price: "₹999",           category: "Business",   href: "/services/fssai-registration" },
  { service: "Shop Act / Gumasta",            price: "₹1,000",         category: "Business",   href: "/services/shop-act-registration" },
  { service: "GST Registration",             price: "₹1,500",         category: "Business",   href: "/services/gst-registration" },
  // Director & MCA
  { service: "DIN Allotment",                 price: "₹1,500",         category: "Business",   href: "/services/din-allotment" },
  { service: "DIR-3 KYC",                     price: "₹700",           category: "Business",   href: "/services/dir-3-kyc" },
  { service: "ADT-1 Auditor Appointment",     price: "₹1,500",         category: "Business",   href: "/services/adt-1-auditor-appointment" },
  { service: "INC-20A",                       price: "₹1,500",         category: "Business",   href: "/services/inc-20a-filing" },
  { service: "AOC-4",                         price: "₹1,700",         category: "Business",   href: "/services/aoc-4-filing" },
  { service: "MGT-7",                         price: "₹1,700",         category: "Business",   href: "/services/mgt-7-filing" },
  { service: "DPT-3",                         price: "₹1,700",         category: "Business",   href: "/services/dpt-3-filing" },
  // Reports & Content
  { service: "NGO Website Development",       price: "₹4,500 onwards", category: "Reports",    href: "/services/ngo-website-development" },
  { service: "Project Report",                price: "₹3,000",         category: "Reports",    href: "/services/ngo-project-report" },
  { service: "Annual Report",                 price: "₹2,000",         category: "Reports",    href: "/services/ngo-annual-report" },
  // Digital
  { service: "Business Website (Static)",     price: "₹4,500 onwards", category: "Digital",    href: "/services/business-website-static" },
  { service: "Dynamic Website with CMS",      price: "₹8,999 onwards", category: "Digital",    href: "/services/dynamic-website-cms" },
  { service: "E-Commerce Website",            price: "₹14,999 onwards",category: "Digital",    href: "/services/ecommerce-website" },
  { service: "SEO Basic Package",             price: "₹3,999/month",   category: "Digital",    href: "/services/seo-basic-package" },
  { service: "SEO Advanced Package",          price: "₹7,999/month",   category: "Digital",    href: "/services/seo-advanced-package" },
  { service: "Google Ads Management",         price: "₹4,999/month",   category: "Digital",    href: "/services/google-ads-management" },
  { service: "Social Media Starter",          price: "₹4,999/month",   category: "Digital",    href: "/services/social-media-starter" },
  { service: "Social Media Growth",           price: "₹8,999/month",   category: "Digital",    href: "/services/social-media-growth" },
  { service: "Meta / Instagram Ads",          price: "₹3,999/month",   category: "Digital",    href: "/services/meta-instagram-ads" },
  { service: "Reels / Short Video Editing",   price: "₹499/video",     category: "Digital",    href: "/services/reels-video-editing" },
  { service: "Promotional / Ad Video",        price: "₹1,999/video",   category: "Digital",    href: "/services/promotional-ad-video" },
  { service: "Logo Design",                   price: "₹1,499",         category: "Digital",    href: "/services/logo-design" },
  { service: "Brand Identity Kit",            price: "₹3,999",         category: "Digital",    href: "/services/brand-identity-kit" },
  { service: "Social Media Post Design",      price: "₹299/post",      category: "Digital",    href: "/services/social-media-post-design" },
  { service: "Android App Development",       price: "₹19,999 onwards",category: "Digital",    href: "/services/android-app-development" },
  { service: "Cross-Platform App",            price: "₹34,999 onwards",category: "Digital",    href: "/services/cross-platform-app" },
];
