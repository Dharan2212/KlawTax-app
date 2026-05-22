import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Mail, ArrowRight, Lock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { BASE_URL } from "@/components/shared/SEO";

const LAST_UPDATED = "18 May 2026";

const SECTIONS = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    body: `When you use KlawTax.online, we collect the following types of information:

**Personal Information:** Name, email address, phone number, and billing details provided during registration or checkout.

**Document Data:** Identity documents (Aadhaar, PAN, passport, address proof), organizational documents (MOA, trust deeds), and supporting materials shared for the purpose of completing your service.

**Usage Data:** Pages visited, time spent, browser type, IP address, and device information collected automatically for analytics and security purposes.

**Communication Data:** Messages sent via our contact form, WhatsApp, or email.`,
  },
  {
    id: "how-we-use-information",
    title: "2. How We Use Your Information",
    body: `We use the information we collect solely to:

• Deliver the legal and compliance services you have purchased
• Communicate with you about your order, documents, and registration status
• Send service-related notifications and updates
• Respond to your queries and provide customer support
• Process payments securely via Razorpay
• Comply with legal obligations applicable to us as a legal services provider
• Improve our services based on aggregated, anonymized usage patterns

We do **not** use your personal data for advertising profiling, and we do **not** sell your data to third parties.`,
  },
  {
    id: "document-security",
    title: "3. Document & Data Security",
    body: `Your documents and personal information are handled with the highest level of confidentiality:

• All uploaded documents are stored on encrypted servers
• Access is restricted to authorized KlawTax team members handling your specific case
• Documents are transmitted using SSL/TLS encrypted connections
• We do not retain documents beyond the period required to complete your service, unless you request otherwise for your account
• Payment information is never stored by us — payments are processed directly via Razorpay's PCI-DSS compliant infrastructure`,
  },
  {
    id: "data-sharing",
    title: "4. Data Sharing",
    body: `We share your information only in the following limited circumstances:

**Government Authorities:** As required to complete the registration or compliance service you have ordered (e.g., filing with MCA, NITI Aayog DARPAN portal, Income Tax department, GST portal). This sharing is essential to deliver the service and is only done with your consent at the time of service purchase.

**Payment Processor:** Razorpay processes payments on our behalf and receives your billing information. Razorpay's privacy policy governs their use of that data.

**Legal Requirements:** We may disclose information if required by law, court order, or to protect the rights and safety of KlawTax, our clients, or the public.

We do **not** share your data with marketing companies, data brokers, or any third party for commercial purposes.`,
  },
  {
    id: "data-retention",
    title: "5. Data Retention",
    body: `We retain your personal information for as long as necessary to deliver your services and comply with applicable legal requirements. Typically:

• Service-related documents and correspondence: 7 years (as required by professional and tax regulations)
• Payment records: 7 years
• Marketing communications and contact form submissions: 2 years, or until you request deletion

You may request deletion of your personal data at any time (see Section 7 — Your Rights). Where legal requirements mandate retention, we will inform you of any applicable limitations.`,
  },
  {
    id: "cookies",
    title: "6. Cookies & Tracking",
    body: `KlawTax.online uses minimal, essential cookies:

• **Session cookies:** To maintain your logged-in session on the client portal
• **Analytics (optional):** Aggregated, anonymized usage data to improve our site. No personally identifiable information is stored in analytics.

We do not use third-party advertising cookies. You may disable cookies in your browser settings; however, some features of the client portal may not function correctly without session cookies.`,
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
    body: `You have the following rights regarding your personal data:

• **Access:** Request a copy of the personal data we hold about you
• **Correction:** Request correction of inaccurate or incomplete data
• **Deletion:** Request deletion of your personal data, subject to our legal retention obligations
• **Portability:** Request your data in a structured, machine-readable format
• **Objection:** Object to processing of your data for specific purposes

To exercise any of these rights, contact us at **info@klawtax.online** or WhatsApp **+91 73877 31313**. We will respond within 30 days.`,
  },
  {
    id: "childrens-privacy",
    title: "8. Children's Privacy",
    body: `KlawTax.online is not directed at individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately and we will delete it.`,
  },
  {
    id: "policy-changes",
    title: "9. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. When we make material changes, we will notify registered clients via email and update the "Last Updated" date at the top of this page. Continued use of our services after the effective date of any update constitutes your acceptance of the revised policy.`,
  },
  {
    id: "contact-us",
    title: "10. Contact Us",
    body: `For any privacy-related questions, data requests, or concerns, please contact:

**KlawTax.online**
Workshop Opp. Water Tank, Nanded 431601, Maharashtra, India

Email: info@klawtax.online
Phone / WhatsApp: +91 73877 31313
Business Hours: Mon – Sat, 10 AM – 7 PM IST`,
  },
];

export default function PrivacyPage() {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      <SEO
        title="Privacy Policy | KlawTax"
        description="Learn how KlawTax.online collects, uses, and protects your personal data and documents. We are committed to your privacy and data security."
        keywords="KlawTax privacy policy, data protection, NGO registration data, legal services privacy"
        canonical="/privacy"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          url: `${BASE_URL}/privacy`,
          name: "Privacy Policy | KlawTax.online",
          description: "KlawTax privacy policy — how we handle your personal data, documents, and information.",
          publisher: { "@id": `${BASE_URL}/#organization` },
        }}
      />
      <Navbar />
      <main role="main" className="flex-1 pt-20">

        {/* ── Hero ──────────────────────────────────────── */}
        <section
          className="py-14 md:py-20"
          style={{
            background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={staggerItem} className="flex items-center justify-center mb-5">
                <span
                  className="flex items-center justify-center w-14 h-14 rounded-2xl"
                  style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
                >
                  <Lock size={22} strokeWidth={1.75} style={{ color: "#FCD34D" }} />
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                className="text-center mb-4"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  color: "white",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.15,
                }}
              >
                Privacy Policy
              </motion.h1>

              <motion.p
                variants={staggerItem}
                className="text-center"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                Last updated: {LAST_UPDATED}
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── Policy Content ────────────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Intro card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
              className="rounded-2xl p-6 mb-12"
              style={{
                background: "rgba(30,58,138,0.05)",
                border: "1.5px solid rgba(30,58,138,0.12)",
              }}
            >
              <div className="flex items-start gap-4">
                <Shield size={20} strokeWidth={1.75} style={{ color: "#1E3A8A", flexShrink: 0, marginTop: "2px" }} />
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  At KlawTax.online, your privacy is fundamental to how we operate. We handle sensitive
                  personal and legal documents on your behalf, and we take that responsibility seriously.
                  This policy explains clearly what we collect, how we use it, and how we protect it.
                </p>
              </div>
            </motion.div>

            {/* Table of contents */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
              className="rounded-2xl p-6 mb-12"
              style={{
                background: "#F8FAFC",
                border: "1px solid rgba(15,27,76,0.07)",
              }}
            >
              <p
                className="mb-4"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  color: "#94A3B8",
                  textTransform: "uppercase",
                }}
              >
                Contents
              </p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 py-1 text-sm transition-colors"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#475569",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#1E3A8A")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#475569")}
                  >
                    <ArrowRight size={12} strokeWidth={2.5} style={{ color: "#1E3A8A", flexShrink: 0 }} />
                    {s.title}
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Policy sections */}
            <div className="flex flex-col gap-10">
              {SECTIONS.map((section, i) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.03, ease: [0, 0, 0.2, 1] }}
                  style={{
                    paddingBottom: "2.5rem",
                    borderBottom: i < SECTIONS.length - 1 ? "1px solid rgba(15,27,76,0.07)" : "none",
                  }}
                >
                  <h2
                    className="mb-4"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.125rem",
                      color: "#0F1B4C",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {section.title}
                  </h2>
                  <div
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.9375rem",
                      color: "#475569",
                      lineHeight: 1.75,
                      whiteSpace: "pre-wrap",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: section.body
                        .replace(/\*\*(.+?)\*\*/g, "<strong style='color:#334155;font-weight:600'>$1</strong>")
                        .replace(/^• /gm, "")
                        .split("\n")
                        .map(line =>
                          line.startsWith("•") || section.body.includes("• " + line)
                            ? `<div style='display:flex;align-items:flex-start;gap:8px;margin-bottom:6px'><span style='color:#1E3A8A;font-weight:700;flex-shrink:0;margin-top:2px'>·</span><span>${line}</span></div>`
                            : line
                        )
                        .join("\n"),
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 rounded-2xl p-7 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(30,58,138,0.05), rgba(124,58,237,0.05))",
                border: "1.5px solid rgba(30,58,138,0.10)",
              }}
            >
              <Mail size={22} strokeWidth={1.75} className="mx-auto mb-3" style={{ color: "#1E3A8A" }} />
              <h3
                className="mb-2"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  color: "#0F1B4C",
                }}
              >
                Questions about this policy?
              </h3>
              <p
                className="mb-5"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem",
                  color: "#64748B",
                }}
              >
                Contact us at{" "}
                <a
                  href="mailto:info@klawtax.online"
                  style={{ color: "#1E3A8A", fontWeight: 600 }}
                >
                  info@klawtax.online
                </a>
                {" "}or WhatsApp{" "}
                <a href="tel:+917387731313" style={{ color: "#1E3A8A", fontWeight: 600 }}>
                  +91 73877 31313
                </a>
                .
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "#1E3A8A",
                    color: "white",
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(30,58,138,0.25)",
                  }}
                >
                  Contact Us
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "white",
                    color: "#334155",
                    textDecoration: "none",
                    border: "1.5px solid rgba(15,27,76,0.12)",
                  }}
                >
                  Help Center
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </motion.div>
  );
}
