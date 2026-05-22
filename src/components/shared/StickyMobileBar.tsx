import { useEffect, useState } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";

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
      const footerOffset = 120;
      const nearBottom = scrollY + windowHeight >= docHeight - footerOffset;

      setVisible(scrollY > 200 && !nearBottom);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Bottom bar */}
      <div
        className="flex items-center gap-2 p-3"
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid #E2E8F0",
          boxShadow: "0 -4px 24px rgba(15,27,76,0.12)",
        }}
      >
        {/* WhatsApp */}
        <a
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 flex-1 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            padding: "12px 0",
            color: "#15803D",
            border: "1.5px solid rgba(34,197,94,0.35)",
            textDecoration: "none",
          }}
        >
          <MessageCircle size={16} strokeWidth={2} />
          WhatsApp
        </a>

        {/* Get Started */}
        <a
          href="/checkout?service=section8-complete"
          className="flex items-center justify-center gap-2 flex-[2] rounded-xl font-semibold text-sm text-[#0F172A] transition-all duration-200"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            padding: "12px 0",
            background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
            boxShadow: "0 4px 16px rgba(217,119,6,0.28)",
            textDecoration: "none",
          }}
        >
          Get Started — ₹13,500
          <ArrowRight size={14} strokeWidth={2.5} />
        </a>
      </div>
    </div>
  );
}
