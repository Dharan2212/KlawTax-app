import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Home, MessageCircle } from "lucide-react";
import SEO from "@/components/shared/SEO";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";

export default function NotFound() {
  return (
    <motion.div {...pageTransition} className="min-h-screen flex flex-col">
      <SEO title="404 — Page Not Found | KlawTax" noindex={true} />
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-20" style={{ background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 40%, #2E1065 100%)" }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* 404 number */}
            <motion.div variants={staggerItem}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800,
                  fontSize: "clamp(6rem, 20vw, 9rem)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0 2px 32px rgba(124,58,237,0.30))",
                  marginBottom: "-8px",
                }}
              >
                404
              </div>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "white", letterSpacing: "-0.02em" }}
              className="mb-4"
            >
              Page Not Found
            </motion.h1>

            <motion.p
              variants={staggerItem}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}
              className="mb-10"
            >
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-wrap justify-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(217,119,6,0.35)" }}
              >
                <Home size={16} strokeWidth={2.5} /> Go Home
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(255,255,255,0.10)", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", border: "1.5px solid rgba(255,255,255,0.20)", backdropFilter: "blur(8px)" }}
              >
                Browse Services <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
              <a
                href="https://wa.me/917387731313"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: "#25D366", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(37,211,102,0.30)" }}
              >
                <MessageCircle size={14} strokeWidth={2} /> Get Help
              </a>
            </motion.div>

            {/* Quick links */}
            <motion.div variants={staggerItem} className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {[
                { label: "Services", href: "/services" },
                { label: "Pricing", href: "/pricing" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  to={href}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.80)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  {label}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </motion.div>
  );
}
