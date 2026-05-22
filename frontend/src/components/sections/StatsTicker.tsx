/**
 * StatsTicker — Premium animated horizontal stats ticker
 * Batch 2.1 — Motion Polish Pass
 *
 * Improvements over Batch 2 base:
 *  - CSS mask-image edge fade (seamless, no z-index overlay hacks)
 *  - Subtle ambient glow in background
 *  - Glassmorphism chip panels with hover interaction
 *  - Energetic speed tuned (35s base — medium, dynamic)
 *  - Stronger typography contrast hierarchy
 *  - Glow separator diamonds instead of plain dots
 *  - Top/bottom accent hairlines
 *  - Gradient background matched to HeroSection stats bar (#182960)
 */

import { useRef, useEffect, useState } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Building2,
  FileText,
  Globe2,
  Headphones,
  BadgeCheck,
  BarChart3,
  Landmark,
} from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: boolean; // highlight colour variant
}

const STATS: StatItem[] = [
  { icon: <ShieldCheck size={14} strokeWidth={2} />, value: "500+",   label: "NGO Registrations", accent: true },
  { icon: <Building2   size={14} strokeWidth={2} />, value: "1,200+", label: "Companies Registered" },
  { icon: <FileText    size={14} strokeWidth={2} />, value: "3,800+", label: "Compliance Filings" },
  { icon: <Users       size={14} strokeWidth={2} />, value: "2,000+", label: "Clients Served", accent: true },
  { icon: <BarChart3   size={14} strokeWidth={2} />, value: "98%",    label: "Filing Success Rate" },
  { icon: <Globe2      size={14} strokeWidth={2} />, value: "28",     label: "States Pan India" },
  { icon: <Headphones  size={14} strokeWidth={2} />, value: "9–7 PM", label: "Expert Support" },
  { icon: <Landmark    size={14} strokeWidth={2} />, value: "950+",   label: "GST Registrations" },
  { icon: <TrendingUp  size={14} strokeWidth={2} />, value: "₹50Cr+", label: "Funds Unlocked", accent: true },
  { icon: <BadgeCheck  size={14} strokeWidth={2} />, value: "4.9★",   label: "Google Rating" },
];

/* ── Separator diamond between chips ── */
function Diamond() {
  return (
    <div
      aria-hidden
      style={{
        width: "5px",
        height: "5px",
        transform: "rotate(45deg)",
        flexShrink: 0,
        background: "rgba(245,158,11,0.22)",
        margin: "0 16px",
      }}
    />
  );
}

/* ── Individual stat chip ── */
function StatChip({ item }: { item: StatItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2.5 flex-shrink-0 px-2"
      style={{ height: "58px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glass panel */}
      <div
        className="flex items-center gap-2.5 px-4"
        style={{
          height: "38px",
          borderRadius: "10px",
          background: hovered
            ? "rgba(245,158,11,0.07)"
            : "rgba(255,255,255,0.03)",
          border: hovered
            ? "1px solid rgba(245,158,11,0.22)"
            : "1px solid rgba(255,255,255,0.07)",
          transition: "background 0.25s ease, border-color 0.25s ease",
          cursor: "default",
        }}
      >
        {/* Icon */}
        <span
          style={{
            color: item.accent ? "#F59E0B" : "rgba(245,158,11,0.65)",
            flexShrink: 0,
            transition: "color 0.2s ease",
          }}
        >
          {item.icon}
        </span>

        {/* Value — the hero number */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: "0.9375rem",
            letterSpacing: "-0.02em",
            color: hovered ? "#FFFFFF" : "#FCD34D",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "color 0.2s ease",
          }}
        >
          {item.value}
        </span>

        {/* Label — supporting text */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.8125rem",
            letterSpacing: "0.005em",
            color: hovered ? "rgba(255,255,255,0.70)" : "rgba(255,255,255,0.42)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "color 0.2s ease",
          }}
        >
          {item.label}
        </span>
      </div>
    </div>
  );
}

export default function StatsTicker() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef   = useRef<HTMLDivElement>(null);
  const animRef    = useRef<Animation | null>(null);

  useEffect(() => {
    const track   = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    /* Wait one frame so scrollWidth is accurate */
    requestAnimationFrame(() => {
      const half     = track.scrollWidth / 2;
      /* 35 px/s = ~28.5ms/px → 35s for ~1230px wide track */
      const duration = Math.max(28000, half * 28.5);

      animRef.current = track.animate(
        [
          { transform: "translateX(0px)" },
          { transform: `translateX(-${half}px)` },
        ],
        { duration, iterations: Infinity, easing: "linear" }
      );

      /* Smooth decelerate on hover, accelerate on leave */
      let pauseTimeout: ReturnType<typeof setTimeout>;

      const slowDown = () => {
        clearTimeout(pauseTimeout);
        animRef.current?.updatePlaybackRate(0.25);
      };
      const speedUp = () => {
        pauseTimeout = setTimeout(() => {
          animRef.current?.updatePlaybackRate(1);
        }, 120);
      };

      wrapper.addEventListener("mouseenter", slowDown);
      wrapper.addEventListener("mouseleave", speedUp);

      return () => {
        animRef.current?.cancel();
        clearTimeout(pauseTimeout);
        wrapper.removeEventListener("mouseenter", slowDown);
        wrapper.removeEventListener("mouseleave", speedUp);
      };
    });
  }, []);

  const items = [...STATS, ...STATS]; // doubled — seamless loop

  return (
    <section
      aria-label="Platform statistics"
      style={{
        /* Gradient that picks up where HeroSection #182960 stats bar leaves off */
        background: "linear-gradient(180deg, #182960 0%, #121E4A 50%, #0F1B4C 100%)",
        position: "relative",
        overflow: "hidden",
        /* CSS mask-image: cleanest way to fade edges — no z-index warfare */
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      {/* Top hairline accent */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "10%", right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.18), rgba(245,158,11,0.28), rgba(245,158,11,0.18), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle ambient glow — centre */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%", left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "140px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Scrolling track */}
      <div
        ref={wrapperRef}
        style={{ overflow: "hidden", position: "relative" }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            alignItems: "center",
            willChange: "transform",
            width: "max-content",
            padding: "10px 0",
          }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <StatChip item={item} />
              {/* Separator between items but not after last in the doubled set */}
              <Diamond />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom hairline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: "10%", right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
