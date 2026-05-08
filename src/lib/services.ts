// ============================================================
// KlawTax Services Catalog
// Version: 2.1 | Clean data layer — no extra metadata
// ============================================================

export type ServiceCategory = "ngo" | "business" | "audit" | "digital";

export interface Service {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  icon: string;
  description: string;
  price: string;
  features: string[];

  // Optional compatibility fields
  badge?: string;
  featured?: boolean;
  advancePrice?: string;
  processingTime?: string;
}

// ============================================================
// SERVICES CATALOG
// ============================================================

export const SERVICES_LIST: Service[] = [

  // ─── NGO SERVICES ────────────────────────────────────────

  {
    id: "ngo-12a",
    slug: "12a-registration",
    title: "12A Registration",
    category: "ngo",
    icon: "ShieldCheck",
    description:
      "Obtain income tax exemption for your NGO under Section 12A of the Income Tax Act — mandatory for all charitable organizations.",
    price: "₹3,500",
    features: [
      "Application drafting and filing",
      "Trust deed / MOA review",
      "Response to IT department queries",
      "ITBA portal registration",
      "Provisional and final 12A certificate",
    ],
  },
  {
    id: "ngo-80g",
    slug: "80g-registration",
    title: "80G Registration",
    category: "ngo",
    icon: "BadgeCheck",
    description:
      "Enable your donors to claim 50% tax deduction on contributions. Critical for fundraising credibility and CSR eligibility.",
    price: "₹3,500",
    features: [
      "80G application preparation",
      "Filing with Income Tax Authority",
      "Donor receipt format design",
      "Query resolution support",
      "80G exemption certificate",
    ],
  },
  {
    id: "ngo-csr",
    slug: "csr-registration",
    title: "CSR-1 Registration",
    category: "ngo",
    icon: "Handshake",
    description:
      "Register on the MCA CSR portal to become eligible for corporate CSR funding under Companies Act 2013.",
    price: "₹2,500",
    features: [
      "CSR-1 form preparation",
      "MCA portal filing",
      "DSC application if needed",
      "Unique CSR registration number",
      "Compliance checklist provided",
    ],
  },
  {
    id: "ngo-darpan",
    slug: "darpan-registration",
    title: "NGO DARPAN Registration",
    category: "ngo",
    icon: "Globe",
    description:
      "Mandatory government portal registration to access central government grants and schemes across all ministries.",
    price: "₹1,500",
    features: [
      "DARPAN portal account setup",
      "Profile completion and verification",
      "Unique DARPAN ID acquisition",
      "Document upload assistance",
      "Ministry linkage support",
    ],
  },
  {
    id: "ngo-eanudan",
    slug: "e-anudan-registration",
    title: "E-Anudan Registration",
    category: "ngo",
    icon: "Landmark",
    description:
      "Register on the Ministry of Home Affairs E-Anudan portal to apply for grants from central government ministries.",
    price: "₹2,000",
    features: [
      "E-Anudan portal registration",
      "Ministry-wise profile setup",
      "Grant application guidance",
      "Document preparation support",
      "Post-registration compliance advice",
    ],
  },
  {
    id: "ngo-udyam",
    slug: "udyam-registration",
    title: "Udyam (MSME) Registration",
    category: "ngo",
    icon: "Award",
    description:
      "Get MSME / Udyam registration to access government subsidies, priority lending, and exclusive schemes for NGOs.",
    price: "₹1,000",
    features: [
      "Udyam registration filing",
      "Udyam certificate download",
      "MSME classification guidance",
      "Scheme eligibility overview",
      "Lifetime validity registration",
    ],
  },
  {
    id: "ngo-itr",
    slug: "ngo-itr-filing",
    title: "ITR Filing (NGO)",
    category: "ngo",
    icon: "FileText",
    description:
      "Annual income tax return filing for NGOs and charitable trusts with 12A exemption compliance.",
    price: "₹1,500",
    features: [
      "ITR-7 form preparation",
      "12A/80G compliance review",
      "Application of exemptions",
      "E-filing with IT department",
      "Acknowledgment and ITR-V",
    ],
  },
  {
    id: "ngo-audit",
    slug: "ngo-audit-udin-balance-sheet",
    title: "Audit + UDIN + Balance Sheet",
    category: "ngo",
    icon: "ClipboardCheck",
    description:
      "CA-certified statutory audit with UDIN generation and balance sheet preparation — required for 12A renewals and grants.",
    price: "₹3,000",
    features: [
      "Full accounts audit by CA",
      "UDIN generation on ICAI portal",
      "Audited balance sheet preparation",
      "Income and expenditure statement",
      "Audit certificate issuance",
      "Compliance notes and recommendations",
    ],
  },
  {
    id: "ngo-project-report",
    slug: "ngo-project-report",
    title: "Project Report",
    category: "ngo",
    icon: "FileBarChart",
    description:
      "Professional project reports for grant applications, donor presentations, and government scheme submissions.",
    price: "₹2,500",
    features: [
      "Need assessment and background",
      "Objectives and outcome mapping",
      "Detailed budget breakdown",
      "Implementation timeline",
      "Impact measurement framework",
      "Customized for target funder",
    ],
  },
  {
    id: "ngo-annual-report",
    slug: "ngo-annual-report",
    title: "Annual Report",
    category: "ngo",
    icon: "BookOpen",
    description:
      "Comprehensive NGO annual reports covering financial highlights, impact stories, and compliance summaries.",
    price: "₹2,500",
    features: [
      "Executive summary and highlights",
      "Program-wise impact reporting",
      "Audited financial summary",
      "Governance and compliance section",
      "Donor acknowledgment section",
      "Print-ready PDF format",
    ],
  },
  {
    id: "ngo-website",
    slug: "ngo-website-development",
    title: "Website Development + Hosting",
    category: "ngo",
    icon: "Monitor",
    description:
      "Professional NGO website with donation gateway, impact pages, and 1-year hosting — built for credibility and fundraising.",
    price: "₹8,000",
    features: [
      "5 to 7 page responsive website",
      "Online donation gateway integration",
      "Impact stories and project pages",
      "Annual report download section",
      "Google Analytics setup",
      "1-year hosting included",
      "SSL certificate",
    ],
  },

  // ─── BUSINESS & COMPLIANCE ────────────────────────────────

  {
    id: "biz-section8",
    slug: "section-8-registration",
    title: "Section 8 Company Registration",
    category: "business",
    icon: "Building2",
    description:
      "Incorporate a Section 8 Company — the gold standard NGO structure in India, preferred by CSR teams and government agencies.",
    price: "₹8,000",
    features: [
      "MOA and AOA drafting",
      "DSC for 2 directors",
      "DIN for 2 directors",
      "Name approval via RUN application",
      "MCA incorporation filing",
      "Incorporation certificate",
      "PAN and TAN registration",
      "Bank account opening guidance",
    ],
  },
  {
    id: "biz-pvtltd-opc-llp",
    slug: "pvt-ltd-opc-llp-registration",
    title: "Pvt Ltd / OPC / LLP Registration",
    category: "business",
    icon: "Briefcase",
    description:
      "Full-service company registration for Private Limited Companies, One Person Companies, and LLPs.",
    price: "From ₹7,000",
    features: [
      "Name availability search",
      "DSC and DIN for directors",
      "MOA / AOA / LLP agreement drafting",
      "MCA incorporation filing",
      "Certificate of incorporation",
      "PAN and TAN registration",
      "Commencement of business filing",
    ],
  },
  {
    id: "biz-din",
    slug: "din-director-identification-number",
    title: "DIN — Director Identification Number",
    category: "business",
    icon: "UserCheck",
    description:
      "Obtain a Director Identification Number — mandatory for every director of a company in India.",
    price: "₹999",
    features: [
      "DIR-3 application filing",
      "Document verification",
      "DIN allotment confirmation",
      "DIR-3 KYC compliance",
    ],
  },
  {
    id: "biz-dsc",
    slug: "dsc-digital-signature-certificate",
    title: "DSC — Digital Signature Certificate",
    category: "business",
    icon: "Fingerprint",
    description:
      "Get a Class 3 DSC for MCA, GST, income tax, and e-procurement filings — valid for 2 years.",
    price: "₹1,200",
    features: [
      "Class 3 DSC application",
      "Video KYC coordination",
      "DSC USB token delivery",
      "2-year validity",
      "All government portals compatible",
    ],
  },
  {
    id: "biz-kyc",
    slug: "kyc-compliance",
    title: "KYC Compliance",
    category: "business",
    icon: "ScanLine",
    description:
      "Director KYC and company KYC filings to maintain active status on the MCA portal.",
    price: "₹999",
    features: [
      "DIR-3 KYC web form filing",
      "OTP-based Aadhaar verification",
      "Email and mobile verification",
      "DIN active status confirmation",
    ],
  },
  {
    id: "biz-gst",
    slug: "gst-registration",
    title: "GST Registration",
    category: "business",
    icon: "Receipt",
    description:
      "Get your GSTIN quickly. Mandatory for businesses above the turnover threshold and increasingly required by clients.",
    price: "₹1,000",
    features: [
      "GST portal application",
      "Business type and HSN/SAC mapping",
      "ARN tracking and follow-up",
      "GSTIN certificate delivery",
      "First return filing guidance",
    ],
  },
  {
    id: "biz-iso",
    slug: "iso-certification",
    title: "ISO Certification",
    category: "business",
    icon: "Medal",
    description:
      "ISO 9001, 14001, or 27001 certification to enhance credibility with government and corporate clients.",
    price: "₹1,500 – ₹2,500",
    features: [
      "ISO standard selection guidance",
      "Application and documentation",
      "Audit coordination support",
      "Certificate issuance",
      "3-year validity",
    ],
  },
  {
    id: "biz-fssai",
    slug: "fssai-registration",
    title: "FSSAI Registration",
    category: "business",
    icon: "Utensils",
    description:
      "FSSAI food license for food businesses, kitchens, NGO canteens, and community food programs.",
    price: "₹999",
    features: [
      "FSSAI registration or license application",
      "Category and turnover assessment",
      "Portal filing and tracking",
      "FSSAI certificate",
      "Renewal reminder service",
    ],
  },
  {
    id: "biz-iec",
    slug: "iec-registration",
    title: "IEC — Import Export Code",
    category: "business",
    icon: "Ship",
    description:
      "IEC from DGFT — mandatory for businesses involved in international trade or receiving foreign remittances.",
    price: "₹1,500",
    features: [
      "DGFT portal application",
      "Digital signature coordination",
      "IEC certificate download",
      "Bank account linking",
      "Lifetime validity",
    ],
  },

  // ─── AUDITS & REPORTS ─────────────────────────────────────

  {
    id: "audit-project-report",
    slug: "project-reports",
    title: "Project Reports",
    category: "audit",
    icon: "FileBarChart",
    description:
      "Detailed project feasibility and financial reports for bank loans, government grants, and investor presentations.",
    price: "₹2,500",
    features: [
      "Project background and objectives",
      "Market and feasibility analysis",
      "Detailed financial projections",
      "Fund requirement and utilization",
      "Risk assessment",
      "Bank-format compatible layout",
    ],
  },
  {
    id: "audit-annual-report",
    slug: "annual-reports",
    title: "Annual Reports",
    category: "audit",
    icon: "BookOpen",
    description:
      "Comprehensive annual reports for companies and NGOs — suitable for MCA compliance, donors, and stakeholders.",
    price: "₹2,500",
    features: [
      "Director's report and MDA",
      "Audited financial statements",
      "Corporate governance section",
      "Activity and program highlights",
      "MCA-compliant format",
    ],
  },
  {
    id: "audit-social-audit",
    slug: "social-audit-reports",
    title: "Social Audit Reports",
    category: "audit",
    icon: "Users",
    description:
      "Social audit reports for NGOs and CSR projects — measuring and reporting community impact in a standardized format.",
    price: "₹3,000",
    features: [
      "Stakeholder consultation framework",
      "Impact indicator mapping",
      "Beneficiary data analysis",
      "Social Return on Investment",
      "Third-party validation support",
      "Donor-ready report format",
    ],
  },
  {
    id: "audit-itr-compliance",
    slug: "itr-filing-compliance",
    title: "ITR Filing & Compliance",
    category: "audit",
    icon: "FileText",
    description:
      "Income tax return filing for individuals, firms, companies, and NGOs with full compliance management.",
    price: "From ₹1,500",
    features: [
      "Income computation and tax planning",
      "All ITR forms ITR-1 to ITR-7",
      "TDS reconciliation with 26AS",
      "Deduction optimization",
      "E-filing and acknowledgment",
      "IT notice response support",
    ],
  },
  {
    id: "audit-udin-balance",
    slug: "audit-udin-balance-sheet",
    title: "Audit + UDIN + Balance Sheet",
    category: "audit",
    icon: "ClipboardCheck",
    description:
      "Statutory audit with UDIN certificate and balance sheet preparation — for companies, firms, and NGOs.",
    price: "₹3,000",
    features: [
      "Full statutory audit by CA",
      "UDIN generation on ICAI portal",
      "Balance sheet and P&L preparation",
      "Cash flow statement",
      "Notes to accounts",
      "Audit report issuance",
    ],
  },

  // ─── DIGITAL SERVICES ─────────────────────────────────────

  {
    id: "digital-website",
    slug: "website-development-hosting",
    title: "Website Development + Hosting",
    category: "digital",
    icon: "Monitor",
    description:
      "Professional, mobile-first websites for NGOs, businesses, and startups — with 1-year hosting included.",
    price: "From ₹8,000",
    features: [
      "5 to 7 page responsive website",
      "Mobile-first design",
      "Contact form integration",
      "Google Analytics setup",
      "Basic on-page SEO",
      "1-year hosting and SSL",
      "Content management system",
    ],
  },
  {
    id: "digital-marketing",
    slug: "digital-marketing-seo",
    title: "Digital Marketing & SEO",
    category: "digital",
    icon: "TrendingUp",
    description:
      "Grow your online presence with SEO, social media management, and targeted digital campaigns.",
    price: "From ₹5,000/month",
    features: [
      "On-page and technical SEO",
      "Google My Business optimization",
      "Social media content calendar",
      "Monthly performance reports",
      "Google and Meta ad management",
      "Backlink and citations building",
    ],
  },
  {
    id: "digital-crowdfunding",
    slug: "crowdfunding-campaigns",
    title: "Crowdfunding & Project Campaigns",
    category: "digital",
    icon: "HeartHandshake",
    description:
      "End-to-end crowdfunding campaign setup on Milaap, Ketto, ImpactGuru, or your own website.",
    price: "₹3,000",
    features: [
      "Campaign strategy and goal setting",
      "Compelling campaign copy and story",
      "Platform selection and setup",
      "Donation page design",
      "Social media launch kit",
      "Donor communication templates",
      "Campaign analytics reporting",
    ],
  },
  {
    id: "digital-aws",
    slug: "aws-hosting-solutions",
    title: "AWS Hosting Solutions",
    category: "digital",
    icon: "Cloud",
    description:
      "Cloud hosting, deployment, and infrastructure management on Amazon Web Services for NGOs and businesses.",
    price: "From ₹3,000/month",
    features: [
      "AWS account setup and configuration",
      "EC2 instance deployment",
      "S3 storage and CDN setup",
      "Domain and SSL configuration",
      "Daily backup configuration",
      "Monthly infrastructure reports",
      "24/7 uptime monitoring",
    ],
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getServicesByCategory(category: ServiceCategory): Service[] {
  return SERVICES_LIST.filter((s) => s.category === category);
}

export function getServiceBySlug(slug: string): Service | undefined {
  return SERVICES_LIST.find((s) => s.slug === slug);
}

export function getRelatedServices(currentSlug: string, limit = 3): Service[] {
  const current = getServiceBySlug(currentSlug);
  if (!current) return [];
  return SERVICES_LIST.filter(
    (s) => s.category === current.category && s.slug !== currentSlug
  ).slice(0, limit);
}

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

export const services = SERVICES_LIST;

export const SERVICE_CATEGORIES = [
  {
    id: "ngo",
    label: "NGO Services",
    icon: "ShieldCheck",
    description: "Registrations, exemptions, and compliance services for NGOs.",
  },
  {
    id: "business",
    label: "Business & Compliance",
    icon: "Briefcase",
    description: "Company registration, GST, ISO, and legal compliance.",
  },
  {
    id: "audit",
    label: "Audits & Reports",
    icon: "BarChart3",
    description: "Professional audits, reports, and taxation support.",
  },
  {
    id: "digital",
    label: "Digital Services",
    icon: "Monitor",
    description: "Websites, SEO, crowdfunding, and cloud hosting.",
  },
];