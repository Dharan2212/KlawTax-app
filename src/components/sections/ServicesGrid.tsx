import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import {
  SERVICES_LIST,
  SERVICE_CATEGORIES, 
  getServicesByCategory,
  type ServiceCategory,
} from "@/lib/services";
import { getServiceIcon } from "@/lib/serviceIcons";
import SectionWrapper from "@/components/layout/SectionWrapper";
import {
  staggerContainer,
  staggerItem,
  fadeIn,
  scaleIn,
  useIsMobile,
} from "@/lib/motion";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STAGGER_CAP = 6;

/** Per-category accent colours using design tokens */
const CATEGORY_PALETTE: Record<
  ServiceCategory,
  { icon: string; bg: string; text: string }
> = {
  ngo: {
    icon: "hsl(var(--color-primary-600))",
    bg: "hsl(var(--color-primary-100))",
    text: "hsl(var(--color-primary-700))",
  },
  business: {
    icon: "hsl(var(--color-secondary-500))",
    bg: "hsl(var(--color-secondary-100))",
    text: "hsl(var(--color-secondary-700))",
  },
  audit: {
    icon: "hsl(var(--color-accent-500))",
    bg: "hsl(var(--color-accent-100))",
    text: "hsl(var(--color-accent-600))",
  },
  digital: {
    icon: "hsl(var(--color-info-500))",
    bg: "hsl(188 40% 90%)",
    text: "hsl(var(--color-info-500))",
  },
};

// ─────────────────────────────────────────────
// Grid animation — re-enters on tab switch
// ─────────────────────────────────────────────

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ─────────────────────────────────────────────
// Service Card
// ─────────────────────────────────────────────

function ServiceCard({
  service,
  index,
  isMobile,
}: {
  service: (typeof SERVICES_LIST)[0];
  index: number;
  isMobile: boolean;
}) {
  const pal = CATEGORY_PALETTE[service.category];
  const Icon = getServiceIcon(service.icon);
  const isStaggered = index < STAGGER_CAP;
  const visibleFeatures = service.features.slice(0, 3);

  const motionProps = isStaggered
    ? {
        variants: isMobile ? fadeIn : staggerItem,
        initial: "hidden" as const,
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-40px" },
      }
    : {};

  return (
    <motion.div
      className="group premium-card hover-lift cursor-pointer relative overflow-hidden flex flex-col"
      style={{ padding: "28px" }}
      {...motionProps}
    >
      {/* Top accent stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
        style={{
          background: `linear-gradient(90deg, ${pal.icon}, hsl(var(--color-secondary-500)))`,
        }}
      />

      {/* Icon + badge row */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: pal.bg,
            boxShadow: `0 4px 12px ${pal.icon}22`,
          }}
        >
          <Icon size={22} strokeWidth={1.75} style={{ color: pal.icon }} />
        </div>

        {(service.badge || service.featured) && (
          <span
            className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full flex-shrink-0"
            style={{
              background: "hsl(var(--color-accent-100))",
              color: "hsl(var(--color-accent-600))",
              border: "1px solid hsl(var(--color-accent-400) / 0.25)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {service.badge ?? "Most Popular"}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="card-title text-foreground mb-2"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {service.title}
      </h3>

      {/* Description */}
      <p
        className="text-sm text-muted-foreground mb-4 line-clamp-2"
        style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
      >
        {service.description}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-2 mb-4">
        <span
          className="font-bold text-xl"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            color: pal.icon,
          }}
        >
          {service.price}
        </span>
        {service.advancePrice && (
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            or {service.advancePrice} advance
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-1.5 mb-4 flex-1">
        {visibleFeatures.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-xs text-muted-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55 }}
          >
            <span
              className="mt-[3px] flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center"
              style={{ background: `${pal.icon}18` }}
            >
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                fill="none"
                style={{ color: pal.icon }}
              >
                <path
                  d="M1.5 4L3 5.5L6.5 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Processing time */}
      {service.processingTime && (
        <div className="flex items-center gap-1.5 mb-5">
          <Clock
            size={12}
            strokeWidth={2}
            className="text-muted-foreground flex-shrink-0"
          />
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {service.processingTime}
          </span>
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-3 mt-auto">
        <Link
          to={`/services/${service.slug}`}
          className="flex-1 text-center py-3 rounded-xl border text-sm font-semibold transition-all duration-200"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            borderColor: "hsl(var(--border) / 0.6)",
            color: "hsl(var(--color-neutral-700))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = `${pal.icon}66`;
            e.currentTarget.style.color = pal.icon;
            e.currentTarget.style.background = pal.bg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "hsl(var(--border) / 0.6)";
            e.currentTarget.style.color = "hsl(var(--color-neutral-700))";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Details
        </Link>
        <Link
          to={`/checkout?service=${service.slug}`}
          className="flex-[1.5] flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold btn-premium"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Get Started
          <ArrowRight size={13} strokeWidth={2.5} />
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────

export default function ServicesGrid() {
  const isMobile = useIsMobile();
  const [activeCategory, setActiveCategory] =
    useState<ServiceCategory>("ngo");

  const filteredServices = getServicesByCategory(activeCategory);
  const activePal = CATEGORY_PALETTE[activeCategory];
  const activeMeta = SERVICE_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <SectionWrapper id="services" spacing="lg">
      {/* ── Section heading ── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="text-center mb-12"
      >
        <motion.h2
          variants={staggerItem}
          className="section-heading text-foreground mb-4"
        >
          Everything Your{" "}
          <span className="gradient-text">NGO or Business</span> Needs
        </motion.h2>
        <motion.p
          variants={staggerItem}
          className="body-lg text-muted-foreground max-w-2xl mx-auto"
        >
          Professional legal services at transparent, flat fees — from
          registration to compliance, all under one roof.
        </motion.p>
      </motion.div>

      {/* ── Category tabs ── */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-wrap justify-center gap-2 mb-10"
      >
        {SERVICE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const CatIcon = getServiceIcon(cat.icon);
          const pal = CATEGORY_PALETTE[cat.id as ServiceCategory];
          const count = getServicesByCategory(cat.id as ServiceCategory).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as ServiceCategory)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: isActive ? pal.bg : "hsl(var(--color-neutral-100))",
                color: isActive ? pal.text : "hsl(var(--color-neutral-500))",
                border: isActive
                  ? `1.5px solid ${pal.icon}40`
                  : "1.5px solid transparent",
                boxShadow: isActive ? `0 4px 16px ${pal.icon}20` : "none",
                transform: isActive ? "translateY(-1px)" : "none",
              }}
            >
              <CatIcon
                size={15}
                strokeWidth={2}
                style={{ color: isActive ? pal.icon : "currentColor" }}
              />
              {cat.label}
              <span
                className="ml-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                style={{
                  background: isActive
                    ? `${pal.icon}20`
                    : "hsl(var(--color-neutral-200))",
                  color: isActive
                    ? pal.icon
                    : "hsl(var(--color-neutral-500))",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* ── Active category subtitle ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory + "-meta"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <span
            className="text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "hsl(var(--color-neutral-500))",
            }}
          >
            {activeMeta.description}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: activePal.bg,
              color: activePal.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {filteredServices.length} services
          </span>
        </motion.div>
      </AnimatePresence>

      {/* ── Services grid ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredServices.map((service, i) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={i}
              isMobile={isMobile}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* ── Bottom CTA ── */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center mt-14"
      >
        <p
          className="text-sm text-muted-foreground mb-4"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Want to see everything we offer?
        </p>
        <Link
          to="/services"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "hsl(var(--color-primary-700))",
            borderColor: "hsl(var(--color-primary-200))",
            background: "hsl(var(--color-primary-50))",
          }}
        >
          View All Services
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </motion.div>
    </SectionWrapper>
  );
}
