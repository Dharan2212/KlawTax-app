import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, MessageCircle, Zap, ShieldCheck, Clock } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { pricingPlans, featuredPackage, comparisonData } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";

export default function PricingPage() {
  const [tab, setTab] = useState<"ngo" | "business">("ngo");

  const filtered = pricingPlans.filter((p) =>
    tab === "ngo"
      ? p.category === "ngo" || p.category === "compliance"
      : p.category === "business"
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="KlawTax Pricing | Transparent Legal & NGO Service Packages"
        description="Clear pricing for NGO registration, business compliance, audits, and digital service packages. No hidden fees — all government fees included."
        keywords="pricing, transparent pricing, NGO package, business package, compliance package, legal services India"
        canonical="/pricing"
        jsonLd={JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Are government fees included in KlawTax pricing?", acceptedAnswer: { "@type": "Answer", text: "Yes — all KlawTax prices are all-inclusive. Government registration and filing fees are covered unless explicitly noted." } },
            { "@type": "Question", name: "Can I pay in instalments?", acceptedAnswer: { "@type": "Answer", text: "Yes. Pay 50% now to get started, and the remaining balance is due before your final certificate is delivered." } },
            { "@type": "Question", name: "What payment methods does KlawTax accept?", acceptedAnswer: { "@type": "Answer", text: "UPI, net banking, credit/debit cards, and wallets via Razorpay — India's most trusted payment gateway." } },
            { "@type": "Question", name: "How much does NGO registration cost?", acceptedAnswer: { "@type": "Answer", text: "Section 8 NGO registration starts from ₹8,000. The complete NGO package including 12A, 80G, DARPAN, and E-Anudan is ₹13,500 all-inclusive." } },
          ],
        })}
      />
      <Navbar />

      {/* ── Page hero ─────────────────────────────────────── */}
      <section className="pt-28 pb-14" style={{ background: "var(--gradient-mesh-light)" }}>
        <div className="container mx-auto px-4 text-center">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-2xl mx-auto">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
              style={{
                background: "hsl(var(--color-primary-100))",
                color: "hsl(var(--color-primary-700))",
                border: "1px solid hsl(var(--color-primary-100))",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <Zap size={12} strokeWidth={2.5} />
              Transparent, All-Inclusive Pricing
            </span>
            <h1
              className="font-bold mb-4 leading-tight"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "clamp(1.875rem, 4vw, 3rem)",
                color: "hsl(var(--color-neutral-900))",
                letterSpacing: "-0.02em",
              }}
            >
              Simple,{" "}
              <span className="gradient-text">Transparent Pricing</span>
            </h1>
            <p
              className="mb-8 max-w-lg mx-auto"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.125rem",
                lineHeight: 1.7,
                color: "hsl(var(--color-neutral-500))",
              }}
            >
              No hidden charges. Government fees included. Pay in full or 50% advance.
            </p>

            {/* Tab switcher */}
            <div
              className="inline-flex rounded-full p-1"
              style={{
                background: "hsl(var(--color-neutral-100))",
                border: "1px solid hsl(var(--color-neutral-300))",
              }}
            >
              {(["ngo", "business"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: tab === t ? "hsl(var(--color-primary-700))" : "transparent",
                    color: tab === t ? "white" : "hsl(var(--color-neutral-500))",
                    boxShadow: tab === t ? "0 1px 6px rgba(15,27,76,0.20)" : "none",
                  }}
                >
                  {t === "ngo" ? "NGO Services" : "Business Services"}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured package ──────────────────────────────── */}
      <section className="py-14" style={{ background: "var(--gradient-cta-banner)" }}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(15,27,76,0.40), inset 0 1px 0 rgba(255,255,255,0.10)",
              }}
            >
              {/* Top gold stripe */}
              <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--color-accent-400)), hsl(var(--color-accent-600)))" }}
              />

              <div className="p-8 md:p-10">
                {/* Badge + title */}
                <div className="text-center mb-7">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide mb-4"
                    style={{
                      background: "rgba(245,158,11,0.15)",
                      color: "hsl(var(--color-accent-300))",
                      border: "1px solid rgba(245,158,11,0.28)",
                      fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Zap size={11} strokeWidth={2.5} />
                    BEST VALUE PACKAGE
                  </span>
                  <h2
                    className="font-bold text-white mb-2"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      lineHeight: 1.25,
                    }}
                  >
                    {featuredPackage.name}
                  </h2>
                  <p
                    className="max-w-md mx-auto leading-relaxed"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.9375rem",
                      color: "rgba(255,255,255,0.58)",
                    }}
                  >
                    {featuredPackage.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "clamp(2.25rem, 5vw, 3rem)",
                        lineHeight: 1,
                        color: "hsl(var(--color-accent-300))",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatCurrency(featuredPackage.price)}
                    </span>
                    <span
                      className="line-through"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "1.1rem",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {formatCurrency(featuredPackage.originalPrice)}
                    </span>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      color: "hsl(var(--color-success-500))",
                      border: "1px solid rgba(34,197,94,0.25)",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <CheckCircle2 size={12} strokeWidth={2.5} />
                    You save {formatCurrency(featuredPackage.savings)}
                  </span>
                </div>

                <div className="mb-7" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />

                {/* Features chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7">
                  {featuredPackage.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <CheckCircle2
                        size={12}
                        strokeWidth={2.5}
                        className="flex-shrink-0"
                        style={{ color: "hsl(var(--color-accent-400))" }}
                      />
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.80)",
                          lineHeight: 1.3,
                        }}
                      >
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
                  <Link
                    to="/checkout"
                    className="btn-premium flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Get This Package
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                  <a
                    href="https://wa.me/919999999999?text=Hi%20KlawTax!%20I%27m%20interested%20in%20the%20Complete%20NGO%20Package"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "rgba(255,255,255,0.68)",
                      border: "1px solid rgba(255,255,255,0.20)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.92)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.68)";
                    }}
                  >
                    <MessageCircle size={15} strokeWidth={2} />
                    Discuss on WhatsApp
                  </a>
                </div>

                {/* Trust microcopy */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-5">
                  {[
                    { icon: ShieldCheck, text: "Razorpay secured" },
                    { icon: CheckCircle2, text: "All govt. fees included" },
                    { icon: Clock,        text: "48hr start guarantee" },
                  ].map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: "rgba(255,255,255,0.28)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      <Icon size={11} strokeWidth={2} />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Individual plans grid ────────────────────────── */}
      <SectionWrapper>
        <div className="text-center mb-10">
          <h2
            className="font-bold mb-3"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              color: "hsl(var(--color-neutral-900))",
              letterSpacing: "-0.015em",
            }}
          >
            Individual Services
          </h2>
          <p
            className="max-w-xl mx-auto"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "hsl(var(--color-neutral-500))",
              lineHeight: 1.65,
            }}
          >
            Pick exactly what you need, or bundle multiple services for extra savings.
          </p>
        </div>

        <motion.div
          key={tab}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
        >
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              variants={staggerItem}
              className="relative flex flex-col rounded-xl transition-all duration-300"
              style={{
                padding: "24px",
                background: p.popular ? "hsl(var(--color-primary-50))" : "white",
                border: p.popular
                  ? "1.5px solid hsl(var(--color-primary-600) / 0.30)"
                  : "1px solid hsl(var(--color-neutral-300))",
                boxShadow: p.popular
                  ? "0 0 0 3px hsl(var(--color-primary-100)), 0 6px 20px rgba(15,27,76,0.08)"
                  : "0 2px 8px rgba(15,27,76,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = p.popular
                  ? "0 0 0 3px hsl(var(--color-primary-100)), 0 12px 32px rgba(15,27,76,0.12)"
                  : "0 8px 24px rgba(15,27,76,0.09)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = p.popular
                  ? "0 0 0 3px hsl(var(--color-primary-100)), 0 6px 20px rgba(15,27,76,0.08)"
                  : "0 2px 8px rgba(15,27,76,0.05)";
              }}
            >
              {/* Popular badge */}
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: "hsl(var(--color-primary-700))",
                      color: "white",
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: "0 2px 8px rgba(15,27,76,0.28)",
                    }}
                  >
                    <Zap size={10} strokeWidth={2.5} />
                    Most Popular
                  </span>
                </div>
              )}

              {/* Name + price */}
              <div className="mb-4">
                <h3
                  className="font-semibold mb-3 leading-snug"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "1rem",
                    color: "hsl(var(--color-neutral-900))",
                  }}
                >
                  {p.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      fontSize: "1.625rem",
                      letterSpacing: "-0.02em",
                      color: p.popular
                        ? "hsl(var(--color-primary-700))"
                        : "hsl(var(--color-neutral-900))",
                    }}
                  >
                    {formatCurrency(p.price)}
                  </span>
                  {p.originalPrice && (
                    <span
                      className="line-through"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "0.875rem",
                        color: "hsl(var(--color-neutral-500))",
                      }}
                    >
                      {formatCurrency(p.originalPrice)}
                    </span>
                  )}
                </div>
                {p.originalPrice && (
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "hsl(var(--color-success-700))",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Save {formatCurrency(p.originalPrice - p.price)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div
                className="mb-4"
                style={{ height: "1px", background: "hsl(var(--color-neutral-300))" }}
              />

              {/* Features */}
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.875rem",
                      color: "hsl(var(--color-neutral-700))",
                    }}
                  >
                    <CheckCircle2
                      size={13}
                      strokeWidth={2.5}
                      className="flex-shrink-0"
                      style={{ color: "hsl(var(--color-success-500))" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/checkout"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: p.popular ? "hsl(var(--color-primary-700))" : "transparent",
                  color: p.popular ? "white" : "hsl(var(--color-neutral-900))",
                  border: p.popular ? "none" : "1.5px solid hsl(var(--color-neutral-300))",
                }}
                onMouseEnter={(e) => {
                  if (p.popular) {
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--color-primary-800))";
                  } else {
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--color-neutral-100))";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-neutral-500))";
                  }
                }}
                onMouseLeave={(e) => {
                  if (p.popular) {
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--color-primary-700))";
                  } else {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-neutral-300))";
                  }
                }}
              >
                Get Started
                <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </SectionWrapper>

      {/* ── Comparison table ──────────────────────────────── */}
      <SectionWrapper background="muted">
        <div className="text-center mb-10">
          <h2
            className="font-bold mb-3"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              color: "hsl(var(--color-neutral-900))",
              letterSpacing: "-0.015em",
            }}
          >
            Compare Plans
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--color-neutral-500))" }}>
            See exactly what's included in each option.
          </p>
        </div>

        <div
          className="max-w-3xl mx-auto overflow-x-auto rounded-2xl"
          style={{
            border: "1px solid hsl(var(--color-neutral-300))",
            background: "white",
            boxShadow: "0 4px 16px rgba(15,27,76,0.06)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(var(--color-neutral-300))", background: "hsl(var(--color-neutral-100))" }}>
                <th
                  className="text-left py-4 px-5 font-medium"
                  style={{ color: "hsl(var(--color-neutral-500))", fontFamily: "'DM Sans', sans-serif" }}
                >
                  Feature
                </th>
                {comparisonData.plans.map((p) => (
                  <th
                    key={p.name}
                    className="text-center py-4 px-5 font-semibold"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      color: p.name === "Complete Package"
                        ? "hsl(var(--color-primary-700))"
                        : "hsl(var(--color-neutral-900))",
                    }}
                  >
                    {p.name}
                    <br />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {formatCurrency(p.price)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.features.map((f, i) => (
                <tr
                  key={f}
                  style={{
                    borderBottom: i < comparisonData.features.length - 1
                      ? "1px solid hsl(var(--color-neutral-100))"
                      : "none",
                  }}
                >
                  <td
                    className="py-3.5 px-5"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--color-neutral-900))" }}
                  >
                    {f}
                  </td>
                  {comparisonData.plans.map((p) => (
                    <td key={p.name} className="text-center py-3.5 px-5">
                      {p.availability[i] ? (
                        <CheckCircle2 size={17} strokeWidth={2.5} className="mx-auto" style={{ color: "hsl(var(--color-success-500))" }} />
                      ) : (
                        <XCircle size={17} strokeWidth={1.5} className="mx-auto" style={{ color: "hsl(var(--color-neutral-300))" }} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/checkout"
            className="btn-premium inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Get Complete Package
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </SectionWrapper>

      {/* ── Pricing FAQs ──────────────────────────────────── */}
      <SectionWrapper>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2
              className="font-bold mb-3"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                color: "hsl(var(--color-neutral-900))",
                letterSpacing: "-0.015em",
              }}
            >
              Pricing FAQs
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(var(--color-neutral-500))" }}>
              Everything you need to know about our fees and process.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Are government fees included?",
                a: "Yes — all KlawTax prices are all-inclusive. Government registration and filing fees are covered unless explicitly noted.",
              },
              {
                q: "Can I pay in instalments?",
                a: "Absolutely. Pay 50% now to get started, and the remaining balance is due before your final certificate is delivered.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept UPI, net banking, credit/debit cards, and wallets via Razorpay — India's most trusted payment gateway.",
              },
              {
                q: "Is there a refund policy?",
                a: "Yes. If we are unable to deliver your service due to reasons within our control, we offer a full refund.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="p-5 rounded-xl"
                style={{
                  background: "white",
                  border: "1px solid hsl(var(--color-neutral-300))",
                  boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
                }}
              >
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "0.9375rem",
                    color: "hsl(var(--color-neutral-900))",
                  }}
                >
                  {faq.q}
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9rem",
                    color: "hsl(var(--color-neutral-500))",
                    lineHeight: 1.65,
                  }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* WhatsApp help */}
          <div
            className="mt-10 p-6 rounded-2xl text-center"
            style={{
              background: "hsl(var(--color-neutral-100))",
              border: "1px solid hsl(var(--color-neutral-300))",
            }}
          >
            <p
              className="mb-4"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                color: "hsl(var(--color-neutral-700))",
              }}
            >
              Still have questions? Our team is available Mon–Sat, 9 AM–7 PM.
            </p>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-all duration-200"
              style={{
                background: "#22C55E",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 14px rgba(34,197,94,0.30)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#16A34A";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#22C55E";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <MessageCircle size={15} strokeWidth={2} />
              Chat with Us on WhatsApp
            </a>
          </div>
        </div>
      </SectionWrapper>

      <Footer />
      <StickyMobileBar />
    </div>
  );

}
