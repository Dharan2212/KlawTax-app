import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShieldCheck, Users, Award, TrendingUp, CheckCircle2,
  MessageCircle, ArrowRight, Star, Building2, MapPin,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import { organizationSchema } from "@/lib/seo";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";

const TEAM = [
  { name: "Adv. Priya Sharma", role: "Founder & Legal Head", initials: "PS", exp: "12 yrs", spec: "NGO & Corporate Law" },
  { name: "CA Rahul Mehta", role: "Chief Finance Officer", initials: "RM", exp: "10 yrs", spec: "Tax & Compliance" },
  { name: "CS Deepa Nair", role: "Company Secretary", initials: "DN", exp: "8 yrs", spec: "MCA Filings & Governance" },
  { name: "Arun Kumar", role: "Operations Head", initials: "AK", exp: "6 yrs", spec: "Client Management" },
];

const MILESTONES = [
  { year: "2018", title: "Founded", desc: "KlawTax.online established to democratize legal services" },
  { year: "2020", title: "100 NGOs", desc: "Crossed 100 successful NGO registrations across India" },
  { year: "2022", title: "MSME Certified", desc: "Obtained MSME Udyam certification for our practice" },
  { year: "2024", title: "500+ Clients", desc: "Serving 500+ satisfied clients across 28 states" },
];

const VALUES = [
  { icon: ShieldCheck, title: "Transparency", desc: "Upfront pricing with no hidden fees. What you see is what you pay." },
  { icon: Award, title: "Expertise", desc: "Qualified CA, CS, and legal professionals handling every case." },
  { icon: Users, title: "Client First", desc: "WhatsApp-first support model for accessible, human assistance." },
  { icon: TrendingUp, title: "Results", desc: "100% legal compliance with timely delivery, guaranteed." },
];

export default function AboutPage() {
  return (
    <motion.div {...pageTransition} className="min-h-screen flex flex-col">
      <SEO
        title="About KlawTax | India's Trusted Legal & NGO Platform"
        description="Learn about KlawTax.online — founded to make legal and NGO services simple and affordable across India. 500+ NGOs registered. Qualified CA, CS, and legal professionals. 4.9★ rated."
        keywords="about KlawTax, legal services company India, NGO registration firm, CA CS legal professionals India, KlawTax team, trusted legal platform India"
        canonical="/about"
        schema={organizationSchema}
      />
      <Navbar />
      <main role="main" className="flex-1 pt-20">

        {/* Hero */}
        <section className="py-20 md:py-28" style={{ background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div variants={staggerItem}>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4" style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D", letterSpacing: "0.04em" }}>
                    🇮🇳 INDIA'S TRUSTED LEGAL PLATFORM
                  </span>
                </motion.div>
                <motion.h1 variants={staggerItem} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3.25rem)", color: "white", letterSpacing: "-0.025em", lineHeight: 1.1 }} className="mb-5">
                  Making Legal Services<br /><span style={{ background: "linear-gradient(90deg, #FCD34D, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Simple & Affordable</span>
                </motion.h1>
                <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }} className="mb-8">
                  KlawTax.online was founded with a single mission — to make legal compliance and NGO registration accessible to every organization in India, regardless of size or budget.
                </motion.p>
                <motion.div variants={staggerItem} className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {[
                    { n: "500+", l: "NGOs Served" },
                    { n: "4.9★", l: "Google Rating" },
                    { n: "28", l: "States Covered" },
                    { n: "₹50Cr+", l: "Funds Unlocked" },
                  ].map(({ n, l }) => (
                    <div key={l} className="text-center">
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.5rem", color: "#F59E0B" }}>{n}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{l}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
              {/* Right: abstract visual */}
              <motion.div variants={staggerItem} className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  <div className="w-72 h-72 rounded-3xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                    <Building2 size={80} strokeWidth={1} style={{ color: "rgba(245,158,11,0.60)" }} />
                  </div>
                  {/* Floating badges */}
                  {[
                    { text: "MSME Certified", style: { top: "10%", left: "-20%", background: "#22C55E" } },
                    { text: "4.9★ Google", style: { bottom: "15%", right: "-20%", background: "#F59E0B" } },
                  ].map(({ text, style: { background, ...pos } }) => (
                    <div key={text} className="absolute flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl" style={{ ...pos, background, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.8125rem", color: "white", whiteSpace: "nowrap" }}>
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                      {text}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-24" style={{ background: "#F8FAFC" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
              <motion.div variants={staggerItem} className="text-center mb-14">
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0F1B4C", letterSpacing: "-0.015em" }} className="mb-3">
                  Why We Built KlawTax
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B", lineHeight: 1.7 }} className="max-w-2xl mx-auto">
                  Thousands of NGOs and businesses in India struggle with complex legal processes, opaque pricing, and inaccessible experts. We built KlawTax to change that.
                </p>
              </motion.div>

              {/* Values grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {VALUES.map(({ icon: Icon, title, desc }) => (
                  <motion.div key={title} variants={staggerItem} className="p-6 rounded-2xl service-card">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(30,58,138,0.08)" }}>
                      <Icon size={24} strokeWidth={1.75} style={{ color: "#1E3A8A" }} />
                    </div>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0F1B4C" }} className="mb-2">{title}</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#64748B", lineHeight: 1.65 }}>{desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* Milestones */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MILESTONES.map((m) => (
                  <motion.div key={m.year} variants={staggerItem} className="p-5 rounded-2xl text-center" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.5rem", color: "#D97706" }}>{m.year}</div>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0F1B4C", margin: "6px 0 4px" }}>{m.title}</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "#64748B" }}>{m.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-24" style={{ background: "white" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
              <motion.div variants={staggerItem} className="text-center mb-12">
                <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#0F1B4C", letterSpacing: "-0.015em" }} className="mb-3">
                  Expert Team Behind KlawTax
                </h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B" }}>
                  Qualified legal, financial, and compliance professionals.
                </p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEAM.map((t) => (
                  <motion.div key={t.name} variants={staggerItem} className="p-6 rounded-2xl text-center service-card">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl" style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", color: "white", fontFamily: "'Sora', sans-serif" }}>{t.initials}</div>
                    <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#0F1B4C" }} className="mb-1">{t.name}</h3>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "#7C3AED", fontWeight: 600 }} className="mb-2">{t.role}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#94A3B8" }}>{t.spec} · {t.exp}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Google Reviews strip */}
        <section className="py-12" style={{ background: "#FFFBEB", borderTop: "1px solid #FCD34D", borderBottom: "1px solid #FCD34D" }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={20} fill="#F59E0B" style={{ color: "#F59E0B" }} />)}
            </div>
            <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.5rem", color: "#92400E" }}>4.9 / 5 on Google Reviews</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#B45309", marginTop: "4px" }}>Based on 127+ verified reviews from clients across India</p>
          </div>
        </section>

        {/* Location + CTA */}
        <section className="py-16 md:py-20" style={{ background: "white" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <motion.h2 variants={staggerItem} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#0F1B4C" }} className="mb-4">
                  Serving All of India
                </motion.h2>
                <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "#64748B", lineHeight: 1.7 }} className="mb-6">
                  We work remotely with clients across all 28 states and 8 union territories. Our digital-first approach means no travel, no delays — just fast, expert legal services from wherever you are.
                </motion.p>
                <motion.div variants={staggerItem} className="flex items-center gap-2 mb-4">
                  <MapPin size={16} strokeWidth={2} style={{ color: "#1E3A8A" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", color: "#334155" }}>Registered Office: India</span>
                </motion.div>
                <motion.div variants={staggerItem} className="flex gap-3">
                  <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(217,119,6,0.30)" }}>
                    Get in Touch <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                  <a href="https://wa.me/917387731313" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5" style={{ background: "#25D366", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif" }}>
                    <MessageCircle size={14} strokeWidth={2} /> WhatsApp
                  </a>
                </motion.div>
              </motion.div>
              <motion.div variants={staggerItem} initial="hidden" whileInView="visible" viewport={{ once: true }} className="p-8 rounded-2xl" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1px solid #BFDBFE" }}>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "#0F1B4C" }} className="mb-4">Our Credentials</h3>
                {[
                  "MSME / Udyam Registered",
                  "Qualified CA & CS on Team",
                  "500+ Satisfied Clients",
                  "All 28 States Covered",
                  "Razorpay Verified Merchant",
                  "ISO-ready Documentation Process",
                ].map(c => (
                  <div key={c} className="flex items-center gap-3 mb-3">
                    <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: "#22C55E", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", color: "#334155" }}>{c}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
