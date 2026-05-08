import { motion } from "framer-motion";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { staggerContainer, staggerItem, fadeIn, useIsMobile } from "@/lib/motion";
import { PhoneCall, ClipboardList, UploadCloud, Settings, Award } from "lucide-react";

const steps = [
  { num: 1, title: "Free Consultation",  desc: "Discuss your needs with our legal experts",     icon: PhoneCall     },
  { num: 2, title: "Choose Service",     desc: "Select the right service and package",           icon: ClipboardList },
  { num: 3, title: "Submit Documents",   desc: "Upload or WhatsApp your documents",             icon: UploadCloud   },
  { num: 4, title: "We Process",         desc: "Our team handles all government filings",        icon: Settings      },
  { num: 5, title: "Get Certificate",    desc: "Receive your registration certificate",          icon: Award         },
];

const STAGGER_CAP = 4;

export default function ProcessTimeline() {
  const isMobile = useIsMobile();

  return (
    <SectionWrapper background="muted">
      {/* ── Heading ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-14"
      >
        <motion.h2 variants={staggerItem} className="section-heading text-foreground mb-4">
          How It <span className="gradient-text">Works</span>
        </motion.h2>
        <motion.p variants={staggerItem} className="body-lg text-muted-foreground max-w-xl mx-auto">
          Simple 5-step process from consultation to certificate
        </motion.p>
      </motion.div>

      {/* ── Desktop horizontal timeline ── */}
      <div className="hidden md:block relative">
        {/* Connector line */}
        <div className="absolute top-[38px] left-[calc(10%+20px)] right-[calc(10%+20px)] h-px bg-gradient-to-r from-primary-100 via-primary-300 to-primary-100" />

        <div className="flex items-start justify-between">
          {steps.map((s, i) => {
            const isStaggered = i < STAGGER_CAP;
            const Tag = isStaggered ? motion.div : "div";
            const props = isStaggered
              ? {
                  variants: isMobile ? fadeIn : staggerItem,
                  initial: "hidden" as const,
                  whileInView: "visible" as const,
                  viewport: { once: true },
                }
              : {};
            const Icon = s.icon;

            return (
              <Tag
                key={s.num}
                className="flex flex-col items-center text-center relative z-10 w-1/5 px-2"
                {...props}
              >
                {/* Step circle */}
                <div className="relative mb-5">
                  <div className="w-[76px] h-[76px] rounded-full bg-card border-2 border-primary-100 flex items-center justify-center shadow-md group hover:border-primary-500 transition-colors duration-200">
                    <Icon size={28} strokeWidth={1.75} className="text-primary-600" />
                  </div>
                  {/* Step number badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-sm">
                    {s.num}
                  </span>
                </div>

                <h3
                  className="font-heading font-semibold text-sm text-foreground mb-1.5 leading-snug"
                >
                  {s.title}
                </h3>
                <p
                  className="text-xs text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {s.desc}
                </p>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* ── Mobile vertical timeline ── */}
      <div className="md:hidden space-y-0">
        {steps.map((s, i) => {
          const isStaggered = i < STAGGER_CAP;
          const Tag = isStaggered ? motion.div : "div";
          const props = isStaggered
            ? {
                variants: fadeIn,
                initial: "hidden" as const,
                whileInView: "visible" as const,
                viewport: { once: true },
              }
            : {};
          const Icon = s.icon;
          const isLast = i === steps.length - 1;

          return (
            <Tag key={s.num} className="flex items-start gap-4 relative" {...props}>
              {/* Left: icon + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="relative w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <Icon size={20} strokeWidth={1.75} className="text-primary-600" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-600 text-white text-[9px] font-bold font-mono flex items-center justify-center">
                    {s.num}
                  </span>
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-primary-100 mt-2 mb-0 min-h-[24px]" />
                )}
              </div>

              {/* Right: text */}
              <div className={`pt-1 ${isLast ? "pb-0" : "pb-6"}`}>
                <h3 className="font-heading font-semibold text-sm text-foreground mb-1">
                  {s.title}
                </h3>
                <p
                  className="text-xs text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {s.desc}
                </p>
              </div>
            </Tag>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
