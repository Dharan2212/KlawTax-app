// ============================================================
// KlawTax SEO Schema Library
// Centralized JSON-LD structured data builders
// ============================================================

import { BASE_URL, SITE_NAME } from "@/components/shared/SEO";

// ─── Organization Schema (site-wide) ─────────────────────────────────────────

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  "@id": `${BASE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: "KlawTax",
  url: BASE_URL,
  logo: `${BASE_URL}/favicon.png`,
  image: `${BASE_URL}/og-image.png`,
  description:
    "India's trusted platform for NGO registration, legal compliance, Section 8 company formation, 12A, 80G, GST, ISO certifications, and digital services.",
  telephone: "+917387731313",
  email: "info@klawtax.online",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
    addressRegion: "Maharashtra",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  priceRange: "₹500 – ₹15,000",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
  sameAs: [
    "https://wa.me/917387731313",
  ],
};

// ─── Website Schema ───────────────────────────────────────────────────────────

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  url: BASE_URL,
  name: SITE_NAME,
  description: "Legal, NGO, and compliance services platform for India",
  publisher: {
    "@id": `${BASE_URL}/#organization`,
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/services?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// ─── Service Schema Builder ───────────────────────────────────────────────────

interface ServiceSchemaInput {
  name: string;
  description: string;
  slug: string;
  price: string;
  priceNumeric: number;
  category: string;
}

export function buildServiceSchema(service: ServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}/services/${service.slug}#service`,
    name: service.name,
    description: service.description,
    url: `${BASE_URL}/services/${service.slug}`,
    provider: {
      "@id": `${BASE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    offers: {
      "@type": "Offer",
      price: service.priceNumeric,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${BASE_URL}/checkout?service=${service.slug}`,
    },
    serviceType: service.category,
  };
}

// ─── Breadcrumb Schema Builder ────────────────────────────────────────────────

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${BASE_URL}${item.url}` } : {}),
    })),
  };
}

// ─── FAQ Schema Builder ───────────────────────────────────────────────────────

export function buildFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// ─── Contact Page Schema ──────────────────────────────────────────────────────

export const contactPageSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${BASE_URL}/contact`,
  name: "Contact KlawTax — Free Legal Consultation",
  description:
    "Reach KlawTax experts for NGO registration, legal compliance, and tax services across India.",
  mainEntity: {
    "@id": `${BASE_URL}/#organization`,
  },
};

// ─── Support Page Schema ──────────────────────────────────────────────────────

export const supportPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: `${BASE_URL}/support`,
  name: "Support & Help Center | KlawTax",
  description:
    "Get help with NGO registration, legal services, payments, and document submission. FAQ and direct contact options.",
  provider: {
    "@id": `${BASE_URL}/#organization`,
  },
};

// ─── Pricing Page Schema ──────────────────────────────────────────────────────

export const pricingPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  url: `${BASE_URL}/pricing`,
  name: "Pricing | KlawTax Legal & NGO Services",
  description:
    "Transparent flat-fee pricing for all NGO, legal, compliance, and digital services. No hidden charges.",
  provider: {
    "@id": `${BASE_URL}/#organization`,
  },
};

// ─── Services Listing Page Schema ─────────────────────────────────────────────

export const servicesPageSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  url: `${BASE_URL}/services`,
  name: "All Legal & NGO Services | KlawTax",
  description:
    "Comprehensive legal, NGO registration, compliance, tax, audit, and digital services for businesses and nonprofits across India.",
  provider: {
    "@id": `${BASE_URL}/#organization`,
  },
};

// ─── Homepage FAQ ─────────────────────────────────────────────────────────────

export const homepageFAQSchema = buildFAQSchema([
  {
    question: "How do I register an NGO in India?",
    answer:
      "You can register an NGO in India as a Trust, Society, or Section 8 Company. KlawTax handles end-to-end registration including MOA/AOA drafting, DSC, DIN, and government filing — starting at ₹1,500 for individual certificates.",
  },
  {
    question: "What is 12A and 80G registration?",
    answer:
      "12A grants income tax exemption to an NGO on its income. 80G allows donors to claim 50% tax deduction on donations. Both are critical for NGO fundraising and government grant eligibility. KlawTax handles both registrations starting at ₹1,500 each.",
  },
  {
    question: "How much does NGO registration cost in India?",
    answer:
      "NGO registration costs vary by type. Section 8 Company registration starts at ₹7,999. Individual certificates like 12A and 80G start at ₹1,500 each. The complete Section 8 NGO package (Section 8 + 12A + 80G + DARPAN + E-Anudan + Udyam) costs ₹13,500 all-inclusive.",
  },
  {
    question: "How long does NGO registration take?",
    answer:
      "Processing time varies by service. DARPAN and E-Anudan register in 1–2 working days. 12A and 80G take 2–4 working days. Section 8 company incorporation takes 10–21 working days depending on government processing.",
  },
  {
    question: "Does KlawTax provide services across all Indian states?",
    answer:
      "Yes. KlawTax provides legal, NGO, compliance, and digital services across all 28 states and 8 Union Territories of India. All services are delivered remotely via WhatsApp and our client portal.",
  },
]);
