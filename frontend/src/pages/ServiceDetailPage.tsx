import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle2, ChevronDown, ChevronRight,
  MessageCircle, ShieldCheck, Clock, ArrowLeft, Users, Send,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { buildServiceSchema, buildBreadcrumbSchema } from "@/lib/seo";
import { getServiceBySlug, getRelatedServices, SERVICES_LIST } from "@/lib/services";
import { getServiceIcon, CATEGORY_ICON_STYLE } from "@/lib/serviceIcons";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import InquiryForm from "@/components/features/InquiryForm";

const CAT_META: Record<string, { label: string; color: string; bg: string }> = {
  ngo:        { label: "NGO Services",        color: "#1E3A8A", bg: "#DBEAFE" },
  compliance: { label: "Compliance & Tax",    color: "#15803D", bg: "#DCFCE7" },
  business:   { label: "Business & Licenses", color: "#4C1D95", bg: "#EDE9FE" },
  reports:    { label: "Reports & Content",   color: "#0F766E", bg: "#CCFBF1" },
  digital:    { label: "Digital Services",    color: "#B45309", bg: "#FEF3C7" },
  audit:      { label: "Audits & Reports",    color: "#15803D", bg: "#DCFCE7" },
};

const WA_BASE = "https://wa.me/917387731313?text=";

function AccordionItem({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full py-4 text-left">
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0F1B4C", fontSize: "0.9375rem" }}>{title}</span>
        <ChevronDown size={16} strokeWidth={2.5} style={{ color: "#94A3B8", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug ?? "");
  const [showInquiry, setShowInquiry] = useState(false);

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#0F1B4C" }}>Service Not Found</h1>
          <Link to="/services" style={{ color: "#1E3A8A", fontFamily: "'DM Sans', sans-serif", marginTop: "12px", display: "block" }}>← Back to Services</Link>
        </div>
      </div>
    );
  }

  const Icon = getServiceIcon(service.icon || service.slug);
  const iconStyle = CATEGORY_ICON_STYLE[service.category] ?? CATEGORY_ICON_STYLE["ngo"];
  const cat = CAT_META[service.category];
  const waLink = WA_BASE + encodeURIComponent(`Hi KlawTax! I'm interested in ${service.title}.`);
  const related = getRelatedServices(service.slug, 3);

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="min-h-screen flex flex-col">
      <SEO
        title={`${service.title} | KlawTax`}
        description={service.description}
        keywords={`${service.title}, ${cat?.label}, ${service.title} India, ${service.title} online, ${service.title} fee, ${cat?.label} India, legal services India, KlawTax`}
        canonical={`/services/${service.slug}`}
        ogType="product"
        schema={[
          buildServiceSchema({
            name: service.title,
            description: service.description,
            slug: service.slug,
            price: service.price,
            priceNumeric: service.priceNumeric,
            category: cat?.label ?? service.category,
          }),
          buildBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Services", url: "/services" },
            { name: service.title },
          ]),
        ]}
      />
      <Navbar />
      <main role="main" className="flex-1 pt-20">

        {/* Breadcrumb */}
        <div style={{ background: "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "#94A3B8" }}>
            <Link to="/" style={{ color: "#94A3B8", textDecoration: "none" }}>Home</Link>
            <ChevronRight size={12} />
            <Link to="/services" style={{ color: "#94A3B8", textDecoration: "none" }}>Services</Link>
            <ChevronRight size={12} />
            <span style={{ color: "#0F1B4C", fontWeight: 500 }}>{service.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">

            {/* LEFT content */}
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem} className="mb-8">
                <Link to="/services" className="inline-flex items-center gap-1.5 mb-5 text-sm" style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B", textDecoration: "none" }}>
                  <ArrowLeft size={14} strokeWidth={2.5} /> All Services
                </Link>

                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0" style={{ background: iconStyle.bg, border: `1px solid ${iconStyle.border}` }}>
                    <Icon size={26} strokeWidth={1.75} style={{ color: iconStyle.icon }} />
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: cat?.bg, color: cat?.color, fontFamily: "'DM Sans', sans-serif" }}>{cat?.label}</span>
                      {(service as any).subcategory && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "#F1F5F9", color: "#475569", fontFamily: "'DM Sans', sans-serif" }}>{(service as any).subcategory}</span>
                      )}
                      {service.processingTime && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "#F1F5F9", color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>
                          <Clock size={10} strokeWidth={2.5} /> {service.processingTime}
                        </span>
                      )}
                      {service.featured && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "linear-gradient(90deg,#D97706,#F59E0B)", color: "#0F172A", fontFamily: "'DM Sans', sans-serif" }}>★ POPULAR</span>}
                      {(service as any).badge && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626", fontFamily: "'DM Sans', sans-serif" }}>{(service as any).badge}</span>}
                    </div>
                    <h1 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", color: "#0F1B4C", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                      {service.title}
                    </h1>
                  </div>
                </div>

                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B", lineHeight: 1.7 }}>{service.description}</p>
              </motion.div>

              {/* What's Included */}
              {service.features?.length > 0 && (
                <motion.div variants={staggerItem} className="mb-8">
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0F1B4C", marginBottom: "16px" }}>What's Included</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {service.features.map((feat: string) => (
                      <div key={feat} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.15)" }}>
                          <CheckCircle2 size={12} strokeWidth={2.5} style={{ color: "#22C55E" }} />
                        </div>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#334155" }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* How It Works */}
              <motion.div variants={staggerItem} className="mb-8">
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0F1B4C", marginBottom: "16px" }}>How It Works</h2>
                {["Select & Pay", "Submit Documents via WhatsApp", "Expert Team Processes Filing", "Certificate Delivered"].map((step, i, arr) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: i === arr.length - 1 ? "linear-gradient(135deg,#1E3A8A,#7C3AED)" : "#EFF6FF", color: i === arr.length - 1 ? "white" : "#1E3A8A", fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</div>
                      {i < arr.length - 1 && <div className="w-px h-6 mt-1" style={{ background: "#E2E8F0" }} />}
                    </div>
                    <div className="pt-1 pb-5">
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0F1B4C", fontSize: "0.9375rem" }}>{step}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Related Services */}
              {related.length > 0 && (
                <motion.div variants={staggerItem}>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0F1B4C", marginBottom: "16px" }}>
                    <Users size={18} className="inline mr-2" style={{ color: "#7C3AED" }} />
                    Customers Also Get
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {related.map((rel: any) => {
                      const RelIcon = getServiceIcon(rel.icon || rel.slug);
                      const relStyle = CATEGORY_ICON_STYLE[rel.category] ?? CATEGORY_ICON_STYLE["ngo"];
                      return (
                        <Link key={rel.id} to={`/services/${rel.slug}`} style={{ textDecoration: "none" }}>
                          <div className="p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1" style={{ border: "1px solid #E2E8F0", background: "white" }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#BFDBFE")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                          >
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: relStyle.bg }}>
                              <RelIcon size={18} strokeWidth={1.75} style={{ color: relStyle.icon }} />
                            </div>
                            <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0F1B4C" }}>{rel.title}</p>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8125rem", color: "#D97706", marginTop: "4px" }}>{rel.price}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* RIGHT sticky sidebar */}
            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid #E2E8F0", boxShadow: "0 8px 32px rgba(15,27,76,0.10)" }}>
                <div className="p-6" style={{ background: "linear-gradient(135deg,#0F1B4C,#1A2D6B)" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                    {service.priceSuffix ? "Starting Price" : "All-Inclusive Price"}
                  </p>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.25rem", fontWeight: 700, color: "#F59E0B", lineHeight: 1 }}>
                    {service.price}
                    {service.priceSuffix && <span style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(245,158,11,0.65)", marginLeft: "4px" }}>{service.priceSuffix}</span>}
                  </div>
                  {service.processingTime && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
                      ⏱ {service.processingTime}
                    </p>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-col gap-2.5 mb-5">
                    <Link to={`/checkout?service=${service.slug}`} className="flex items-center justify-center gap-2 w-full rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, padding: "13px 0", background: "linear-gradient(90deg,#D97706,#F59E0B)", color: "#0F172A", boxShadow: "0 4px 20px rgba(217,119,6,0.35)", textDecoration: "none" }}>
                      {service.priceSuffix ? "Get a Quote" : `Pay ${service.price} — Start Now`} <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                    {!service.priceSuffix && (
                      <Link to={`/checkout?service=${service.slug}&advance=true`} className="flex items-center justify-center w-full rounded-xl font-medium text-sm transition-colors"
                        style={{ fontFamily: "'DM Sans', sans-serif", padding: "12px 0", border: "1.5px solid #E2E8F0", color: "#64748B", textDecoration: "none", background: "white" }}
                        onMouseEnter={(e) => { (e.currentTarget.style.borderColor = "#BFDBFE"); (e.currentTarget.style.color = "#1E3A8A"); }}
                        onMouseLeave={(e) => { (e.currentTarget.style.borderColor = "#E2E8F0"); (e.currentTarget.style.color = "#64748B"); }}>
                        Pay 50% Advance Only
                      </Link>
                    )}
                  </div>

                  {service.category === "ngo" && service.slug !== "section8-complete" && (
                    <div className="p-4 rounded-xl mb-5" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "#92400E", fontWeight: 500, marginBottom: "8px" }}>
                        💡 Need {service.title} + 6 more services?
                      </p>
                      <Link to="/checkout?service=section8-complete" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 700, color: "#B45309", textDecoration: "none" }}>
                        Get Complete Package ₹13,500 →
                      </Link>
                    </div>
                  )}

                  <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 mb-5"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: "12px 0", background: "rgba(37,211,102,0.10)", color: "#15803D", border: "1.5px solid rgba(37,211,102,0.25)", textDecoration: "none" }}>
                    <MessageCircle size={15} strokeWidth={2} /> Chat on WhatsApp
                  </a>

                  {/* ── Inline Inquiry Form toggle ── */}
                  <button
                    onClick={() => setShowInquiry(!showInquiry)}
                    className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-sm transition-all mb-4"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      padding: "11px 0",
                      background: "transparent",
                      color: "#1E3A8A",
                      border: "1.5px solid rgba(30,58,138,0.20)",
                      cursor: "pointer",
                    }}
                  >
                    <Send size={13} strokeWidth={2.5} />
                    {showInquiry ? "Hide Inquiry Form" : "Send an Inquiry"}
                    <ChevronDown
                      size={13}
                      strokeWidth={2.5}
                      style={{
                        transform: showInquiry ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                        marginLeft: "auto",
                      }}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {showInquiry && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: "hidden" }}
                        className="mb-4"
                      >
                        <div
                          className="p-4 rounded-xl"
                          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                        >
                          <InquiryForm
                            serviceTitle={service.title}
                            serviceSlug={service.slug}
                            heading=""
                            subheading="We'll call you back within 2 hours."
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-col gap-2">
                    {[
                      { icon: ShieldCheck, text: "Secure payment via Razorpay" },
                      { icon: CheckCircle2, text: "All govt. fees included" },
                    ].map(({ icon: Ic, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Ic size={13} strokeWidth={2.5} style={{ color: "#22C55E", flexShrink: 0 }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#64748B" }}>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
