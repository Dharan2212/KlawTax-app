import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { pricingPlans } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function PricingTable() {
  return (
    <section
      style={{ background: "var(--gradient-mesh-light)" }}
      className="py-16 md:py-24 lg:py-32"
      id="pricing"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <motion.p
            variants={staggerItem}
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ fontFamily: "'DM Sans', sans-serif", color: "#1E3A8A", letterSpacing: "0.1em" }}
          >
            Pricing
          </motion.p>
          <motion.h2
            variants={staggerItem}
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.015em",
              color: "#1A2D6B",
              marginBottom: "12px",
            }}
          >
            Simple,{" "}
            <span style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Transparent Pricing
            </span>
          </motion.h2>
          <motion.p
            variants={staggerItem}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B", lineHeight: 1.7 }}
          >
            No hidden charges. All government fees included.
          </motion.p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch"
        >
          {pricingPlans.map((p) => (
            <motion.div
              key={p.id}
              variants={staggerItem}
              className={`relative flex flex-col ${p.popular ? "lg:-mt-5 z-10" : ""}`}
            >
              {p.popular ? (
                /* ── Featured card ── */
                <div
                  className="flex flex-col flex-1 rounded-3xl overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #0F1B4C 0%, #1E3A8A 38%, #4C1D95 100%)",
                    border: "1.5px solid rgba(245,158,11,0.35)",
                    boxShadow: "0 0 0 1px rgba(245,158,11,0.12), 0 24px 64px rgba(15,27,76,0.55), 0 0 40px rgba(124,58,237,0.18)",
                  }}
                >
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)" }} />

                  <div className="flex justify-center pt-6 pb-1 px-8">
                    <span
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "0.04em",
                        background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                        color: "#0F172A",
                        boxShadow: "0 2px 12px rgba(217,119,6,0.40)",
                      }}
                    >
                      <Zap size={11} strokeWidth={2.5} style={{ fill: "#0F172A" }} />
                      MOST POPULAR
                    </span>
                  </div>

                  <div className="p-7 md:p-8 flex flex-col flex-1">
                    <h3
                      className="mb-1 font-bold"
                      style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.2rem", color: "#FFFFFF", letterSpacing: "-0.01em" }}
                    >
                      {p.name}
                    </h3>
                    <p
                      className="mb-5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}
                    >
                      {p.description}
                    </p>

                    <div className="flex items-baseline gap-3 mb-1">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          fontSize: "2.25rem",
                          lineHeight: 1,
                          color: "#FCD34D",
                          textShadow: "0 0 20px rgba(252,211,77,0.25)",
                        }}
                      >
                        {formatCurrency(p.price)}
                      </span>
                      {p.originalPrice && (
                        <span
                          className="text-sm line-through"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(255,255,255,0.28)" }}
                        >
                          {formatCurrency(p.originalPrice)}
                        </span>
                      )}
                    </div>

                    {p.advancePrice && (
                      <p className="mb-6 text-xs" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.40)" }}>
                        or start with{" "}
                        <span style={{ color: "#FCD34D", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                          {formatCurrency(p.advancePrice)}
                        </span>{" "}
                        advance
                      </p>
                    )}

                    <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

                    <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <CheckCircle2 size={14} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" style={{ color: "#FCD34D" }} />
                          <span className="text-sm leading-snug" style={{ fontFamily: "'DM Sans', sans-serif", color: "rgba(255,255,255,0.82)" }}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/checkout"
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                        color: "#0F172A",
                        boxShadow: "0 6px 24px rgba(217,119,6,0.45)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(217,119,6,0.60)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(217,119,6,0.45)"; }}
                    >
                      {p.cta}
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              ) : (
                /* ── Standard card ── */
                <div
                  className="flex flex-col flex-1 rounded-3xl transition-all duration-300 hover:-translate-y-1 group"
                  style={{
                    background: "white",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 4px 16px rgba(15,27,76,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(15,27,76,0.14)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#BFDBFE";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(15,27,76,0.08)";
                    (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0";
                  }}
                >
                  <div style={{ height: "3px", background: "linear-gradient(90deg, #1E3A8A, #7C3AED)", borderRadius: "24px 24px 0 0", opacity: 0.4 }} />

                  <div className="p-8 flex flex-col flex-1">
                    <h3
                      className="mb-1 font-bold"
                      style={{ fontFamily: "'Sora', sans-serif", fontSize: "1.125rem", color: "#0F1B4C", letterSpacing: "-0.01em" }}
                    >
                      {p.name}
                    </h3>
                    <p
                      className="mb-5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "#64748B", lineHeight: 1.6 }}
                    >
                      {p.description}
                    </p>

                    <div className="flex items-baseline gap-2 mb-6">
                      <span
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: "1.875rem", lineHeight: 1, color: "#D97706" }}
                      >
                        {formatCurrency(p.price)}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <CheckCircle2 size={14} strokeWidth={2.5} className="flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                          <span className="text-sm leading-snug" style={{ fontFamily: "'DM Sans', sans-serif", color: "#334155" }}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/checkout"
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: "#1E3A8A",
                        border: "1.5px solid #BFDBFE",
                        background: "#EFF6FF",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#1E3A8A";
                        (e.currentTarget as HTMLElement).style.background = "#DBEAFE";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = "#BFDBFE";
                        (e.currentTarget as HTMLElement).style.background = "#EFF6FF";
                      }}
                    >
                      {p.cta}
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom trust strip */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12"
        >
          {[
            "No hidden fees",
            "All govt. fees included",
            "Dedicated case manager",
            "Razorpay secured",
          ].map((t) => (
            <span
              key={t}
              className="flex items-center gap-2 text-xs"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B" }}
            >
              <ShieldCheck size={13} strokeWidth={2} style={{ color: "#22C55E" }} />
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
