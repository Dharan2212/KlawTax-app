/**
 * CRMSidebar — Batch 3 (live auth, no mock store)
 *
 * Identity comes from useAuth(). Badge counts come from live API calls.
 * No dependency on mock operational data in useCRMStore.
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { CRMRole } from "@/store/useCRMStore";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare,
  CreditCard, BarChart3, FileText, Send, Home, X,
  Scale, Download, HelpCircle, FolderOpen, Briefcase, Bell,
  UserRound, Headphones,
} from "lucide-react";
import { fetchUnreadCount, fetchApprovals, fetchFollowUpCounts } from "@/lib/crmApi";

interface MenuItem { label: string; icon: ReactNode; path: string; }
interface SidebarProps { mobileOpen?: boolean; onMobileClose?: () => void; }

const roleMenus: Record<CRMRole, MenuItem[]> = {
  admin: [
    { label: "Dashboard",  icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/admin" },
    { label: "Clients",    icon: <Users size={16} strokeWidth={2} />,           path: "/crm/admin/clients" },
    { label: "Employees",  icon: <Briefcase size={16} strokeWidth={2} />,       path: "/crm/admin/employees" },
    { label: "Leads",      icon: <UserRound size={16} strokeWidth={2} />,       path: "/crm/admin/leads" },
    { label: "Projects",   icon: <FolderKanban size={16} strokeWidth={2} />,    path: "/crm/admin/projects" },
    { label: "Approvals",  icon: <CheckSquare size={16} strokeWidth={2} />,     path: "/crm/admin/approvals" },
    { label: "Payments",   icon: <CreditCard size={16} strokeWidth={2} />,      path: "/crm/admin/payments" },
    { label: "Support",    icon: <Headphones size={16} strokeWidth={2} />,      path: "/crm/admin/support" },
    { label: "Follow-ups", icon: <Bell size={16} strokeWidth={2} />,             path: "/crm/admin/followups" },
    { label: "Reports",    icon: <BarChart3 size={16} strokeWidth={2} />,       path: "/crm/admin/reports" },
  ],
  employee: [
    { label: "Dashboard",   icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/employee" },
    { label: "My Projects", icon: <FolderKanban size={16} strokeWidth={2} />,   path: "/crm/employee/projects" },
  ],
  client: [
    { label: "Dashboard",    icon: <LayoutDashboard size={16} strokeWidth={2} />, path: "/crm/client" },
    { label: "My Services",  icon: <FolderOpen size={16} strokeWidth={2} />,      path: "/crm/client/projects" },
    { label: "Project View", icon: <FileText size={16} strokeWidth={2} />,        path: "/crm/client/project" },
    { label: "Submit Docs",  icon: <Send size={16} strokeWidth={2} />,            path: "/crm/client/submit" },
    { label: "Payments",     icon: <CreditCard size={16} strokeWidth={2} />,      path: "/crm/client/payments" },
    { label: "Documents",    icon: <Download size={16} strokeWidth={2} />,        path: "/crm/client/documents" },
    { label: "Support",      icon: <HelpCircle size={16} strokeWidth={2} />,      path: "/crm/client/support" },
  ],
};

const ROLE_ACCENT: Record<CRMRole, { active: string; activeBg: string; dot: string; name: string; desc: string }> = {
  admin:    { name: "Admin",    desc: "Full platform access", dot: "hsl(221 83% 53%)", active: "hsl(222 73% 33%)", activeBg: "hsl(214 95% 93%)" },
  employee: { name: "Employee", desc: "Assigned workspace",   dot: "hsl(160 84% 39%)", active: "hsl(160 84% 25%)", activeBg: "hsl(152 60% 92%)" },
  client:   { name: "Client",   desc: "Registration portal",  dot: "hsl(43 96% 56%)",  active: "hsl(28 90% 37%)",  activeBg: "hsl(48 96% 89%)" },
};

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { role: authRole, user: authUser } = useAuth();
  const currentRole = (authRole ?? "client") as CRMRole;
  const location    = useLocation();
  const menu        = roleMenus[currentRole];
  const accent      = ROLE_ACCENT[currentRole];

  // Live badge counts
  const [pendingApprovals,  setPendingApprovals]  = useState(0);
  const [unreadNotifs,      setUnreadNotifs]       = useState(0);
  const [overdueFollowUps,  setOverdueFollowUps]  = useState(0);
  const [todayFollowUps,    setTodayFollowUps]    = useState(0);

  useEffect(() => {
    let mounted = true;
    if (currentRole === "admin") {
      fetchApprovals("pending")
        .then((r) => { if (mounted) setPendingApprovals(r.approvals?.length ?? 0); })
        .catch(() => {});
      fetchFollowUpCounts()
        .then((c) => { if (mounted) { setOverdueFollowUps(c.overdue); setTodayFollowUps(c.today); } })
        .catch(() => {});
    }
    fetchUnreadCount()
      .then((count) => { if (mounted) setUnreadNotifs(count); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [currentRole]);

  const BADGE_MAP: Record<string, { count: number; color: string }> = {
    "/crm/admin/approvals": { count: pendingApprovals,                    color: "#D97706" },
    "/crm/admin/followups": { count: overdueFollowUps + todayFollowUps,  color: "#DC2626" },
  };

  const userName = authUser
    ? `${authUser.firstName} ${authUser.lastName}`
    : accent.desc;

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{ background: "hsl(222 47% 10%)", borderRight: "1px solid hsl(215 25% 17%)" }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(215 25% 15%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)" }}>
            <Scale size={15} strokeWidth={2.5} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white block leading-none" style={{ fontFamily: "'Sora', sans-serif" }}>
              Klaw<span style={{ color: "#F59E0B" }}>Tax</span>
            </span>
            <span className="text-[10px] mt-0.5 block" style={{ color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif" }}>
              CRM Portal
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10" aria-label="Close sidebar">
            <X size={16} strokeWidth={2} className="text-neutral-400" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "hsl(215 25% 14%)", border: "1px solid hsl(215 25% 20%)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${accent.dot}18` }}>
            {currentRole === "admin"    ? <Scale    size={14} style={{ color: accent.dot }} /> :
             currentRole === "employee" ? <Briefcase size={14} style={{ color: accent.dot }} /> :
                                          <Users    size={14} style={{ color: accent.dot }} />}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold block leading-none"
              style={{ color: accent.dot, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>
              {accent.name.toUpperCase()}
            </span>
            <span className="text-[11px] truncate block mt-0.5"
              style={{ color: "hsl(215 16% 45%)", fontFamily: "'DM Sans', sans-serif" }}>
              {userName}
            </span>
          </div>
          {unreadNotifs > 0 && (
            <div className="text-center flex-shrink-0">
              <span className="text-sm font-bold block leading-none"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "#D97706" }}>{unreadNotifs}</span>
              <span className="text-[9px]" style={{ color: "hsl(215 16% 38%)" }}>notif</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav role="navigation" aria-label="CRM navigation" className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="text-[10px] font-bold tracking-wider px-3 mb-2"
          style={{ color: "hsl(215 16% 38%)", fontFamily: "'DM Sans', sans-serif" }}>
          NAVIGATION
        </div>
        <div className="space-y-0.5">
          {menu.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/crm/admin" && item.path !== "/crm/employee" && item.path !== "/crm/client" &&
               location.pathname.startsWith(item.path + "/"));
            const badge = BADGE_MAP[item.path];
            const showBadge = badge && badge.count > 0;

            return (
              <Link key={item.path} to={item.path} onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150")}
                style={{ fontFamily: "'DM Sans', sans-serif", background: isActive ? accent.activeBg : "transparent", color: isActive ? accent.active : "hsl(215 16% 55%)" }}
                onMouseEnter={(e) => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(215 25% 18%)"; el.style.color = "hsl(0 0% 88%)"; } }}
                onMouseLeave={(e) => { if (!isActive) { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(215 16% 55%)"; } }}
              >
                <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                  style={{ background: isActive ? `${accent.dot}22` : "transparent", color: isActive ? accent.dot : "currentColor" }}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {showBadge ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${badge.color}20`, color: badge.color }}>
                    {badge.count}
                  </span>
                ) : isActive ? (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent.dot }} />
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: "1px solid hsl(215 25% 17%)" }}>
        <Link to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ fontFamily: "'DM Sans', sans-serif", color: "hsl(215 16% 47%)" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "hsl(215 25% 18%)"; el.style.color = "hsl(0 0% 80%)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "hsl(215 16% 47%)"; }}>
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
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 overflow-hidden">
        <SidebarContent />
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside key="mobile-sidebar" initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-40 overflow-hidden">
            <SidebarContent onClose={onMobileClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
