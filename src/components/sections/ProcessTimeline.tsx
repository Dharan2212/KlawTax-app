/**
 * ProcessTimeline — Professional "How It Works" section
 * Batch C — Process Section Professional Rewrite
 *
 * Design direction: Legal-tech enterprise onboarding process.
 * Clean card-based layout, dark accent step indicators, connector
 * lines that feel structural not decorative. Horizontal desktop,
 * vertical mobile with proper connector drawing.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/motion";
import {
  MessageSquare,
  PackageSearch,
  FolderUp,
  ClipboardCheck,
  FileCheck2,
} from "lucide-react";

/* ── Step data ── */
const STEPS = [
  {
    num: 1,
    title: "Free Consultation",
    desc: "Speak with a CA or CS expert about your registration goals, timeline, and requirements — at no charge.",
    icon: MessageSquare,
    accentColor: "#1E3A8A",
    accentLight: "rgba(30,58,138,0.10)",
    accentBorder: "rgba(30,58,138,0.18)",
  },
  {
    num: 2,
    title: "Select Your Service",
    desc: "Choose the right registration or compliance package. We guide you to the most efficient path for your entity.",
    icon: PackageSearch,
    accentColor: "#4C1D95",
    accentLight: "rgba(76,29,149,0.10)",
    accentBorder: "rgba(76,29,149,0.18)",
  },
  {
    num: 3,
    title: "Submit Documents",
    desc: "Upload securely via our portal or send directly on WhatsApp. Our team provides a clear checklist upfront.",
    icon: FolderUp,
    accentColor: "#0369A1",
    accentLight: "rgba(3,105,161,0.10)",
    accentBorder: "rgba(3,105,161,0.18)",
  },
  {
    num: 4,
    title: "Expert Processing",
    desc: "Our legal team files with the relevant government authority and handles all follow-up correspondence.",
    icon: ClipboardCheck,
    accentColor: "#15803D",
    accentLight: "rgba(21,128,61,0.10)",
    accentBorder: "rgba(21,128,61,0.18)",
  },
  {
    num: 5,
    title: "Receive Certificate",
    desc: "Your registration certificate is delivered digitally with a full compliance summary and next-step guidance.",
    icon: FileCheck2,
    accentColor: "#B45309",
    accentLight: "rgba(180,83,9,0.10)",
    accentBorder: "rgba(180,83,9,0.18)",
  },
] as const;

/* ── Desktop step card ── */
function DesktopCard({
  step,
  index,
  total,
}: {
  step: (typeof STEPS)[number];
  index: number;
  total: number;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = step.icon;
  const isLast = index === total - 1;

  return (
    <div className="relative flex-1 flex flex-col items-center" style={{ minWidth: 0 }}>
      {/* Connector line — drawn between cards */}
      {!isLast && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "36px",
            left: "calc(50% + 38px)",
            right: "calc(-50% + 38px)",
            height: "1px",
            background: `linear-gradient(90deg, ${step.accentColor}30, rgba(203,213,225,0.40))`,
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        variants={staggerItem}
        className="flex flex-col items-center text-center relative z-10 w-full px-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Step number + icon circle */}
        <div className="relative mb-5">
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: hovered ? step.accentLight : "white",
              border: `1.5px solid ${hovered ? step.accentColor + "40" : step.accentBorder}`,
              boxShadow: hovered
                ? `0 8px 28px ${step.accentColor}18`
                : "0 2px 12px rgba(15,27,76,0.07)",
              transition: "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
            }}
          >
            <Icon
              size={28}
              strokeWidth={1.6}
              style={{
                color: step.accentColor,
                transition: "transform 0.2s ease",
                transform: hovered ? "scale(1.08)" : "scale(1)",
              }}
            />
          </div>
          {/* Step number badge */}
          <span
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white flex items-center justify-center"
            style={{
              background: step.accentColor,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              fontWeight: 600,
              boxShadow: `0 2px 6px ${step.accentColor}50`,
              letterSpacing: 0,
            }}
          >
            {step.num}
          </span>
        </div>

        {/* Text */}
        <h3
          className="mb-2 leading-snug"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 600,
            fontSize: "0.875rem",
            color: "#0F1B4C",
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.8rem",
            color: "#64748B",
            lineHeight: 1.65,
            maxWidth: "176px",
          }}
        >
          {step.desc}
        </p>
      </motion.div>
    </div>
  );
}

/* ── Mobile step row ── */
function MobileRow({
  step,
  isLast,
}: {
  step: (typeof STEPS)[number];
  isLast: boolean;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      variants={staggerItem}
      className="flex items-start gap-4 relative"
    >
      {/* Left: icon + connector */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: "48px" }}>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: step.accentLight,
            border: `1.5px solid ${step.accentBorder}`,
            boxShadow: `0 2px 10px ${step.accentColor}12`,
          }}
        >
          <Icon size={20} strokeWidth={1.75} style={{ color: step.accentColor }} />
        </div>
        {!isLast && (
          <div
            style={{
              width: "1px",
              flex: 1,
              minHeight: "28px",
              marginTop: "6px",
              background: `linear-gradient(180deg, ${step.accentColor}30, rgba(203,213,225,0.18))`,
            }}
          />
        )}
      </div>

      {/* Right: text */}
      <div className={`pt-1 min-w-0 ${isLast ? "pb-0" : "pb-7"}`}>
        {/* Number tag */}
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white flex-shrink-0"
            style={{
              background: step.accentColor,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8.5px",
              fontWeight: 600,
            }}
          >
            {step.num}
          </span>
          <h3
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#0F1B4C",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            {step.title}
          </h3>
        </div>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.8125rem",
            color: "#64748B",
            lineHeight: 1.65,
          }}
        >
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main export ── */
export default function ProcessTimeline() {
  return (
    <section
      aria-labelledby="process-heading"
      style={{
        background:
          "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 60%, #F8FAFC 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(30,58,138,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,58,138,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">

        {/* Section header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-14 sm:mb-16"
        >
          <motion.p
            variants={staggerItem}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#1E3A8A",
              marginBottom: "12px",
            }}
          >
            Our Process
          </motion.p>

          <motion.h2
            variants={staggerItem}
            id="process-heading"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.02em",
              color: "#0F1B4C",
              lineHeight: 1.2,
              marginBottom: "14px",
            }}
          >
            From Enquiry to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Registration
            </span>
            {" "}— Fully Managed
          </motion.h2>

          <motion.p
            variants={staggerItem}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(0.9rem, 1.3vw, 1.0625rem)",
              color: "#64748B",
              lineHeight: 1.7,
              maxWidth: "520px",
              margin: "0 auto",
            }}
          >
            We handle every step of your registration — government filings,
            documentation, follow-ups — so you can focus on your mission.
          </motion.p>
        </motion.div>

        {/* ── Desktop horizontal layout ── */}
        <motion.div
          className="hidden md:flex items-start justify-between gap-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {STEPS.map((step, i) => (
            <DesktopCard
              key={step.num}
              step={step}
              index={i}
              total={STEPS.length}
            />
          ))}
        </motion.div>

        {/* ── Mobile vertical layout ── */}
        <motion.div
          className="md:hidden"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid rgba(203,213,225,0.60)",
              boxShadow: "0 4px 24px rgba(15,27,76,0.06)",
              padding: "24px 20px",
            }}
          >
            {STEPS.map((step, i) => (
              <MobileRow
                key={step.num}
                step={step}
                isLast={i === STEPS.length - 1}
              />
            ))}
          </div>
        </motion.div>

        {/* Bottom assurance strip */}
        <motion.div
          variants={staggerItem}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 sm:mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {[
            "No hidden charges",
            "Dedicated manager assigned",
            "WhatsApp updates throughout",
            "100% government compliant",
          ].map((item) => (
            <span
              key={item}
              className="flex items-center gap-2"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8125rem",
                color: "#475569",
              }}
            >
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#22C55E",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
