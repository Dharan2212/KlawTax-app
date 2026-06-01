import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, Award, Users } from "lucide-react";

const stats = [
  { value: 500,  suffix: "+", label: "NGOs Registered",  sub: "Section 8 & Trust", icon: ShieldCheck },
  { value: 98,   suffix: "%", label: "Success Rate",      sub: "Government filings", icon: TrendingUp },
  { value: 10,   suffix: "+", label: "Years Experience",  sub: "CS & CA experts",   icon: Award      },
  { value: 1000, suffix: "+", label: "Happy Clients",     sub: "Pan India served",  icon: Users      },
];

function Counter({ value, suffix, isInView }: { value: number; suffix: string; isInView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.max(1, Math.floor(value / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700,
        fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
        lineHeight: 1,
        color: "#FCD34D",
        letterSpacing: "-0.02em",
      }}
    >
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 50%, #1E1065 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container mx-auto px-4 py-4 md:py-2">
        <div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-4"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "none" : "translateY(16px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === stats.length - 1;
            const isOdd = i % 2 !== 0;
            return (
              <div
                key={s.label}
                className="flex flex-col items-center text-center py-10 px-6 gap-3"
                style={{
                  borderRight: !isLast
                    ? "1px solid rgba(255,255,255,0.07)"
                    : undefined,
                  borderBottom: i < 2
                    ? "1px solid rgba(255,255,255,0.07) "
                    : undefined,
                }}
              >
                {/* Icon container */}
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-2xl flex-shrink-0"
                  style={{
                    background: "rgba(245,158,11,0.10)",
                    border: "1px solid rgba(245,158,11,0.20)",
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} style={{ color: "#F59E0B" }} />
                </div>

                {/* Number */}
                <Counter value={s.value} suffix={s.suffix} isInView={isInView} />

                {/* Label */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "rgba(255,255,255,0.88)",
                      lineHeight: 1.3,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.38)",
                      marginTop: "3px",
                    }}
                  >
                    {s.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
