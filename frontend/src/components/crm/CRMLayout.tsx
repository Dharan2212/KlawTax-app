import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import CRMSidebar from "./CRMSidebar";
import CRMNavbar from "./CRMNavbar";

interface CRMLayoutProps {
  children: ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "hsl(220 20% 97%)" }}
    >
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{
            background: "rgba(15,23,42,0.50)",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <CRMSidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 min-w-0">
        <CRMNavbar onMenuToggle={() => setSidebarOpen((v) => !v)} />

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
          className="flex-1 overflow-auto"
          style={{ padding: "28px 24px 48px" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
