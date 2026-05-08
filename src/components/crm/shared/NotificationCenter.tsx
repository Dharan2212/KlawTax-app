import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCRMStore } from "@/store/useCRMStore";
import { useNavigate } from "react-router-dom";
import {
  Bell, X, CheckCheck, AlertTriangle, Clock,
  CreditCard, FolderKanban, MessageSquare, CheckCircle2,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────
function daysOverdue(deadline: string) {
  return Math.ceil((Date.now() - new Date(deadline).getTime()) / 86400000);
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Group types ────────────────────────────────────────────
type NotifItem = {
  id: string;
  label: string;
  sub: string;
  age: string;
  href: string;
  urgent?: boolean;
};

type NotifGroup = {
  key: string;
  title: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  items: NotifItem[];
};

// ── Props ─────────────────────────────────────────────────
interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const navigate       = useNavigate();
  const panelRef       = useRef<HTMLDivElement>(null);
  const submissions    = useCRMStore((s) => s.clientSubmissions);
  const projects       = useCRMStore((s) => s.projects);
  const payments       = useCRMStore((s) => s.payments);
  const clients        = useCRMStore((s) => s.clients);
  const updates        = useCRMStore((s) => s.updates);

  const getClientName  = (id: string) => clients.find((c) => c.id === id)?.name ?? "Client";
  const getProjectTitle = (id: string) => projects.find((p) => p.id === id)?.title ?? "Project";

  // ── Derive notification groups from store ────────────────

  // 1. Pending approvals
  const pendingApprovals: NotifItem[] = submissions
    .filter((s) => s.status === "pending")
    .slice(0, 5)
    .map((s) => ({
      id: `sub-${s.id}`,
      label: s.title || s.description,
      sub: getClientName(s.clientId),
      age: ageLabel(s.submittedAt),
      href: "/crm/admin/approvals",
      urgent: true,
    }));

  // 2. Overdue projects
  const overdueProjects: NotifItem[] = projects
    .filter((p) => p.status !== "completed" && new Date(p.deadline) < new Date())
    .slice(0, 5)
    .map((p) => ({
      id: `proj-${p.id}`,
      label: p.title,
      sub: `${daysOverdue(p.deadline)}d overdue`,
      age: ageLabel(p.deadline),
      href: `/crm/admin/projects/${p.id}`,
      urgent: true,
    }));

  // 3. Waiting-client projects
  const waitingClient: NotifItem[] = projects
    .filter((p) => p.status === "waiting-client")
    .slice(0, 4)
    .map((p) => ({
      id: `wait-${p.id}`,
      label: p.title,
      sub: `Awaiting client action`,
      age: ageLabel(p.deadline),
      href: `/crm/admin/projects/${p.id}`,
    }));

  // 4. Overdue payments
  const overduePayments: NotifItem[] = payments
    .filter((p) => p.status === "overdue")
    .slice(0, 4)
    .map((p) => ({
      id: `pay-${p.id}`,
      label: getClientName(p.clientId),
      sub: `₹${(p.amount - p.paidAmount).toLocaleString("en-IN")} overdue`,
      age: ageLabel(p.dueDate ?? ""),
      href: "/crm/admin/payments",
      urgent: true,
    }));

  // 5. Recent important updates (last 48h)
  const recentUpdates: NotifItem[] = updates
    .filter((u) => {
      const age = (Date.now() - new Date(u.date).getTime()) / 86400000;
      return age < 2;
    })
    .slice(0, 4)
    .map((u) => ({
      id: `upd-${u.id}`,
      label: u.message.length > 60 ? u.message.slice(0, 57) + "…" : u.message,
      sub: `${u.fromType} · ${getProjectTitle(u.projectId)}`,
      age: ageLabel(u.date),
      href: `/crm/admin/projects/${u.projectId}`,
    }));

  const groups: NotifGroup[] = [
    {
      key:   "approvals",
      title: "Pending Approvals",
      color: "#B45309",
      bg:    "rgba(217,119,6,0.08)",
      icon:  <CheckCircle2 size={13} strokeWidth={2.5} aria-hidden="true" />,
      items: pendingApprovals,
    },
    {
      key:   "overdue",
      title: "Overdue Projects",
      color: "#DC2626",
      bg:    "rgba(220,38,38,0.08)",
      icon:  <AlertTriangle size={13} strokeWidth={2.5} aria-hidden="true" />,
      items: overdueProjects,
    },
    {
      key:   "payments",
      title: "Overdue Payments",
      color: "#DC2626",
      bg:    "rgba(220,38,38,0.08)",
      icon:  <CreditCard size={13} strokeWidth={2.5} aria-hidden="true" />,
      items: overduePayments,
    },
    {
      key:   "waiting",
      title: "Waiting on Client",
      color: "#7C3AED",
      bg:    "rgba(124,58,237,0.08)",
      icon:  <Clock size={13} strokeWidth={2.5} aria-hidden="true" />,
      items: waitingClient,
    },
    {
      key:   "updates",
      title: "Recent Updates",
      color: "#1E3A8A",
      bg:    "rgba(30,58,138,0.08)",
      icon:  <MessageSquare size={13} strokeWidth={2.5} aria-hidden="true" />,
      items: recentUpdates,
    },
  ].filter((g) => g.items.length > 0);

  const totalCount = groups.reduce((s, g) => s + g.items.length, 0);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleItemClick = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            aria-modal="true"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="fixed z-40 flex flex-col"
            style={{
              top: "68px",
              right: "16px",
              width: "min(380px, calc(100vw - 32px))",
              maxHeight: "min(520px, calc(100vh - 88px))",
              background: "hsl(var(--color-white))",
              border: "1px solid hsl(var(--color-neutral-200))",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-2xl)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
              style={{ borderBottom: "1px solid hsl(var(--color-neutral-100))" }}
            >
              <div className="flex items-center gap-2">
                <Bell size={15} strokeWidth={2} style={{ color: "hsl(var(--color-primary-700))" }} aria-hidden="true" />
                <h2
                  className="text-sm font-bold text-foreground"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  Notifications
                </h2>
                {totalCount > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "rgba(220,38,38,0.10)",
                      color: "#DC2626",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    aria-label={`${totalCount} notifications`}
                  >
                    {totalCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close notifications"
                className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <X size={14} strokeWidth={2} style={{ color: "#64748B" }} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(22,163,74,0.10)" }}
                  >
                    <CheckCheck size={20} strokeWidth={2} style={{ color: "#15803D" }} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                    All clear
                  </p>
                  <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    No pending actions or overdue items.
                  </p>
                </div>
              ) : (
                <div>
                  {groups.map((group) => (
                    <div key={group.key}>
                      {/* Group header */}
                      <div
                        className="flex items-center gap-2 px-4 py-2 sticky top-0"
                        style={{
                          background: "hsl(var(--color-white))",
                          borderBottom: "1px solid hsl(var(--color-neutral-100))",
                        }}
                      >
                        <span
                          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: group.color, fontFamily: "'DM Sans', sans-serif" }}
                        >
                          <span style={{ color: group.color }}>{group.icon}</span>
                          {group.title}
                        </span>
                        <span
                          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: group.bg, color: group.color }}
                        >
                          {group.items.length}
                        </span>
                      </div>

                      {/* Group items */}
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.href)}
                          className="w-full text-left flex items-start gap-3 px-4 py-3 transition-colors"
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--color-neutral-50))")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {/* Urgency dot */}
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                            style={{ background: item.urgent ? group.color : "#CBD5E1" }}
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium text-foreground truncate"
                              style={{ fontFamily: "'DM Sans', sans-serif" }}
                            >
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.sub}
                            </p>
                          </div>
                          <span
                            className="text-[10px] flex-shrink-0 mt-0.5"
                            style={{ color: "#94A3B8", fontFamily: "'DM Sans', sans-serif" }}
                          >
                            {item.age}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {groups.length > 0 && (
              <div
                className="flex-shrink-0 px-4 py-3"
                style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}
              >
                <button
                  onClick={() => { navigate("/crm/admin/approvals"); onClose(); }}
                  className="text-xs font-semibold w-full text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                  style={{ color: "hsl(var(--color-primary-600))", fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--color-primary-700))")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--color-primary-600))")}
                >
                  View all approvals →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
