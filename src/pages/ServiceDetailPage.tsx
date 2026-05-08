import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ChevronRight,
  CheckCircle2,
  ChevronDown,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { SERVICES_LIST, getServiceBySlug } from "@/lib/services";
import { ServiceIcon } from "@/lib/serviceIcons";
import { fadeInUp, staggerContainer, staggerItem, useIsMobile, heightCollapse } from "@/lib/motion";

const PROCESS_STEPS = [
  { title: "Choose & Pay",      desc: "Select this service and pay securely via Razorpay — full amount or 50% advance." },
  { title: "WhatsApp Connect",  desc: "Our team contacts you within 2 hours to confirm and guide the next step." },
  { title: "Submit Documents",  desc: "Share required documents via WhatsApp or the secure upload portal." },
  { title: "We File & Track",   desc: "Our legal experts prepare and file your application with the relevant authority." },
  { title: "Certificate",       desc: "Receive your official certificate or confirmation once approved." },
];

const FAQS = [
  {
    question: "How long does the process take?",
    answer: "Timeline depends on the service. We provide an estimated processing time at the time of onboarding and keep you updated at every step.",
  },
  {
    question: "Are government fees included in the price?",
    answer: "Yes — all KlawTax prices are all-inclusive. There are no hidden government fee charges unless otherwise specified.",
  },
  {
    question: "Can I pay in instalments?",
    answer: "Yes. You can pay 50% in advance to get started, and the remaining balance is due before delivery of the final certificate.",
  },
  {
    question: "What happens after I pay?",
    answer: "You'll receive an automated payment confirmation, followed by a WhatsApp message from your dedicated manager within 2 hours.",
  },
  {
    question: "Do you provide support after registration?",
    answer: "Yes. We offer post-registration compliance guidance and are available on WhatsApp for queries even after your service is delivered.",
  },
];

export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || "");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const isMobile = useIsMobile();

  const related = SERVICES_LIST.filter(
    (s) => s.category === service?.category && s.id !== service?.id
  ).slice(0, 3);

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-40 text-center container mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <ServiceIcon name="FileText" size={28} className="text-muted-foreground" />
          </div>
          <h1 className="page-title text-foreground mb-3">Service Not Found</h1>
          <p className="text-muted-foreground mb-6">This service doesn't exist or may have moved.</p>
          <Link to="/services" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            <ChevronRight size={16} className="rotate-180" />
            Back to Services
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${service.name} | KlawTax`}
        description={`${service.name} — ${service.description ?? "Professional legal service with transparent pricing and expert support."}`}
        keywords={`${service.name}, legal services India, NGO registration, compliance, KlawTax`}
        canonical={`/services/${service.slug}`}
      />
      <Navbar />

      {/* ── Service Hero ──────────────────────────────────── */}
      <section className="pt-28 pb-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/services" className="hover:text-white transition-colors">Services</Link>
            <ChevronRight size={12} />
            <span className="text-white/80">{service.title}</span>
          </nav>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                <ServiceIcon name={service.icon} size={26} className="text-white" strokeWidth={1.6} />
              </div>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium capitalize">
                {service.category}
              </span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight tracking-tight">
              {service.title}
            </h1>
            <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl">
              {service.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ── Left column ───────────────────────────────── */}
          <div className="flex-1 lg:max-w-[62%] space-y-14">

            {/* Features */}
            <motion.section
              variants={isMobile ? fadeInUp : staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">
                What's Included
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {service.features.map((f) => (
                  <motion.div
                    key={f}
                    variants={isMobile ? fadeInUp : staggerItem}
                    className="flex items-start gap-3 p-4 rounded-xl bg-muted border border-border/50"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-success mt-0.5 flex-shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="text-sm text-foreground leading-snug">{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Process steps */}
            <section>
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">
                How It Works
              </h2>
              <div className="space-y-0">
                {PROCESS_STEPS.map((step, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-4 group"
                  >
                    {/* Timeline spine */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                        {i + 1}
                      </div>
                      {i < PROCESS_STEPS.length - 1 && (
                        <div className="w-px flex-1 bg-border my-1" />
                      )}
                    </div>
                    <div className={`pb-6 ${i < PROCESS_STEPS.length - 1 ? "" : ""}`}>
                      <h3 className="font-heading font-semibold text-sm text-foreground mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section>
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm text-foreground pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <motion.div
                        variants={heightCollapse}
                        initial="hidden"
                        animate="visible"
                        className="px-5 pb-4"
                        style={{ transformOrigin: "top" }}
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Related services */}
            {related.length > 0 && (
              <section>
                <h2 className="font-heading font-bold text-xl text-foreground mb-6">
                  Related Services
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {related.map((r) => (
                    <Link
                      key={r.id}
                      to={`/services/${r.slug}`}
                      className="group p-5 rounded-xl border border-border hover-lift text-center bg-card"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-primary-600">
                        <ServiceIcon name={r.icon} size={18} strokeWidth={1.75} />
                      </div>
                      <h3 className="font-heading font-semibold text-xs text-foreground mb-2 leading-snug">
                        {r.title}
                      </h3>
                      <span className="font-mono text-sm font-bold text-primary">{r.price}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right sidebar ──────────────────────────────── */}
          <div className="lg:w-[36%]">
            <div className="lg:sticky lg:top-28">
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="premium-card p-6 md:p-8"
              >
                {/* Price */}
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">
                    Service Fee
                  </p>
                  <div className="font-mono font-bold text-4xl text-primary tracking-tight mb-1">
                    {service.price}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All-inclusive · No hidden charges
                  </p>
                </div>

                {/* Payment options */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-muted border border-border text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pay Full</p>
                    <p className="font-mono font-semibold text-sm text-foreground">{service.price}</p>
                  </div>
                  {service.advancePrice ? (
                    <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
                      <p className="text-xs text-primary-600 mb-1">50% Advance</p>
                      <p className="font-mono font-semibold text-sm text-primary">{service.advancePrice}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-center">
                      <p className="text-xs text-primary-600 mb-1">50% Advance</p>
                      <p className="text-xs text-primary font-medium">Available</p>
                    </div>
                  )}
                </div>

                {/* CTAs */}
                <Link
                  to="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-4 btn-premium text-base mb-3 rounded-xl"
                >
                  Get Started
                  <ArrowRight size={17} />
                </Link>
                <a
                  href={`https://wa.me/919999999999?text=I'm interested in ${encodeURIComponent(service.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                >
                  <MessageCircle size={16} />
                  WhatsApp Us
                </a>

                {/* Trust bullets */}
                <ul className="mt-6 space-y-2.5">
                  {[
                    { icon: "CheckCircle2", label: "No hidden charges" },
                    { icon: "Shield",       label: "Govt fees included" },
                    { icon: "Users",        label: "Dedicated manager assigned" },
                    { icon: "Clock",        label: "Updates at every step" },
                  ].map((t) => (
                    <li key={t.label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <ServiceIcon name={t.icon} size={14} className="text-success flex-shrink-0" />
                      {t.label}
                    </li>
                  ))}
                </ul>

                {/* Package upsell */}
                <div className="mt-6 p-4 rounded-xl bg-accent-100 border border-accent-300/40">
                  <p className="text-xs font-semibold text-accent-600 mb-1">Save more with our bundle</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Get Section 8 + 12A + 80G + DARPAN + more for just
                    <span className="font-mono font-bold text-accent-600"> ₹13,500</span>
                  </p>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-1 text-xs font-semibold text-accent-600 hover:underline"
                  >
                    View Complete Package
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <StickyMobileBar />
    </div>
  );
}
