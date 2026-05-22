import { motion } from "framer-motion";
import { staggerContainer, staggerItem, fadeIn } from "@/lib/motion";
import { PhoneCall, ClipboardList, UploadCloud, Settings, Award } from "lucide-react";

const steps = [
  { num: 1, title: "Free Consultation",  desc: "Discuss your needs with our legal experts",    icon: PhoneCall,     color: "#1E3A8A", bg: "#DBEAFE" },
  { num: 2, title: "Choose Service",     desc: "Select the right service and package",          icon: ClipboardList, color: "#4C1D95", bg: "#EDE9FE" },
  { num: 3, title: "Submit Documents",   desc: "Upload or WhatsApp your documents securely",    icon: UploadCloud,   color: "#0369A1", bg: "#E0F2FE" },
  { num: 4, title: "We Process",         desc: "Our experts handle all government filings",     icon: Settings,      color: "#15803D", bg: "#DCFCE7" },
  { num: 5, title: "Get Certificate",    desc: "Receive your registration certificate",         icon: Award,         color: "#B45309", bg: "#FEF3C7" },
];

export default function ProcessTimeline() {
  return (
    <section style={{ background: "#F8FAFC" }} className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            How It Works
          </motion.p>
          <motion.h2
            variants={staggerItem}
            className="mb-4"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.015em",
              color: "#1A2D6B",
            }}
          >
            Simple as <span style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>1–2–3–4–5</span>
          </motion.h2>
          <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B", lineHeight: 1.7 }}>
            From consultation to certificate — we handle everything
          </motion.p>
        </motion.div>

        {/* Desktop horizontal stepper */}
        <div className="hidden md:block">
          <div className="relative flex items-start justify-between">
            {/* Connector line */}
            <div
              className="absolute h-px"
              style={{
                top: "44px",
                left: "calc(10% + 36px)",
                right: "calc(10% + 36px)",
                background: "linear-gradient(90deg, #DBEAFE 0%, #C4B5FD 50%, #FEF3C7 100%)",
              }}
            />

            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.num}
                  variants={staggerItem}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex flex-col items-center text-center relative z-10 w-1/5 px-3"
                >
                  {/* Icon circle */}
                  <div className="relative mb-5">
                    <div
                      className="w-[88px] h-[88px] rounded-2xl flex items-center justify-center transition-all duration-300"
                      style={{
                        background: "white",
                        border: `2px solid ${s.bg}`,
                        boxShadow: `0 4px 20px rgba(15,27,76,0.08)`,
                      }}
                    >
                      <Icon size={32} strokeWidth={1.5} style={{ color: s.color }} />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`,
                        fontFamily: "'JetBrains Mono', monospace",
                        boxShadow: "0 2px 8px rgba(15,27,76,0.20)",
                      }}
                    >
                      {s.num}
                    </span>
                  </div>

                  <h3
                    className="font-semibold text-sm mb-1.5 leading-snug"
                    style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, color: "#0F1B4C" }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B", lineHeight: 1.6 }}
                  >
                    {s.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
        <div className="md:hidden space-y-0">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === steps.length - 1;
            return (
              <motion.div
                key={s.num}
                variants={fadeIn}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-start gap-4 relative"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg, border: `1.5px solid ${s.color}22` }}
                  >
                    <Icon size={20} strokeWidth={1.75} style={{ color: s.color }} />
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ background: s.color, fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {s.num}
                    </span>
                  </div>
                  {!isLast && (
                    <div className="w-px mt-2" style={{ minHeight: "28px", flex: "1", background: `linear-gradient(180deg, ${s.color}33, transparent)` }} />
                  )}
                </div>
                <div className={`pt-1 ${isLast ? "pb-0" : "pb-6"}`}>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, color: "#0F1B4C" }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B" }}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
