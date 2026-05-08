import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** Pass extra JSON-LD schema strings to inject */
  jsonLd?: string;
}

const SITE_NAME    = "KlawTax.online";
const BASE_URL     = "https://klawtax.online";
const DEFAULT_IMG  = `${BASE_URL}/og-image.png`;

const DEFAULT_TITLE =
  "KlawTax.online | Premium Legal & NGO Services in India";
const DEFAULT_DESCRIPTION =
  "Premium legal, NGO, registration, compliance, audit, and digital services with transparent pricing, expert support, and fast service across India.";
const DEFAULT_KEYWORDS =
  "NGO registration, 12A registration, 80G registration, Section 8 company, GST registration, ISO certification, audit services, compliance services, legal services India";

// ── Global JSON-LD schemas injected on every page ─────────────────────────
const GLOBAL_SCHEMA = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "KlawTax.online",
    url: BASE_URL,
    logo: `${BASE_URL}/favicon.png`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9999999999",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BASE_URL}/#service`,
    name: "KlawTax.online",
    url: BASE_URL,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMG,
    priceRange: "₹999 – ₹13,500",
    servesCuisine: undefined,
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    serviceType: [
      "NGO Registration",
      "12A & 80G Certification",
      "GST Registration",
      "ISO Certification",
      "FSSAI Registration",
      "Audit Services",
      "Legal Compliance",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/services?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
]);

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_IMG,
  jsonLd,
}: SEOProps) {
  // Only append "| KlawTax.online" when title is not already the full default
  const resolvedTitle =
    title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;
  const resolvedOgTitle = ogTitle ?? resolvedTitle;
  const resolvedOgDesc  = ogDescription ?? description;
  const canonicalHref   = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      {/* ── Core ────────────────────────────────────────────────── */}
      <title>{resolvedTitle}</title>
      <meta name="description"  content={description} />
      <meta name="keywords"     content={keywords} />
      <meta name="author"       content="KlawTax.online" />
      <link rel="canonical"     href={canonicalHref} />

      {/* ── Robots ──────────────────────────────────────────────── */}
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"}
      />

      {/* ── Open Graph ──────────────────────────────────────────── */}
      <meta property="og:site_name"    content={SITE_NAME} />
      <meta property="og:type"         content="website" />
      <meta property="og:url"          content={canonicalHref} />
      <meta property="og:title"        content={resolvedOgTitle} />
      <meta property="og:description"  content={resolvedOgDesc} />
      <meta property="og:image"        content={ogImage} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt"    content={resolvedOgTitle} />
      <meta property="og:locale"       content="en_IN" />

      {/* ── Twitter Card ────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content="@KlawTax" />
      <meta name="twitter:creator"     content="@KlawTax" />
      <meta name="twitter:title"       content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image"       content={ogImage} />
      <meta name="twitter:image:alt"   content={resolvedOgTitle} />

      {/* ── Global JSON-LD schemas ──────────────────────────────── */}
      {!noindex && (
        <script type="application/ld+json">{GLOBAL_SCHEMA}</script>
      )}

      {/* ── Per-page extra schema ───────────────────────────────── */}
      {jsonLd && (
        <script type="application/ld+json">{jsonLd}</script>
      )}
    </Helmet>
  );
}
