import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, AlertTriangle, Clock, CreditCard, FolderKanban, MessageSquare, CheckCircle2, FileCheck, Activity, Zap, Loader2 } from "lucide-react";
import { fetchNotifications, markAllNotifRead, markNotifRead, dismissNotif, type ApiNotification } from "@/lib/crmApi";

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  project_overdue:    <AlertTriangle size={14} className="text-red-500" />,
  payment_received:   <CreditCard    size={14} className="text-green-600" />,
  document_uploaded:  <FileCheck     size={14} className="text-blue-600" />,
  approval_required:  <CheckCircle2  size={14} className="text-amber-600" />,
  support_ticket:     <MessageSquare size={14} className="text-purple-600" />,
  task_assigned:      <FolderKanban  size={14} className="text-blue-500" />,
  system:             <Activity      size={14} className="text-slate-500" />,
  default:            <Zap           size={14} className="text-slate-400" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#DC2626",
  high:   "#EA580C",
  medium: "#D97706",
  low:    "#64748B",
};

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const panelRef    = useRef<HTMLDivElement>(null);
  const [notifs, setNotifs]     = useState<ApiNotification[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(false);

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
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="fixed top-[68px] right-4 z-50 w-96 max-h-[540px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "white", border: "1px solid hsl(213 27% 84% / 0.8)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(213 27% 90%)" }}>
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: "hsl(222 47% 20%)" }} />
              <span className="text-sm font-semibold" style={{ color: "hsl(222 47% 11%)", fontFamily: "'Sora', sans-serif" }}>
                Notifications
              </span>
              {unread > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#DC2626", color: "white" }}>
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all as read" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <CheckCheck size={14} style={{ color: "hsl(215 16% 47%)" }} />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X size={14} style={{ color: "hsl(215 16% 47%)" }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            )}
            {error && !loading && (
              <div className="text-center py-10 px-6">
                <p className="text-sm text-slate-500">Could not load notifications.</p>
                <button onClick={loadNotifs} className="mt-3 text-xs text-blue-600 hover:underline">Try again</button>
              </div>
            )}
            {!loading && !error && notifs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <Bell size={32} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-400 text-center">You're all caught up!</p>
              </div>
            )}
            {!loading && notifs.map(n => (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors hover:bg-slate-50 ${!n.isRead ? "bg-blue-50/40" : ""}`}
                style={{ borderBottom: "1px solid hsl(213 27% 94%)" }}
              >
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "hsl(213 27% 94%)" }}>
                  {NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <p className="text-sm font-medium leading-snug flex-1 truncate" style={{ color: "hsl(222 47% 11%)", fontFamily: "'DM Sans', sans-serif" }}>
                      {n.title}
                    </p>
                    <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: PRIORITY_COLORS[n.priority] ?? "#64748B" }}>
                      ●
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "hsl(215 16% 47%)" }}>{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px]" style={{ color: "hsl(215 16% 60%)" }}>{ageLabel(n.createdAt)}</span>
                    {!n.isRead && <span className="text-[11px] text-blue-500 font-medium">New</span>}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDismiss(n._id); }}
                  className="flex-shrink-0 p-1 rounded hover:bg-slate-200 transition-colors"
                >
                  <X size={11} style={{ color: "hsl(215 16% 60%)" }} />
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="px-5 py-3" style={{ borderTop: "1px solid hsl(213 27% 90%)" }}>
              <button onClick={loadNotifs} className="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
