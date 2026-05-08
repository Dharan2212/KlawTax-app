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
    <div className="flex items-center gap-3 px-6 py-4">
      <span className="text-[#F59E0B] opacity-90">{stat.icon}</span>
      <div>
        <div
          className="text-xl font-semibold text-[#F59E0B] leading-none tracking-tight"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
        >
          {displayed}
        </div>
        <div
          className="text-xs text-[#94A3B8] mt-1"
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

  // Trigger hero animation after mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Stats counter trigger on scroll
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const whatsappLink =
    "https://wa.me/918793949471?text=" +
    encodeURIComponent("Hi KlawTax! I'd like to know more about your services.");

  /* Stagger helper */
  const stagger = (index: number, base = 120) =>
    ({ transitionDelay: `${index * base}ms` } as React.CSSProperties);

  const fadeUp = (visible: boolean, delay?: React.CSSProperties) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(28px)",
    transition: "opacity 0.6s cubic-bezier(0,0,0.2,1), transform 0.6s cubic-bezier(0,0,0.2,1)",
    ...delay,
  } as React.CSSProperties);

  return (
    <>
      {/* ── Styles — single consolidated block ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .hero-card-float {
          animation: heroFloat 5s ease-in-out infinite;
        }
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-10px) rotate(0.4deg); }
          66%       { transform: translateY(-5px) rotate(-0.2deg); }
        }

        .hero-orb-1 { animation: orbDrift1 12s ease-in-out infinite; }
        .hero-orb-2 { animation: orbDrift2 16s ease-in-out infinite; }

        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -20px) scale(1.08); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, 30px) scale(0.95); }
        }

        .badge-pulse::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          border: 1.5px solid rgba(245, 158, 11, 0.5);
          animation: badgePulse 2.8s ease-out infinite;
        }
        @keyframes badgePulse {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0; }
        }

        .feature-item { transition: transform 0.2s ease; }
        .feature-item:hover { transform: translateX(4px); }

        .stat-divider:not(:last-child) {
          border-right: 1px solid rgba(255, 255, 255, 0.07);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse at 15% 50%, rgba(37, 99, 235, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 15%, rgba(124, 58, 237, 0.14) 0%, transparent 50%),
            radial-gradient(ellipse at 55% 85%, rgba(217, 119, 6, 0.08) 0%, transparent 45%),
            linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%);
        }

        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }

        @keyframes scrollDot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          80%       { transform: translateY(8px); opacity: 0; }
        }

        @keyframes scrollBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }

        .hero-card-divider {
          border-top: 1px solid rgba(255, 255, 255, 0.07);
        }
        .hero-card-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO SECTION
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        className="mesh-bg relative min-h-screen flex flex-col justify-center overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Background orbs */}
        <div
          className="hero-orb-1 absolute top-[15%] left-[8%] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%)" }}
        />
        <div
          className="hero-orb-2 absolute bottom-[10%] right-[5%] w-[600px] h-[600px] rounded-full opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 70%)" }}
        />

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.025] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-32 pb-20">
          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-16 items-center">

            {/* ── LEFT — Text content ── */}
            <div className="flex flex-col gap-7">

              {/* Badge — Lucide icon replaces emoji */}
              <div style={fadeUp(heroVisible, stagger(0))}>
                <span
                  className="badge-pulse relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide"
                  style={{
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.30)",
                    color: "#FCD34D",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"
                      style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
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
                  className="text-white leading-[1.08]"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(2.4rem, 5.5vw, 4rem)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Complete Legal &{" "}
                  <span
                    style={{
                      background: "linear-gradient(90deg, #F59E0B 0%, #FCD34D 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    NGO Solutions
                  </span>
                  <br />
                  <span className="text-white/90">— Simple, Fast, Reliable</span>
                </h1>
              </div>

              {/* Subtext */}
              <div style={fadeUp(heroVisible, stagger(2))}>
                <p
                  className="text-[#94A3B8] max-w-lg"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "1.0625rem",
                    lineHeight: 1.75,
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
                  className="inline-flex items-center gap-2.5 rounded-xl font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    padding: "14px 28px",
                    background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                    boxShadow: "0 8px 32px rgba(217,119,6,0.40)",
                  }}
                >
                  Get Started — Free Consultation
                  <ArrowRight size={16} strokeWidth={2.5} />
                </a>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-xl font-semibold text-white/90 transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    padding: "13px 24px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1.5px solid rgba(255,255,255,0.20)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <MessageCircle size={16} />
                  Talk to an Expert
                </a>
              </div>

              {/* Trust strip */}
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2.5"
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
                      color: "#94A3B8",
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
                transform: heroVisible ? "translateX(0) scale(1)" : "translateX(40px) scale(0.95)",
                transition:
                  "opacity 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.45s, transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.45s",
              }}
            >
              <div
                className="hero-card-float relative rounded-3xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.065)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  backdropFilter: "blur(24px)",
                  boxShadow:
                    "0 24px 64px rgba(15,27,76,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                {/* Card header */}
                <div
                  className="hero-card-header px-6 py-4 flex items-center justify-between"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(217,119,6,0.18) 0%, rgba(124,58,237,0.13) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Star size={13} className="text-[#F59E0B]" fill="#F59E0B" />
                    <span
                      className="text-[11px] font-bold tracking-widest text-[#F59E0B] uppercase"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Featured Package
                    </span>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-[#0F172A]"
                    style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)" }}
                  >
                    BEST VALUE
                  </span>
                </div>

                {/* Card body */}
                <div className="p-6">
                  <h3
                    className="text-white font-bold text-[1.2rem] leading-snug"
                    style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
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
                      color: "#7C8FAC",
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
                        fontSize: "2.25rem",
                        fontWeight: 500,
                      }}
                    >
                      ₹13,500
                    </span>
                    <div className="pb-1 flex flex-col gap-0.5">
                      <span
                        className="line-through"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "0.8125rem",
                          color: "#475569",
                        }}
                      >
                        ₹17,000
                      </span>
                      <span
                        className="text-[#22C55E] font-semibold"
                        style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem" }}
                      >
                        Save ₹3,500
                      </span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="flex flex-col gap-2.5 mb-6">
                    {PACKAGE_FEATURES.map((f) => (
                      <div key={f.label} className="feature-item flex items-center gap-2.5">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.14)" }}
                        >
                          <span className="text-[#F59E0B]">{f.icon}</span>
                        </span>
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.8125rem",
                            color: "#CBD5E1",
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
                      className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-[#0F172A] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        padding: "13px 0",
                        background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                        boxShadow: "0 4px 20px rgba(217,119,6,0.38)",
                      }}
                    >
                      Claim This Package
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </a>
                    <a
                      href="/checkout?service=section8-complete&advance=true"
                      className="flex items-center justify-center gap-1.5 w-full rounded-xl font-medium transition-colors duration-150"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.8125rem",
                        color: "#7C8FAC",
                        padding: "11px 0",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#CBD5E1")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#7C8FAC")}
                    >
                      Or start with just{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "#FCD34D", fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        ₹6,750
                      </span>
                    </a>
                  </div>
                </div>

                {/* Card footer */}
                <div className="hero-card-divider px-6 py-3.5 flex items-center gap-2">
                  <ShieldCheck size={13} strokeWidth={2} className="text-[#22C55E] flex-shrink-0" />
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.75rem",
                      color: "#475569",
                    }}
                  >
                    Razorpay secured · All govt. fees included · No hidden costs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile Package Card (below text) ── */}
          <div
            className="lg:hidden mt-10"
            style={fadeUp(heroVisible, stagger(5))}
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.13)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div>
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
                      className="text-white font-bold text-base leading-snug"
                      style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700 }}
                    >
                      Section 8 NGO Complete Setup
                    </h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="leading-none"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "1.5rem",
                        fontWeight: 500,
                        color: "#F59E0B",
                      }}
                    >
                      ₹13,500
                    </div>
                    <div
                      className="mt-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#22C55E" }}
                    >
                      Save ₹3,500
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PACKAGE_FEATURES.map((f) => (
                    <div key={f.label} className="flex items-center gap-1.5">
                      <CheckCircle2 size={11} strokeWidth={2.5} className="text-[#22C55E] flex-shrink-0" />
                      <span
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "#7C8FAC",
                        }}
                      >
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="/checkout?service=section8-complete"
                  className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-[#0F172A]"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    padding: "13px 0",
                    background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
                  }}
                >
                  Claim This Package
                  <ArrowRight size={14} strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{
            opacity: heroVisible ? 0.45 : 0,
            transition: "opacity 0.6s ease 1.2s",
            animation: "scrollBounce 2s ease-in-out infinite",
          }}
        >
          <div
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.18)" }}
          >
            <div
              className="w-1 h-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.45)",
                animation: "scrollDot 1.8s ease infinite",
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
        style={{ background: "#182960" }}
      >
        {/* Top separator line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent)" }}
        />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {TRUST_STATS.map((stat) => (
              <div key={stat.label} className="stat-divider">
                <StatItem stat={stat} active={statsVisible} />
              </div>
            ))}
          </div>
        </div>
        {/* Bottom separator line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.20), transparent)" }}
        />
      </div>
    </>
  );
}
