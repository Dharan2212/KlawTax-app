import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Star, CheckCircle2, MessageCircle, ArrowRight, ShieldCheck, Zap, Clock } from "lucide-react";
import { featuredPackage } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { slideInRight, staggerContainer, staggerItem } from "@/lib/motion";

export default function FeaturedPackage() {
  return (
    <section
      className="py-16 md:py-24"
      style={{ background: "var(--gradient-cta-banner)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: text content ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {/* Badge */}
            <motion.span
              variants={staggerItem}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.05em",
                background: "rgba(245,158,11,0.15)",
                color: "hsl(var(--color-accent-300))",
                border: "1px solid rgba(245,158,11,0.28)",
              }}
            >
              <Star
                size={11}
                strokeWidth={2}
                style={{ fill: "hsl(var(--color-accent-300))", color: "hsl(var(--color-accent-300))" }}
              />
              MOST POPULAR PACKAGE
            </motion.span>

            <motion.h2
              variants={staggerItem}
              className="font-bold mb-4 leading-tight text-white"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                letterSpacing: "-0.025em",
              }}
            >
              {featuredPackage.name}
            </motion.h2>

            <motion.p
              variants={staggerItem}
              className="mb-8 max-w-lg leading-relaxed"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.60)",
                lineHeight: 1.7,
              }}
            >
              {featuredPackage.description}
            </motion.p>

            {/* Feature checklist */}
            <ul className="space-y-3 mb-8">
              {featuredPackage.features.map((f) => (
                <motion.li
                  key={f}
                  variants={staggerItem}
                  className="flex items-center gap-3"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.18)" }}
                  >
                    <CheckCircle2
                      size={12}
                      strokeWidth={2.5}
                      style={{ color: "hsl(var(--color-success-500))" }}
                    />
                  </span>
                  {f}
                </motion.li>
              ))}
            </ul>

            {/* Trust chips */}
            <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
              {[
                { icon: ShieldCheck, text: "100% Legal Compliance" },
                { icon: Zap,         text: "48hr Processing Start"  },
                { icon: Clock,       text: "Expert CS & CA Team"    },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: "rgba(255,255,255,0.50)",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <Icon size={11} strokeWidth={2} style={{ color: "hsl(var(--color-accent-400))" }} />
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: pricing card ── */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-md mx-auto lg:ml-auto w-full"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.13)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 56px rgba(15,27,76,0.38), inset 0 1px 0 rgba(255,255,255,0.09)",
              }}
            >
              {/* Top gold accent stripe */}
              <div
                className="h-1 w-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--color-accent-400)), hsl(var(--color-accent-600)))" }}
              />

              <div className="p-7">
                {/* Price block */}
                <div className="text-center mb-6">
                  <p
                    className="text-[11px] font-semibold uppercase tracking-widest mb-3"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "rgba(255,255,255,0.36)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    All-inclusive price
                  </p>

                  <div className="flex items-baseline justify-center gap-3 mb-2">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "clamp(2rem, 4vw, 2.75rem)",
                        lineHeight: 1,
                        color: "hsl(var(--color-accent-300))",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatCurrency(featuredPackage.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <span
                      className="line-through text-sm"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(255,255,255,0.26)",
                      }}
                    >
                      {formatCurrency(featuredPackage.originalPrice)}
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        background: "rgba(34,197,94,0.15)",
                        color: "hsl(var(--color-success-500))",
                        border: "1px solid rgba(34,197,94,0.25)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      Save {formatCurrency(featuredPackage.savings)}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div
                  className="mb-5"
                  style={{ height: "1px", background: "rgba(255,255,255,0.08)" }}
                />

                {/* 50% advance note */}
                <div
                  className="text-center mb-5 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Start for just{" "}
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        color: "hsl(var(--color-accent-300))",
                      }}
                    >
                      {formatCurrency(Math.round(featuredPackage.price / 2))}
                    </span>{" "}
                    — pay balance on delivery
                  </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2.5">
                  <Link
                    to="/checkout"
                    className="btn-premium flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Get Complete Package
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </Link>
                  <a
                    href="https://wa.me/919999999999?text=I%27m%20interested%20in%20the%20Complete%20NGO%20Package"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-colors duration-200"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "rgba(255,255,255,0.60)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.60)";
                    }}
                  >
                    <MessageCircle size={14} strokeWidth={2} />
                    Discuss on WhatsApp
                  </a>
                </div>

                {/* Security note */}
                <p
                  className="text-center text-[11px] mt-4"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: "rgba(255,255,255,0.26)",
                  }}
                >
                  Razorpay secured · All govt. fees included · No hidden charges
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

