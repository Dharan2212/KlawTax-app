import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CRMSidebar from "./CRMSidebar";
import CRMNavbar from "./CRMNavbar";

interface CRMLayoutProps {
  children: ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Lock body scroll when mobile sidebar open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "hsl(220 20% 97%)" }}
    >
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="crm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 lg:hidden"
            style={{
              background: "rgba(15,23,42,0.55)",
              backdropFilter: "blur(3px)",
            }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <CRMSidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 min-w-0">
        <CRMNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <motion.main
          id="main-content"
          role="main"
          aria-label="Main content"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
          className="flex-1 overflow-auto crm-main-pad"
          style={{
            padding: "24px 20px 48px",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
