import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function CTABanner() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ background: "var(--gradient-cta-banner)" }}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="container mx-auto px-4 text-center"
      >
        {/* Eyebrow badge */}
        <motion.div variants={staggerItem} className="flex justify-center mb-5">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <ShieldCheck
              size={12}
              strokeWidth={2.5}
              style={{ color: "hsl(var(--color-accent-400))" }}
            />
            Free expert consultation — no commitment
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          variants={staggerItem}
          className="font-heading font-bold text-3xl md:text-4xl mb-4 leading-tight"
          style={{ color: "rgba(255,255,255,0.96)" }}
        >
          Ready to Register Your{" "}
          <span style={{ color: "hsl(var(--color-accent-300))" }}>NGO Today?</span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          variants={staggerItem}
          className="mb-8 max-w-lg mx-auto leading-relaxed"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "rgba(255,255,255,0.60)",
          }}
        >
          Start with just ₹6,750 advance. Our experts handle everything —
          from incorporation to compliance.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={staggerItem}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/services"
            className="btn-premium inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Explore Services
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>

          <a
            href="https://wa.me/918793949471"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.90)",
              border: "1.5px solid rgba(255,255,255,0.22)",
              background: "transparent",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <MessageCircle size={15} strokeWidth={2} />
            WhatsApp Us
          </a>
        </motion.div>

        {/* Trust micro-copy */}
        <motion.p
          variants={staggerItem}
          className="mt-6 text-xs"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "rgba(255,255,255,0.32)",
          }}
        >
          Razorpay secured &nbsp;·&nbsp; 500+ NGOs registered &nbsp;·&nbsp; 4.9★ Google rated
        </motion.p>
      </motion.div>
    </section>
  );
}
