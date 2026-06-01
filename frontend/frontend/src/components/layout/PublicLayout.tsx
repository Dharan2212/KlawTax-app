import { ReactNode } from "react";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import { pageTransition } from "@/lib/motion";

interface PublicLayoutProps {
  children: ReactNode;
  /** Override the sticky mobile bar CTA (defaults to section8-complete package) */
  hideStickyBar?: boolean;
}

/**
 * Shared public site layout shell.
 * Wraps any public page with Navbar + Footer + StickyMobileBar + page transition.
 */
export default function PublicLayout({ children, hideStickyBar = false }: PublicLayoutProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <main role="main" className="flex-1">
        {children}
      </main>
      <Footer />
      {!hideStickyBar && <StickyMobileBar />}
    </motion.div>
  );
}
