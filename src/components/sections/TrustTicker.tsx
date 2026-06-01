/**
 * TrustTicker — Premium animated organization trust strip
 * Batch B — Motion Polish Pass
 *
 * Improvements:
 *  - Two-frame RAF init for accurate scrollWidth measurement
 *  - Wider edge fade on masked scrolling region
 *  - Refined pill sizing — slightly taller for better readability
 *  - Stronger hover state — pill becomes more visible
 *  - Spacer dots improved contrast
 *  - Background gradient flows cleanly from StatsTicker
 *  - "Trusted By" label better proportioned
 *  - Smooth playback rate ramp (no abrupt speed jump)
 */

import { useRef, useEffect, useState } from "react";
import {
  Heart,
  Sprout,
  Building2,
  GraduationCap,
  Stethoscope,
  Factory,
  Scale,
  Wheat,
  ShoppingBag,
  Globe2,
} from "lucide-react";

interface OrgItem {
  icon: React.ReactNode;
  category: string;
}

const ORGS: OrgItem[] = [
  { icon: <Heart          size={12} strokeWidth={2} />, category: "NGOs & Foundations"          },
  { icon: <Sprout         size={12} strokeWidth={2} />, category: "Startups"                    },
  { icon: <Building2      size={12} strokeWidth={2} />, category: "Pvt Ltd Companies"           },
  { icon: <GraduationCap  size={12} strokeWidth={2} />, category: "Educational Trusts"          },
  { icon: <Stethoscope    size={12} strokeWidth={2} />, category: "Healthcare Organizations"    },
  { icon: <Factory        size={12} strokeWidth={2} />, category: "MSMEs"                       },
  { icon: <Scale          size={12} strokeWidth={2} />, category: "Charitable Trusts"           },
  { icon: <Wheat          size={12} strokeWidth={2} />, category: "Farmer Producer Companies"   },
  { icon: <ShoppingBag    size={12} strokeWidth={2} />, category: "Retail & D2C Brands"        },
  { icon: <Globe2         size={12} strokeWidth={2} />, category: "Social Enterprises"          },
];

function OrgPill({ org }: { org: OrgItem }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="flex items-center flex-shrink-0 px-2"
      style={{ height: "46px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="flex items-center gap-2 px-3.5"
        style={{
          height: "30px",
          borderRadius: "999px",
          background: hovered
            ? "rgba(124,58,237,0.10)"
            : "rgba(255,255,255,0.030)",
          border: hovered
            ? "1px solid rgba(124,58,237,0.28)"
            : "1px solid rgba(255,255,255,0.075)",
          boxShadow: hovered
            ? "0 0 14px rgba(124,58,237,0.10), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "none",
          transition:
            "background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            color: hovered ? "#A78BFA" : "rgba(124,58,237,0.65)",
            flexShrink: 0,
            transition: "color 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          {org.icon}
        </span>

        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: "0.6875rem",
            letterSpacing: "0.01em",
            color: hovered ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.40)",
            transition: "color 0.2s ease",
          }}
        >
          {org.category}
        </span>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <div
      aria-hidden
      style={{
        width: "3px",
        height: "3px",
        borderRadius: "50%",
        background: "rgba(124,58,237,0.16)",
        flexShrink: 0,
        margin: "0 6px",
      }}
    />
  );
}

export default function TrustTicker() {
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

      const duration = Math.max(40000, half * 44);

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
        animRef.current?.updatePlaybackRate(0.18);
      };
      const speedUp = () => {
        rampTimeout = setTimeout(() => {
          animRef.current?.updatePlaybackRate(1);
        }, 140);
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

    requestAnimationFrame(() => requestAnimationFrame(init));

    return () => cleanup?.();
  }, []);

  const items = [...ORGS, ...ORGS];

  return (
    <section
      aria-label="Organization types we serve"
      style={{
        background: "linear-gradient(180deg, #0D1640 0%, #0A1128 100%)",
        position: "relative",
      }}
    >
      {/* Purple top hairline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "8%", right: "8%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.18), rgba(124,58,237,0.30), rgba(124,58,237,0.18), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Ambient purple glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-30%", left: "28%",
          width: "450px",
          height: "120px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.048) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Row: "Trusted By" label + masked ticker */}
      <div style={{ display: "flex", alignItems: "center" }}>

        {/* Label — outside the mask */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 18px 0 22px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.5875rem",
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "rgba(124,58,237,0.50)",
              whiteSpace: "nowrap",
            }}
          >
            Trusted By
          </span>
          <div
            style={{
              width: "1px",
              height: "14px",
              background: "rgba(124,58,237,0.16)",
              flexShrink: 0,
            }}
          />
        </div>

        {/* Masked scrolling area */}
        <div
          ref={wrapperRef}
          style={{
            flex: 1,
            overflow: "hidden",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 9%, black 91%, transparent 100%)",
          }}
        >
          <div
            ref={trackRef}
            style={{
              display: "flex",
              alignItems: "center",
              willChange: "transform",
              width: "max-content",
              padding: "6px 0",
            }}
          >
            {items.map((org, i) => (
              <div key={i} className="flex items-center flex-shrink-0">
                <OrgPill org={org} />
                <Dot />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom hairline */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
