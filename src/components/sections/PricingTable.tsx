import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import { pricingPlans } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { staggerContainer, staggerItem } from "@/lib/motion";

export default function PricingTable() {
  return (
    <SectionWrapper background="muted" spacing="lg">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-16"
      >
        <motion.h2 variants={staggerItem} className="section-heading text-foreground mb-4">
          Simple,{" "}
          <span className="gradient-text">Transparent Pricing</span>
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="body-lg text-muted-foreground max-w-xl mx-auto"
        >
          No hidden charges. All government fees included.
        </motion.p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-stretch"
      >
        {pricingPlans.map((p) => (
          <motion.div
            key={p.id}
            variants={staggerItem}
            className={`relative flex flex-col ${p.popular ? "lg:-mt-4 lg:mb-0 z-10" : ""}`}
          >
            {p.popular ? (
              /* ── Featured card ─────────────────────────────── */
              <div
                className="flex flex-col flex-1 rounded-3xl overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #0F1B4C 0%, #1E3A8A 38%, #4C1D95 100%)",
                  border: "1.5px solid rgba(245,158,11,0.35)",
                  boxShadow:
                    "0 0 0 1px rgba(245,158,11,0.12), 0 20px 60px rgba(15,27,76,0.55), 0 0 40px rgba(124,58,237,0.18)",
                }}
              >
                {/* Gold top stripe */}
                <div
                  style={{
                    height: "3px",
                    background: "linear-gradient(90deg, #D97706 0%, #F59E0B 50%, #FCD34D 100%)",
                  }}
                />

                {/* Badge */}
                <div className="flex justify-center pt-5 pb-1 px-8">
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

                <div className="p-7 md:p-9 flex flex-col flex-1">
                  {/* Plan name */}
                  <h3
                    className="mb-1 font-bold text-xl"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      color: "#FFFFFF",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.name}
                  </h3>

                  {/* Price row */}
                  <div className="flex items-baseline gap-2.5 mb-6 mt-3">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                        fontSize: "2.25rem",
                        lineHeight: 1,
                        color: "#FCD34D",
                        textShadow: "0 0 20px rgba(252,211,77,0.30)",
                      }}
                    >
                      {formatCurrency(p.price)}
                    </span>
                    {p.originalPrice && (
                      <span
                        className="text-sm line-through"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "rgba(255,255,255,0.32)",
                        }}
                      >
                        {formatCurrency(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={15}
                          strokeWidth={2.5}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "#FCD34D" }}
                        />
                        <span
                          className="text-sm leading-snug"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    to="/checkout"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                      color: "#0F172A",
                      boxShadow: "0 6px 24px rgba(217,119,6,0.45)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 32px rgba(217,119,6,0.60)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(217,119,6,0.45)";
                    }}
                  >
                    Get Started
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>

                  {/* Advance note */}
                  {p.advanceAmount && (
                    <p
                      className="text-center text-xs mt-3"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      or start with{" "}
                      <span style={{ color: "#FCD34D", fontWeight: 600 }}>
                        {formatCurrency(p.advanceAmount)} advance
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* ── Standard card ──────────────────────────────── */
              <div
                className="flex flex-col flex-1 rounded-3xl transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "hsl(var(--color-white))",
                  borderRadius: "var(--radius-2xl)",
                  border: "1.5px solid hsl(var(--color-neutral-200))",
                  boxShadow: "var(--shadow-md)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xl)";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-primary-200, 214 80% 80%))";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-neutral-200))";
                }}
              >
                {/* Top accent stripe */}
                <div
                  style={{
                    height: "3px",
                    background: "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                    borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0",
                    opacity: 0,
                    transition: "opacity 0.3s",
                  }}
                  className="group-hover:opacity-100"
                />

                <div className="p-8 md:p-9 flex flex-col flex-1">
                  <h3
                    className="card-title mb-1"
                    style={{ color: "hsl(var(--color-primary-900))" }}
                  >
                    {p.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-5 mt-3">
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        fontSize: "1.875rem",
                        lineHeight: 1,
                        color: "hsl(var(--color-accent-500))",
                      }}
                    >
                      {formatCurrency(p.price)}
                    </span>
                    {p.originalPrice && (
                      <span
                        className="text-sm line-through"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: "hsl(var(--color-neutral-400, 215 20% 65%))",
                        }}
                      >
                        {formatCurrency(p.originalPrice)}
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2
                          size={15}
                          strokeWidth={2.5}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "hsl(var(--color-success-500))" }}
                        />
                        <span
                          className="text-sm leading-snug"
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            color: "hsl(var(--color-neutral-700))",
                          }}
                        >
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
                      color: "hsl(var(--color-primary-700))",
                      border: "1.5px solid hsl(var(--color-primary-200, 214 80% 80%))",
                      background: "hsl(var(--color-primary-50))",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-primary-600))";
                      (e.currentTarget as HTMLElement).style.background = "hsl(var(--color-primary-100))";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--color-primary-200, 214 80% 80%))";
                      (e.currentTarget as HTMLElement).style.background = "hsl(var(--color-primary-50))";
                    }}
                  >
                    Get Started
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </SectionWrapper>
  );
}
