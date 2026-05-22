import { Helmet } from "react-helmet-async";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OgType = "website" | "article" | "product";

export interface SchemaOrg {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: OgType;
  schema?: SchemaOrg | SchemaOrg[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SITE_NAME = "KlawTax.online";
export const BASE_URL = "https://klawtax.online";
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export const DEFAULT_TITLE =
  "KlawTax.online | India's Trusted NGO & Legal Registration Platform";
export const DEFAULT_DESCRIPTION =
  "Register your NGO, Section 8 company, get 12A, 80G, DARPAN, GST, ISO certifications — managed by CA/CS experts. Transparent flat fees. 500+ clients served across India.";
export const DEFAULT_KEYWORDS =
  "NGO registration India, Section 8 company registration, 12A registration, 80G registration, GST registration, NGO DARPAN, legal services India, compliance services, CA CS legal experts";

// ─── Component ────────────────────────────────────────────────────────────────

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  noindex = false,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  schema,
}: SEOProps) {
  const resolvedTitle =
    title === DEFAULT_TITLE ? title : `${title} | ${SITE_NAME}`;
  const resolvedOgTitle = ogTitle ?? resolvedTitle;
  const resolvedOgDesc = ogDescription ?? description;
  const canonicalHref = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  const schemaArray = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

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
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalHref} />
      <meta property="og:title" content={resolvedOgTitle} />
      <meta property="og:description" content={resolvedOgDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — Legal & NGO Services`} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@KlawTax" />
      <meta name="twitter:creator" content="@KlawTax" />
      <meta name="twitter:title" content={resolvedOgTitle} />
      <meta name="twitter:description" content={resolvedOgDesc} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={`${SITE_NAME} — Legal & NGO Services`} />

      {/* JSON-LD Structured Data */}
      {schemaArray.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
