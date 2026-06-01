import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MessageCircle, Phone, Mail, Clock, ChevronDown,
  FileText, Shield, Zap, HelpCircle, ArrowRight,
  CheckCircle2, Star, BookOpen, LifeBuoy,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { buildFAQSchema } from "@/lib/seo";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";

// ─── Constants ────────────────────────────────────────────────────────────────

const WA = "https://wa.me/917387731313?text=" + encodeURIComponent("Hi KlawTax! I need help with my service.");

const SUPPORT_CHANNELS = [
  {
    icon: MessageCircle,
    title: "WhatsApp (Fastest)",
    desc: "Get instant replies during business hours. Send documents, ask questions, track your order.",
    cta: "Open WhatsApp",
    href: WA,
    external: true,
    accent: "#25D366",
    bg: "rgba(37,211,102,0.08)",
    border: "rgba(37,211,102,0.20)",
  },
  {
    icon: Phone,
    title: "Call Us",
    desc: "Talk directly to a legal expert. Available Mon–Sat, 10 AM – 7 PM IST.",
    cta: "+91 73877 31313",
    href: "tel:+917387731313",
    external: false,
    accent: "#1E3A8A",
    bg: "rgba(30,58,138,0.07)",
    border: "rgba(30,58,138,0.18)",
  },
  {
    icon: Mail,
    title: "Email Support",
    desc: "For detailed queries, document reviews, or formal correspondence. Response within 4 hours.",
    cta: "info@klawtax.online",
    href: "mailto:info@klawtax.online",
    external: false,
    accent: "#7C3AED",
    bg: "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.18)",
  },
];

const QUICK_LINKS = [
  { icon: FileText, label: "All Services",      href: "/services"  },
  { icon: Zap,      label: "Pricing",            href: "/pricing"   },
  { icon: BookOpen, label: "About KlawTax",      href: "/about"     },
  { icon: Mail,     label: "Contact Us",         href: "/contact"   },
];

const FAQS: { q: string; a: string; category: string }[] = [
  // Getting Started
  {
    category: "Getting Started",
    q: "How do I get started with KlawTax?",
    a: "Simply browse our services at klawtax.online/services, select what you need, and click 'Get Started'. You can also WhatsApp us directly at +91 73877 31313 for a free consultation before choosing.",
  },
  {
    category: "Getting Started",
    q: "Do I need to visit your office?",
    a: "No. KlawTax is 100% online. All services are delivered remotely across India. You submit documents via WhatsApp or our portal, and we handle everything with the relevant authorities.",
  },
  {
    category: "Getting Started",
    q: "Can I get a free consultation before paying?",
    a: "Yes, absolutely. WhatsApp or call us anytime during business hours (Mon–Sat, 10 AM – 7 PM IST) for a free consultation. We'll help you understand which services you need and guide you through the process.",
  },
  // Payments
  {
    category: "Payments",
    q: "What payment methods do you accept?",
    a: "We accept UPI, credit cards, debit cards, net banking, and popular wallets — all via Razorpay's secure payment gateway. You can also pay in two installments: 50% advance now, 50% on delivery.",
  },
  {
    category: "Payments",
    q: "Is the 50% advance option available for all services?",
    a: "Yes, for most services priced ₹2,000 and above, you can pay 50% upfront and the remaining 50% when your certificate or registration is ready.",
  },
  {
    category: "Payments",
    q: "Are government fees included in your pricing?",
    a: "Yes. All our prices are fully inclusive of government fees, portal charges, DSC costs, and our professional fees. There are no surprise charges.",
  },
  {
    category: "Payments",
    q: "What is your refund policy?",
    a: "If we are unable to complete a service due to a reason on our end (e.g., government rejection not caused by your documents), we offer a full refund. If the process is already partially completed, a partial refund may apply. Contact us and we'll sort it out promptly.",
  },
  // Documents & Process
  {
    category: "Documents & Process",
    q: "How do I submit my documents?",
    a: "After payment, our team will contact you on WhatsApp within 2 hours with a document checklist. You can send all documents directly via WhatsApp, or upload them through our secure client portal at klawtax.online/dashboard.",
  },
  {
    category: "Documents & Process",
    q: "Are my documents safe with you?",
    a: "Yes. All documents and personal information shared with us are kept strictly confidential. We use encrypted storage and never share your information with third parties.",
  },
  {
    category: "Documents & Process",
    q: "What happens after I submit documents?",
    a: "Our expert team reviews your documents, prepares all applications, and files them with the relevant government authority. We keep you updated at every step via WhatsApp. You can also track status on your client dashboard.",
  },
  // Timelines
  {
    category: "Timelines & Delivery",
    q: "How long does NGO DARPAN registration take?",
    a: "DARPAN registration typically takes 1–2 working days once your documents are verified.",
  },
  {
    category: "Timelines & Delivery",
    q: "How long does 12A or 80G take?",
    a: "Provisional 12A and 80G certificates are typically processed in 2–4 working days by the Income Tax department. We handle the entire filing on your behalf.",
  },
  {
    category: "Timelines & Delivery",
    q: "How long does Section 8 company registration take?",
    a: "Section 8 incorporation takes 10–21 working days depending on government processing times at the Ministry of Corporate Affairs.",
  },
  // After Registration
  {
    category: "After Registration",
    q: "Will you help after I get my certificate?",
    a: "Yes. We provide post-registration guidance and answer queries via WhatsApp. For ongoing compliance (annual filings, audit, ITR), we offer separate compliance services at flat fees.",
  },
  {
    category: "After Registration",
    q: "Do you provide compliance support after NGO registration?",
    a: "Absolutely. We offer full compliance packages for NGOs including annual ITR filing, Form 10B audit, UDIN generation, Form 10BD donation returns, annual reports, and more. Browse our compliance services for details.",
  },
];

const CATEGORIES = [...new Set(FAQS.map(f => f.category))];

// ─── Accordion Item ───────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid rgba(15,27,76,0.07)",
        transition: "all 0.2s ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left gap-4"
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#0F1B4C",
            lineHeight: 1.45,
          }}
        >
          {q}
        </span>
        <span
          className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200"
          style={{
            background: open ? "#1E3A8A" : "rgba(15,27,76,0.06)",
          }}
        >
          <ChevronDown
            size={13}
            strokeWidth={2.5}
            style={{
              color: open ? "white" : "#64748B",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.25s ease",
            }}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="pb-4 pr-8"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState("Getting Started");

  const filteredFAQs = FAQS.filter(f => f.category === activeCategory);

  const faqSchema = buildFAQSchema(FAQS.map(f => ({ question: f.q, answer: f.a })));

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      <SEO
        title="Support & Help | KlawTax"
        description="Get help with NGO registration, legal services, payments, and document submission. WhatsApp, call, or email our CA/CS experts. FAQ and support resources."
        keywords="KlawTax support, NGO registration help, legal services support, contact KlawTax, WhatsApp support, FAQ"
        canonical="/support"
        schema={faqSchema}
      />
      <Navbar />
      <main id="main-content" role="main" className="flex-1 pt-20">

        {/* ── Hero ──────────────────────────────────────── */}
        <section
          className="py-16 md:py-24"
          style={{
            background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div variants={staggerItem}>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#FCD34D",
                  }}
                >
                  <LifeBuoy size={12} strokeWidth={2.5} />
                  HELP & SUPPORT CENTER
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  color: "white",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                }}
                className="mb-5"
              >
                How Can We Help You?
              </motion.h1>

              <motion.p
                variants={staggerItem}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1.0625rem",
                  color: "rgba(255,255,255,0.58)",
                  lineHeight: 1.7,
                  maxWidth: "540px",
                  margin: "0 auto 2.5rem",
                }}
              >
                Find answers to common questions or reach our expert team directly.
                We typically respond within 2 hours.
              </motion.p>

              {/* Trust strip */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap items-center justify-center gap-5"
              >
                {[
                  { icon: Clock,        text: "2 hr avg. response" },
                  { icon: Star,         text: "4.9/5 support rating" },
                  { icon: CheckCircle2, text: "500+ happy clients" },
                ].map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.8125rem",
                      color: "rgba(255,255,255,0.50)",
                    }}
                  >
                    <Icon size={13} strokeWidth={2} style={{ color: "#F59E0B" }} />
                    {text}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Support Channels ──────────────────────────── */}
        <section className="py-14 md:py-20" style={{ background: "#F8FAFC" }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.h2
                variants={staggerItem}
                className="text-center mb-10"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  color: "#0F1B4C",
                  letterSpacing: "-0.02em",
                }}
              >
                Reach Us Your Way
              </motion.h2>

              <div className="grid sm:grid-cols-3 gap-5">
                {SUPPORT_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <motion.a
                      key={ch.title}
                      variants={staggerItem}
                      href={ch.href}
                      target={ch.external ? "_blank" : undefined}
                      rel={ch.external ? "noopener noreferrer" : undefined}
                      className="flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                      style={{
                        background: "white",
                        border: `1.5px solid ${ch.border}`,
                        boxShadow: "0 2px 12px rgba(15,27,76,0.06)",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        className="flex items-center justify-center w-11 h-11 rounded-xl"
                        style={{ background: ch.bg }}
                      >
                        <Icon size={20} strokeWidth={1.75} style={{ color: ch.accent }} />
                      </span>
                      <div>
                        <p
                          className="mb-1.5"
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            fontWeight: 700,
                            fontSize: "1rem",
                            color: "#0F1B4C",
                          }}
                        >
                          {ch.title}
                        </p>
                        <p
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.875rem",
                            color: "#64748B",
                            lineHeight: 1.6,
                          }}
                        >
                          {ch.desc}
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1.5 font-semibold text-sm mt-auto"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          color: ch.accent,
                        }}
                      >
                        {ch.cta}
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </span>
                    </motion.a>
                  );
                })}
              </div>

              {/* Business hours note */}
              <motion.p
                variants={staggerItem}
                className="text-center mt-7"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.8125rem",
                  color: "#94A3B8",
                }}
              >
                <Clock size={12} strokeWidth={2} className="inline mr-1.5 mb-0.5" />
                Business hours: Mon – Sat, 10:00 AM – 7:00 PM IST
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────── */}
        <section className="py-14 md:py-20" style={{ background: "white" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div variants={staggerItem} className="text-center mb-10">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    background: "rgba(30,58,138,0.08)",
                    color: "#1E3A8A",
                  }}
                >
                  <HelpCircle size={12} strokeWidth={2.5} />
                  FREQUENTLY ASKED QUESTIONS
                </span>
                <h2
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(1.5rem, 3vw, 2rem)",
                    color: "#0F1B4C",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Quick Answers
                </h2>
              </motion.div>

              {/* Category tabs */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap gap-2 justify-center mb-8"
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: activeCategory === cat ? "#1E3A8A" : "rgba(15,27,76,0.05)",
                      color: activeCategory === cat ? "white" : "#475569",
                      border: activeCategory === cat ? "1.5px solid #1E3A8A" : "1.5px solid transparent",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>

              {/* FAQ list */}
              <motion.div
                variants={staggerItem}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: "1.5px solid rgba(15,27,76,0.08)",
                  boxShadow: "0 2px 16px rgba(15,27,76,0.06)",
                }}
              >
                <div className="px-6 py-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {filteredFAQs.map((faq) => (
                        <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Still need help */}
              <motion.div
                variants={staggerItem}
                className="mt-10 rounded-2xl p-7 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(30,58,138,0.05), rgba(124,58,237,0.05))",
                  border: "1.5px solid rgba(30,58,138,0.10)",
                }}
              >
                <Shield size={24} strokeWidth={1.75} className="mx-auto mb-3" style={{ color: "#1E3A8A" }} />
                <h3
                  className="mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.125rem",
                    color: "#0F1B4C",
                  }}
                >
                  Still have questions?
                </h3>
                <p
                  className="mb-5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    color: "#64748B",
                    lineHeight: 1.6,
                  }}
                >
                  Our legal experts are happy to help. WhatsApp us for a free consultation.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={WA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: "#25D366",
                      color: "white",
                      textDecoration: "none",
                      boxShadow: "0 4px 16px rgba(37,211,102,0.30)",
                    }}
                  >
                    <MessageCircle size={15} strokeWidth={2} />
                    WhatsApp Us
                  </a>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: "white",
                      color: "#1E3A8A",
                      textDecoration: "none",
                      border: "1.5px solid rgba(30,58,138,0.20)",
                    }}
                  >
                    Contact Form
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Quick Links ───────────────────────────────── */}
        <section className="py-12" style={{ background: "#F8FAFC", borderTop: "1px solid rgba(15,27,76,0.06)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p
              className="text-center mb-6"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "#94A3B8",
                textTransform: "uppercase",
              }}
            >
              Quick Links
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {QUICK_LINKS.map(({ icon: Icon, label, href }) => (
                <Link
                  key={href}
                  to={href}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: "white",
                    color: "#334155",
                    textDecoration: "none",
                    border: "1.5px solid rgba(15,27,76,0.09)",
                    boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
                  }}
                >
                  <Icon size={14} strokeWidth={2} style={{ color: "#1E3A8A" }} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
