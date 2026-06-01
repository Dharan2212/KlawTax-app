import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X, MessageCircle, ChevronDown, ArrowRight,
  Building2, ShieldCheck, BarChart3, Monitor, Phone,
  type LucideProps,
} from "lucide-react";
import type { FC } from "react";
import { COMPLETE_PACKAGE } from "@/lib/services";

// ── Config ────────────────────────────────────────────────

const WA_LINK =
  "https://wa.me/917387731313?text=" +
  encodeURIComponent("Hi KlawTax! I'd like to learn more about your services.");

const NAV_LINKS = [
  { label: "Services",   href: "/services"  },
  { label: "Pricing",    href: "/pricing"   },
  { label: "Blog",       href: "/blogs"     },
  { label: "About",      href: "/about"     },
  { label: "Contact",    href: "/contact"   },
];

interface ServiceMenuItem {
  icon: FC<LucideProps>;
  label: string;
  sub: string;
  href: string;
}

const SERVICE_MENU: ServiceMenuItem[] = [
  { icon: ShieldCheck,  label: "NGO Services",        sub: "12A, 80G, DARPAN, E-Anudan",     href: "/services?category=ngo"        },
  { icon: Building2,    label: "Business & Licenses",  sub: "Section 8, Pvt Ltd, LLP",        href: "/services?category=business"   },
  { icon: BarChart3,    label: "Compliance & Tax",     sub: "ITR, Audit, GST, Annual Filings", href: "/services?category=compliance"  },
  { icon: Monitor,      label: "Digital Services",     sub: "Website, SEO, AWS, Campaigns",   href: "/services?category=digital"    },
];

// ── Animation variants ─────────────────────────────────────

const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { type: "spring", stiffness: 320, damping: 32 } },
  exit:   { x: "100%", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const dropdownVariants: Variants = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.18, ease: [0, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -4, scale: 0.97, transition: { duration: 0.12 } },
};

const linkListVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
};

const linkItemVariants: Variants = {
  hidden:  { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
};

// ── Navbar component ──────────────────────────────────────

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  // Scroll watcher
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isDark    = !scrolled && location.pathname === "/";
  const textColor = isDark ? "rgba(255,255,255,0.90)" : "#0F1B4C";
  const logoGold  = "#F59E0B";

  return (
    <>
      {/* ── Main Navbar bar ── */}
      <header
        role="banner"
        aria-label="Site header"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background:    scrolled ? "rgba(255,255,255,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(14px)" : "none",
          boxShadow:      scrolled ? "0 1px 0 rgba(15,27,76,0.08)" : "none",
          padding:        scrolled ? "12px 0" : "18px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" aria-label="KlawTax home" style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily:    "'Sora', sans-serif",
                fontWeight:    800,
                fontSize:      "1.375rem",
                letterSpacing: "-0.025em",
                color:         scrolled ? "#0F1B4C" : "white",
                transition:    "color 0.3s",
              }}
            >
              Klaw<span style={{ color: logoGold }}>Tax</span>
              <span style={{ fontWeight: 400, fontSize: "0.6em", opacity: 0.55, marginLeft: "2px" }}>
                .online
              </span>
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            {/* Services with dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
                style={{ fontFamily: "'DM Sans', sans-serif", color: textColor }}
                onMouseEnter={(e) => !isDark && (e.currentTarget.style.background = "#EFF6FF")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Services
                <ChevronDown
                  size={13}
                  strokeWidth={2.5}
                  className="transition-transform duration-200"
                  style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] rounded-2xl overflow-hidden shadow-xl"
                    style={{ background: "white", border: "1px solid #E2E8F0" }}
                  >
                    <div className="p-2">
                      {SERVICE_MENU.map(({ icon: Icon, label, sub, href }) => (
                        <Link
                          key={href}
                          to={href}
                          className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                          style={{ textDecoration: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(30,58,138,0.08)" }}>
                            <Icon size={18} strokeWidth={1.75} style={{ color: "#1E3A8A" }} />
                          </div>
                          <div>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.875rem", color: "#0F1B4C" }}>{label}</p>
                            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#94A3B8" }}>{sub}</p>
                          </div>
                          <ArrowRight size={12} strokeWidth={2.5} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1E3A8A" }} />
                        </Link>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid #F1F5F9" }}>
                      <Link to="/services" className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1E3A8A", textDecoration: "none" }}>
                        View all services <ArrowRight size={11} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Other nav links */}
            {NAV_LINKS.slice(1).map(({ label, href }) => {
              const isActive = location.pathname === href ||
                (href === "/blogs" && location.pathname.startsWith("/blogs"));
              return (
                <Link
                  key={href}
                  to={href}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: isActive ? "#1E3A8A" : textColor,
                    textDecoration: "none",
                    background: isActive && !isDark ? "#EFF6FF" : "transparent",
                    borderBottom: isActive ? "2px solid #1E3A8A" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => !isDark && (e.currentTarget.style.background = "#EFF6FF")}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isActive && !isDark ? "#EFF6FF" : "transparent"; }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div className="hidden lg:flex items-center gap-2.5">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
              style={{ fontFamily: "'DM Sans', sans-serif", color: isDark ? "rgba(255,255,255,0.85)" : "#15803D", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.10)" : "#DCFCE7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <MessageCircle size={15} strokeWidth={2} />
              WhatsApp
            </a>
            <Link
              to="/checkout?service=section8-complete"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background:  "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                color:       "#0F172A",
                boxShadow:   "0 4px 16px rgba(217,119,6,0.32)",
                textDecoration: "none",
              }}
            >
              Get Started
              <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-colors duration-150"
            style={{ background: mobileOpen ? "rgba(30,58,138,0.08)" : "transparent" }}
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 rounded-full transition-colors"
              style={{ width: "20px", background: scrolled ? "#0F1B4C" : "white" }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block h-0.5 rounded-full"
              style={{ width: "20px", background: scrolled ? "#0F1B4C" : "white" }}
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="block h-0.5 rounded-full"
              style={{ width: "20px", background: scrolled ? "#0F1B4C" : "white" }}
            />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(10,15,35,0.65)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 bottom-0 z-50 lg:hidden flex flex-col"
              style={{ width: "min(360px, 100vw)", background: "white", boxShadow: "-4px 0 40px rgba(10,15,35,0.20)" }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <Link to="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                  <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#0F1B4C", letterSpacing: "-0.02em" }}>
                    Klaw<span style={{ color: "#F59E0B" }}>Tax</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ background: "#F1F5F9", color: "#64748B" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#E2E8F0")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#F1F5F9")}
                  aria-label="Close menu"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto">
                {/* Service category quick links */}
                <div className="px-4 pt-4 pb-2">
                  <p className="px-2 mb-2.5 text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif", color: "#94A3B8" }}>Services</p>
                  <motion.div variants={linkListVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-2">
                    {SERVICE_MENU.map(({ icon: Icon, label, sub, href }) => (
                      <motion.div key={href} variants={linkItemVariants}>
                        <Link
                          to={href}
                          onClick={() => setMobileOpen(false)}
                          className="flex flex-col gap-1 p-3 rounded-xl transition-colors"
                          style={{ textDecoration: "none", background: "#F8FAFC", border: "1px solid #F1F5F9" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        >
                          <Icon size={18} strokeWidth={1.75} style={{ color: "#1E3A8A" }} />
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.75rem", color: "#0F1B4C", lineHeight: 1.3 }}>{label}</p>
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6875rem", color: "#94A3B8", lineHeight: 1.4 }}>{sub}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Main nav links */}
                <motion.nav
                  variants={linkListVariants}
                  initial="hidden"
                  animate="visible"
                  className="px-4 pt-2 pb-2"
                >
                  <p className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif", color: "#94A3B8" }}>Pages</p>
                  {[
                    { label: "All Services",    href: "/services"  },
                    { label: "Pricing",          href: "/pricing"   },
                    { label: "Blog & Guides",    href: "/blogs"     },
                    { label: "About Us",         href: "/about"     },
                    { label: "Contact",          href: "/contact"   },
                    { label: "My Dashboard",     href: "/dashboard" },
                  ].map(({ label, href }) => (
                    <motion.div key={href} variants={linkItemVariants}>
                      <Link
                        to={href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-between px-4 py-3 rounded-xl transition-colors mb-0.5"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.9375rem", color: "#0F1B4C", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {label}
                        <ArrowRight size={14} strokeWidth={2.5} style={{ color: "#CBD5E1" }} />
                      </Link>
                    </motion.div>
                  ))}
                </motion.nav>

                {/* Contact quick info */}
                <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)", border: "1px solid #BFDBFE" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 700, color: "#1E3A8A", marginBottom: "8px" }}>REACH US DIRECTLY</p>
                  <a href="tel:+917387731313" className="flex items-center gap-2 mb-2" style={{ textDecoration: "none" }}>
                    <Phone size={13} strokeWidth={2} style={{ color: "#1E3A8A", flexShrink: 0 }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#0F1B4C", fontWeight: 500 }}>+91 73877 31313</span>
                  </a>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#64748B" }}>Mon–Sat, 9 AM – 7 PM IST</p>
                </div>
              </div>

              {/* Drawer footer CTAs */}
              <div className="px-4 py-4 flex flex-col gap-2.5" style={{ borderTop: "1px solid #F1F5F9", background: "white" }}>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: "#25D366", color: "white", textDecoration: "none", boxShadow: "0 4px 16px rgba(37,211,102,0.30)" }}
                >
                  <MessageCircle size={16} strokeWidth={2} />
                  Chat on WhatsApp
                </a>
                <Link
                  to="/checkout?service=section8-complete"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                  style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", textDecoration: "none", boxShadow: "0 4px 16px rgba(217,119,6,0.28)" }}
                >
                  Get Started — ₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
