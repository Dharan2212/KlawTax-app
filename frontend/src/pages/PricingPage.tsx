import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, X, Zap, ArrowRight, MessageCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import { pricingPageSchema } from "@/lib/seo";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { allPriceItems, pricingPlans, featuredPackage } from "@/lib/pricing";
import { COMPLETE_PACKAGE } from "@/lib/services";

const WA = "https://wa.me/917387731313?text=" + encodeURIComponent("Hi KlawTax! I'd like to know about pricing.");
const CATS = ["All", "NGO", "Compliance", "Business", "Reports", "Digital"] as const;
type Cat = typeof CATS[number];

export default function PricingPage() {
  const [tab, setTab] = useState<Cat>("All");
  const filtered = tab === "All" ? allPriceItems : allPriceItems.filter(p => p.category === tab);

  return (
    <motion.div {...pageTransition} className="min-h-screen flex flex-col">
      <SEO
        title="Service Pricing | KlawTax Legal & NGO Services"
        description={`Flat-fee pricing for all NGO, legal, and compliance services. Section 8 complete NGO package ₹${COMPLETE_PACKAGE.price.toLocaleString("en-IN")}. 12A & 80G from ₹1,500. No hidden charges. All government fees included.`}
        keywords="NGO registration price India, Section 8 company cost, 12A registration fee, 80G registration fee, GST registration price, legal services fee India, KlawTax pricing"
        canonical="/pricing"
        schema={pricingPageSchema}
      />
      <Navbar />
      <main id="main-content" role="main" className="flex-1 pt-20">

        {/* Hero */}
        <section className="py-16 md:py-20" style={{ background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.h1 variants={staggerItem} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", color: "white", letterSpacing: "-0.025em", lineHeight: 1.1 }} className="mb-4">
                Simple, Transparent Pricing
              </motion.h1>
              <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "rgba(255,255,255,0.60)", lineHeight: 1.7 }}>
                No hidden fees. No surprises. All government charges included.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* Featured Package Banner */}
          <motion.div
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="rounded-2xl overflow-hidden mb-16"
            style={{ background: "linear-gradient(135deg, #0F1B4C, #1E3A8A, #4C1D95)", border: "1.5px solid rgba(245,158,11,0.30)", boxShadow: "0 20px 60px rgba(15,27,76,0.35)" }}
          >
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B, #FCD34D)" }} />
            <div className="p-8 md:p-10">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} strokeWidth={2.5} style={{ color: "#F59E0B" }} fill="#F59E0B" />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.75rem", color: "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase" }}>Recommended Package</span>
                  </div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 3vw, 2rem)", color: "white", letterSpacing: "-0.02em" }} className="mb-2">{featuredPackage.name}</h2>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }} className="mb-5">{featuredPackage.description}</p>
                  <div className="grid sm:grid-cols-2 gap-y-2 gap-x-6">
                    {featuredPackage.features.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 size={13} strokeWidth={2.5} style={{ color: "#22C55E", flexShrink: 0 }} />
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "rgba(255,255,255,0.80)" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>All-inclusive</p>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "2.75rem", fontWeight: 700, color: "#F59E0B", lineHeight: 1 }}>₹{featuredPackage.price.toLocaleString("en-IN")}</div>
                  <div className="flex items-center gap-2 justify-end mt-1 mb-5">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.875rem", color: "rgba(255,255,255,0.30)", textDecoration: "line-through" }}>₹{featuredPackage.originalPrice.toLocaleString("en-IN")}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#22C55E", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: "9999px" }}>Save ₹{featuredPackage.savings.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to="/checkout?service=section8-complete" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(217,119,6,0.40)" }}>
                      Get This Package <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                    <Link to="/checkout?service=section8-complete&advance=true" className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all" style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.60)", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                      Pay ₹{COMPLETE_PACKAGE.advancePrice.toLocaleString("en-IN")} Advance Only
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Individual pricing cards */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0F1B4C" }}>All Services & Pricing</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {CATS.map(c => (
                  <button key={c} onClick={() => setTab(c)} className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200" style={{ fontFamily: "'DM Sans', sans-serif", background: tab === c ? "#1E3A8A" : "#F1F5F9", color: tab === c ? "white" : "#64748B", boxShadow: tab === c ? "0 4px 12px rgba(30,58,138,0.25)" : "none" }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto -mx-0 rounded-2xl table-responsive" style={{ border: "1px solid #E2E8F0" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th className="text-left px-6 py-3.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Service</th>
                    <th className="text-left px-6 py-3.5 hidden sm:table-cell" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</th>
                    <th className="text-right px-6 py-3.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Price</th>
                    <th className="px-6 py-3.5 hidden md:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => (
                    <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F1F5F9" : "none", background: item.highlight ? "rgba(245,158,11,0.04)" : "white" }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.highlight && <Zap size={12} strokeWidth={2.5} style={{ color: "#F59E0B", flexShrink: 0 }} fill="#F59E0B" />}
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: item.highlight ? 700 : 500, fontSize: "0.9375rem", color: item.highlight ? "#0F1B4C" : "#334155" }}>{item.service}</span>
                          {item.highlight && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", fontWeight: 700, background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", padding: "2px 8px", borderRadius: "9999px" }}>BEST VALUE</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, background: "#F1F5F9", color: "#64748B", padding: "2px 8px", borderRadius: "9999px" }}>{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1rem", fontWeight: 600, color: item.highlight ? "#D97706" : "#0F1B4C" }}>{item.price}</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden md:table-cell">
                        <Link to={item.href} className="inline-flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-0.5" style={{ fontFamily: "'DM Sans', sans-serif", background: item.highlight ? "linear-gradient(90deg, #D97706, #F59E0B)" : "#EFF6FF", color: item.highlight ? "#0F172A" : "#1E3A8A", textDecoration: "none" }}>
                          {item.highlight ? "Get Package" : "Get Started"} <ArrowRight size={10} strokeWidth={2.5} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-16">
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0F1B4C" }} className="mb-8 text-center">
              Section 8 Standalone vs. Complete Package
            </h2>
            <div className="overflow-x-auto -mx-0 rounded-2xl table-responsive" style={{ border: "1px solid #E2E8F0" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <th className="text-left px-6 py-4" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#94A3B8", fontSize: "0.875rem", background: "#F8FAFC" }}>Feature</th>
                    <th className="text-center px-6 py-4" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#64748B", fontSize: "0.875rem", background: "#F8FAFC" }}>Section 8 Only</th>
                    <th className="text-center px-6 py-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: "#D97706", fontSize: "0.875rem", background: "rgba(245,158,11,0.06)" }}>⭐ Complete Package</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Section 8 Registration", true, true],
                    ["12A Tax Exemption", false, true],
                    ["80G Donor Certificate", false, true],
                    ["DARPAN Registration", false, true],
                    ["E-Anudan Setup", false, true],
                    ["Udyam / MSME", false, true],
                    ["PAN & TAN", true, true],
                    ["DSC & DIN", true, true],
                  ].map(([feat, standalone, pkg], i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td className="px-6 py-3.5" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", color: "#334155" }}>{feat as string}</td>
                      <td className="text-center px-6 py-3.5">{standalone ? <CheckCircle2 size={18} style={{ color: "#22C55E", margin: "0 auto" }} strokeWidth={2.5} /> : <X size={16} style={{ color: "#CBD5E1", margin: "0 auto" }} strokeWidth={2.5} />}</td>
                      <td className="text-center px-6 py-3.5" style={{ background: "rgba(245,158,11,0.03)" }}>{pkg ? <CheckCircle2 size={18} style={{ color: "#22C55E", margin: "0 auto" }} strokeWidth={2.5} /> : <X size={16} style={{ color: "#CBD5E1", margin: "0 auto" }} strokeWidth={2.5} />}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#F8FAFC" }}>
                    <td className="px-6 py-4" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: "#0F1B4C" }}>PRICE</td>
                    <td className="text-center px-6 py-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#0F1B4C", fontSize: "1.125rem" }}>₹7,999</td>
                    <td className="text-center px-6 py-4" style={{ background: "rgba(245,158,11,0.06)" }}><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#D97706", fontSize: "1.25rem" }}>₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 text-center">
              <Link to="/checkout?service=section8-complete" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 8px 32px rgba(217,119,6,0.30)" }}>
                Get Complete Package — ₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")} <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </div>

          {/* Questions CTA */}
          <div className="text-center p-10 rounded-2xl" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)" }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#0F1B4C" }} className="mb-3">Not sure which service you need?</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B", marginBottom: "20px" }}>Our experts will guide you to the right solution for free.</p>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:-translate-y-0.5" style={{ background: "#25D366", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(37,211,102,0.35)" }}>
              <MessageCircle size={16} strokeWidth={2} /> Chat on WhatsApp — Free Advice
            </a>
          </div>
        </div>
      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
