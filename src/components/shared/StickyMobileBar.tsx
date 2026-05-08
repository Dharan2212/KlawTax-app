import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight } from "lucide-react";

export default function StickyMobileBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector("footer");
      const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
      setVisible(window.scrollY > 300 && footerTop > 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid hsl(var(--color-neutral-300))",
            padding: "10px 12px",
            paddingBottom: "max(10px, env(safe-area-inset-bottom))",
            boxShadow: "0 -4px 24px rgba(15,27,76,0.10)",
          }}
        >
          <div className="flex gap-2.5">
            <a
              href="https://wa.me/918793949471?text=Hi%20KlawTax!%20I%27d%20like%20to%20know%20more%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{
                background: "hsl(142 71% 45% / 0.1)",
                color: "hsl(142 71% 29%)",
                border: "1.5px solid hsl(142 71% 45% / 0.2)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <MessageCircle size={15} strokeWidth={2} />
              WhatsApp
            </a>
            <Link
              to="/checkout?service=section8-complete"
              className="flex-[1.5] flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, hsl(var(--color-accent-300)), hsl(var(--color-accent-500)))",
                color: "hsl(var(--color-neutral-900))",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 16px hsl(var(--color-accent-500) / 0.30)",
              }}
            >
              Get Started
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
