import { useState, useEffect } from "react";
import { Menu, Bell, Search, ChevronRight, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import NotificationCenter from "./shared/NotificationCenter";
import { fetchUnreadCount } from "@/lib/crmApi";

interface CRMNavbarProps {
  onMenuToggle?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  "/crm/admin":           "Dashboard",
  "/crm/admin/clients":   "Client Management",
  "/crm/admin/projects":  "Projects",
  "/crm/admin/approvals": "Approval Queue",
  "/crm/admin/payments":  "Payments",
  "/crm/admin/reports":   "Reports",
  "/crm/employee":          "Dashboard",
  "/crm/employee/projects": "My Projects",
  "/crm/client":            "Dashboard",
  "/crm/client/project":    "My Project",
  "/crm/client/submit":     "Submit Documents",
  "/crm/client/payments":   "Payments",
  "/crm/client/support":    "Support",
};

const ROLE_CONFIG: Record<string, { label: string; dot: string; badge: string; text: string }> = {
  admin:    { label: "Admin",    dot: "hsl(221 83% 53%)", badge: "hsl(214 95% 93%)", text: "hsl(222 73% 33%)" },
  employee: { label: "Employee", dot: "hsl(160 84% 39%)", badge: "hsl(152 60% 92%)", text: "hsl(160 84% 25%)" },
  client:   { label: "Client",   dot: "hsl(43 96% 56%)",  badge: "hsl(48 96% 89%)",  text: "hsl(28 90% 37%)" },
};

export default function CRMNavbar({ onMenuToggle }: CRMNavbarProps) {
  const [notifOpen, setNotifOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, role, logout } = useAuth();

  const currentRole = role ?? "client";
  const roleMeta    = ROLE_CONFIG[currentRole] ?? ROLE_CONFIG.client;
  const pageLabel   = ROUTE_LABELS[location.pathname] ?? "Overview";
  const userInitial = user ? (user.firstName?.charAt(0) ?? "U").toUpperCase() : "U";
  const userName    = user ? `${user.firstName} ${user.lastName}` : "User";

  // Poll unread notification count
  useEffect(() => {
    let mounted = true;
    async function poll() {
      try {
        const count = await fetchUnreadCount();
        if (mounted) setUnreadCount(count);
      } catch { /* silent */ }
    }
    poll();
    const timer = setInterval(poll, 30_000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header
        className="sticky top-0 z-20 flex items-center gap-4"
        style={{
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid hsl(213 27% 84% / 0.8)",
          padding: "0 24px",
          height: "60px",
          boxShadow: "0 1px 0 hsl(213 27% 84% / 0.6)",
        }}
      >
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-neutral-100"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} strokeWidth={2} className="text-neutral-600" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-medium hidden sm:block truncate" style={{ color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif" }}>
            {roleMeta.label} Panel
          </span>
          <ChevronRight size={13} strokeWidth={2} className="hidden sm:block flex-shrink-0" style={{ color: "hsl(213 27% 84%)" }} />
          <span className="text-sm font-semibold truncate" style={{ color: "hsl(222 47% 11%)", fontFamily: "'Sora', sans-serif" }}>
            {pageLabel}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <button
            className="hidden md:flex items-center gap-2 rounded-lg transition-colors"
            style={{ background: "hsl(210 40% 96%)", border: "1px solid hsl(213 27% 84% / 0.8)", padding: "7px 12px", color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem" }}
          >
            <Search size={13} strokeWidth={2} />
            <span>Search...</span>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen(v => !v)}
            aria-label={`${unreadCount} unread notifications`}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-neutral-100"
          >
            <Bell size={16} strokeWidth={2} style={{ color: "hsl(215 16% 47%)" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 text-[9px] font-bold flex items-center justify-center rounded-full"
                style={{ background: "#DC2626", color: "white", minWidth: "14px", height: "14px", padding: "0 3px", border: "1.5px solid white", fontFamily: "'DM Sans', sans-serif" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Role badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: roleMeta.badge, color: roleMeta.text, fontFamily: "'DM Sans', sans-serif" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: roleMeta.dot }} />
            {roleMeta.label}
          </div>

          {/* User avatar */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", fontFamily: "'Sora', sans-serif" }}
            title={userName}
          >
            {userInitial}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-red-50 text-neutral-400 hover:text-red-500"
            title="Sign out"
          >
            <LogOut size={15} strokeWidth={2} />
          </button>
        </div>
      </header>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
