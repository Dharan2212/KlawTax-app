import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  SERVICES_LIST,
  SERVICE_CATEGORIES,
  type ServiceCategory,
  type Service,
} from "@/lib/services";
import { getServiceIcon, CATEGORY_ICON_STYLE } from "@/lib/serviceIcons";
import { staggerContainer, staggerItem } from "@/lib/motion";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_ORDER: ServiceCategory[] = ["ngo", "business", "compliance", "reports", "digital"];

const CAT_META: Record<ServiceCategory, { label: string; color: string; bg: string; border: string }> = {
  ngo:        { label: "NGO Services",         color: "#1E3A8A", bg: "#DBEAFE", border: "rgba(30,58,138,0.18)"  },
  business:   { label: "Business & Licenses",  color: "#4C1D95", bg: "#EDE9FE", border: "rgba(76,29,149,0.18)"  },
  compliance: { label: "Compliance & Tax",      color: "#15803D", bg: "#DCFCE7", border: "rgba(21,128,61,0.18)"  },
  reports:    { label: "Reports & Content",     color: "#B45309", bg: "#FEF3C7", border: "rgba(180,83,9,0.18)"   },
  digital:    { label: "Digital Services",      color: "#0369A1", bg: "#E0F2FE", border: "rgba(3,105,161,0.18)"  },
};

// Precomputed count per category — never recalculated at runtime
const CATEGORY_COUNTS = CATEGORY_ORDER.reduce<Record<string, number>>((acc, cat) => {
  acc[cat] = SERVICES_LIST.filter((s) => s.category === cat).length;
  return acc;
}, {});

// ─── CategoryTab ─────────────────────────────────────────────────────────────

interface TabProps {
  id: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

function CategoryTab({ id, active, count, onClick }: TabProps) {
  const label = id === "all" ? "All Services" : (CAT_META[id as ServiceCategory]?.label ?? id);
  const totalCount = id === "all" ? SERVICES_LIST.length : count;

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: "0.875rem",
        padding: "8px 18px",
        borderRadius: "9999px",
        border: active ? "1.5px solid transparent" : "1.5px solid #E2E8F0",
        background: active
          ? "linear-gradient(90deg, #1E3A8A, #4C1D95)"
          : "transparent",
        color: active ? "#fff" : "#64748B",
        boxShadow: active ? "0 4px 16px rgba(30,58,138,0.22)" : "none",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
        flexShrink: 0,
        transition: "background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
      }}
    >
      {label}
      {typeof totalCount === "number" && (
        <span
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: "9999px",
            background: active ? "rgba(255,255,255,0.20)" : "rgba(100,116,139,0.10)",
            color: active ? "rgba(255,255,255,0.90)" : "#94A3B8",
            lineHeight: 1.6,
          }}
        >
          {totalCount}
        </span>
      )}
    </button>
  );
}

// ─── ServiceCard ──────────────────────────────────────────────────────────────

function ServiceCard({ service }: { service: Service }) {
  const Icon = getServiceIcon(service.icon ?? service.slug);
  const iconStyle = CATEGORY_ICON_STYLE[service.category] ?? CATEGORY_ICON_STYLE["ngo"];
  const cat = CAT_META[service.category];
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={`/services/${service.slug}`}
      style={{ textDecoration: "none", display: "block", height: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="service-card h-full flex flex-col"
        style={{
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 16px 48px rgba(15,27,76,0.15)"
            : "0 2px 8px rgba(15,27,76,0.08)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Top accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5 origin-left"
          style={{
            background: "linear-gradient(90deg, #1E3A8A, #7C3AED)",
            transform: hovered ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          }}
        />

        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
            style={{
              background: hovered ? "linear-gradient(135deg,#1E3A8A,#7C3AED)" : iconStyle.bg,
              border: `1px solid ${iconStyle.border}`,
              boxShadow: hovered ? "0 4px 16px rgba(30,58,138,0.28)" : "none",
              transition: "background 0.25s ease, box-shadow 0.25s ease",
            }}
          >
            <Icon
              size={22}
              strokeWidth={1.75}
              style={{
                color: hovered ? "#fff" : iconStyle.icon,
                transition: "color 0.2s ease",
              }}
            />
          </div>
          <ArrowRight
            size={14}
            strokeWidth={2.5}
            style={{
              color: hovered ? "#1E3A8A" : "#CBD5E1",
              transform: hovered ? "translateX(3px)" : "translateX(0)",
              transition: "color 0.2s ease, transform 0.2s ease",
            }}
          />
        </div>

        {/* Category badge */}
        <div className="mb-2">
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 600,
              background: cat?.bg,
              color: cat?.color,
              border: `1px solid ${cat?.border}`,
            }}
          >
            {cat?.label}
          </span>
        </div>

        {/* Title */}
        <h3
          className="mb-2"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: hovered ? "#1E3A8A" : "#0F1B4C",
            lineHeight: 1.3,
            transition: "color 0.2s ease",
          }}
        >
          {service.title}
        </h3>

        {/* Description */}
        <p
          className="flex-1 mb-4"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.8125rem",
            color: "#64748B",
            lineHeight: 1.65,
          }}
        >
          {service.description}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-auto pt-4"
          style={{ borderTop: "1px solid #F1F5F9" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "1rem",
              color: "#D97706",
              fontWeight: 600,
            }}
          >
            {service.price}
          </div>
          {service.featured && (
            <span
              className="px-2.5 py-1 rounded-full"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.625rem",
                fontWeight: 700,
                background: "linear-gradient(90deg,#D97706,#F59E0B)",
                color: "#0F172A",
              }}
            >
              ★ POPULAR
            </span>
          )}
          {service.badge && !service.featured && (
            <span
              className="px-2.5 py-1 rounded-full"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.625rem",
                fontWeight: 700,
                background: "rgba(30,58,138,0.08)",
                color: "#1E3A8A",
              }}
            >
              {service.badge}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ category }: { category: string }) {
  return (
    <div
      className="text-center py-16"
      style={{
        background: "rgba(248,250,252,0.5)",
        borderRadius: "16px",
        border: "1.5px dashed #E2E8F0",
      }}
    >
      <div
        style={{
          fontFamily: "'Sora', sans-serif",
          fontWeight: 700,
          fontSize: "1.125rem",
          color: "#0F1B4C",
          marginBottom: "8px",
        }}
      >
        No services found
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.875rem",
          color: "#94A3B8",
        }}
      >
        No services are currently listed under{" "}
        <strong>{CAT_META[category as ServiceCategory]?.label ?? category}</strong>.
      </p>
    </div>
  );
}

// ─── Grid animation variants ──────────────────────────────────────────────────

const gridVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
  },
};

// ─── Main component ───────────────────────────────────────────────────────────

interface ServicesGridProps {
  /** Limit total cards shown (used on homepage). When set, always renders a flat grid. */
  limit?: number;
}

export default function ServicesGrid({ limit }: ServicesGridProps) {
  const location   = useLocation();
  const onServicesPage = location.pathname === "/services";

  // URL params — only used on /services page
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive initial category from URL (only on /services page)
  const urlCategory = onServicesPage ? (searchParams.get("category") ?? "all") : "all";

  // Validate URL category is real
  const validUrlCategory =
    urlCategory === "all" || CATEGORY_ORDER.includes(urlCategory as ServiceCategory)
      ? urlCategory
      : "all";

  const [activeCategory, setActiveCategory] = useState<string>(validUrlCategory);

  // Sync state if URL changes (e.g. browser back/forward)
  useEffect(() => {
    if (onServicesPage) {
      setActiveCategory(validUrlCategory);
    }
  }, [validUrlCategory, onServicesPage]);

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setActiveCategory(cat);
      if (onServicesPage) {
        if (cat === "all") {
          setSearchParams({}, { replace: true });
        } else {
          setSearchParams({ category: cat }, { replace: true });
        }
      }
    },
    [onServicesPage, setSearchParams]
  );

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered: Service[] =
    activeCategory === "all"
      ? SERVICES_LIST
      : SERVICES_LIST.filter((s) => s.category === activeCategory);

  // When limit is set, always render a flat grid (homepage mode).
  // When no limit, render grouped view in "all" mode.
  const isHomepageMode = Boolean(limit);

  // For flat grid / homepage
  const displayedFlat = isHomepageMode ? filtered.slice(0, limit) : filtered;

  // For grouped view (services page, no limit, activeCategory==="all")
  const grouped =
    !isHomepageMode && activeCategory === "all"
      ? CATEGORY_ORDER.reduce<Record<string, Service[]>>((acc, cat) => {
          const svcs = SERVICES_LIST.filter((s) => s.category === cat);
          if (svcs.length) acc[cat] = svcs;
          return acc;
        }, {})
      : null;

  const showGrouped = grouped !== null;

  return (
    <section
      className="py-16 md:py-24"
      style={{ background: "#F8FAFC" }}
      id="services-grid"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-10"
        >
          <motion.div variants={staggerItem} className="flex justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                background: "rgba(30,58,138,0.07)",
                border: "1px solid rgba(30,58,138,0.14)",
                color: "#1E3A8A",
                letterSpacing: "0.04em",
              }}
            >
              {SERVICES_LIST.length} SERVICES ACROSS 5 CATEGORIES
            </span>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            id="services-heading"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.015em",
              color: "#1A2D6B",
            }}
            className="mb-3"
          >
            Everything Your NGO &{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #1E3A8A, #7C3AED)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Business Needs
            </span>
          </motion.h2>

          <motion.p
            variants={staggerItem}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1.0625rem",
              color: "#64748B",
              lineHeight: 1.7,
            }}
            className="max-w-2xl mx-auto"
          >
            Transparent flat fees — complete, end-to-end professional legal services.
          </motion.p>
        </motion.div>

        {/* ── Filter tabs ── */}
        {/*
          Mobile: horizontally scrollable single row (no wrapping).
          Desktop: centered flex row.
        */}
        <div
          className="mb-10"
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            /* Hide scrollbar cross-browser */
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div
            className="flex items-center gap-2"
            style={{
              /* On mobile: min-content width so tabs don't wrap */
              width: "max-content",
              minWidth: "100%",
              justifyContent: "center",
              padding: "4px 16px 8px",
            }}
          >
            <CategoryTab
              id="all"
              active={activeCategory === "all"}
              onClick={() => handleCategoryChange("all")}
            />
            {CATEGORY_ORDER.map((cat) => (
              <CategoryTab
                key={cat}
                id={cat}
                count={CATEGORY_COUNTS[cat]}
                active={activeCategory === cat}
                onClick={() => handleCategoryChange(cat)}
              />
            ))}
          </div>
        </div>

        {/* ── Service cards ── */}
        <AnimatePresence mode="wait">
          {showGrouped ? (
            /* ── Grouped view (services page, all tab) ── */
            <motion.div
              key="grouped"
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-12"
            >
              {CATEGORY_ORDER.map((cat) => {
                const svcs = grouped![cat];
                if (!svcs?.length) return null;
                const meta = CAT_META[cat];

                return (
                  <div key={cat} id={`category-${cat}`}>
                    {/* Category header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1 h-8 rounded-full flex-shrink-0"
                          style={{ background: meta.color }}
                        />
                        <div>
                          <h3
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              fontWeight: 700,
                              fontSize: "1.125rem",
                              color: "#0F1B4C",
                            }}
                          >
                            {meta.label}
                          </h3>
                          <p
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontSize: "0.75rem",
                              color: "#94A3B8",
                            }}
                          >
                            {svcs.length} service{svcs.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCategoryChange(cat)}
                        className="flex items-center gap-1 hover:opacity-80"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                          color: meta.color,
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textDecoration: "none",
                          padding: 0,
                        }}
                      >
                        View all <ChevronRight size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Cards grid */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-60px" }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                    >
                      {svcs.map((s) => (
                        <motion.div key={s.id} variants={staggerItem}>
                          <ServiceCard service={s} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* ── Flat grid (filtered single category, or homepage with limit) ── */
            <motion.div
              key={activeCategory}
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {displayedFlat.length === 0 ? (
                <EmptyState category={activeCategory} />
              ) : (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                >
                  {displayedFlat.map((s) => (
                    <motion.div key={s.id} variants={staggerItem}>
                      <ServiceCard service={s} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "View all" CTA — only on homepage when limit truncates ── */}
        {isHomepageMode && SERVICES_LIST.length > (limit ?? 0) && (
          <div className="text-center mt-12">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                color: "#1E3A8A",
                border: "1.5px solid #1E3A8A",
                background: "transparent",
                textDecoration: "none",
                fontSize: "0.9375rem",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "#EFF6FF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              }}
            >
              View All {SERVICES_LIST.length} Services{" "}
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
