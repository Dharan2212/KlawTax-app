/**
 * KlawTax Blog — Frontend Content Data Layer
 * All blog content lives here as typed data objects.
 * No backend required — statically rendered from this file.
 *
 * To add a new article: add a new entry to BLOG_POSTS.
 * Slug must be unique and URL-safe (kebab-case).
 */

import { BASE_URL } from "@/components/shared/SEO";

// ─── Types ──────────────────────────────────────────────────────────────────

export type BlogCategory =
  | "ngo"
  | "business"
  | "compliance"
  | "tax"
  | "digital"
  | "startup";

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogSection {
  heading: string;
  body: string; // Supports **bold**, _italic_, and [link text](/path) markdown-light
}

export interface RelatedService {
  label: string;
  href: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  tags: string[];
  author: string;
  publishedAt: string; // ISO date string
  readingMinutes: number;
  coverGradient: string; // CSS gradient — used as cover when no image
  coverEmoji: string;

  // SEO
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalPath: string;
  ogTitle: string;
  ogDescription: string;
  featured?: boolean;

  // Content
  intro: string;
  sections: BlogSection[];
  faqs: BlogFAQ[];
  relatedServices: RelatedService[];
  relatedSlugs: string[];
}

// ─── Category metadata ───────────────────────────────────────────────────────

export const BLOG_CATEGORIES: Record<
  BlogCategory,
  { label: string; color: string; bg: string; border: string; description: string }
> = {
  ngo:        { label: "NGO & Nonprofits", color: "#1E3A8A", bg: "#DBEAFE", border: "rgba(30,58,138,0.18)",  description: "Guides for NGO registration, compliance, and fundraising in India." },
  business:   { label: "Business Setup",   color: "#4C1D95", bg: "#EDE9FE", border: "rgba(76,29,149,0.18)",  description: "Registration guides for Pvt Ltd, LLP, OPC, Section 8, and more." },
  compliance: { label: "Compliance",       color: "#15803D", bg: "#DCFCE7", border: "rgba(21,128,61,0.18)",  description: "Annual filings, MCA compliance, and regulatory requirements." },
  tax:        { label: "Tax & Audit",      color: "#B45309", bg: "#FEF3C7", border: "rgba(180,83,9,0.18)",   description: "GST, ITR, FSSAI, audit, and tax filing guides for India." },
  digital:    { label: "Digital & Growth", color: "#0369A1", bg: "#E0F2FE", border: "rgba(3,105,161,0.18)",  description: "Digital marketing, SEO, and website guides for NGOs and businesses." },
  startup:    { label: "Startup Guide",    color: "#7C3AED", bg: "#F3E8FF", border: "rgba(124,58,237,0.18)", description: "Step-by-step advice for founders at every stage of company setup." },
};

// ─── Blog posts ──────────────────────────────────────────────────────────────

export const BLOG_POSTS: BlogPost[] = [
  // ── 1. Section 8 Complete Guide ──────────────────────────────────────────
  {
    slug: "section-8-company-registration-complete-guide",
    title: "Section 8 Company Registration: The Complete 2025 Guide for NGOs in India",
    excerpt:
      "Everything founders need to know about registering a Section 8 company in India — eligibility, documents, process, timeline, and costs explained.",
    category: "ngo",
    tags: ["Section 8", "NGO Registration", "MCA", "Company Law", "Nonprofit"],
    author: "KlawTax Legal Team",
    publishedAt: "2025-03-10",
    readingMinutes: 9,
    coverGradient: "linear-gradient(135deg, #0F1B4C 0%, #1E3A8A 60%, #2E1065 100%)",
    coverEmoji: "🏛️",
    featured: true,

    metaTitle: "Section 8 Company Registration Guide 2025 | Process, Documents & Fees",
    metaDescription:
      "Complete guide to Section 8 company registration in India. Learn eligibility criteria, required documents, MCA filing process, government fees, and timeline. Updated for 2025.",
    keywords: [
      "section 8 company registration",
      "section 8 ngo registration india",
      "how to register section 8 company",
      "section 8 company documents required",
      "section 8 registration process",
      "section 8 company fees 2025",
    ],
    canonicalPath: "/blogs/section-8-company-registration-complete-guide",
    ogTitle: "Section 8 Company Registration: Complete Guide 2025",
    ogDescription:
      "Step-by-step guide to registering a Section 8 company (NGO) in India. Documents, process, timeline, and expert tips included.",

    intro:
      "A Section 8 company is the most recognised legal structure for nonprofit organisations in India. Governed by Section 8 of the Companies Act, 2013, it enables NGOs, foundations, and charitable bodies to operate with the credibility of a registered company — without distributing profits to members. This guide walks you through every step of the registration process, from eligibility to certificate issuance.",

    sections: [
      {
        heading: "What is a Section 8 Company?",
        body: "A Section 8 company is incorporated under the Companies Act, 2013 with the specific objective of promoting charitable purposes — such as commerce, art, science, religion, social welfare, education, or environmental protection. Unlike a public limited company, all income is applied toward the stated objectives and no dividend is paid to its members.\n\nThe name of a Section 8 company need not include 'Limited' or 'Private Limited', giving it a distinct identity aligned with its nonprofit mission. It is regulated by the Ministry of Corporate Affairs (MCA) and must be incorporated through the Registrar of Companies (ROC).",
      },
      {
        heading: "Who Should Register as a Section 8 Company?",
        body: "Section 8 is the preferred structure for organisations that:\n\n**Seek 12A and 80G tax benefits** — Section 8 companies are eligible to apply for 12A (income tax exemption) and 80G (donor deduction) certifications immediately after incorporation, making them attractive for institutional donors and CSR funding.\n\n**Need FCRA eligibility** — Foreign contribution under FCRA requires the organisation to have a clean legal standing, and Section 8 companies are well-regarded in this context.\n\n**Plan to apply for government grants** — DARPAN and E-Anudan registrations (required for government grants) are easier to obtain for a registered company.\n\n**Require professional credibility** — For NGOs dealing with large corporates, hospitals, or international partners, the company structure provides formal legal standing.",
      },
      {
        heading: "Eligibility Criteria",
        body: "To register a Section 8 company, you must meet the following conditions:\n\n- **Minimum 2 directors** (can be the same as members for a private structure)\n- **No minimum paid-up capital** requirement\n- **Charitable objectives** — the MOA must clearly state nonprofit purposes\n- **Indian resident director** — at least one director must be an Indian resident\n- **Unique name** — the proposed name must be available on the MCA portal and not be identical to any existing entity",
      },
      {
        heading: "Required Documents",
        body: "Prepare the following before starting the application:\n\n**For each Director/Member:**\n- Aadhaar card (front and back)\n- PAN card\n- Recent passport-size photograph (white background)\n- Address proof: electricity bill, bank statement, or mobile bill (not older than 3 months)\n\n**For the Registered Office:**\n- Latest electricity bill of the premises\n- NOC (No Objection Certificate) from the property owner\n- Rent agreement (if the premises is rented)\n\n**For the Company:**\n- Proposed name (up to 3 choices ranked by preference)\n- Object clause — a brief description of the charitable purposes the company will pursue\n- Draft Memorandum of Association (MOA) and Articles of Association (AOA)",
      },
      {
        heading: "Step-by-Step Registration Process",
        body: "**Step 1 — Digital Signature Certificate (DSC)**\nAll proposed directors must obtain a Class 3 DSC from a certified authority. This is used to sign all MCA forms electronically. Turnaround: 1–2 business days.\n\n**Step 2 — Director Identification Number (DIN)**\nNew directors must apply for a DIN via the SPICe+ form on the MCA portal. For experienced directors with existing DINs, this step is skipped.\n\n**Step 3 — Name Reservation (RUN)**\nSubmit up to 2 name choices via the Reserve Unique Name (RUN) application on MCA. Approval typically takes 2–3 working days. Names that are too generic, religious in nature, or identical to existing entities may be rejected.\n\n**Step 4 — MOA and AOA Drafting**\nDraft the Memorandum of Association (specifying objectives) and Articles of Association (governing rules). For Section 8 companies, the MOA must include a non-profit clause explicitly prohibiting dividend distribution.\n\n**Step 5 — SPICe+ Filing**\nSubmit the integrated SPICe+ form (INC-32) along with MOA (INC-33), AOA (INC-34), and the Section 8 license application (INC-12). This single form handles company incorporation, PAN, TAN, EPFO, ESIC, and bank account opening simultaneously.\n\n**Step 6 — Section 8 License (INC-12)**\nThe CRC (Central Registration Centre) reviews the Section 8 license application. If approved, a licence under Section 8 is issued. This is bundled into the SPICe+ process.\n\n**Step 7 — Certificate of Incorporation**\nUpon approval, the ROC issues the Certificate of Incorporation with the Corporate Identification Number (CIN). This is your official registration document.",
      },
      {
        heading: "Timeline",
        body: "The total timeline for Section 8 company registration in India is typically **15–21 working days**, subject to document completeness and ROC workload:\n\n- DSC: 1–2 days\n- Name approval: 2–3 days\n- SPICe+ preparation: 2–3 days\n- MCA processing: 10–14 days\n\nAt KlawTax, we've consistently completed registrations in 15 working days for clients who submit complete documents on Day 1.",
      },
      {
        heading: "Government Fees",
        body: "Section 8 companies are exempt from the standard stamp duty and government fee slabs applicable to other company types. The applicable government fees include:\n\n- DSC fee: ₹1,500 – ₹2,000 per director\n- DIN fee: Included in SPICe+ filing\n- SPICe+ filing fee: Nominal (₹0 for authorised capital up to ₹15 lakh)\n- ROC processing: ₹2,000 – ₹5,000 depending on state\n\nAll-inclusive professional fees at KlawTax start at ₹8,000, which covers DSC, DIN, name approval, SPICe+ filing, MOA/AOA drafting, PAN, TAN, and certificate delivery.",
      },
      {
        heading: "Next Steps After Registration",
        body: "Registration is only the beginning. After incorporating your Section 8 company, you should immediately pursue:\n\n1. **12A Registration** — Income tax exemption on all income earned by the NGO\n2. **80G Certification** — Allows donors to claim 50% deduction on donations made to your NGO\n3. **NGO DARPAN** — Mandatory government registry for NGOs receiving government grants\n4. **Udyam (MSME) Registration** — Useful for accessing government schemes and tenders\n5. **Bank account opening** — Submit the Certificate of Incorporation and MOA to a bank",
      },
    ],

    faqs: [
      {
        question: "Can a single person register a Section 8 company?",
        answer:
          "No. A Section 8 company requires a minimum of 2 directors (and 2 members). The directors and members can overlap, but there must be at least 2 distinct individuals.",
      },
      {
        question: "Is paid-up capital mandatory for a Section 8 company?",
        answer:
          "No. Section 8 companies have no minimum paid-up capital requirement. You can incorporate with any amount.",
      },
      {
        question: "Can a Section 8 company pay salaries to its employees?",
        answer:
          "Yes. Employees including founders and directors can draw a reasonable salary from the NGO. The restriction is on dividend distribution to members — not on paying salaries for services rendered.",
      },
      {
        question: "How is a Section 8 company different from a Trust or Society?",
        answer:
          "A Trust is governed by the Indian Trusts Act and is registered with the state government. A Society is registered under the Societies Registration Act, 1860. A Section 8 company is registered with the MCA under the Companies Act, 2013, making it the most regulated and credible structure — preferred by international donors, FCRA authorities, and CSR committees.",
      },
      {
        question: "How long does Section 8 registration take?",
        answer:
          "The process typically takes 15–21 working days from the date all documents are submitted. Document deficiencies or MCA resubmission requests can extend this timeline.",
      },
      {
        question: "What is the Section 8 license and is it mandatory?",
        answer:
          "The Section 8 license (issued under Section 8(1) of the Companies Act) is the formal permission from the MCA that allows a company to operate as a nonprofit. It is mandatory and is issued as part of the incorporation process via INC-12.",
      },
    ],

    relatedServices: [
      { label: "Section 8 Registration",     href: "/services/section-8-registration"     },
      { label: "12A Registration",            href: "/services/12a-registration"           },
      { label: "80G Registration",            href: "/services/80g-registration"           },
      { label: "NGO DARPAN Registration",     href: "/services/darpan-registration"        },
      { label: "Section 8 Complete Package",  href: "/checkout?service=section8-complete"  },
    ],
    relatedSlugs: [
      "12a-80g-registration-guide-ngo-india",
      "ngo-darpan-registration-guide",
      "ngo-compliance-annual-checklist",
    ],
  },

  // ── 2. 12A & 80G Guide ────────────────────────────────────────────────────
  {
    slug: "12a-80g-registration-guide-ngo-india",
    title: "12A and 80G Registration for NGOs: Complete 2025 Guide",
    excerpt:
      "Get income tax exemption (12A) and donor deduction eligibility (80G) for your NGO. This guide covers the application process, documents, timeline, and what changes after the 2022 amendment.",
    category: "ngo",
    tags: ["12A", "80G", "Income Tax", "NGO Tax Exemption", "Donor Deduction"],
    author: "KlawTax Legal Team",
    publishedAt: "2025-03-18",
    readingMinutes: 8,
    coverGradient: "linear-gradient(135deg, #1E3A8A 0%, #4C1D95 100%)",
    coverEmoji: "📋",
    featured: true,

    metaTitle: "12A and 80G Registration Guide for NGOs India 2025 | Process & Documents",
    metaDescription:
      "Step-by-step guide to 12A and 80G registration for NGOs in India. Learn eligibility, documents, application process via the Income Tax portal, and how the 2022 amendment changed renewals.",
    keywords: [
      "12a registration ngo india",
      "80g registration india",
      "ngo income tax exemption",
      "12a 80g documents required",
      "80g donor deduction",
      "12a registration process 2025",
    ],
    canonicalPath: "/blogs/12a-80g-registration-guide-ngo-india",
    ogTitle: "12A and 80G Registration: Complete NGO Guide 2025",
    ogDescription:
      "Everything NGOs need to know about 12A income tax exemption and 80G donor deduction registration. Updated for the 2022 amendment changes.",

    intro:
      "For any NGO in India, 12A and 80G certifications are not optional — they are the financial lifeline of an organisation. 12A grants income tax exemption on all income received by the NGO, while 80G allows donors to claim 50% of their donation as a tax deduction. Together, they make your organisation far more fundable. This guide explains the registration process under the new regime introduced by the Finance Act 2022.",

    sections: [
      {
        heading: "What Changed in 2022?",
        body: "Prior to the Finance Act 2022, 12A and 80G registrations were permanent once granted. The 2022 amendment fundamentally changed this — all existing and new registrations now require renewal every 5 years. New organisations must first obtain provisional registration (valid for 3 years), which can then be converted to final registration after 1 year of actual activities.\n\nThis means:\n- New NGOs apply for **provisional 12A/80G** — granted for 3 years\n- After 1 year of operations, apply for **final registration** — valid for 5 years\n- Renewal every 5 years is mandatory for all NGOs",
      },
      {
        heading: "12A Registration — Income Tax Exemption",
        body: "Under Section 12A of the Income Tax Act, a registered charitable institution is exempt from paying income tax on its income, provided the income is applied toward the charitable objectives stated in its MOA/Trust Deed.\n\n**Eligibility:** Any Section 8 company, public charitable trust, or registered society can apply for 12A.\n\n**Application:** Filed online through the Income Tax e-Filing portal (incometax.gov.in) using Form 10A (for new/provisional registration) or Form 10AB (for final/renewal registration).\n\n**Processing time:** 3–6 months from application. The Commissioner of Income Tax (Exemptions) reviews the application and may call for additional documents or a hearing.",
      },
      {
        heading: "80G Certification — Donor Tax Deduction",
        body: "80G allows donors — individuals, HUFs, and companies — to claim a deduction of 50% of their donation amount from their taxable income. This makes your organisation significantly more attractive to donors, particularly corporates fulfilling their CSR obligations.\n\n**Application:** Same portal as 12A — Form 10A for provisional, Form 10AB for final/renewal. 12A and 80G applications can be filed simultaneously.\n\n**What qualifies:** The donation must be to an approved institution for charitable purposes. The donor receives a stamped receipt from the NGO quoting the 80G registration number and PAN of the NGO.\n\n**Annual statement:** From FY 2021-22, NGOs with 80G registration must file Form 10BD (statement of donations received) by May 31 of each financial year, and issue Form 10BE (certificate) to each donor.",
      },
      {
        heading: "Documents Required",
        body: "**For the NGO:**\n- Registration certificate (Section 8 incorporation certificate or Trust/Society registration)\n- PAN card of the NGO\n- MOA and AOA (or Trust Deed / Rules & Regulations for Society)\n- Audited financial statements for the last 3 years (or since incorporation if newer)\n- Bank statements\n- Activity report — a written description of charitable activities undertaken\n\n**For the authorised signatory (applying online):**\n- DSC of the authorised signatory\n- PAN of the signatory\n- Aadhaar linked mobile number for OTP",
      },
      {
        heading: "Application Process (New Registration)",
        body: "**Step 1:** Log in to the Income Tax e-Filing portal (incometax.gov.in) using the NGO's PAN credentials.\n\n**Step 2:** Navigate to _Income Tax Forms_ → _Form 10A_ → Select applicable sub-section (12A or 80G or both simultaneously).\n\n**Step 3:** Fill in organisation details, upload supporting documents, and digitally sign using the authorised signatory's DSC.\n\n**Step 4:** Submit and note the Acknowledgement Number. The application is forwarded to the jurisdictional CIT(E) office.\n\n**Step 5:** The CIT(E) may issue a notice for additional documents or a hearing within 30 days. Respond promptly to avoid delays.\n\n**Step 6:** On approval, an order under Section 12AB is issued (for 12A) and an approval order under Section 80G(5) is issued (for 80G).",
      },
      {
        heading: "After Registration: Compliance Obligations",
        body: "Holding 12A and 80G certifications comes with ongoing obligations:\n\n**Annual ITR filing:** NGOs must file ITR-7 every year, even if income is fully exempt. The due date is typically October 31.\n\n**Form 10BD:** Statement of donations received — to be filed by May 31 each year (from FY 2021-22 onward).\n\n**Form 10BE:** Donation certificates issued to each donor, generated from the 80G portal.\n\n**Renewal:** File Form 10AB at least 6 months before the expiry of current registration. Failure to renew results in loss of tax exemption status retroactively.",
      },
    ],

    faqs: [
      {
        question: "Can we apply for 12A and 80G simultaneously?",
        answer:
          "Yes. Both can be applied for in a single Form 10A submission. This saves time and reduces documentation effort.",
      },
      {
        question: "Do we need 12A before applying for 80G?",
        answer:
          "Under the revised process (post 2022), both applications are filed together via Form 10A and processed together. You do not need 12A approval first.",
      },
      {
        question: "What if our NGO is less than 1 year old — can we still apply?",
        answer:
          "Yes. Newly registered NGOs can apply for provisional 12A and 80G from Day 1 of registration. Provisional status is granted before any activities commence.",
      },
      {
        question: "How long does 12A/80G take to process?",
        answer:
          "Typically 3–6 months, depending on CIT(E) workload and whether additional documents are requested. We recommend applying as soon as your NGO is incorporated.",
      },
      {
        question: "Is 80G useful if our donors are individuals or small businesses?",
        answer:
          "Absolutely. Any donor — individual or company — can claim 80G deductions. It is particularly impactful for individual donors who want to reduce their income tax liability.",
      },
    ],

    relatedServices: [
      { label: "12A & 80G Registration",   href: "/services/12a-registration"          },
      { label: "Section 8 Registration",   href: "/services/section-8-registration"    },
      { label: "NGO ITR Filing",           href: "/services/ngo-itr-filing"            },
      { label: "NGO Audit + UDIN",         href: "/services/ngo-audit-udin"            },
    ],
    relatedSlugs: [
      "section-8-company-registration-complete-guide",
      "ngo-darpan-registration-guide",
      "ngo-compliance-annual-checklist",
    ],
  },

  // ── 3. NGO DARPAN Registration ───────────────────────────────────────────
  {
    slug: "ngo-darpan-registration-guide",
    title: "NGO DARPAN Registration: Why It's Mandatory and How to Register",
    excerpt:
      "DARPAN registration is mandatory for NGOs seeking central government grants. Learn what DARPAN is, why it matters, and how to complete registration on the NITI Aayog portal.",
    category: "ngo",
    tags: ["NGO DARPAN", "NITI Aayog", "Government Grants", "NGO Portal"],
    author: "KlawTax Legal Team",
    publishedAt: "2025-04-02",
    readingMinutes: 6,
    coverGradient: "linear-gradient(135deg, #064E3B 0%, #065F46 100%)",
    coverEmoji: "🔵",

    metaTitle: "NGO DARPAN Registration Guide 2025 | NITI Aayog Portal Process",
    metaDescription:
      "Complete guide to NGO DARPAN registration on the NITI Aayog portal. Understand why DARPAN is mandatory for government grants, what documents are needed, and how to complete registration.",
    keywords: [
      "ngo darpan registration",
      "niti aayog ngo portal",
      "darpan ngo unique id",
      "government grants ngo india",
      "ngo darpan documents required",
    ],
    canonicalPath: "/blogs/ngo-darpan-registration-guide",
    ogTitle: "NGO DARPAN Registration Guide 2025",
    ogDescription:
      "Why DARPAN registration is mandatory for government grants and how to register your NGO on the NITI Aayog DARPAN portal.",

    intro:
      "DARPAN (Database and Registers for Voluntary Associations and Associations for Non-profit) is a transparency and accountability platform maintained by NITI Aayog. Any NGO seeking to receive grants from central government ministries or departments is required to have an active DARPAN registration and a unique DARPAN ID. Without it, grant applications are rejected outright.",

    sections: [
      {
        heading: "What is DARPAN and Why Does It Matter?",
        body: "DARPAN is the Government of India's official NGO registry. It was created to improve transparency in how voluntary organisations receive and utilise public funds. Every central government ministry — including the Ministry of Social Justice, Ministry of Women and Child Development, and Ministry of Rural Development — now requires a DARPAN Unique ID as a prerequisite for processing grant applications.\n\nBeyond eligibility for grants, a DARPAN registration signals credibility and transparency to donors, partner organisations, and beneficiaries.",
      },
      {
        heading: "Who Needs to Register on DARPAN?",
        body: "DARPAN registration is recommended for any NGO but is **mandatory** for NGOs that:\n\n- Apply for grants from central government ministries\n- Register on the E-Anudan portal (PM Grants portal)\n- Participate in government-funded social programmes\n- Apply for FCRA registration or renewal (DARPAN ID often required as supporting evidence)\n\nSection 8 companies, public trusts, and registered societies are all eligible.",
      },
      {
        heading: "Documents Required for DARPAN Registration",
        body: "- **NGO PAN card** (mandatory)\n- **Registration certificate** — Incorporation certificate (Section 8), Trust deed registration, or Society registration\n- **12A/80G certificate** (if obtained — not mandatory for DARPAN registration itself)\n- **Bank account details** — Account number, IFSC code, and a cancelled cheque\n- **MOA/Trust Deed/Constitution** — The governing document of the organisation\n- **List of governing body members** — Names, designations, and PAN/Aadhaar details\n- **Photo of the organisation's office/operations** (optional but improves approval speed)",
      },
      {
        heading: "Step-by-Step Registration Process",
        body: "**Step 1:** Visit ngodarpan.gov.in and click _Sign Up_.\n\n**Step 2:** Enter the organisation PAN, mobile number, and email. An OTP is sent for verification.\n\n**Step 3:** Create login credentials and complete the basic profile — organisation name, address, type (Society/Trust/Section 8), and year of establishment.\n\n**Step 4:** Enter key persons — Chief Functionary details (Chairperson, Secretary, or CEO) with PAN and Aadhaar.\n\n**Step 5:** Upload required documents in PDF/JPG format (each file under 1 MB).\n\n**Step 6:** Submit the application. A Unique ID (DARPAN ID) is generated immediately upon successful submission. No government approval waiting period — the ID is issued instantly.\n\n**Step 7:** Update the profile annually with audited accounts and activity reports to maintain active status.",
      },
      {
        heading: "After DARPAN Registration",
        body: "Once registered, your DARPAN Unique ID:\n\n- Must be quoted on all government grant applications\n- Is linked to your E-Anudan portal profile (PM's grants platform)\n- Is publicly visible on the DARPAN portal — improving organisational credibility\n- Requires annual update of audited accounts and project reports to remain active\n\nFailing to update the profile annually can result in the account being flagged as inactive, which will disqualify grant applications.",
      },
    ],

    faqs: [
      {
        question: "Is DARPAN registration free?",
        answer: "Yes. Registering on the NITI Aayog DARPAN portal is completely free.",
      },
      {
        question: "How long does it take to get a DARPAN ID?",
        answer:
          "The DARPAN Unique ID is generated immediately upon successful submission of the registration form. There is no waiting period.",
      },
      {
        question: "Can a newly incorporated Section 8 company register on DARPAN?",
        answer:
          "Yes. You can register on DARPAN as soon as your incorporation certificate is issued. You do not need 12A/80G first.",
      },
      {
        question: "Is DARPAN renewal required?",
        answer:
          "DARPAN registration itself does not expire, but your profile must be updated annually with audited accounts and activity reports. Inactive profiles can be suspended by NITI Aayog.",
      },
    ],

    relatedServices: [
      { label: "NGO DARPAN Registration",   href: "/services/darpan-registration"     },
      { label: "E-Anudan Registration",     href: "/services/e-anudan-registration"   },
      { label: "Section 8 Registration",   href: "/services/section-8-registration"  },
    ],
    relatedSlugs: [
      "section-8-company-registration-complete-guide",
      "12a-80g-registration-guide-ngo-india",
      "ngo-compliance-annual-checklist",
    ],
  },

  // ── 4. GST Registration Guide ────────────────────────────────────────────
  {
    slug: "gst-registration-guide-india-2025",
    title: "GST Registration in India 2025: Who Needs It and How to Apply",
    excerpt:
      "A practical guide to GST registration for businesses, startups, freelancers, and NGOs in India. Covers turnover thresholds, documents, application steps, and common mistakes to avoid.",
    category: "tax",
    tags: ["GST", "GST Registration", "Goods and Services Tax", "Business Compliance"],
    author: "KlawTax Tax Team",
    publishedAt: "2025-02-20",
    readingMinutes: 7,
    coverGradient: "linear-gradient(135deg, #92400E 0%, #B45309 100%)",
    coverEmoji: "📊",
    featured: true,

    metaTitle: "GST Registration Guide India 2025 | Eligibility, Documents & Process",
    metaDescription:
      "Complete guide to GST registration in India. Learn who must register, turnover thresholds for different states, documents required, and the online application process on the GST portal.",
    keywords: [
      "gst registration india 2025",
      "gst registration process",
      "who needs gst registration india",
      "gst registration documents required",
      "gstin application online",
      "gst registration for startup",
    ],
    canonicalPath: "/blogs/gst-registration-guide-india-2025",
    ogTitle: "GST Registration India 2025: Complete Guide",
    ogDescription:
      "Who needs GST registration, what documents are required, and how to apply online — complete 2025 guide.",

    intro:
      "The Goods and Services Tax (GST) is India's unified indirect tax system, replacing VAT, Service Tax, and multiple cess levies. Every business that meets the applicable turnover threshold must register for GST and obtain a GSTIN (GST Identification Number). Failure to register when required is a punishable offence. This guide breaks down who needs to register, what documents are needed, and how to complete the process online.",

    sections: [
      {
        heading: "Who Must Register for GST?",
        body: "**Mandatory registration applies to:**\n\n- Businesses with aggregate annual turnover exceeding **₹40 lakh** for supply of goods (general category states)\n- Businesses with turnover exceeding **₹20 lakh** for supply of services (general category states)\n- Businesses in special category states (Himachal Pradesh, Uttarakhand, and NE states) with turnover exceeding **₹20 lakh** (goods) or **₹10 lakh** (services)\n- Any person making interstate supplies of taxable goods or services — **regardless of turnover**\n- E-commerce operators and sellers on platforms like Amazon, Flipkart, Meesho\n- Casual taxable persons making taxable supplies\n- Any business registered under the previous tax regime (VAT, Service Tax, Central Excise)\n\n**Voluntary registration** is allowed even below the threshold and is beneficial for businesses wanting to claim Input Tax Credit (ITC).",
      },
      {
        heading: "Documents Required for GST Registration",
        body: "**For sole proprietors:**\n- PAN card (individual)\n- Aadhaar card\n- Bank account details (cancelled cheque or bank statement)\n- Photograph\n- Address proof of business: electricity bill, rent agreement, or property documents\n\n**For companies (Pvt Ltd, Section 8, LLP):**\n- PAN card of the company\n- Certificate of Incorporation\n- MOA and AOA (or LLP agreement)\n- PAN and Aadhaar of all directors/partners\n- Board resolution / authorisation letter for GST application signatory\n- Registered office address proof\n\n**For all applicants:**\n- Bank account proof: pre-printed cheque or bank statement (account must be in the entity's name)\n- Photographs of the primary authorised signatory",
      },
      {
        heading: "Step-by-Step GST Application Process",
        body: "**Step 1:** Visit gst.gov.in → _Services_ → _New Registration_.\n\n**Step 2:** Enter PAN, mobile number, and email. Verify both via OTP. Note the Temporary Reference Number (TRN) generated.\n\n**Step 3:** Re-login using the TRN and complete the full registration form (Part B):\n- Business details, address, and nature of supply\n- Add all business locations if you have multiple premises\n- Enter bank account details\n- Upload required documents\n\n**Step 4:** Sign the application using Aadhaar OTP or DSC.\n\n**Step 5:** Submit the application. An Application Reference Number (ARN) is generated for tracking.\n\n**Step 6:** The GST officer reviews the application within 7 working days. Additional documents may be requested via Form GST REG-03.\n\n**Step 7:** On successful verification, the GSTIN (15-digit Goods and Services Tax Identification Number) is issued via Form GST REG-06.",
      },
      {
        heading: "Common Mistakes to Avoid",
        body: "**Incorrect PAN:** GST registration is permanently linked to PAN. Any mismatch causes instant rejection.\n\n**Wrong address proof:** The address proof must match the principal place of business exactly. If you're using a rented premises, both the electricity bill and the rent agreement must be submitted.\n\n**Missing bank proof:** The cancelled cheque or bank statement must show the entity's name — not the proprietor's personal account for companies.\n\n**Not adding additional places:** If you have a warehouse, branch, or manufacturing unit in the same state, add it as an additional place of business during registration.\n\n**Delay in responding to queries:** If the GST officer raises a query (REG-03), you have 7 working days to respond. Missing this deadline results in rejection.",
      },
      {
        heading: "GST Compliance After Registration",
        body: "Once registered, your key ongoing compliance obligations are:\n\n- **GSTR-1:** Monthly/quarterly return of outward supplies (sales). Due: 11th of the following month (monthly) or 13th of the month following the quarter (quarterly).\n- **GSTR-3B:** Monthly summary return and tax payment. Due: 20th of the following month.\n- **Annual return (GSTR-9):** Filed once a year by December 31 for businesses above ₹2 crore.\n- **E-invoicing:** Mandatory for businesses above ₹5 crore (as of August 2023 threshold). B2B invoices must be generated on the government e-invoice portal.",
      },
    ],

    faqs: [
      {
        question: "Can I register for GST if my turnover is below the threshold?",
        answer:
          "Yes. Voluntary GST registration is permitted. It is beneficial if you want to claim Input Tax Credit on your purchases, or if you're selling on e-commerce platforms.",
      },
      {
        question: "Do NGOs need GST registration?",
        answer:
          "NGOs providing taxable services — such as training programs, consulting, or digital marketing — above the ₹20 lakh threshold may need to register. NGOs receiving purely charitable donations are generally not required to register.",
      },
      {
        question: "Is a physical inspection required for GST registration?",
        answer:
          "Not always. In most cases, the GST officer approves based on documents alone. However, for high-risk applications or large premises, a physical inspection may be ordered.",
      },
      {
        question: "How long does GST registration take?",
        answer:
          "If Aadhaar authentication is successful and all documents are in order, GSTIN is typically issued within 3–7 working days. Applications requiring physical verification may take up to 30 days.",
      },
    ],

    relatedServices: [
      { label: "GST Registration",          href: "/services/gst-registration"         },
      { label: "ITR Filing",                href: "/services/ngo-itr-filing"            },
      { label: "Private Limited Company",   href: "/services/private-limited-company"  },
      { label: "LLP Registration",          href: "/services/llp-registration"         },
    ],
    relatedSlugs: [
      "private-limited-company-registration-guide",
      "ngo-compliance-annual-checklist",
    ],
  },

  // ── 5. Pvt Ltd Registration Guide ────────────────────────────────────────
  {
    slug: "private-limited-company-registration-guide",
    title: "Private Limited Company Registration in India: 2025 Step-by-Step Guide",
    excerpt:
      "Register your startup or business as a Private Limited Company in India. Complete guide covering SPICe+ filing, required documents, director requirements, MCA process, and post-registration compliance.",
    category: "business",
    tags: ["Private Limited", "Startup Registration", "Company Incorporation", "MCA", "SPICe+"],
    author: "KlawTax Legal Team",
    publishedAt: "2025-01-28",
    readingMinutes: 8,
    coverGradient: "linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)",
    coverEmoji: "🏢",

    metaTitle: "Private Limited Company Registration 2025 | Documents, Process & MCA Filing",
    metaDescription:
      "Complete guide to Private Limited Company registration in India in 2025. Learn SPICe+ process, required documents, director eligibility, DSC/DIN requirements, and post-incorporation compliance.",
    keywords: [
      "private limited company registration india 2025",
      "pvt ltd company incorporation",
      "how to register company india",
      "spice+ filing mca",
      "private limited company documents required",
      "startup company registration india",
    ],
    canonicalPath: "/blogs/private-limited-company-registration-guide",
    ogTitle: "Private Limited Company Registration India 2025: Complete Guide",
    ogDescription:
      "Step-by-step guide to registering a Private Limited Company in India. SPICe+ process, documents, and post-registration compliance covered.",

    intro:
      "The Private Limited Company is the most popular business structure for startups and growth-oriented businesses in India. It offers limited liability, a separate legal identity, easier access to institutional funding, and a clear governance framework. This guide walks you through the complete registration process under the Companies Act, 2013 using the MCA21 SPICe+ integrated form.",

    sections: [
      {
        heading: "Why Choose a Private Limited Company?",
        body: "**Limited liability protection:** Shareholders are only liable up to their investment. Personal assets are not at risk.\n\n**Separate legal entity:** The company can own property, enter contracts, and sue or be sued independently of its owners.\n\n**Access to institutional funding:** VCs, angel investors, and banks prefer companies. Equity fundraising is straightforward with a private limited structure.\n\n**Tax advantages:** Corporate tax rates (22% for domestic companies under Section 115BAA) can be more favourable than individual slab rates for profitable businesses.\n\n**Credibility:** Clients, vendors, and employees often perceive a registered company as more credible than a proprietorship.",
      },
      {
        heading: "Eligibility Requirements",
        body: "- **Minimum 2 directors** (maximum 15 for a private company)\n- **Minimum 2 shareholders** (maximum 200)\n- At least **1 director must be an Indian resident** (182+ days in India in the preceding calendar year)\n- **No minimum paid-up capital** (removed by the Companies Amendment Act 2015)\n- The proposed company name must be unique and compliant with MCA naming guidelines",
      },
      {
        heading: "Documents Required",
        body: "**For each Director/Shareholder:**\n- PAN card (mandatory for Indian nationals)\n- Aadhaar card\n- Passport-size photograph (white background)\n- Address proof: bank statement, electricity bill, or postpaid mobile bill (not older than 2 months)\n\n**For the Registered Office:**\n- Electricity bill of the premises (not older than 2 months)\n- Rent agreement + NOC from owner (if rented)\n- Property documents (if owned)\n\n**For the Company:**\n- Proposed company name (up to 2 choices)\n- Nature of business (main objects for MOA)\n- Proposed authorised and paid-up capital amount\n- Shareholding pattern",
      },
      {
        heading: "Registration Process via SPICe+",
        body: "**Step 1 — DSC (Digital Signature Certificate):** All proposed directors must obtain Class 3 DSCs. These are used to digitally sign the MCA forms.\n\n**Step 2 — Name Availability Check:** Run a name availability check on the MCA portal. Use the SPICe+ Part A (formerly RUN) to reserve the name if needed.\n\n**Step 3 — SPICe+ Part B Filing:** Complete the comprehensive SPICe+ Part B form covering:\n- Director details (DIN application if new directors)\n- Registered office address\n- MOA (INC-33) and AOA (INC-34) in linked forms\n- Shareholder details and capital structure\n\n**Step 4 — Linked Forms:** Along with SPICe+, file:\n- **AGILE-PRO-S:** For GSTIN, ESIC, EPFO, professional tax, and bank account opening in one form\n- **INC-9:** Declaration by subscribers and first directors\n\n**Step 5 — Submit and Pay:** Pay government fees based on authorised capital and state stamp duty. The MCA portal processes payments online.\n\n**Step 6 — ROC Review and Approval:** The ROC reviews the application and issues the **Certificate of Incorporation (CoI)** with the CIN. PAN and TAN are typically issued within 1–2 days of CoI.",
      },
      {
        heading: "Post-Incorporation Compliance",
        body: "Registration is the start, not the end. Key annual compliances for a Private Limited Company:\n\n- **Annual General Meeting (AGM):** Must be held within 6 months of the end of each financial year\n- **Board meetings:** Minimum 4 per year (with specific intervals)\n- **AOC-4 (Annual Accounts):** Financial statements must be filed with MCA within 30 days of AGM\n- **MGT-7/7A (Annual Return):** Filed within 60 days of AGM\n- **DPT-3:** Return of deposits filed annually\n- **DIR-3 KYC:** Every director must complete KYC annually by September 30\n- **GST returns:** If GST registered (GSTR-1, GSTR-3B, GSTR-9)\n- **Income Tax:** ITR-6 filed annually; advance tax payments quarterly",
      },
    ],

    faqs: [
      {
        question: "What is the minimum investment to start a Private Limited Company?",
        answer:
          "There is no minimum paid-up capital requirement. You can start with as little as ₹10,000. However, you will need to budget for professional fees, DSC costs, and government fees.",
      },
      {
        question: "Can a foreign national be a director of an Indian Private Limited Company?",
        answer:
          "Yes, but at least one director must be an Indian resident. Foreign directors can hold DINs by submitting notarised/apostilled identification documents.",
      },
      {
        question: "How long does Private Limited Company registration take?",
        answer:
          "With complete documentation, the entire process typically takes 7–10 working days via SPICe+. The MCA has significantly streamlined the process in recent years.",
      },
      {
        question: "Is a physical office required for registration?",
        answer:
          "You need a registered office address — but it can be a residential address or co-working space. You'll need an electricity bill and NOC from the property owner.",
      },
    ],

    relatedServices: [
      { label: "Private Limited Registration",  href: "/services/private-limited-company" },
      { label: "LLP Registration",              href: "/services/llp-registration"        },
      { label: "GST Registration",              href: "/services/gst-registration"        },
    ],
    relatedSlugs: [
      "gst-registration-guide-india-2025",
      "ngo-compliance-annual-checklist",
    ],
  },

  // ── 6. NGO Annual Compliance Checklist ───────────────────────────────────
  {
    slug: "ngo-compliance-annual-checklist",
    title: "NGO Annual Compliance Checklist 2025: Filings, Deadlines, and Penalties",
    excerpt:
      "A complete annual compliance checklist for registered NGOs in India — Section 8 companies, trusts, and societies. Covers MCA filings, income tax, FCRA, 80G, and state-specific requirements.",
    category: "compliance",
    tags: ["NGO Compliance", "Annual Filings", "MCA", "ITR-7", "12A Renewal"],
    author: "KlawTax Compliance Team",
    publishedAt: "2025-04-15",
    readingMinutes: 7,
    coverGradient: "linear-gradient(135deg, #14532D 0%, #15803D 100%)",
    coverEmoji: "📅",
    featured: true,

    metaTitle: "NGO Annual Compliance Checklist 2025 | Deadlines & MCA Filings",
    metaDescription:
      "Complete compliance calendar for NGOs in India. Covers Section 8 MCA filings, ITR-7, 80G Form 10BD, FCRA AC, DIR-3 KYC, and state compliance — with deadlines and penalty details.",
    keywords: [
      "ngo annual compliance india 2025",
      "section 8 company annual filings",
      "ngo compliance checklist",
      "itr 7 ngo deadline",
      "form 10bd ngo",
      "mca filings section 8 company",
    ],
    canonicalPath: "/blogs/ngo-compliance-annual-checklist",
    ogTitle: "NGO Annual Compliance Checklist 2025",
    ogDescription:
      "Complete checklist of annual compliance obligations for NGOs in India — deadlines, forms, and penalty amounts included.",

    intro:
      "Running an NGO in India involves far more than impact delivery. A registered Section 8 company, public charitable trust, or registered society must meet a long list of annual compliance obligations — at both the central and state level. Missing deadlines can result in penalties, loss of 12A/80G status, or deactivation of government registrations. This checklist covers every key compliance for FY 2024-25.",

    sections: [
      {
        heading: "MCA Filings (for Section 8 Companies)",
        body: "**AOC-4 — Annual Financial Statements**\n- Contents: Balance Sheet, P&L, Cash Flow, Director's Report\n- Due date: Within **30 days of AGM** (AGM must be held by September 30 → AOC-4 due by October 30)\n- Penalty for late filing: ₹100/day of delay (no cap)\n\n**MGT-7A — Annual Return (Small Companies)**\n- Due date: Within **60 days of AGM** (by November 30 if AGM held September 30)\n- Applies to Section 8 companies with turnover < ₹2 crore\n- Penalty: ₹100/day of delay\n\n**ADT-1 — Appointment of Auditor**\n- Filed once: Within 15 days of AGM when auditor is appointed\n- Not required annually if auditor's term is running\n\n**DIR-3 KYC — Director KYC**\n- Every director must file DIR-3 KYC by **September 30** each year\n- Required for every director holding DIN, even if no active filings\n- Penalty: DIN is deactivated; ₹5,000 to reactivate",
      },
      {
        heading: "Income Tax Compliance",
        body: "**ITR-7 — Income Tax Return for Charitable Organizations**\n- Due date: **October 31** (or November 30 if audit required)\n- Must be filed even if income is fully exempt under 12A\n- Form 10B/10BB (audit report) must be submitted before ITR-7 filing\n\n**Form 10BD — Statement of Donations Received (80G holders)**\n- Due date: **May 31** of each financial year\n- Lists all donors with PAN, amount, and donation date\n- Penalty for non-filing: ₹200/day (Section 234G)\n\n**Form 10BE — Donation Certificates**\n- Issued to each donor after filing Form 10BD\n- Must be issued by **June 30**\n- Donors use Form 10BE to claim 80G deductions in their ITR\n\n**Advance Tax**\n- NGOs with taxable income (e.g., business receipts exceeding charitable application) must pay advance tax quarterly if expected tax liability > ₹10,000",
      },
      {
        heading: "FCRA Compliance (if applicable)",
        body: "NGOs with Foreign Contribution Regulation Act (FCRA) registration have additional obligations:\n\n**FC-4 (Annual FCRA Return)**\n- Due date: **December 31** of each year for the preceding financial year\n- Must be filed online on the FCRA portal (fcraonline.nic.in)\n- Penalty for non-filing: ₹5,000 + possible cancellation of FCRA registration\n\n**Designated Bank Account**\n- All foreign contributions must flow through the FCRA-designated account at SBI New Delhi Main Branch (as mandated since 2020)\n- Utilisation report must match FC-4 disclosures\n\n**Renewal**\n- FCRA registration must be renewed every 5 years\n- Application (Form FC-3C) must be filed **6 months before expiry**",
      },
      {
        heading: "State-Level Compliance",
        body: "State-specific obligations vary but commonly include:\n\n**Charity Commissioner filings (Maharashtra, Gujarat, Tamil Nadu, etc.)**\n- Annual report and audited accounts must be filed with the state Charity Commissioner\n- Due dates vary by state — typically between July and September\n- Non-filing can result in cancellation of state registration\n\n**Professional Tax (Employer Registration)**\n- NGOs with employees must register for Professional Tax and remit monthly in states like Maharashtra, Karnataka, and Andhra Pradesh\n\n**Shops and Establishments Act**\n- Annual renewal of Shop Act registration (where applicable) before December 31",
      },
      {
        heading: "12A/80G Renewal Compliance",
        body: "Under the Finance Act 2022, all 12A and 80G registrations expire after 5 years. NGOs must file Form 10AB at least 6 months before expiry:\n\n- **Form 10AB** filed on the Income Tax portal under _e-File → Income Tax Forms_\n- Attach latest audited accounts, activity report, and registration documents\n- Processing time: 3–6 months (plan well in advance)\n- Failure to renew: Loss of 12A/80G status with retrospective effect — donors cannot claim 80G deductions, and NGO income becomes taxable",
      },
      {
        heading: "Quick Compliance Calendar Summary",
        body: "| Due Date | Filing | Who | Penalty |\n|---|---|---|---|\n| May 31 | Form 10BD (donations statement) | 80G holders | ₹200/day |\n| June 30 | Form 10BE (donor certificates) | 80G holders | — |\n| July 31 | Advance tax (1st instalment) | Taxable NGOs | Interest |\n| Sept 30 | AGM + DIR-3 KYC | Section 8 companies | ₹100/day, DIN deactivation |\n| Oct 30 | AOC-4 (accounts filing) | Section 8 companies | ₹100/day |\n| Oct 31 / Nov 30 | ITR-7 | All registered NGOs | ₹5,000 – ₹10,000 |\n| Nov 30 | MGT-7A (annual return) | Section 8 companies | ₹100/day |\n| Dec 31 | FC-4 (FCRA annual return) | FCRA registered | ₹5,000 |",
      },
    ],

    faqs: [
      {
        question: "What happens if we miss the AOC-4 filing deadline?",
        answer:
          "A penalty of ₹100 per day of delay is levied, with no upper cap. This can accumulate rapidly. The MCA also classifies the company as non-compliant, which can block future filings.",
      },
      {
        question: "Can an NGO file ITR-7 without an auditor?",
        answer:
          "No. NGOs claiming 12A exemption on income above ₹5 lakh must have their accounts audited and submit Form 10B/10BB along with ITR-7. An auditor with a UDIN must certify the accounts.",
      },
      {
        question: "What if our 80G approval was granted in 2021 — when does it expire?",
        answer:
          "Under the transitional provisions of the Finance Act 2022, registrations granted before April 1, 2021 are deemed provisional and must be reapplied for using Form 10AB. The CIT(E) has notified deadline extensions — check the current CBDT circular for your specific grant year.",
      },
      {
        question: "Is DIR-3 KYC required for all directors including inactive ones?",
        answer:
          "Yes. Every director holding a DIN must file DIR-3 KYC by September 30 each year, regardless of whether they're actively involved in any company. Failure deactivates the DIN.",
      },
    ],

    relatedServices: [
      { label: "NGO Audit + UDIN",          href: "/services/ngo-audit-udin"           },
      { label: "NGO ITR Filing",            href: "/services/ngo-itr-filing"           },
      { label: "Annual Report Filing",      href: "/services/annual-report-filing"     },
      { label: "12A & 80G Registration",   href: "/services/12a-registration"          },
    ],
    relatedSlugs: [
      "section-8-company-registration-complete-guide",
      "12a-80g-registration-guide-ngo-india",
      "gst-registration-guide-india-2025",
    ],
  },

  // ── 7. Digital Marketing for NGOs ────────────────────────────────────────
  {
    slug: "digital-marketing-for-ngos-india-guide",
    title: "Digital Marketing for NGOs in India: A Practical 2025 Guide",
    excerpt:
      "How Indian NGOs can use social media, SEO, email marketing, and Google Ad Grants to grow donor reach, volunteer engagement, and fundraising — without a large budget.",
    category: "digital",
    tags: ["NGO Marketing", "Digital Marketing", "Google Ad Grants", "Social Media NGO"],
    author: "KlawTax Digital Team",
    publishedAt: "2025-05-01",
    readingMinutes: 6,
    coverGradient: "linear-gradient(135deg, #075985 0%, #0369A1 100%)",
    coverEmoji: "📱",

    metaTitle: "Digital Marketing for NGOs India 2025 | SEO, Social Media & Ad Grants",
    metaDescription:
      "Practical digital marketing guide for Indian NGOs. Learn how to use SEO, social media, email campaigns, Google Ad Grants, and content marketing to grow fundraising and awareness without a big budget.",
    keywords: [
      "digital marketing for ngo india",
      "google ad grants ngo india",
      "ngo social media strategy",
      "ngo website seo",
      "nonprofit marketing india",
      "ngo fundraising online india",
    ],
    canonicalPath: "/blogs/digital-marketing-for-ngos-india-guide",
    ogTitle: "Digital Marketing for NGOs India 2025: A Practical Guide",
    ogDescription:
      "Grow your NGO's reach and fundraising with SEO, social media, Google Ad Grants, and email marketing — practical 2025 guide for Indian nonprofits.",

    intro:
      "Most Indian NGOs are doing important work — but few of them are telling that story digitally. In an era where donor discovery happens on Google and Instagram, an NGO without a digital strategy is effectively invisible to a growing segment of potential supporters. This guide is a practical playbook for NGOs at any budget level.",

    sections: [
      {
        heading: "Why Digital Marketing Matters for Indian NGOs",
        body: "The CSRI (Civil Society Resource Initiative) reports that over 40% of individual donors in India now discover NGOs through online searches or social media. Corporate CSR committees regularly search Google before shortlisting NGOs for grants. International donors almost never engage with an NGO that has no digital footprint.\n\nBeyond donor acquisition, digital marketing builds:\n- **Volunteer recruitment** — job boards, LinkedIn, Instagram Stories\n- **Programme visibility** — Instagram Reels, Facebook groups, YouTube\n- **Government advocacy** — Twitter/X campaigns, petition platforms\n- **Community engagement** — WhatsApp communities, Telegram channels",
      },
      {
        heading: "Google Ad Grants: $10,000/month in Free Ads for NGOs",
        body: "Google offers $10,000 per month in free search advertising to eligible nonprofits through the Google Ad Grants programme. This is one of the most underutilised resources available to Indian NGOs.\n\n**Eligibility:** Your NGO must hold valid 12A/80G/FCRA status (or equivalent tax-exempt status). Register on Google for Nonprofits (npo.google.com/intl/en_in/home/) first.\n\n**What you can do with it:** Run Google Search ads for keywords like 'donate to child education NGO India', 'sponsor a girl child education Mumbai', 'CSR partner NGO Maharashtra' — driving high-intent visitors directly to your donation page.\n\n**Requirements to maintain grants:** 5% click-through rate minimum, meaningful conversion tracking, and ads must link to content-rich landing pages (not just a homepage).",
      },
      {
        heading: "SEO Strategy for NGOs",
        body: "Search Engine Optimisation is the highest ROI channel for NGOs because traffic is free and self-compounding once established.\n\n**Core SEO priorities:**\n\n**1. Google Business Profile** — Create and verify your NGO's Google Business listing. This makes you appear in local searches and on Maps. Add photos, services, and collect reviews.\n\n**2. Keyword-targeted pages** — Create individual pages for each programme: 'Child Education Programme in Nanded', 'Women Empowerment NGO Maharashtra', 'Organic Farming NGO India'. These long-tail pages rank faster than generic homepages.\n\n**3. Blog and content hub** — Regular publishing of helpful guides (like this one) builds topical authority. For an education NGO: 'How to sponsor a child's education in India', 'Tax benefits of donating to education NGOs'.\n\n**4. Backlinks** — Get listed in DARPAN, GiveIndia, Samhita, NGO directories, and local newspaper websites.",
      },
      {
        heading: "Social Media Strategy",
        body: "**Instagram and Facebook** are the primary platforms for Indian NGO storytelling:\n\n- **Reels and short videos:** Impact stories — 60–90 second stories of a beneficiary's life change. These get organic reach even without advertising budgets.\n- **Behind-the-scenes:** Team visits, distribution events, project milestones\n- **Infographics:** 'How your donation is used', '₹500 feeds X families', impact data visualised\n\n**LinkedIn** is critical for corporate fundraising:\n- Share CSR case studies and eligibility documentation\n- Post annual impact reports\n- Connect with CSR managers at corporates in your geography\n\n**WhatsApp Business:** Build a broadcast list of regular donors. Send quarterly impact updates, fundraiser announcements, and event invitations.",
      },
      {
        heading: "Email Marketing",
        body: "Email has the highest conversion rate of any digital channel for nonprofit fundraising. Build your list from:\n- Event registrations\n- Volunteer sign-ups\n- Website contact form opt-ins\n\n**Tools for NGOs (free tiers):** Mailchimp (500 contacts), Brevo (300 emails/day), Google Workspace for Nonprofits.\n\n**Email cadence:** Monthly impact newsletter, quarterly fundraiser campaign, year-end 80G receipt email to all past donors (reminding them to use their donation for tax deductions — this drives repeat giving).",
      },
      {
        heading: "NGO Website Best Practices",
        body: "Your website is the central hub of your digital strategy. Key requirements:\n\n- **Donate button above the fold** on every page\n- **Impact numbers prominently displayed** — beneficiaries served, years operating, rupees disbursed\n- **80G eligibility prominently communicated** — donors search for this before giving\n- **Mobile-first design** — 60%+ of Indian internet users access on mobile\n- **Fast loading** — Every 1-second delay reduces conversions by ~7%\n- **Trust signals:** DARPAN ID, 12A/80G registration numbers, Google rating, audited accounts link\n\nKlawTax offers NGO website development starting at ₹5,000 — built for SEO and donor conversion.",
      },
    ],

    faqs: [
      {
        question: "Does our NGO need 12A to apply for Google Ad Grants?",
        answer:
          "Google requires proof of tax-exempt nonprofit status. In India, 12A registration (or FCRA for international-facing NGOs) is the standard proof Google accepts via Google for Nonprofits.",
      },
      {
        question: "What social media platform should we focus on first?",
        answer:
          "Start with Instagram and Google Business Profile. Instagram Reels give the highest organic reach for emotional storytelling. Google Business ensures you appear in local searches immediately.",
      },
      {
        question: "Can a small NGO with 3 staff manage digital marketing?",
        answer:
          "Yes. Start with just 2 Instagram posts per week and 1 monthly email newsletter. Consistency over volume — Google rewards regular publishing, not sporadic bursts.",
      },
    ],

    relatedServices: [
      { label: "NGO Website Development",   href: "/services/ngo-website-development"   },
      { label: "Digital Marketing & SEO",   href: "/services/digital-marketing-seo"     },
      { label: "12A Registration",          href: "/services/12a-registration"           },
    ],
    relatedSlugs: [
      "section-8-company-registration-complete-guide",
      "12a-80g-registration-guide-ngo-india",
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getBlogsByCategory(cat: BlogCategory): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.category === cat);
}

export function getFeaturedBlogs(count = 3): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.featured).slice(0, count);
}

export function getRelatedBlogs(post: BlogPost, count = 3): BlogPost[] {
  return post.relatedSlugs
    .map((s) => getBlogBySlug(s))
    .filter(Boolean)
    .slice(0, count) as BlogPost[];
}

export function formatPublishedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Build a BlogPosting JSON-LD schema object for a given post */
export function buildBlogPostingSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription,
    url: `${BASE_URL}${post.canonicalPath}`,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author,
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "KlawTax.online",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/favicon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}${post.canonicalPath}`,
    },
    keywords: post.keywords.join(", "),
  };
}

/** Build FAQ schema for a blog post */
export function buildBlogFAQSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Build BreadcrumbList schema */
export function buildBreadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",   item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog",   item: `${BASE_URL}/blogs` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${BASE_URL}${post.canonicalPath}` },
    ],
  };
}
