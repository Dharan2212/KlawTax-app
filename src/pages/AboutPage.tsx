import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  Scale, Users, ShieldCheck, Award, ArrowRight,
  Target, CheckCircle2, MessageCircle,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Legal Accuracy",
    desc: "Every registration is handled by experienced CS and CA professionals — no shortcuts, no compliance gaps.",
  },
  {
    icon: Target,
    title: "Transparent Pricing",
    desc: "Flat, all-inclusive fees. You see the price before you pay — no hidden charges after work begins.",
  },
  {
    icon: Users,
    title: "Client-First Process",
    desc: "A dedicated manager is assigned to every order. WhatsApp support keeps you informed at every step.",
  },
  {
    icon: Award,
    title: "Trusted Track Record",
    desc: "500+ NGOs and businesses registered. 4.9/5 on Google. MSME verified operations.",
  },
];

const STATS = [
  { value: "500+", label: "NGOs Registered"    },
  { value: "4.9★", label: "Google Rating"       },
  { value: "₹50Cr+", label: "Funds Unlocked"   },
  { value: "48hr", label: "Processing Start"    },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-neutral-50))" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section
        className="pt-32 pb-20"
        style={{ background: "var(--gradient-hero)" }}
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 text-center"
        >
          <motion.div variants={staggerItem} className="flex justify-center mb-5">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.80)",
              }}
            >
              <Scale size={12} strokeWidth={2.5} style={{ color: "hsl(var(--color-accent-400))" }} />
              India's Trusted Legal Registration Platform
            </span>
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="font-heading font-bold mb-5 leading-tight text-white"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            About <span style={{ color: "hsl(var(--color-accent-300))" }}>KlawTax</span>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="max-w-2xl mx-auto text-base leading-relaxed"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.65)",
            }}
          >
            KlawTax is an online legal and compliance platform built for Indian NGOs and businesses.
            We simplify the complex process of registration and compliance — from Section 8 incorporation
            to 12A, 80G, DARPAN, GST, and beyond.
          </motion.p>
        </motion.div>

        {/* Stats strip */}
        <div className="container mx-auto px-4 mt-16">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="text-center py-6 px-4"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <p
                  className="font-mono font-bold text-2xl"
                  style={{ color: "hsl(var(--color-accent-300))" }}
                >
                  {value}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-20" style={{ background: "hsl(var(--color-white))" }}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto px-4 max-w-3xl"
        >
          <motion.div variants={staggerItem} className="text-center mb-12">
            <h2 className="section-heading text-foreground mb-4">
              Why <span className="gradient-text">KlawTax</span> Exists
            </h2>
          </motion.div>

          <motion.div variants={staggerItem} className="space-y-5 text-center">
            {[
              "Thousands of NGOs and small businesses struggle with legal registration — not because the process is impossible, but because finding reliable, affordable experts is hard.",
              "KlawTax was created to bridge that gap. We offer flat-fee, expert-managed registration services with full transparency — so founders can focus on their mission instead of paperwork.",
              "From a Section 8 NGO in Mumbai to a startup LLP in Bangalore, we've helped 500+ organizations get legally operational, CSR-eligible, and fully compliant.",
            ].map((para, i) => (
              <p
                key={i}
                className="text-base leading-relaxed"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: "hsl(var(--color-neutral-700))",
                }}
              >
                {para}
              </p>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Values ── */}
      <section className="py-20" style={{ background: "hsl(var(--color-neutral-50))" }}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={staggerItem} className="section-heading text-foreground mb-3">
              How We Work
            </motion.h2>
            <motion.p
              variants={staggerItem}
              className="text-muted-foreground"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Our principles guide every project we take on.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto"
          >
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                className="rounded-2xl p-6 hover-lift"
                style={{
                  background: "hsl(var(--color-white))",
                  border: "1px solid hsl(var(--color-neutral-200))",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(30,58,138,0.08)" }}
                >
                  <Icon size={18} strokeWidth={2} style={{ color: "hsl(var(--color-primary-700))" }} />
                </div>
                <h3
                  className="font-semibold text-foreground text-sm mb-2"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: "hsl(var(--color-neutral-600, 215 14% 34%))",
                  }}
                >
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Team line ── */}
      <section
        className="py-16"
        style={{ background: "hsl(var(--color-primary-50))" }}
      >
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="container mx-auto px-4 max-w-2xl text-center"
        >
          <div className="flex justify-center mb-5">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: "rgba(30,58,138,0.08)",
                color: "hsl(var(--color-primary-700))",
                border: "1px solid rgba(30,58,138,0.12)",
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2.5} />
              CA & CS Certified Team
            </div>
          </div>
          <h2
            className="font-heading font-bold text-2xl text-foreground mb-3"
          >
            Expert team. Transparent process.
          </h2>
          <p
            className="text-sm leading-relaxed mb-8"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "hsl(var(--color-neutral-600, 215 14% 34%))",
            }}
          >
            Our team of qualified Company Secretaries and Chartered Accountants handles every registration
            personally — no outsourcing, no templates, no guesswork.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/services"
              className="btn-premium inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Explore Services
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#15803D",
                background: "rgba(34,197,94,0.10)",
                border: "1.5px solid rgba(34,197,94,0.22)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.18)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(34,197,94,0.10)")}
            >
              <MessageCircle size={14} strokeWidth={2} />
              Chat on WhatsApp
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
