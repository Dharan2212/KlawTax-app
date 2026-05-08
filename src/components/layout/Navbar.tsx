import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  MessageCircle,
  ChevronDown,
  Scale,
  ArrowRight,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description: string }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Services",
    href: "/services",
    children: [
      {
        label: "NGO Services",
        href: "/services#ngo",
        description: "12A, 80G, DARPAN, E-Anudan & more",
      },
      {
        label: "Business Registration",
        href: "/services#business",
        description: "Section 8, Pvt Ltd, OPC, LLP",
      },
      {
        label: "Compliance & Tax",
        href: "/services#compliance",
        description: "GST, ITR, Audit, Annual Reports",
      },
      {
        label: "Certifications",
        href: "/services#certs",
        description: "ISO, FSSAI, IEC, DSC & more",
      },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Reset mobile accordion on close
  useEffect(() => {
    if (!mobileOpen) setMobileServicesOpen(false);
  }, [mobileOpen]);

  const openDropdown = (label: string) => {
    if (dropdownTimer.current) clearTimeout(dropdownTimer.current);
    setActiveDropdown(label);
  };

  const closeDropdown = () => {
    dropdownTimer.current = setTimeout(() => setActiveDropdown(null), 120);
  };

  const whatsappLink =
    "https://wa.me/918793949471?text=" +
    encodeURIComponent("Hi KlawTax! I'd like to know more about your services.");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .mobile-services-grid {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease;
        }
        .mobile-services-grid.open {
          grid-template-rows: 1fr;
        }
        .mobile-services-inner {
          overflow: hidden;
        }
      `}</style>

      <nav
        className={[
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/96 backdrop-blur-md shadow-[0_2px_24px_rgba(15,27,76,0.09)] py-3"
            : "bg-transparent py-5",
        ].join(" ")}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* ── Logo ── */}
          <a
            href="/"
            className="flex items-center gap-2.5 group select-none"
            aria-label="KlawTax Home"
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300"
              style={
                scrolled
                  ? { background: "#1E3A8A" }
                  : { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)" }
              }
            >
              <Scale size={16} className="text-white" strokeWidth={2} />
            </span>
            <span
              className="text-xl tracking-tight transition-colors duration-300"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: scrolled ? "#0F1B4C" : "#FFFFFF",
              }}
            >
              Klaw
              <span style={{ color: scrolled ? "#D97706" : "#F59E0B" }}>Tax</span>
            </span>
          </a>

          {/* ── Desktop Nav ── */}
          <ul className="hidden lg:flex items-center gap-0.5" role="navigation">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(item.label)}
                  onMouseLeave={closeDropdown}
                >
                  <button
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: scrolled ? "#334155" : "rgba(255,255,255,0.85)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = scrolled ? "#1E3A8A" : "#FFFFFF";
                      e.currentTarget.style.background = scrolled ? "#EFF6FF" : "rgba(255,255,255,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = scrolled ? "#334155" : "rgba(255,255,255,0.85)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.label}
                    <ChevronDown
                      size={13}
                      strokeWidth={2.5}
                      className="transition-transform duration-200"
                      style={{
                        transform: activeDropdown === item.label ? "rotate(180deg)" : "rotate(0deg)",
                        opacity: 0.7,
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className="absolute top-[calc(100%+8px)] left-0 w-[280px] bg-white rounded-2xl overflow-hidden transition-all duration-200 origin-top"
                    style={{
                      border: "1px solid #E8EDF3",
                      boxShadow: "0 8px 32px rgba(15,27,76,0.12), 0 2px 8px rgba(15,27,76,0.06)",
                      opacity: activeDropdown === item.label ? 1 : 0,
                      transform: activeDropdown === item.label
                        ? "translateY(0) scaleY(1)"
                        : "translateY(-6px) scaleY(0.96)",
                      pointerEvents: activeDropdown === item.label ? "auto" : "none",
                    }}
                    onMouseEnter={() => openDropdown(item.label)}
                    onMouseLeave={closeDropdown}
                  >
                    <div className="p-2">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="flex flex-col gap-0.5 px-4 py-3 rounded-xl transition-colors duration-150 group"
                          style={{ textDecoration: "none" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span
                            className="text-sm font-semibold group-hover:text-[#1E3A8A] transition-colors"
                            style={{ fontFamily: "'DM Sans', sans-serif", color: "#0F1B4C" }}
                          >
                            {child.label}
                          </span>
                          <span
                            className="text-xs"
                            style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B" }}
                          >
                            {child.description}
                          </span>
                        </a>
                      ))}
                    </div>
                    <div
                      className="px-4 py-3"
                      style={{ borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}
                    >
                      <a
                        href="/services"
                        className="flex items-center gap-1.5 font-semibold transition-all duration-150 hover:gap-2.5"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "#1E3A8A",
                          textDecoration: "none",
                        }}
                      >
                        View all services
                        <ArrowRight size={11} strokeWidth={2.5} />
                      </a>
                    </div>
                  </div>
                </li>
              ) : (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 block"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      color: scrolled ? "#334155" : "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = scrolled ? "#1E3A8A" : "#FFFFFF";
                      e.currentTarget.style.background = scrolled ? "#EFF6FF" : "rgba(255,255,255,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = scrolled ? "#334155" : "rgba(255,255,255,0.85)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              )
            )}
          </ul>

          {/* ── Desktop CTA ── */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* WhatsApp */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                color: scrolled ? "#15803D" : "#FFFFFF",
                border: scrolled
                  ? "1.5px solid rgba(34,197,94,0.35)"
                  : "1.5px solid rgba(255,255,255,0.22)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = scrolled
                  ? "#DCFCE7"
                  : "rgba(255,255,255,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <MessageCircle size={15} strokeWidth={2} />
              WhatsApp
            </a>

            {/* Get Started */}
            <a
              href="/services"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                boxShadow: "0 4px 16px rgba(217,119,6,0.30)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(217,119,6,0.42)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(217,119,6,0.30)";
              }}
            >
              Get Started
              <ArrowRight size={13} strokeWidth={2.5} />
            </a>
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
            style={{
              color: scrolled ? "#0F1B4C" : "#FFFFFF",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = scrolled
                ? "#F1F5F9"
                : "rgba(255,255,255,0.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} strokeWidth={2} /> : <Menu size={22} strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Overlay Menu ── */}
      <div
        className="fixed inset-0 z-40 lg:hidden transition-all duration-300"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: "rgba(15,23,42,0.58)" }}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <div
          className="absolute top-0 right-0 h-full flex flex-col bg-white shadow-2xl transition-transform duration-300"
          style={{
            width: "min(360px, 100vw)",
            transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {/* Mobile header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <span
              className="text-xl tracking-tight"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                color: "#0F1B4C",
                letterSpacing: "-0.02em",
              }}
            >
              Klaw<span style={{ color: "#D97706" }}>Tax</span>
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: "#64748B" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label}>
                  {/* Services accordion trigger */}
                  <button
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className="flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-colors text-left"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#0F1B4C" }}
                    >
                      {item.label}
                    </span>
                    <ChevronDown
                      size={14}
                      strokeWidth={2.5}
                      className="transition-transform duration-200"
                      style={{
                        color: "#94A3B8",
                        transform: mobileServicesOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    />
                  </button>

                  {/* Accordion content */}
                  <div
                    className={`mobile-services-grid ${mobileServicesOpen ? "open" : ""}`}
                  >
                    <div className="mobile-services-inner">
                      <div className="ml-3 mb-1 pt-0.5">
                        {item.children.map((child) => (
                          <a
                            key={child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex flex-col gap-0.5 px-4 py-2.5 rounded-xl transition-colors"
                            style={{ textDecoration: "none" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span
                              className="text-sm font-medium"
                              style={{ fontFamily: "'DM Sans', sans-serif", color: "#1E293B" }}
                            >
                              {child.label}
                            </span>
                            <span
                              className="text-xs"
                              style={{ fontFamily: "'DM Sans', sans-serif", color: "#94A3B8" }}
                            >
                              {child.description}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={item.label}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center px-4 py-3.5 rounded-xl transition-colors"
                    style={{ textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "'DM Sans', sans-serif", color: "#0F1B4C" }}
                    >
                      {item.label}
                    </span>
                  </a>
                </div>
              )
            )}
          </nav>

          {/* Mobile CTAs */}
          <div
            className="px-4 py-5 flex flex-col gap-2.5"
            style={{ borderTop: "1px solid #F1F5F9" }}
          >
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold transition-colors"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "13px 0",
                color: "#15803D",
                border: "1.5px solid rgba(34,197,94,0.45)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#DCFCE7")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <MessageCircle size={17} strokeWidth={2} />
              Chat on WhatsApp
            </a>
            <a
              href="/services"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-[#0F172A] transition-all"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "13px 0",
                background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                boxShadow: "0 4px 16px rgba(217,119,6,0.28)",
                textDecoration: "none",
              }}
            >
              Get Started
              <ArrowRight size={14} strokeWidth={2.5} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
