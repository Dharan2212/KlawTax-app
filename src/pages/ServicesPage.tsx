import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import SEO from "@/components/shared/SEO";
import Footer from "@/components/layout/Footer";
import SectionWrapper from "@/components/layout/SectionWrapper";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import { SERVICES_LIST, SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/services";
import { ServiceIcon } from "@/lib/serviceIcons";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/motion";

const ALL_CATS = [
  { value: "all", label: "All Services", icon: "" },
  ...SERVICE_CATEGORIES.map((c) => ({ value: c.id, label: c.label, icon: c.icon })),
];

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCategory>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const byCategory =
      activeCategory === "all"
        ? SERVICES_LIST
        : SERVICES_LIST.filter((s) => s.category === activeCategory);
    const q = search.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="All Legal & NGO Services | KlawTax"
        description="Browse all NGO registration, business compliance, audit, certification, and digital services offered by KlawTax with transparent pricing."
        keywords="NGO registration, GST, ISO certification, audit services, Section 8, legal services India"
        canonical="/services"
      />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-14" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-5">
              <ServiceIcon name="Globe" size={13} className="text-white/60" />
              India's Trusted Legal Services Platform
            </span>
            <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-4 leading-tight tracking-tight">
              All Legal &amp; NGO Services
            </h1>
            <p className="text-white/70 text-base md:text-lg mb-8 leading-relaxed">
              Expert guidance at transparent flat fees. Find the right service for your organization.
            </p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent-400/60 text-sm transition"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="border-b border-border bg-background sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto">
            {ALL_CATS.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveCategory(c.value as "all" | ServiceCategory)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === c.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.icon && <ServiceIcon name={c.icon} size={14} strokeWidth={2} />}
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <SectionWrapper spacing="sm">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> service{filtered.length !== 1 ? "s" : ""}
          </p>
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-primary hover:underline">
              Clear search
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <motion.div
            key={activeCategory + search}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filtered.map((s) => (
              <motion.div
                key={s.id}
                variants={staggerItem}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover-lift flex flex-col"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <ServiceIcon name={s.icon} size={20} strokeWidth={1.75} />
                    </div>
                    <span className="badge-premium capitalize text-xs">{s.category}</span>
                  </div>
                  <h3 className="font-heading font-semibold text-base text-foreground mb-2 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
                    {s.description}
                  </p>
                  <div className="mb-5">
                    <span className="font-mono font-bold text-xl text-primary tracking-tight">{s.price}</span>
                    {s.processingTime && (
                      <span className="ml-2 text-xs text-muted-foreground">· {s.processingTime}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`/services/${s.slug}`}
                      className="flex-1 text-center py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      to="/checkout"
                      className="flex items-center justify-center gap-1.5 flex-[1.4] py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm"
                    >
                      Start Now
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-muted-foreground" />
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground text-sm mb-6">Try adjusting your search or browse a different category.</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("all"); }}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              View all services
            </button>
          </motion.div>
        )}
      </SectionWrapper>

      {/* Trust strip */}
      <SectionWrapper background="muted" spacing="sm">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {[
            { icon: "ShieldCheck", text: "500+ NGOs Registered" },
            { icon: "Star",        text: "4.9 Google Rating" },
            { icon: "Clock",       text: "48hr Processing Start" },
            { icon: "BadgeCheck",  text: "100% Legal Compliance" },
          ].map((t) => (
            <div key={t.text} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ServiceIcon name={t.icon} size={16} className="text-primary" />
              {t.text}
            </div>
          ))}
        </div>
      </SectionWrapper>

      <Footer />
      <StickyMobileBar />
    </div>
  );
}
