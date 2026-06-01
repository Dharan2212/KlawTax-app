import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, X, CheckCheck, AlertTriangle, Clock, CreditCard,
  FolderKanban, MessageSquare, CheckCircle2, FileCheck,
  Activity, Zap, Loader2, RefreshCw, AlertCircle, Calendar,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchNotifications, markAllNotifRead, markNotifRead,
  dismissNotif, type ApiNotification, type FollowUpCounts,
} from "@/lib/crmApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  project_overdue:   <AlertTriangle size={14} className="text-red-500" aria-hidden="true" />,
  payment_received:  <CreditCard    size={14} className="text-green-600" aria-hidden="true" />,
  document_uploaded: <FileCheck     size={14} className="text-blue-600" aria-hidden="true" />,
  approval_required: <CheckCircle2  size={14} className="text-amber-600" aria-hidden="true" />,
  support_ticket:    <MessageSquare size={14} className="text-purple-600" aria-hidden="true" />,
  task_assigned:     <FolderKanban  size={14} className="text-blue-500" aria-hidden="true" />,
  system:            <Activity      size={14} className="text-slate-500" aria-hidden="true" />,
  default:           <Zap           size={14} className="text-slate-400" aria-hidden="true" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#DC2626",
  high:   "#EA580C",
  medium: "#D97706",
  low:    "#64748B",
};

// ── Component ─────────────────────────────────────────────────────────────────

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  followUpCounts?: FollowUpCounts | null;
}

export default function NotificationCenter({ open, onClose, followUpCounts }: NotificationCenterProps) {
  const panelRef   = useRef<HTMLDivElement>(null);
  const closeRef   = useRef<HTMLButtonElement>(null);
  const navigate   = useNavigate();
  const [notifs, setNotifs]   = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const loadNotifs = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchNotifications(1);
      setNotifs(result.notifications ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when opened
  useEffect(() => {
    if (open) loadNotifs();
  }, [open, loadNotifs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // ESC key dismiss
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus the close button when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => closeRef.current?.focus(), 50);
    }
  }, [open]);

  async function handleMarkAllRead() {
    try {
      await markAllNotifRead();
      setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotifRead(id);
      setNotifs(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  }

  async function handleDismiss(id: string) {
    try {
      await dismissNotif(id);
      setNotifs(ns => ns.filter(n => n._id !== id));
    } catch { /* silent */ }
  }

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed top-[68px] right-4 z-50 w-96 max-h-[540px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid hsl(213 27% 84% / 0.8)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid hsl(213 27% 90%)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: "hsl(222 47% 20%)" }} aria-hidden="true" />
              <h2
                className="text-sm font-semibold"
                style={{ color: "hsl(222 47% 11%)", fontFamily: "'Sora', sans-serif" }}
              >
                Notifications
              </h2>
              {unread > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#DC2626", color: "white" }}
                  aria-label={`${unread} unread`}
                >
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  aria-label="Mark all notifications as read"
                  title="Mark all as read"
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <CheckCheck size={14} style={{ color: "hsl(215 16% 47%)" }} aria-hidden="true" />
                </button>
              )}
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close notifications"
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <X size={14} style={{ color: "hsl(215 16% 47%)" }} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto" aria-live="polite" aria-atomic="false">

            {/* ── Follow-up summary strip (admin/employee only) ── */}
            {followUpCounts && (followUpCounts.overdue > 0 || followUpCounts.today > 0) && (
              <div className="px-4 pt-3 pb-2">
                <div
                  className="rounded-xl p-3"
                  style={{
                    background: followUpCounts.overdue > 0 ? "rgba(220,38,38,0.05)" : "rgba(217,119,6,0.05)",
                    border:     followUpCounts.overdue > 0 ? "1px solid rgba(220,38,38,0.18)" : "1px solid rgba(217,119,6,0.18)",
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>
                    Follow-ups Waiting
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {followUpCounts.overdue > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                        <AlertCircle size={10} /> {followUpCounts.overdue} overdue
                      </span>
                    )}
                    {followUpCounts.today > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(217,119,6,0.10)", color: "#B45309" }}>
                        <Clock size={10} /> {followUpCounts.today} today
                      </span>
                    )}
                    {followUpCounts.upcoming > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(37,99,235,0.08)", color: "#1E3A8A" }}>
                        <Calendar size={10} /> {followUpCounts.upcoming} upcoming
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { navigate("/crm/admin/followups"); onClose(); }}
                    className="mt-2 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                    style={{ color: followUpCounts.overdue > 0 ? "#DC2626" : "#B45309" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                  >
                    Open Follow-Up Center <ExternalLink size={9} />
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12" aria-label="Loading notifications">
                <Loader2 size={24} className="animate-spin" style={{ color: "#3B82F6" }} aria-hidden="true" />
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="text-center py-10 px-6">
                <AlertTriangle size={28} className="mx-auto mb-2" style={{ color: "#F97316" }} aria-hidden="true" />
                <p className="text-sm text-slate-500 mb-3">Could not load notifications.</p>
                <button
                  onClick={loadNotifs}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <RefreshCw size={11} aria-hidden="true" /> Try again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && notifs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "hsl(213 27% 96%)" }}
                  aria-hidden="true"
                >
                  <Bell size={20} style={{ color: "#CBD5E1" }} />
                </div>
                <p className="text-sm font-medium" style={{ color: "#1E3A8A", fontFamily: "'Sora', sans-serif" }}>
                  All caught up!
                </p>
                <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                  No new notifications right now.
                </p>
              </div>
            )}

            {/* Notification list */}
            {!loading && notifs.map(n => (
              <div
                key={n._id}
                role="article"
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                  !n.isRead ? "bg-blue-50/40" : ""
                }`}
                style={{ borderBottom: "1px solid hsl(213 27% 94%)" }}
                aria-label={`${n.isRead ? "" : "Unread: "}${n.title}`}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(213 27% 94%)" }}
                  aria-hidden="true"
                >
                  {NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p
                      className="text-sm font-medium leading-snug flex-1"
                      style={{ color: "hsl(222 47% 11%)", fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {n.title}
                    </p>
                    <span
                      className="text-[10px] flex-shrink-0 mt-0.5"
                      style={{ color: PRIORITY_COLORS[n.priority] ?? "#64748B" }}
                      aria-label={`Priority: ${n.priority}`}
                    >
                      ●
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(215 16% 47%)" }}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px]" style={{ color: "hsl(215 16% 60%)" }}>
                      <Clock size={9} className="inline mr-0.5" aria-hidden="true" />
                      {ageLabel(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="text-[11px] text-blue-500 font-medium" aria-hidden="true">
                        New
                      </span>
                    )}
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); handleDismiss(n._id); }}
                  aria-label={`Dismiss notification: ${n.title}`}
                  className="flex-shrink-0 p-1 rounded hover:bg-slate-200 transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <X size={11} style={{ color: "hsl(215 16% 60%)" }} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid hsl(213 27% 90%)" }}
            >
              <button
                onClick={loadNotifs}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <RefreshCw size={10} aria-hidden="true" /> Refresh
              </button>
              <span className="text-[11px]" style={{ color: "#94A3B8" }}>
                {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
