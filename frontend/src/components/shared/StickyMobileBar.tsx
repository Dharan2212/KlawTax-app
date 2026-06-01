import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { COMPLETE_PACKAGE } from "@/lib/services";

const WA_LINK =
  "https://wa.me/917387731313?text=" +
  encodeURIComponent("Hi KlawTax! I'd like to know more about your services.");

export default function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const footerOffset = 140;
      const nearBottom = scrollY + windowHeight >= docHeight - footerOffset;
      setVisible(scrollY > 240 && !nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 sticky-mobile-bar"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
        willChange: "transform",
      }}
      aria-hidden={!visible}
    >
      <div
        className="flex items-center gap-2.5 p-3"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 -4px 24px rgba(15,27,76,0.10)",
          paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))",
        }}
      >
        {/* WhatsApp */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.8125rem",
            padding: "11px 14px",
            color: "#15803D",
            background: "rgba(22,163,74,0.08)",
            border: "1.5px solid rgba(34,197,94,0.30)",
            textDecoration: "none",
            minHeight: "44px",
            flexShrink: 0,
          }}
        >
          <MessageCircle size={15} strokeWidth={2} />
          <span className="hidden xs:inline">WhatsApp</span>
          <span className="xs:hidden">Chat</span>
        </a>

        {/* Get Started */}
        <a
          href="/checkout?service=section8-complete"
          className="flex items-center justify-center gap-1.5 flex-1 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
            padding: "11px 16px",
            color: "#0F172A",
            background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
            boxShadow: "0 4px 16px rgba(217,119,6,0.30)",
            textDecoration: "none",
            minHeight: "44px",
          }}
        >
          <span className="truncate">Get Started — ₹{COMPLETE_PACKAGE.price.toLocaleString("en-IN")}</span>
          <ArrowRight size={14} strokeWidth={2.5} className="flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}
