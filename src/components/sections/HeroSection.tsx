import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  BadgeCheck,
  Star,
  Clock,
  CheckCircle2,
  Building2,
  FileText,
  Landmark,
  MapPin,
} from "lucide-react";
import { COMPLETE_PACKAGE } from "@/lib/services";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface PackageFeature {
  icon: React.ReactNode;
  label: string;
}

const PACKAGE_FEATURES: PackageFeature[] = [
  { icon: <Building2 size={14} strokeWidth={2} />, label: "Section 8 Company Registration" },
  { icon: <FileText size={14} strokeWidth={2} />, label: "12A & 80G Certification" },
  { icon: <Landmark size={14} strokeWidth={2} />, label: "NGO DARPAN + E-Anudan" },
  { icon: <CheckCircle2 size={14} strokeWidth={2} />, label: "PAN, TAN, DSC & DIN Included" },
];

const TRUST_STATS = [
  { value: "500+", label: "NGOs Registered", icon: <ShieldCheck size={16} /> },
  { value: "4.9★", label: "Google Rating", icon: <Star size={16} /> },
  { value: "48hr", label: "Processing Start", icon: <Clock size={16} /> },
  { value: "100%", label: "Legal Compliance", icon: <BadgeCheck size={16} /> },
];

/* ─────────────────────────────────────────────
   Animated counter hook
───────────────────────────────────────────── */
function useCountUp(target: string, active: boolean) {
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!active) return;
    const numMatch = target.match(/\d+/);
    if (!numMatch) { setDisplay(target); return; }

    const num = parseInt(numMatch[0]);
    const suffix = target.replace(/[\d]+/, "");
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * num) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target]);

  return display;
}

/* ─────────────────────────────────────────────
   Stat item
───────────────────────────────────────────── */
function StatItem({
  stat,
  active,
}: {
  stat: (typeof TRUST_STATS)[0];
  active: boolean;
}) {
  const displayed = useCountUp(stat.value, active);
  return (
    <div className="flex items-center gap-3 px-5 py-4 sm:px-6">
      <span className="text-[#F59E0B] opacity-90 flex-shrink-0">{stat.icon}</span>
      <div>
        <div
          className="text-lg sm:text-xl font-semibold text-[#F59E0B] leading-none tracking-tight tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
        >
          {displayed}
        </div>
        <div
          className="text-xs text-[#94A3B8] mt-1 whitespace-nowrap"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {stat.label}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function HeroSection() {
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const whatsappLink =
    "https://wa.me/917387731313?text=" +
    encodeURIComponent("Hi KlawTax! I'd like to know more about your services.");

  const stagger = (index: number, base = 110) =>
    ({ transitionDelay: `${index * base}ms` } as React.CSSProperties);

  const fadeUp = (visible: boolean, extra?: React.CSSProperties) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(24px)",
    transition: "opacity 0.65s cubic-bezier(0,0,0.2,1), transform 0.65s cubic-bezier(0,0,0.2,1)",
    ...extra,
  } as React.CSSProperties);

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .hero-card-float {
          animation: heroFloat 5.5s ease-in-out infinite;
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          40%       { transform: translateY(-10px) rotate(0.3deg); }
          70%       { transform: translateY(-5px) rotate(-0.2deg); }
        }

        .hero-orb-1 { animation: orbDrift1 14s ease-in-out infinite; }
        .hero-orb-2 { animation: orbDrift2 18s ease-in-out infinite; }
        .hero-orb-3 { animation: orbDrift3 22s ease-in-out infinite; }

        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(28px, -22px) scale(1.07); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-22px, 28px) scale(0.94); }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(16px, 16px) scale(1.04); }
        }

        .badge-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 1.5px solid rgba(245, 158, 11, 0.45);
          animation: badgePulse 3s ease-out infinite;
        }
        @keyframes badgePulse {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        .feature-item { transition: transform 0.2s ease; }
        .feature-item:hover { transform: translateX(3px); }

        .stat-divider:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.07);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse at 12% 45%, rgba(37, 99, 235, 0.20) 0%, transparent 52%),
            radial-gradient(ellipse at 88% 12%, rgba(124, 58, 237, 0.16) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 88%, rgba(217, 119, 6, 0.09) 0%, transparent 45%),
            linear-gradient(140deg, #0F1B4C 0%, #1A2D6B 42%, #2E1065 100%);
        }

        @keyframes ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          80%       { transform: translateY(8px); opacity: 0; }
        }

        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          55%       { transform: translateX(-50%) translateY(6px); }
        }

        .hero-card-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }
        .hero-card-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* Savings pulse banner */
        @keyframes savingsPulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1; }
        }
        .savings-pill {
          animation: savingsPulse 3s ease-in-out infinite;
        }

        /* Hero grid noise texture */
        .hero-noise {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="mesh-bg relative min-h-screen flex flex-col justify-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Noise texture overlay for depth */}
        <div
          className="hero-noise absolute inset-0 opacity-[0.018] pointer-events-none mix-blend-overlay"
        />

        {/* Background orbs */}
        <div
          className="hero-orb-1 absolute top-[12%] left-[6%] w-[480px] h-[480px] rounded-full opacity-[0.28] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.40) 0%, transparent 70%)" }}
        />
        <div
          className="hero-orb-2 absolute bottom-[8%] right-[4%] w-[560px] h-[560px] rounded-full opacity-[0.22] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.32) 0%, transparent 70%)" }}
        />
        <div
          className="hero-orb-3 absolute top-[55%] left-[45%] w-[320px] h-[320px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(217,119,6,0.25) 0%, transparent 70%)" }}
        />

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32 pb-16 sm:pb-20">
          <div className="grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_480px] gap-12 xl:gap-16 items-center">

            {/* ── LEFT — Text content ── */}
            <div className="flex flex-col gap-6 sm:gap-7">

              {/* Badge */}
              <div style={fadeUp(heroVisible, stagger(0))}>
                <span
                  className="badge-pulse relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide"
                  style={{
                    background: "rgba(245,158,11,0.09)",
                    border: "1px solid rgba(245,158,11,0.28)",
                    color: "#FCD34D",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"
                      style={{ animation: "ping 1.6s cubic-bezier(0,0,0.2,1) infinite" }}
                    />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F59E0B]" />
                  </span>
                  <MapPin size={12} strokeWidth={2.5} className="text-[#F59E0B] opacity-80" />
                  India's Trusted NGO &amp; Legal Registration Platform
                </span>
              </div>

              {/* H1 */}
              <div style={fadeUp(heroVisible, stagger(1))}>
                <h1
                  id="hero-heading"
                  className="text-white"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(2.2rem, 5.5vw, 4.1rem)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.09,
                  }}
                >
                  Complete Legal &{" "}
                  <span
                    style={{
                      background: "linear-gradient(92deg, #F59E0B 0%, #FCD34D 55%, #FBBF24 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    NGO Solutions
                  </span>
                  <br />
                  <span
                    className="text-white/80"
                    style={{ fontWeight: 700, fontSize: "0.88em" }}
                  >
                    — Simple, Fast, Reliable
                  </span>
                </h1>
              </div>

              {/* Subtext */}
              <div style={fadeUp(heroVisible, stagger(2))}>
                <p
                  className="text-[#94A3B8] max-w-[520px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "clamp(0.9375rem, 1.4vw, 1.0625rem)",
                    lineHeight: 1.78,
                    fontWeight: 400,
                  }}
                >
                  From registration to compliance, we handle everything — Section 8,
                  12A, 80G, DARPAN, GST, ISO &amp; more. Expert CS &amp; CA team.
                  Starting at{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ₹999.
                  </span>
                </p>
              </div>

              {/* CTA Row */}
              <div
                className="flex flex-wrap items-center gap-3 pt-1"
                style={fadeUp(heroVisible, stagger(3))}
              >
                <a
                  href="/services"
                  className="inline-flex items-center gap-2.5 rounded-xl font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(217,119,6,0.50)] active:translate-y-0 active:scale-[0.98] min-h-[52px] sm:min-h-[50px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    padding: "14px 26px",
                    background: "linear-gradient(92deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%)",
                    boxShadow: "0 8px 32px rgba(217,119,6,0.40), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  Get Started — Free Consultation
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl font-semibold text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:text-white hover:bg-white/[0.12] min-h-[52px] sm:min-h-[50px]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    padding: "13px 22px",
                    background: "rgba(255,255,255,0.065)",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <MessageCircle size={16} />
                  Talk to an Expert
                </a>
              </div>

              {/* Trust strip */}
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2.5 pt-1"
                style={fadeUp(heroVisible, stagger(4))}
              >
                {[
                  "500+ NGOs Registered",
                  "MSME Verified",
                  "5-Star Google Rated",
                ].map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1.5"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.8125rem",
                      color: "#7C8FAC",
                    }}
                  >
                    <CheckCircle2 size={13} strokeWidth={2.5} className="text-[#22C55E] flex-shrink-0" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* ── RIGHT — Floating Package Card ── */}
            <div
              className="hidden lg:block"
              style={{
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateX(0) scale(1)" : "translateX(36px) scale(0.94)",
                transition:
                  "opacity 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.42s, transform 0.75s cubic-bezier(0.34,1.56,0.64,1) 0.42s",
              }}
            >
              <div
                className="hero-card-float relative rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.062)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(28px)",
                  boxShadow:
                    "0 32px 80px rgba(15,27,76,0.50), 0 8px 24px rgba(15,27,76,0.30), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                {/* Card header */}
                <div
                  className="hero-card-header px-6 py-4 flex items-center justify-between"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(217,119,6,0.18) 0%, rgba(124,58,237,0.14) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Star size={12} className="text-[#F59E0B]" fill="#F59E0B" />
                    <span
                      className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase"
                      style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.12em" }}
                    >
                      Featured Package
                    </span>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-[#0F172A]"
                    style={{
                      background: "linear-gradient(90deg, #D97706, #F59E0B)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    BEST VALUE
                  </span>
                </div>

                {/* Card body */}
                <div className="p-6">
                  <h3
                    className="text-white font-bold leading-snug"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.1875rem",
                    }}
                  >
                    Section 8 NGO
                    <br />
                    Complete Setup
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.8125rem",
                      color: "#64748B",
                    }}
                  >
                    7 services bundled — all-inclusive
                  </p>

                  {/* Price */}
                  <div className="flex items-end gap-3 mt-5 mb-5">
                    <span
                      className="text-[#F59E0B] leading-none"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "2.375rem",
                        fontWeight: 500,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      ₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")}
                    </span>
                    <div className="pb-1 flex flex-col gap-0.5">
                      <span
                        className="line-through"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.8125rem",
                          color: "#3D4F6B",
                        }}
                      >
                        ₹{COMPLETE_PACKAGE.originalPrice.toLocaleString("en-IN")}
                      </span>
                      <span
                        className="savings-pill font-semibold"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "#22C55E",
                        }}
                      >
                        Save ₹{COMPLETE_PACKAGE.savings.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="flex flex-col gap-2.5 mb-6">
                    {PACKAGE_FEATURES.map((f) => (
                      <div key={f.label} className="feature-item flex items-center gap-2.5">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.13)" }}
                        >
                          <span className="text-[#F59E0B]">{f.icon}</span>
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.8125rem",
                            color: "#B0BFCF",
                          }}
                        >
                          {f.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="hero-card-divider mb-5" />

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-2.5">
                    <a
                      href="/checkout?service=section8-complete"
                      className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(217,119,6,0.45)] active:translate-y-0"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        padding: "13px 0",
                        background: "linear-gradient(92deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%)",
                        boxShadow: "0 4px 20px rgba(217,119,6,0.38)",
                      }}
                    >
                      Claim This Package
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </a>
                    <a
                      href="/checkout?service=section8-complete&advance=true"
                      className="flex items-center justify-center gap-1.5 w-full rounded-xl font-medium transition-all duration-150 hover:border-white/20"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.8125rem",
                        color: "#64748B",
                        padding: "11px 0",
                        background: "rgba(255,255,255,0.035)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#CBD5E1";
                        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#64748B";
                        e.currentTarget.style.background = "rgba(255,255,255,0.035)";
                      }}
                    >
                      Or start with just{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        ₹{COMPLETE_PACKAGE.advancePrice.toLocaleString("en-IN")}
                      </span>
                    </a>
                  </div>
                </div>

                {/* Card footer */}
                <div className="hero-card-divider px-6 py-3.5 flex items-center gap-2">
                  <ShieldCheck size={12} strokeWidth={2} className="text-[#22C55E] flex-shrink-0" />
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.72rem",
                      color: "#3D4F6B",
                    }}
                  >
                    Razorpay secured · All govt. fees included · No hidden costs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile Package Card ── */}
          <div
            className="lg:hidden mt-8 sm:mt-10"
            style={fadeUp(heroVisible, stagger(5))}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 16px 48px rgba(15,27,76,0.40)",
              }}
            >
              <div className="p-5 sm:p-6">
                {/* Mobile card header row */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star size={11} className="text-[#F59E0B]" fill="#F59E0B" />
                      <span
                        className="text-[10px] font-bold text-[#F59E0B] uppercase tracking-widest"
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        Featured Package
                      </span>
                    </div>
                    <h3
                      className="text-white font-bold leading-snug"
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(0.9375rem, 3.5vw, 1.0625rem)",
                      }}
                    >
                      Section 8 NGO Complete Setup
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="leading-none"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "clamp(1.375rem, 5vw, 1.625rem)",
                        fontWeight: 500,
                        color: "#F59E0B",
                      }}
                    >
                      ₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")}
                    </div>
                    <div
                      className="mt-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#22C55E" }}
                    >
                      Save ₹{COMPLETE_PACKAGE.savings.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PACKAGE_FEATURES.map((f) => (
                    <div key={f.label} className="flex items-start gap-1.5">
                      <CheckCircle2 size={11} strokeWidth={2.5} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "#64748B",
                          lineHeight: 1.4,
                        }}
                      >
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mobile CTAs */}
                <div className="flex flex-col gap-2">
                  <a
                    href="/checkout?service=section8-complete"
                    className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-[#0F172A] min-h-[48px]"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      padding: "13px 0",
                      background: "linear-gradient(92deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%)",
                      boxShadow: "0 4px 16px rgba(217,119,6,0.38)",
                    }}
                  >
                    Claim This Package
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </a>
                  <a
                    href="/checkout?service=section8-complete&advance=true"
                    className="flex items-center justify-center gap-1 w-full rounded-xl min-h-[44px]"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.8125rem",
                      color: "#64748B",
                      padding: "11px 0",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    Or start with{" "}
                    <span
                      className="font-semibold ml-1"
                      style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      ₹{COMPLETE_PACKAGE.advancePrice.toLocaleString("en-IN")}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-7 left-1/2 flex flex-col items-center gap-2 hidden sm:flex"
          style={{
            transform: "translateX(-50%)",
            opacity: heroVisible ? 0.4 : 0,
            transition: "opacity 0.6s ease 1.3s",
            animation: "scrollBounce 2.2s ease-in-out infinite",
          }}
        >
          <div
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.16)" }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.42)",
                animation: "scrollDot 1.9s ease infinite",
              }}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          STATS BAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        ref={statsRef}
        className="relative z-10"
        style={{
          background: "linear-gradient(180deg, #172558 0%, #192960 100%)",
        }}
      >
        {/* Top separator */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.22), transparent)" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="stat-divider">
                <StatItem stat={stat} active={statsVisible} />
              </div>
            ))}
          </div>
        </div>
        {/* Bottom separator */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.18), transparent)" }}
        />
      </div>
    </>
  );
}
