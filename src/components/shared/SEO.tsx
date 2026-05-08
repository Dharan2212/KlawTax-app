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
}

const SITE_NAME = "KlawTax.online";
const BASE_URL = "https://klawtax.online";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

const DEFAULT_TITLE =
  "KlawTax.online | Premium Legal & NGO Services in India";
const DEFAULT_DESCRIPTION =
  "Premium legal, NGO, registration, compliance, audit, and digital services with transparent pricing, expert support, and fast service across India.";
const DEFAULT_KEYWORDS =
  "NGO registration, 12A registration, 80G registration, Section 8 company, GST registration, ISO certification, audit services, compliance services, legal services India";

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
}: SEOProps) {
  const resolvedTitle = title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;
  const resolvedOgTitle = ogTitle ?? resolvedTitle;
  const resolvedOgDesc = ogDescription ?? description;
  const canonicalHref = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  return (
    <Helmet>
      {/* Core */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="KlawTax.online" />
      <link rel="canonical" href={canonicalHref} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@KlawTax" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
