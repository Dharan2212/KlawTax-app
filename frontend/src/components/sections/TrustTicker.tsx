/**
 * TrustTicker — Premium animated organization trust strip
 * Batch 2.1 — Motion Polish Pass
 *
 * Improvements over Batch 2 base:
 *  - CSS mask-image edge fading (seamless)
 *  - Glassmorphism pills with stronger depth treatment
 *  - Purple accent glow in background
 *  - Calmer speed (55s base — confidence-building, not rushed)
 *  - Slow decelerate on hover (not hard pause)
 *  - "Trusted By" label with vertical rule, properly outside the mask
 *  - Subtle purple hairline divider at top
 *  - Better background gradient that flows from StatsTicker
 *  - Hover: pill brightens, icon glows purple
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
      className="flex items-center flex-shrink-0 px-3"
      style={{ height: "44px" }}
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
            : "rgba(255,255,255,0.035)",
          border: hovered
            ? "1px solid rgba(124,58,237,0.30)"
            : "1px solid rgba(255,255,255,0.08)",
          boxShadow: hovered
            ? "0 0 12px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
          transition:
            "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        {/* Icon */}
        <span
          style={{
            color: hovered ? "#A78BFA" : "rgba(124,58,237,0.70)",
            flexShrink: 0,
            transition: "color 0.2s ease",
            display: "flex",
            alignItems: "center",
          }}
        >
          {org.icon}
        </span>

        {/* Category */}
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: "0.6875rem",
            letterSpacing: "0.01em",
            color: hovered ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)",
            transition: "color 0.2s ease",
          }}
        >
          {org.category}
        </span>
      </div>
    </div>
  );
}

/* ── Spacer between pills ── */
function Spacer() {
  return (
    <div
      aria-hidden
      style={{
        width: "1px",
        height: "12px",
        background: "rgba(124,58,237,0.12)",
        flexShrink: 0,
        margin: "0 4px",
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

    requestAnimationFrame(() => {
      const half = track.scrollWidth / 2;
      /* 55s feel — calm, confidence-building; slower than StatsTicker */
      const duration = Math.max(42000, half * 42);

      animRef.current = track.animate(
        [
          { transform: "translateX(0px)" },
          { transform: `translateX(-${half}px)` },
        ],
        { duration, iterations: Infinity, easing: "linear" }
      );

      let timeout: ReturnType<typeof setTimeout>;

      const slowDown = () => {
        clearTimeout(timeout);
        animRef.current?.updatePlaybackRate(0.20); // even calmer than stats
      };
      const speedUp = () => {
        timeout = setTimeout(() => {
          animRef.current?.updatePlaybackRate(1);
        }, 150);
      };

      wrapper.addEventListener("mouseenter", slowDown);
      wrapper.addEventListener("mouseleave", speedUp);

      return () => {
        animRef.current?.cancel();
        clearTimeout(timeout);
        wrapper.removeEventListener("mouseenter", slowDown);
        wrapper.removeEventListener("mouseleave", speedUp);
      };
    });
  }, []);

  const items = [...ORGS, ...ORGS]; // doubled for seamless loop

  return (
    <section
      aria-label="Organization types we serve"
      style={{
        /* Gradient that flows naturally from StatsTicker's #0F1B4C */
        background: "linear-gradient(180deg, #0D1640 0%, #0A1128 100%)",
        position: "relative",
      }}
    >
      {/* Purple top accent hairline — visual divider from StatsTicker */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: "8%", right: "8%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(124,58,237,0.20), rgba(124,58,237,0.35), rgba(124,58,237,0.20), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Subtle purple ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%", left: "30%",
          width: "400px",
          height: "100px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Row layout: "Trusted By" label + masked ticker ── */}
      <div style={{ display: "flex", alignItems: "center" }}>

        {/* "Trusted By" label — sits OUTSIDE the mask region */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 20px 0 24px",
            zIndex: 3,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "rgba(124,58,237,0.55)",
              whiteSpace: "nowrap",
            }}
          >
            Trusted By
          </span>
          {/* Vertical rule separator */}
          <div
            style={{
              width: "1px",
              height: "14px",
              background: "rgba(124,58,237,0.18)",
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
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
            maskImage:
              "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          }}
        >
          <div
            ref={trackRef}
            style={{
              display: "flex",
              alignItems: "center",
              willChange: "transform",
              width: "max-content",
              padding: "7px 0",
            }}
          >
            {items.map((org, i) => (
              <div key={i} className="flex items-center flex-shrink-0">
                <OrgPill org={org} />
                <Spacer />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom hairline — transition to next section */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
