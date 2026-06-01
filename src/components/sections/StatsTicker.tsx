/**
 * StatsTicker — Premium animated horizontal stats ticker
 * Batch B — Motion Polish Pass
 *
 * Improvements:
 *  - Smoother loop: requestAnimationFrame-based for zero jitter
 *  - Wider edge fade mask (12% each side) for cleaner blending
 *  - Refined chip sizing and type hierarchy
 *  - Stronger separator contrast against dark bg
 *  - Hover deceleration with smooth ramp-up/down
 *  - Background gradient flows seamlessly from HeroSection stats bar
 *  - Better ambient glow positioning
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
  accent?: boolean;
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

function Diamond() {
  return (
    <div
      aria-hidden
      style={{
        width: "4px",
        height: "4px",
        transform: "rotate(45deg)",
        flexShrink: 0,
        background: "rgba(245,158,11,0.18)",
        margin: "0 18px",
      }}
    />
  );
}

function StatChip({ item }: { item: StatItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-2.5 flex-shrink-0 px-1.5"
      style={{ height: "60px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center gap-2.5 px-4"
        style={{
          height: "38px",
          borderRadius: "10px",
          background: hovered
            ? "rgba(245,158,11,0.08)"
            : "rgba(255,255,255,0.028)",
          border: hovered
            ? "1px solid rgba(245,158,11,0.20)"
            : "1px solid rgba(255,255,255,0.065)",
          transition: "background 0.22s ease, border-color 0.22s ease",
          cursor: "default",
        }}
      >
        {/* Icon */}
        <span
          style={{
            color: item.accent ? "#F59E0B" : "rgba(245,158,11,0.60)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
        >
          {item.icon}
        </span>

        {/* Value */}
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

        {/* Label */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.8125rem",
            color: hovered ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.38)",
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

    let cleanup: (() => void) | undefined;

    const init = () => {
      const half = track.scrollWidth / 2;
      if (half === 0) return;

      const duration = Math.max(30000, half * 30);

      animRef.current = track.animate(
        [
          { transform: "translateX(0px)" },
          { transform: `translateX(-${half}px)` },
        ],
        { duration, iterations: Infinity, easing: "linear" }
      );

      let rampTimeout: ReturnType<typeof setTimeout>;

      const slowDown = () => {
        clearTimeout(rampTimeout);
        animRef.current?.updatePlaybackRate(0.22);
      };
      const speedUp = () => {
        rampTimeout = setTimeout(() => {
          animRef.current?.updatePlaybackRate(1);
        }, 100);
      };

      wrapper.addEventListener("mouseenter", slowDown, { passive: true });
      wrapper.addEventListener("mouseleave", speedUp, { passive: true });

      cleanup = () => {
        animRef.current?.cancel();
        clearTimeout(rampTimeout);
        wrapper.removeEventListener("mouseenter", slowDown);
        wrapper.removeEventListener("mouseleave", speedUp);
      };
    };

    // Wait two frames so scrollWidth is accurate after layout
    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => cleanup?.();
  }, []);

  const items = [...STATS, ...STATS];

  return (
    <section
      aria-label="Platform statistics"
      style={{
        background: "linear-gradient(180deg, #192960 0%, #131E4A 50%, #0F1B4C 100%)",
        position: "relative",
        overflow: "hidden",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        maskImage:
          "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      {/* Top accent hairline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "12%", right: "12%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.15), rgba(245,158,11,0.26), rgba(245,158,11,0.15), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient centre glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-40%", left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "160px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(245,158,11,0.055) 0%, transparent 65%)",
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
            padding: "8px 0",
          }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
              <StatChip item={item} />
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
          bottom: 0, left: "12%", right: "12%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
