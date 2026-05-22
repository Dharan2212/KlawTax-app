import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import SectionWrapper from "@/components/layout/SectionWrapper";
import { staggerContainer, staggerItem, fadeIn, useIsMobile } from "@/lib/motion";

const testimonials = [
  { name: "Rajesh Kumar",   role: "NGO Founder, Delhi",        text: "KlawTax made our Section 8 registration effortless. Completed in just 18 days with full support!", rating: 5 },
  { name: "Priya Sharma",   role: "Trust Secretary, Mumbai",   text: "The complete package saved us ₹25,000. Professional team and transparent process throughout.",     rating: 5 },
  { name: "Dr. Anil Mehta", role: "Hospital Director, Pune",   text: "Excellent service for our hospital trust registration. The team was responsive and knowledgeable.", rating: 5 },
  { name: "Sunita Devi",    role: "Social Worker, Jaipur",     text: "WhatsApp support was incredibly convenient. Got our 12A & 80G registration without any hassle.",   rating: 5 },
  { name: "Vikram Singh",   role: "Startup Founder, Bangalore",text: "Pvt Ltd registration was smooth. Great team, clear communication, and no hidden charges.",          rating: 5 },
];

// Use inline styles for avatar colours (avoids missing Tailwind class issue)
const AVATAR_STYLES = [
  { bg: "#DBEAFE",    color: "#1E3A8A"    },
  { bg: "#FEF3C7",     color: "#B45309"     },
  { bg: "#DCFCE7",    color: "#15803D"    },
  { bg: "#EFF6FF",     color: "#2563EB"    },
  { bg: "#EDE9FE",  color: "#4C1D95"  },
];

function getInitials(name: string): string {
  const parts = name.split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : parts[0].slice(0, 2);
}

const STAGGER_CAP = 4;

export default function TestimonialsCarousel() {
  const isMobile = useIsMobile();

  return (
    <SectionWrapper background="muted">
      {/* ── Heading ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-12"
      >
        <motion.h2 variants={staggerItem} className="section-heading text-foreground mb-4">
          Trusted by <span className="gradient-text">Thousands</span>
        </motion.h2>
        <motion.p variants={staggerItem} className="body-lg text-muted-foreground">
          Real clients, real results — across India
        </motion.p>
      </motion.div>

      {/* ── Cards ── */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4"
        style={{ scrollbarWidth: "none" }}
      >
        {testimonials.map((t, i) => {
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
          const avatar = AVATAR_STYLES[i % AVATAR_STYLES.length];
          const initials = getInitials(t.name);

          return (
            <Tag
              key={i}
              className="flex-shrink-0 w-[300px] md:w-[340px] snap-center flex flex-col hover-lift"
              style={{
                padding: "24px",
                background: "white",
                borderRadius: "var(--radius-xl)",
                border: "1px solid #E2E8F0",
                boxShadow: "var(--shadow-md)",
              }}
              {...props}
            >
              {/* Quote icon + stars */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      size={13}
                      strokeWidth={0}
                      style={{ fill: "#F59E0B", color: "#F59E0B" }}
                    />
                  ))}
                </div>
                <Quote
                  size={18}
                  strokeWidth={1.5}
                  style={{ color: "#BFDBFE", opacity: 0.8 }}
                />
              </div>

              {/* Quote text */}
              <blockquote
                className="text-sm leading-relaxed flex-1 mb-5"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: "#334155",
                  lineHeight: 1.7,
                }}
              >
                "{t.text}"
              </blockquote>

              {/* Divider */}
              <div
                className="mb-4"
                style={{ height: "1px", background: "#F1F5F9" }}
              />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: avatar.bg,
                    color: avatar.color,
                    fontFamily: "'Sora', sans-serif",
                    border: "1.5px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {initials}
                </div>
                <div>
                  <p
                    className="font-semibold text-sm leading-tight"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      color: "#0F172A",
                    }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: "#64748B",
                    }}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
            </Tag>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
