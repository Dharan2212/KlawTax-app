import { useState } from "react";
import { Menu, Bell, Search, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useCRMStore } from "@/store/useCRMStore";
import RoleSwitcher from "./RoleSwitcher";
import NotificationCenter from "./shared/NotificationCenter";

interface CRMNavbarProps {
  onMenuToggle?: () => void;
}

const ROUTE_LABELS: Record<string, string> = {
  "/crm/admin": "Dashboard",
  "/crm/admin/clients": "Client Management",
  "/crm/admin/projects": "Projects",
  "/crm/admin/approvals": "Approval Queue",
  "/crm/admin/payments": "Payments",
  "/crm/admin/reports": "Reports",
  "/crm/employee": "Dashboard",
  "/crm/employee/projects": "My Projects",
  "/crm/client": "Dashboard",
  "/crm/client/project": "My Project",
  "/crm/client/submit": "Submit Update",
};

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    dot: "hsl(221 83% 53%)",
    badge: "hsl(214 95% 93%)",
    text: "hsl(222 73% 33%)",
  },
  employee: {
    label: "Employee",
    dot: "hsl(160 84% 39%)",
    badge: "hsl(152 60% 92%)",
    text: "hsl(160 84% 25%)",
  },
  client: {
    label: "Client",
    dot: "hsl(43 96% 56%)",
    badge: "hsl(48 96% 89%)",
    text: "hsl(28 90% 37%)",
  },
};

export default function CRMNavbar({ onMenuToggle }: CRMNavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const location    = useLocation();
  const currentRole = useCRMStore((s) => s.currentRole);
  const users       = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser = users.find((u) => u.id === currentUserId);
  const submissions = useCRMStore((s) => s.clientSubmissions);
  const projects    = useCRMStore((s) => s.projects);
  const payments    = useCRMStore((s) => s.payments);

  // Live counts
  const pendingCount  = currentRole === "admin" ? submissions.filter((s) => s.status === "pending").length : 0;
  const overdueProj   = currentRole === "admin" ? projects.filter((p) => p.status !== "completed" && new Date(p.deadline) < new Date()).length : 0;
  const overduePay    = currentRole === "admin" ? payments.filter((p) => p.status === "overdue").length : 0;
  const notifCount    = pendingCount + overdueProj + overduePay;

  const pageLabel = ROUTE_LABELS[location.pathname] ?? "Overview";
  const roleMeta  = ROLE_CONFIG[currentRole];
  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

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
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} strokeWidth={2} className="text-neutral-600" aria-hidden="true" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span
            className="text-xs font-medium hidden sm:block truncate"
            style={{ color: "hsl(215 16% 47%)", fontFamily: "'DM Sans', sans-serif" }}
          >
            {roleLabel} Panel
          </span>
          <ChevronRight
            size={13}
            strokeWidth={2}
            className="hidden sm:block flex-shrink-0"
            style={{ color: "hsl(213 27% 84%)" }}
            aria-hidden="true"
          />
          <span
            className="text-sm font-semibold truncate"
            style={{ color: "hsl(222 47% 11%)", fontFamily: "'Sora', sans-serif" }}
          >
            {pageLabel}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <button
            className="hidden md:flex items-center gap-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            style={{
              background: "hsl(210 40% 96%)",
              border: "1px solid hsl(213 27% 84% / 0.8)",
              padding: "7px 12px",
              color: "hsl(215 16% 47%)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8125rem",
            }}
            aria-label="Search"
          >
            <Search size={13} strokeWidth={2} aria-hidden="true" />
            <span>Search...</span>
            <span
              className="ml-1 text-[10px] px-1 rounded"
              style={{ background: "hsl(213 27% 84%)", color: "hsl(215 25% 27%)" }}
              aria-hidden="true"
            >
              ⌘K
            </span>
          </button>

          {/* Notification bell */}
          <button
            onClick={() => setNotifOpen((v) => !v)}
            aria-label={`${notifCount} notifications. ${notifOpen ? "Close" : "Open"} notification center`}
            aria-expanded={notifOpen}
            aria-haspopup="dialog"
            className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Bell size={16} strokeWidth={2} style={{ color: "hsl(215 16% 47%)" }} aria-hidden="true" />
            {notifCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 text-[9px] font-bold flex items-center justify-center rounded-full"
                style={{
                  background: "#DC2626",
                  color: "white",
                  minWidth: "14px",
                  height: "14px",
                  padding: "0 3px",
                  border: "1.5px solid white",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                aria-hidden="true"
              >
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          {/* Role badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
            style={{
              background: roleMeta.badge,
              color: roleMeta.text,
              fontFamily: "'DM Sans', sans-serif",
            }}
            aria-label={`Current role: ${roleMeta.label}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: roleMeta.dot }} aria-hidden="true" />
            {roleMeta.label}
          </div>

          <RoleSwitcher />

          {/* User avatar */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold flex-shrink-0 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, hsl(var(--color-primary-700)), hsl(var(--color-secondary-500)))",
              fontFamily: "'Sora', sans-serif",
            }}
            title={currentUser?.name ?? "User"}
            aria-label={`Logged in as ${currentUser?.name ?? "User"}`}
          >
            {(currentUser?.name ?? "U").charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Notification Center panel */}
      {currentRole === "admin" && (
        <NotificationCenter
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </>
  );
}
