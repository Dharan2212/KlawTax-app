import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCRMStore, CRMRole } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  CreditCard,
  BarChart3,
  FileText,
  Send,
  Home,
  X,
  Scale,
  Download,
  HelpCircle,
  FolderOpen,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: ReactNode;
  path: string;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const roleMenus: Record<CRMRole, MenuItem[]> = {
  admin: [
    { label: "Dashboard", icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/admin" },
    { label: "Clients", icon: <Users size={16} strokeWidth={2} />, path: "/crm/admin/clients" },
    { label: "Projects", icon: <FolderKanban size={16} strokeWidth={2} />, path: "/crm/admin/projects" },
    { label: "Approvals", icon: <CheckSquare size={16} strokeWidth={2} />, path: "/crm/admin/approvals" },
    { label: "Payments", icon: <CreditCard size={16} strokeWidth={2} />, path: "/crm/admin/payments" },
    { label: "Reports", icon: <BarChart3 size={16} strokeWidth={2} />, path: "/crm/admin/reports" },
  ],
  employee: [
    { label: "Dashboard", icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/employee" },
    { label: "My Projects", icon: <FolderKanban size={16} strokeWidth={2} />, path: "/crm/employee/projects" },
  ],
  client: [
    { label: "Dashboard",    icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/client" },
    { label: "My Projects",  icon: <FolderOpen size={16} strokeWidth={2} />,      path: "/crm/client/projects" },
    { label: "Project View", icon: <FileText size={16} strokeWidth={2} />,        path: "/crm/client/project" },
    { label: "Submit Update",icon: <Send size={16} strokeWidth={2} />,            path: "/crm/client/submit" },
    { label: "Payments",     icon: <CreditCard size={16} strokeWidth={2} />,      path: "/crm/client/payments" },
    { label: "Documents",    icon: <Download size={16} strokeWidth={2} />,        path: "/crm/client/documents" },
    { label: "Support",      icon: <HelpCircle size={16} strokeWidth={2} />,      path: "/crm/client/support" },
  ],
};

/** Per-role accent system */
const ROLE_ACCENT: Record<CRMRole, { active: string; hover: string; activeBg: string; dot: string; name: string }> = {
  admin: {
    name: "Admin",
    dot: "hsl(221 83% 53%)",
    active: "hsl(222 73% 33%)",
    activeBg: "hsl(214 95% 93%)",
    hover: "hsl(210 40% 96%)",
  },
  employee: {
    name: "Employee",
    dot: "hsl(160 84% 39%)",
    active: "hsl(160 84% 25%)",
    activeBg: "hsl(152 60% 92%)",
    hover: "hsl(152 30% 96%)",
  },
  client: {
    name: "Client",
    dot: "hsl(43 96% 56%)",
    active: "hsl(28 90% 37%)",
    activeBg: "hsl(48 96% 89%)",
    hover: "hsl(48 40% 96%)",
  },
};

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const currentRole = useCRMStore((s) => s.currentRole);
  const users = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);
  const location = useLocation();
  const menu = roleMenus[currentRole];
  const accent = ROLE_ACCENT[currentRole];

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: "hsl(222 47% 11%)",
        width: "256px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid hsl(215 25% 20%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, hsl(var(--color-primary-700)), hsl(var(--color-secondary-500)))",
            }}
          >
            <Scale size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <span
              className="font-bold text-base text-white block leading-none"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Klaw<span style={{ color: "hsl(var(--color-accent-400))" }}>Tax</span>
            </span>
            <span
              className="text-[10px] mt-0.5 block"
              style={{ color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif" }}
            >
              CRM Portal
            </span>
          </div>
        </div>

        {/* Mobile close */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={16} strokeWidth={2} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-5 py-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: "hsl(215 25% 16%)" }}
        >
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: accent.dot }}
          />
          <div className="min-w-0">
            <span
              className="text-[11px] font-semibold block truncate"
              style={{ color: accent.dot, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}
            >
              {accent.name.toUpperCase()} ACCESS
            </span>
            <span
              className="text-[11px] truncate block"
              style={{ color: "hsl(215 16% 55%)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {currentUser?.name ?? "User"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav role="navigation" aria-label="CRM navigation" className="flex-1 px-3 py-2 overflow-y-auto">
        <div
          className="text-[10px] font-bold tracking-wider px-3 mb-2"
          style={{ color: "hsl(215 16% 38%)", fontFamily: "'DM Sans', sans-serif" }}
        >
          NAVIGATION
        </div>

        <div className="space-y-0.5">
          {menu.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/crm/admin" &&
                item.path !== "/crm/employee" &&
                item.path !== "/crm/client" &&
                location.pathname.startsWith(item.path + "/"));

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
                )}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  background: isActive ? accent.activeBg : "transparent",
                  color: isActive ? accent.active : "hsl(215 16% 55%)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "hsl(215 25% 18%)";
                    (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 88%)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "hsl(215 16% 55%)";
                  }
                }}
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                  style={{
                    background: isActive ? `${accent.dot}22` : "transparent",
                    color: isActive ? accent.dot : "currentColor",
                  }}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: accent.dot }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-4 pt-3"
        style={{ borderTop: "1px solid hsl(215 25% 17%)" }}
      >
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(215 16% 47%)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "hsl(215 25% 18%)";
            (e.currentTarget as HTMLElement).style.color = "hsl(0 0% 80%)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "hsl(215 16% 47%)";
          }}
        >
          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7">
            <Home size={16} strokeWidth={2} />
          </span>
          Back to Website
        </Link>
      </div>
    </div>
  );
}

export default function CRMSidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-40 overflow-hidden"
          >
            <SidebarContent onClose={onMobileClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
