// ============================================================
// KlawTax Services Catalog — Final Canonical Version
// Version: 3.0 | Single source of truth for all service data
// ============================================================

export type ServiceCategory =
  | "ngo"
  | "compliance"
  | "business"
  | "reports"
  | "digital";

export interface Service {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  subcategory?: string;
  icon: string;
  description: string;
  price: string;
  priceNumeric: number;
  priceSuffix?: string;
  processingTime: string;
  features: string[];
  badge?: string;
  featured?: boolean;
  advancePrice?: string;
}

export const SERVICES_LIST: Service[] = [

  // NGO CERTIFICATES
  {
    id: "ngo-12a-provisional",
    slug: "12a-registration",
    title: "Provisional 12A Registration",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "ShieldCheck",
    description: "Obtain income tax exemption for your NGO under Section 12A — mandatory for all charitable organizations to claim tax exemption on income.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "2-4 working days",
    features: ["Application drafting and filing","Trust deed / MOA review","ITBA portal registration","Response to IT department queries","Provisional 12A certificate"],
  },
  {
    id: "ngo-80g-provisional",
    slug: "80g-registration",
    title: "Provisional 80G Certificate",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "Gift",
    description: "Enable your donors to claim 50% tax deduction on contributions. Critical for fundraising credibility and CSR eligibility.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "2-4 working days",
    features: ["80G application preparation","Filing with Income Tax Authority","Donor receipt format design","Query resolution support","80G exemption certificate"],
  },
  {
    id: "ngo-darpan",
    slug: "darpan-registration",
    title: "DARPAN Registration",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "Globe",
    description: "NITI Aayog mandatory portal registration to access central government grants. Get your unique NGO ID for all government schemes.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "1-2 working days",
    features: ["DARPAN portal account setup","Profile completion and verification","Unique DARPAN ID acquisition","Document upload assistance","Ministry linkage support"],
  },
  {
    id: "ngo-eanudan",
    slug: "e-anudan-registration",
    title: "E-Anudan Registration",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "Landmark",
    description: "Register on the central government E-Anudan portal — the online grant management system for all Ministry funding applications.",
    price: "₹500",
    priceNumeric: 500,
    processingTime: "1 working day",
    features: ["E-Anudan portal registration","Ministry-wise profile setup","Grant application guidance","Document preparation support","Post-registration compliance advice"],
  },
  {
    id: "ngo-udyam",
    slug: "udyam-registration",
    title: "Udyam Registration",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "Award",
    description: "Get MSME Udyam registration for your NGO — access government subsidies, priority lending, and exclusive schemes for nonprofits.",
    price: "₹500",
    priceNumeric: 500,
    processingTime: "1 working day",
    features: ["Udyam registration filing","Udyam certificate download","MSME classification guidance","Scheme eligibility overview","Lifetime validity registration"],
  },
  {
    id: "ngo-csr1",
    slug: "csr-registration",
    title: "CSR-1 Registration",
    subcategory: "NGO Certificates",
    category: "ngo",
    icon: "Handshake",
    description: "Register on the MCA CSR portal to become eligible for corporate CSR funding under Companies Act 2013. Full advance payment required.",
    price: "₹3,500",
    priceNumeric: 3500,
    processingTime: "3-5 working days",
    badge: "Full Advance",
    features: ["CSR-1 form preparation","MCA portal filing","DSC application if needed","Unique CSR registration number","Compliance checklist provided"],
  },

  // NGO REGISTRATIONS
  {
    id: "ngo-society",
    slug: "society-registration",
    title: "Society Registration",
    subcategory: "NGO Registrations",
    category: "ngo",
    icon: "Users",
    description: "Register your Society under the Societies Registration Act — ideal for clubs, cultural bodies, educational and charitable organizations.",
    price: "₹5,999",
    priceNumeric: 5999,
    processingTime: "7-10 working days",
    features: ["Memorandum and rules drafting","Name availability check","Registrar of Societies filing","Certificate of registration","PAN application for society","Bank account guidance"],
  },
  {
    id: "ngo-public-trust",
    slug: "public-trust-registration",
    title: "Public Trust Registration",
    subcategory: "NGO Registrations",
    category: "ngo",
    icon: "Scale",
    description: "Register your Public Trust under the Public Trust Act — the most common structure for charitable and religious NGOs in India.",
    price: "₹6,499",
    priceNumeric: 6499,
    processingTime: "8-12 working days",
    features: ["Trust deed drafting","Trustee documentation","Charity Commissioner filing","Trust registration certificate","PAN and TAN registration","First trustees resolution"],
  },
  {
    id: "ngo-section8",
    slug: "section-8-registration",
    title: "Section 8 Company (NGO)",
    subcategory: "NGO Registrations",
    category: "ngo",
    icon: "Building2",
    description: "Incorporate a Section 8 Company — the gold-standard NGO structure preferred by CSR teams, government agencies, and foreign donors.",
    price: "₹7,999",
    priceNumeric: 7999,
    processingTime: "8-12 working days",
    featured: true,
    features: ["MOA and AOA drafting","DSC for 2 directors","DIN for 2 directors","Name approval via RUN application","MCA incorporation filing","Incorporation certificate","PAN and TAN registration","Bank account opening guidance"],
  },

  // NGO COMPLIANCE
  {
    id: "comp-audit-udin",
    slug: "ngo-audit-udin",
    title: "Audit + UDIN",
    subcategory: "NGO Compliance",
    category: "compliance",
    icon: "ClipboardCheck",
    description: "CA-certified statutory audit with UDIN generation — required for 12A renewals, grant applications, and annual compliance.",
    price: "₹2,500",
    priceNumeric: 2500,
    processingTime: "3-5 working days",
    features: ["Full accounts audit by CA","UDIN generation on ICAI portal","Audited balance sheet preparation","Income and expenditure statement","Audit certificate issuance"],
  },
  {
    id: "comp-itr-ngo",
    slug: "ngo-itr-filing",
    title: "ITR Filing (NGO / Trust)",
    subcategory: "NGO Compliance",
    category: "compliance",
    icon: "FileText",
    description: "Annual income tax return filing for NGOs and charitable trusts using ITR-7 with full 12A exemption compliance.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "2-3 working days",
    features: ["ITR-7 form preparation","12A/80G compliance review","Application of exemptions","E-filing with IT department","Acknowledgment and ITR-V"],
  },
  {
    id: "comp-form10b",
    slug: "form-10b-audit",
    title: "Form 10B + Audit",
    subcategory: "NGO Compliance",
    category: "compliance",
    icon: "ClipboardList",
    description: "Mandatory audit report for NGOs with income above Rs.5 Crore. Includes CA audit report filing with the Income Tax Department.",
    price: "₹5,000",
    priceNumeric: 5000,
    processingTime: "4-6 working days",
    features: ["CA audit with Form 10B","Income verification above Rs.5Cr","IT department filing","UDIN generation","Audit certificate"],
  },
  {
    id: "comp-form10bb",
    slug: "form-10bb-audit",
    title: "Form 10BB + Audit",
    subcategory: "NGO Compliance",
    category: "compliance",
    icon: "ClipboardList",
    description: "Audit report for NGOs with income below Rs.5 Crore — Form 10BB with CA certification for annual IT compliance.",
    price: "₹4,500",
    priceNumeric: 4500,
    processingTime: "3-5 working days",
    features: ["CA audit with Form 10BB","Income verification below Rs.5Cr","IT department filing","UDIN generation","Audit certificate"],
  },
  {
    id: "comp-form10bd",
    slug: "form-10bd-donation-return",
    title: "Form 10BD Donation Return",
    subcategory: "NGO Compliance",
    category: "compliance",
    icon: "Receipt",
    description: "File your NGO annual donation return (Form 10BD) on time — Rs.200/day late penalty applies. Mandatory for 80G-registered NGOs.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "1-2 working days",
    badge: "Rs.200/day penalty if late",
    features: ["Donor data compilation","Form 10BD preparation","E-filing with IT department","Form 10BE (donor certificates)","Filing confirmation receipt"],
  },

  // REPORTS AND CONTENT
  {
    id: "rep-ngo-website",
    slug: "ngo-website-development",
    title: "NGO Website Development",
    subcategory: "Reports & Content",
    category: "reports",
    icon: "Monitor",
    description: "Mobile-friendly, donation-ready website for your NGO — built to build credibility and drive fundraising from day one.",
    price: "₹4,500",
    priceNumeric: 4500,
    priceSuffix: "onwards",
    processingTime: "5-8 working days",
    features: ["5-7 page responsive website","Online donation gateway integration","Impact stories and project pages","Annual report download section","Google Analytics setup","1-year hosting included","SSL certificate"],
  },
  {
    id: "rep-project-report",
    slug: "ngo-project-report",
    title: "Project Report",
    subcategory: "Reports & Content",
    category: "reports",
    icon: "FileBarChart",
    description: "Professional project reports for grant applications, donor presentations, and government scheme submissions.",
    price: "₹3,000",
    priceNumeric: 3000,
    processingTime: "3-5 working days",
    features: ["Need assessment and background","Objectives and outcome mapping","Detailed budget breakdown","Implementation timeline","Impact measurement framework","Customized for target funder"],
  },
  {
    id: "rep-annual-report",
    slug: "ngo-annual-report",
    title: "Annual Report",
    subcategory: "Reports & Content",
    category: "reports",
    icon: "BookOpen",
    description: "Comprehensive NGO annual reports for donor reporting and compliance — covering financials, impact stories, and governance.",
    price: "₹2,000",
    priceNumeric: 2000,
    processingTime: "3-4 working days",
    features: ["Executive summary and highlights","Program-wise impact reporting","Audited financial summary","Governance and compliance section","Donor acknowledgment section","Print-ready PDF format"],
  },

  // LICENSES
  {
    id: "lic-fssai",
    slug: "fssai-registration",
    title: "FSSAI Basic Registration",
    subcategory: "Licenses",
    category: "business",
    icon: "Utensils",
    description: "Mandatory food safety registration for businesses with turnover up to Rs.12L. Get your FSSAI registration quickly.",
    price: "₹999",
    priceNumeric: 999,
    processingTime: "2-3 working days",
    features: ["Application form preparation","FSSAI portal filing","Document compilation support","FSSAI registration certificate","Compliance guidance provided"],
  },
  {
    id: "lic-shop-act",
    slug: "shop-act-registration",
    title: "Shop Act / Gumasta Registration",
    subcategory: "Licenses",
    category: "business",
    icon: "Package2",
    description: "Mandatory business registration under Shop & Establishment Act for Maharashtra and other states. Quick approval.",
    price: "₹1,000",
    priceNumeric: 1000,
    processingTime: "1-2 working days",
    features: ["Shop Act application preparation","Municipal corporation filing","Business details documentation","Shop Act registration certificate","Annual renewal guidance"],
  },
  {
    id: "lic-gst",
    slug: "gst-registration",
    title: "GST Registration",
    subcategory: "Licenses",
    category: "business",
    icon: "Receipt",
    description: "Mandatory GST registration for businesses with turnover above Rs.20L. Get your GSTIN quickly with full application support.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "2-3 working days",
    features: ["GST application preparation","GST portal filing","Document review and support","GSTIN allotment","First return filing guidance","HSN/SAC code advice"],
  },

  // DIRECTOR SERVICES
  {
    id: "dir-din",
    slug: "din-allotment",
    title: "DIN Allotment",
    subcategory: "Director Services",
    category: "business",
    icon: "UserCheck",
    description: "Director Identification Number — mandatory for all company directors. Quick allotment via SPICe+ / DIR-3 filing.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "1-2 working days",
    features: ["DIR-3 form preparation","MCA portal filing","DIN allotment certificate","Digital signature support","Compliance guidance"],
  },
  {
    id: "dir-kyc",
    slug: "dir-3-kyc",
    title: "DIR-3 KYC",
    subcategory: "Director Services",
    category: "business",
    icon: "ScanLine",
    description: "Annual director KYC due September 30 every year. Avoid Rs.5,000 late fee — file on time with our quick support.",
    price: "₹700",
    priceNumeric: 700,
    processingTime: "1 working day",
    badge: "Due Sep 30",
    features: ["DIR-3 KYC form preparation","OTP-based digital signing","MCA portal filing","KYC completion confirmation","Timely reminder service"],
  },
  {
    id: "dir-adt1",
    slug: "adt-1-auditor-appointment",
    title: "ADT-1 (Auditor Appointment)",
    subcategory: "Director Services",
    category: "business",
    icon: "BadgeCheck",
    description: "Statutory auditor appointment filing with MCA — mandatory within 15 days of AGM for all companies.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "1-2 working days",
    features: ["ADT-1 form preparation","Auditor consent letter","MCA portal filing","Filing acknowledgment","Compliance record maintenance"],
  },

  // MCA FILINGS
  {
    id: "mca-inc20a",
    slug: "inc-20a-filing",
    title: "INC-20A",
    subcategory: "MCA Filings",
    category: "business",
    icon: "FolderOpen",
    description: "Declaration of commencement of business — mandatory within 180 days of incorporation for all companies with share capital.",
    price: "₹1,500",
    priceNumeric: 1500,
    processingTime: "1-2 working days",
    features: ["INC-20A form preparation","Bank account proof compilation","MCA portal filing","Filing acknowledgment","Compliance confirmation"],
  },
  {
    id: "mca-aoc4",
    slug: "aoc-4-filing",
    title: "AOC-4",
    subcategory: "MCA Filings",
    category: "business",
    icon: "FolderOpen",
    description: "Annual filing of financial statements with MCA — mandatory for all companies under the Companies Act 2013.",
    price: "₹1,700",
    priceNumeric: 1700,
    processingTime: "2-3 working days",
    features: ["Financial statements preparation","AOC-4 form filing","Directors report annexures","MCA portal submission","SRN and acknowledgment"],
  },
  {
    id: "mca-mgt7",
    slug: "mgt-7-filing",
    title: "MGT-7",
    subcategory: "MCA Filings",
    category: "business",
    icon: "FolderOpen",
    description: "Annual return filing with MCA — mandatory for all companies detailing shareholding, board changes, and company information.",
    price: "₹1,700",
    priceNumeric: 1700,
    processingTime: "2-3 working days",
    features: ["MGT-7 form preparation","Shareholding pattern compilation","Director and KMP details","MCA portal filing","SRN and acknowledgment"],
  },
  {
    id: "mca-dpt3",
    slug: "dpt-3-filing",
    title: "DPT-3",
    subcategory: "MCA Filings",
    category: "business",
    icon: "FolderOpen",
    description: "Annual return of deposits — mandatory for all companies to file details of money received but not considered as deposits.",
    price: "₹1,700",
    priceNumeric: 1700,
    processingTime: "1-2 working days",
    features: ["DPT-3 form preparation","Deposit summary compilation","Auditor certificate coordination","MCA portal filing","SRN and acknowledgment"],
  },

  // BUSINESS REGISTRATIONS
  {
    id: "biz-pvtltd",
    slug: "private-limited-company",
    title: "Private Limited Company",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Briefcase",
    description: "Register your Private Limited Company — the preferred structure for startups and growing businesses with investor-readiness.",
    price: "₹7,500",
    priceNumeric: 7500,
    processingTime: "8-12 working days",
    features: ["Name availability search","DSC and DIN for 2 directors","MOA and AOA drafting","MCA incorporation filing","Certificate of incorporation","PAN and TAN registration"],
  },
  {
    id: "biz-llp",
    slug: "llp-registration",
    title: "LLP Registration",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Briefcase",
    description: "Register your Limited Liability Partnership — flexible structure combining benefits of company and partnership for professionals.",
    price: "₹6,500",
    priceNumeric: 6500,
    processingTime: "7-10 working days",
    features: ["Name availability check","DSC and DPIN for partners","LLP agreement drafting","MCA LLP filing","Certificate of incorporation","PAN and TAN registration"],
  },
  {
    id: "biz-opc",
    slug: "opc-registration",
    title: "OPC Registration",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Briefcase",
    description: "One Person Company — perfect for solo entrepreneurs who want corporate benefits with single ownership and limited liability.",
    price: "₹7,000",
    priceNumeric: 7000,
    processingTime: "7-10 working days",
    features: ["Name availability check","DSC and DIN for director","MOA and AOA drafting","Nominee appointment","Certificate of incorporation","PAN and TAN registration"],
  },
  {
    id: "biz-fpc",
    slug: "fpc-registration",
    title: "FPC Registration",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Briefcase",
    description: "Farmer Producer Company registration — empower agricultural communities with a structured corporate entity for collective benefit.",
    price: "₹6,500",
    priceNumeric: 6500,
    processingTime: "10-15 working days",
    features: ["FPC name approval","Member documentation","MOA and AOA drafting","ROC filing","Certificate of incorporation","PAN registration"],
  },
  {
    id: "biz-section8-company",
    slug: "section-8-company-nonprofit",
    title: "Section 8 Company (Non-Profit)",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Building2",
    description: "Incorporate a Section 8 Company for non-profit purposes — the most credible corporate NGO structure for CSR and government grants.",
    price: "₹7,999",
    priceNumeric: 7999,
    processingTime: "8-12 working days",
    features: ["Name availability search","MOA and AOA drafting","DSC and DIN for directors","MCA filing with Section 8 license","Certificate of incorporation","PAN and TAN registration"],
  },
  {
    id: "biz-partnership",
    slug: "partnership-firm-registration",
    title: "Partnership Firm Registration",
    subcategory: "Business Registrations",
    category: "business",
    icon: "Handshake",
    description: "Register your Partnership Firm — simple structure for small businesses and professional partnerships with shared management.",
    price: "₹3,500",
    priceNumeric: 3500,
    processingTime: "3-5 working days",
    features: ["Partnership deed drafting","Stamp paper coordination","Registrar of Firms filing","Partnership registration certificate","PAN application for firm"],
  },

  // ANNUAL COMPLIANCE
  {
    id: "ann-pvtltd-compliance",
    slug: "pvt-ltd-annual-compliance",
    title: "Pvt Ltd Annual Compliance Package",
    subcategory: "Annual Compliance",
    category: "compliance",
    icon: "CheckSquare",
    description: "Complete annual compliance package for Private Limited Companies — AOC-4, MGT-7, ITR, audit and all mandatory filings.",
    price: "₹9,999",
    priceNumeric: 9999,
    processingTime: "7-14 working days",
    badge: "Best Value",
    features: ["AOC-4 (financial statements)","MGT-7 (annual return)","Director KYC (DIR-3)","Income tax return","Statutory audit support","Compliance calendar"],
  },
  {
    id: "ann-llp-compliance",
    slug: "llp-annual-compliance",
    title: "LLP Annual Compliance Package",
    subcategory: "Annual Compliance",
    category: "compliance",
    icon: "CheckSquare",
    description: "Complete annual compliance for LLPs — Form 11, Form 8, ITR, and all mandatory MCA filings handled end-to-end.",
    price: "₹7,999",
    priceNumeric: 7999,
    processingTime: "7-14 working days",
    features: ["Form 11 (annual return)","Form 8 (statement of accounts)","Partner KYC","Income tax return","Compliance calendar"],
  },
  {
    id: "ann-gst-return",
    slug: "gst-return-filing",
    title: "GST Return Filing",
    subcategory: "Annual Compliance",
    category: "compliance",
    icon: "Receipt",
    description: "Monthly or quarterly GST return filing (GSTR-1 and GSTR-3B) — stay compliant and avoid interest and penalties.",
    price: "₹999",
    priceNumeric: 999,
    priceSuffix: "/month",
    processingTime: "1-2 working days",
    features: ["GSTR-1 preparation and filing","GSTR-3B preparation and filing","Input tax credit reconciliation","E-invoice support if applicable","GST compliance tracking"],
  },
  {
    id: "ann-itr-individual",
    slug: "itr-filing-individual",
    title: "ITR Filing (Individual / Salaried)",
    subcategory: "Annual Compliance",
    category: "compliance",
    icon: "FileText",
    description: "Income tax return filing for salaried individuals, freelancers, and professionals — accurate filing with maximum refund.",
    price: "₹799",
    priceNumeric: 799,
    processingTime: "1-2 working days",
    features: ["ITR form selection","Form 16 / income data review","Deductions and exemptions","E-filing with IT department","Acknowledgment and ITR-V"],
  },
  {
    id: "ann-ngo-bundle",
    slug: "ngo-full-compliance-bundle",
    title: "NGO Full Compliance Bundle",
    subcategory: "Annual Compliance",
    category: "compliance",
    icon: "ShieldCheck",
    description: "Complete annual compliance package for NGOs — audit, ITR, Form 10BD, and all mandatory filings in one affordable bundle.",
    price: "₹8,999",
    priceNumeric: 8999,
    processingTime: "10-15 working days",
    badge: "Best Value",
    features: ["Statutory audit with UDIN","ITR-7 filing","Form 10BD (donation return)","Balance sheet preparation","FCRA compliance check","Annual compliance calendar"],
  },

  // DIGITAL SERVICES
  {
    id: "dig-website-static",
    slug: "business-website-static",
    title: "Business Website (Static)",
    subcategory: "Websites",
    category: "digital",
    icon: "Monitor",
    description: "Professional static website for your business — mobile-first, fast-loading, and optimized for Google search from day one.",
    price: "₹4,500",
    priceNumeric: 4500,
    priceSuffix: "onwards",
    processingTime: "5-8 working days",
    features: ["5-7 page responsive design","Mobile-first development","Basic SEO optimization","Contact form integration","Google Analytics setup","1-year hosting included"],
  },
  {
    id: "dig-website-dynamic",
    slug: "dynamic-website-cms",
    title: "Dynamic Website with CMS",
    subcategory: "Websites",
    category: "digital",
    icon: "Monitor",
    description: "Manage your own website content with a dynamic CMS — blog, product pages, and team updates without needing a developer.",
    price: "₹8,999",
    priceNumeric: 8999,
    priceSuffix: "onwards",
    processingTime: "8-14 working days",
    features: ["CMS-powered website","Blog / news section","Admin dashboard","Mobile-responsive design","SEO and analytics setup","1-year hosting and SSL"],
  },
  {
    id: "dig-website-ecommerce",
    slug: "ecommerce-website",
    title: "E-Commerce Website",
    subcategory: "Websites",
    category: "digital",
    icon: "Package2",
    description: "Full-featured e-commerce website with payment gateway, product catalog, and order management — ready to sell online.",
    price: "₹14,999",
    priceNumeric: 14999,
    priceSuffix: "onwards",
    processingTime: "15-20 working days",
    features: ["Product catalog management","Payment gateway integration","Shopping cart and checkout","Order management panel","Mobile-responsive design","SEO and performance optimization"],
  },
  {
    id: "dig-website-ngo",
    slug: "ngo-website-donation",
    title: "NGO Website with Donation",
    subcategory: "Websites",
    category: "digital",
    icon: "HeartHandshake",
    description: "Purpose-built NGO website with integrated donation gateway, impact pages, and grant credibility features.",
    price: "₹4,500",
    priceNumeric: 4500,
    priceSuffix: "onwards",
    processingTime: "5-8 working days",
    features: ["Donation gateway integration","Impact stories section","Project pages","Annual report download","Google Analytics setup","1-year hosting and SSL"],
  },
  {
    id: "dig-seo-basic",
    slug: "seo-basic-package",
    title: "SEO Basic Package",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "TrendingUp",
    description: "Improve your Google rankings with on-page SEO, keyword optimization, and local search setup for your business.",
    price: "₹3,999",
    priceNumeric: 3999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["Keyword research and mapping","On-page SEO optimization","Google My Business setup","Monthly performance report","Technical SEO audit"],
  },
  {
    id: "dig-seo-advanced",
    slug: "seo-advanced-package",
    title: "SEO Advanced Package",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "TrendingUp",
    description: "Comprehensive SEO with backlink building, content strategy, and advanced technical optimization for competitive keywords.",
    price: "₹7,999",
    priceNumeric: 7999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["Advanced keyword strategy","Content calendar and writing","Backlink building campaign","Technical SEO deep audit","Competitor analysis monthly","Weekly performance reports"],
  },
  {
    id: "dig-google-ads",
    slug: "google-ads-management",
    title: "Google Ads Management",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "Megaphone",
    description: "Expert Google Ads campaign management — maximize ROI with targeted search, display, and local campaigns.",
    price: "₹4,999",
    priceNumeric: 4999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["Campaign strategy and setup","Ad copywriting","Keyword bidding management","Conversion tracking setup","Monthly ROI reporting"],
  },
  {
    id: "dig-social-starter",
    slug: "social-media-starter",
    title: "Social Media Starter",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "Megaphone",
    description: "Establish your social media presence with consistent posting, branding, and community engagement across key platforms.",
    price: "₹4,999",
    priceNumeric: 4999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["2 platforms managed","12 posts per month","Branded design templates","Caption writing","Monthly analytics report"],
  },
  {
    id: "dig-social-growth",
    slug: "social-media-growth",
    title: "Social Media Growth Package",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "Megaphone",
    description: "Accelerate social media growth with advanced content strategy, paid campaigns, and influencer-style creative content.",
    price: "₹8,999",
    priceNumeric: 8999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["3 platforms managed","20 posts per month","Reels and stories included","Paid campaign management","Weekly performance report"],
  },
  {
    id: "dig-meta-ads",
    slug: "meta-instagram-ads",
    title: "Meta / Instagram Ads",
    subcategory: "Digital Marketing",
    category: "digital",
    icon: "Megaphone",
    description: "Targeted Meta and Instagram advertising campaigns — reach your ideal customers and donors with precision ad targeting.",
    price: "₹3,999",
    priceNumeric: 3999,
    priceSuffix: "/month",
    processingTime: "Ongoing",
    features: ["Campaign strategy and setup","Audience targeting research","Ad creative and copywriting","A/B testing","Monthly performance report"],
  },
  {
    id: "dig-reels-editing",
    slug: "reels-video-editing",
    title: "Reels / Short Video Editing",
    subcategory: "Video Services",
    category: "digital",
    icon: "Monitor",
    description: "Engaging short-form video editing for Instagram Reels, YouTube Shorts, and social media — fast turnaround.",
    price: "₹499",
    priceNumeric: 499,
    priceSuffix: "/video",
    processingTime: "1-2 working days",
    features: ["Short-form video editing","Captions and subtitles","Background music","Brand color grading","Social media optimization"],
  },
  {
    id: "dig-promo-video",
    slug: "promotional-ad-video",
    title: "Promotional / Ad Video",
    subcategory: "Video Services",
    category: "digital",
    icon: "Monitor",
    description: "Professional promotional and advertisement videos for your brand — scripted, edited, and delivery-ready.",
    price: "₹1,999",
    priceNumeric: 1999,
    priceSuffix: "/video",
    processingTime: "3-5 working days",
    features: ["Script consultation","Professional editing","Motion graphics","Voice-over support","Brand-aligned output"],
  },
  {
    id: "dig-corporate-video",
    slug: "corporate-ngo-video",
    title: "Corporate / NGO Video Production",
    subcategory: "Video Services",
    category: "digital",
    icon: "Monitor",
    description: "Full corporate or NGO video production — impact stories, donor films, and brand documentaries.",
    price: "₹4,999",
    priceNumeric: 4999,
    priceSuffix: "onwards",
    processingTime: "7-14 working days",
    features: ["Concept and script development","Professional production","Motion graphics and animation","Voice-over and music","Multiple format delivery"],
  },
  {
    id: "dig-android-app",
    slug: "android-app-development",
    title: "Android App Development",
    subcategory: "App Development",
    category: "digital",
    icon: "Monitor",
    description: "Custom Android mobile application development for businesses and NGOs — from concept to Play Store launch.",
    price: "₹19,999",
    priceNumeric: 19999,
    priceSuffix: "onwards",
    processingTime: "30-45 working days",
    features: ["UI/UX design","Native Android development","Backend API integration","Play Store submission","3 months post-launch support"],
  },
  {
    id: "dig-crossplatform-app",
    slug: "cross-platform-app",
    title: "Cross-Platform App",
    subcategory: "App Development",
    category: "digital",
    icon: "Monitor",
    description: "One codebase, both platforms — cross-platform app for Android and iOS using React Native or Flutter.",
    price: "₹34,999",
    priceNumeric: 34999,
    priceSuffix: "onwards",
    processingTime: "45-60 working days",
    features: ["iOS and Android from one codebase","React Native / Flutter","Backend integration","App Store and Play Store submission","6 months post-launch support"],
  },
  {
    id: "dig-logo-design",
    slug: "logo-design",
    title: "Logo Design",
    subcategory: "Branding",
    category: "digital",
    icon: "Megaphone",
    description: "Professional logo design that represents your brand identity — multiple concepts, unlimited revisions until perfect.",
    price: "₹1,499",
    priceNumeric: 1499,
    processingTime: "3-5 working days",
    features: ["3 unique concepts","Unlimited revisions","All formats (PNG, SVG, PDF)","Brand color palette","Transparent background version"],
  },
  {
    id: "dig-brand-kit",
    slug: "brand-identity-kit",
    title: "Brand Identity Kit",
    subcategory: "Branding",
    category: "digital",
    icon: "Megaphone",
    description: "Complete brand identity package — logo, colors, typography, and brand guidelines for consistent brand communication.",
    price: "₹3,999",
    priceNumeric: 3999,
    processingTime: "5-8 working days",
    features: ["Logo design (3 concepts)","Brand color palette","Typography selection","Brand guidelines document","Business card design","Social media profile kit"],
  },
  {
    id: "dig-social-post",
    slug: "social-media-post-design",
    title: "Social Media Post Design",
    subcategory: "Branding",
    category: "digital",
    icon: "Megaphone",
    description: "Eye-catching social media post designs for Instagram, Facebook, LinkedIn — on-brand and engagement-ready.",
    price: "₹299",
    priceNumeric: 299,
    priceSuffix: "/post",
    processingTime: "1 working day",
    features: ["Platform-optimized dimensions","On-brand design","Caption suggestions","Multiple formats provided","Quick 24-hour turnaround"],
  },
];

// ============================================================
// CATEGORY METADATA
// ============================================================

export const SERVICE_CATEGORIES = [
  { id: "ngo",        label: "NGO Services",        icon: "ShieldCheck",   description: "Certificates, registrations, and setup for NGOs and trusts." },
  { id: "compliance", label: "Compliance & Tax",     icon: "ClipboardCheck",description: "Annual compliance, audits, ITR, and mandatory filings." },
  { id: "business",   label: "Business & Licenses",  icon: "Briefcase",     description: "Company registrations, licenses, director services, MCA filings." },
  { id: "reports",    label: "Reports & Content",    icon: "FileBarChart",  description: "Project reports, annual reports, and NGO websites." },
  { id: "digital",    label: "Digital Services",     icon: "Monitor",       description: "Websites, SEO, ads, video, branding, and app development." },
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
export const SERVICES = SERVICES_LIST;

export function formatPrice(price: string | undefined): string {
  return price ?? "Contact Us";
}

export function getAdvancePrice(service: Service): string | null {
  return service.advancePrice ?? null;
}

// ============================================================
// FEATURED COMPLETE PACKAGE
// ============================================================

export const COMPLETE_PACKAGE = {
  id: "section8-complete",
  name: "Complete NGO Setup Package",
  description: "Everything you need: Section 8 + 12A + 80G + DARPAN + E-Anudan + Udyam + PAN/TAN/DSC/DIN",
  price: 13500,
  advancePrice: 6750,
  originalPrice: 17000,
  savings: 3500,
  processingTime: "21-30 working days",
  services: [
    "Section 8 Company Registration",
    "12A Income Tax Exemption",
    "80G Donor Deduction Certificate",
    "NGO DARPAN Registration",
    "E-Anudan Portal Setup",
    "Udyam (MSME) Registration",
    "PAN, TAN, DSC & DIN Included",
  ],
};

export const featuredPackage = {
  id: "section8-complete",
  name: "Complete NGO Setup in One Package",
  description: "Everything you need from incorporation to CSR-eligibility, handled end-to-end by our legal experts.",
  price: 13500,
  advancePrice: 6750,
  originalPrice: 17000,
  savings: 3500,
  features: [
    "Section 8 Company Registration",
    "12A Income Tax Exemption",
    "80G Donor Deduction Certificate",
    "NGO DARPAN Registration",
    "E-Anudan Portal Setup",
    "Udyam (MSME) Registration",
    "PAN, TAN, DSC & DIN Included",
  ],
};

// ============================================================
// CHECKOUT PRICE RESOLUTION
// ============================================================

export function parsePriceToNumber(price: string): number {
  const stripped = price
    .replace(/₹/g, "")
    .replace(/Rs\./g, "")
    .replace(/[,\s]/g, "")
    .replace(/^[Ff]rom\s*/i, "")
    .replace(/onwards/i, "")
    .replace(/\/month/i, "")
    .replace(/\/video/i, "")
    .replace(/\/post/i, "");
  const num = parseFloat(stripped);
  return isNaN(num) ? 0 : num;
}

export interface CheckoutServiceInfo {
  id: string;
  slug: string;
  name: string;
  price: number;
  advancePrice: number;
  priceDisplay: string;
  advancePriceDisplay: string;
  description: string;
  priceSuffix?: string;
  isBundle: boolean;
}

export function resolveCheckoutService(slug: string): CheckoutServiceInfo | null {
  if (slug === "section8-complete") {
    return {
      id: "section8-complete",
      slug: "section8-complete",
      name: COMPLETE_PACKAGE.name,
      price: COMPLETE_PACKAGE.price,
      advancePrice: COMPLETE_PACKAGE.advancePrice,
      priceDisplay: "₹13,500",
      advancePriceDisplay: "₹6,750",
      description: COMPLETE_PACKAGE.description,
      isBundle: true,
    };
  }
  const service = getServiceBySlug(slug);
  if (!service) return null;
  const price = service.priceNumeric;
  const advancePrice = Math.ceil(price / 2);
  const suffix = service.priceSuffix ? " " + service.priceSuffix : "";
  return {
    id: service.id,
    slug: service.slug,
    name: service.title,
    price,
    advancePrice,
    priceDisplay: service.price + suffix,
    advancePriceDisplay: "₹" + advancePrice.toLocaleString("en-IN"),
    description: service.description,
    priceSuffix: service.priceSuffix,
    isBundle: false,
  };
}

export const DEFAULT_CHECKOUT_SERVICE: CheckoutServiceInfo = {
  id: "section8-complete",
  slug: "section8-complete",
  name: "Complete NGO Setup Package",
  price: 13500,
  advancePrice: 6750,
  priceDisplay: "₹13,500",
  advancePriceDisplay: "₹6,750",
  description: "Section 8 + 12A + 80G + DARPAN + E-Anudan + Udyam + PAN/TAN/DSC/DIN",
  isBundle: true,
};
