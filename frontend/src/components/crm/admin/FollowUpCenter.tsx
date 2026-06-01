/**
 * FollowUpCenter — Batch 2
 *
 * Full-featured CRM follow-up management panel.
 * Shows today / overdue / upcoming follow-ups with actions:
 *   - Mark Done, Snooze (1/3/7 days), Open Lead, Add Note
 *
 * Backed by /api/v1/followups/* endpoints.
 * No mock data — live backend only.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, Clock, AlertCircle, Calendar, Search,
  RefreshCw, ChevronRight, ArrowLeft, MessageSquare,
  Bell, Loader2, Inbox, PhoneCall, MoreHorizontal,
  AlarmClock,
} from "lucide-react";
import {
  fetchFollowUps,
  fetchFollowUpCounts,
  snoozeFollowUp,
  markFollowUpDone,
  exportFollowups,
  type ApiFollowUp,
  type FollowUpBucket,
  type FollowUpCounts,
} from "@/lib/crmApi";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const d    = new Date(iso);
  const diff = Math.floor((d.getTime() - Date.now()) / 86_400_000);
  if (diff === 0)  return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1)  return "Tomorrow";
  if (diff < 0)   return `${Math.abs(diff)}d overdue`;
  return `In ${diff}d`;
}

function fullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_COLORS: Record<string, { text: string; bg: string }> = {
  new:           { text: "#1E3A8A", bg: "#EFF6FF" },
  contacted:     { text: "#0F766E", bg: "#CCFBF1" },
  qualified:     { text: "#6D28D9", bg: "#EDE9FE" },
  proposal_sent: { text: "#B45309", bg: "#FEF3C7" },
  onboarding:    { text: "#D97706", bg: "#FEF3C7" },
};

const PRIORITY_COLORS: Record<string, { text: string; bg: string }> = {
  urgent: { text: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  high:   { text: "#B45309", bg: "rgba(217,119,6,0.10)" },
  medium: { text: "#1E3A8A", bg: "rgba(37,99,235,0.10)" },
  low:    { text: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

// ── Bucket tabs ────────────────────────────────────────────────

const BUCKETS: { key: FollowUpBucket; label: string; icon: typeof Clock }[] = [
  { key: "overdue",  label: "Overdue",  icon: AlertCircle },
  { key: "today",    label: "Today",    icon: Clock },
  { key: "upcoming", label: "Upcoming", icon: Calendar },
  { key: "all",      label: "All",      icon: Bell },
];

// ── Snooze dropdown ────────────────────────────────────────────

const SNOOZE_OPTIONS = [
  { days: 1, label: "Tomorrow" },
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
];

// ── Sub-components ─────────────────────────────────────────────

function CountBadge({ count, variant }: { count: number; variant: "red" | "amber" | "blue" | "gray" }) {
  if (count === 0) return null;
  const colors = {
    red:   { bg: "rgba(220,38,38,0.10)",   text: "#DC2626" },
    amber: { bg: "rgba(217,119,6,0.10)",   text: "#B45309" },
    blue:  { bg: "rgba(37,99,235,0.10)",   text: "#1E3A8A" },
    gray:  { bg: "rgba(100,116,139,0.10)", text: "#64748B" },
  }[variant];
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
      {count}
    </span>
  );
}

interface FollowUpCardProps {
  item:      ApiFollowUp;
  onDone:    (id: string) => void;
  onSnooze:  (id: string, days: number) => void;
  onNavigate: (id: string) => void;
  loading:   boolean;
}

function FollowUpCard({ item, onDone, onSnooze, onNavigate, loading }: FollowUpCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const isOverdue = item.followUpDate && new Date(item.followUpDate) < new Date(new Date().setHours(0, 0, 0, 0));
  const sc = STATUS_COLORS[item.status] ?? { text: "#64748B", bg: "#F1F5F9" };
  const pc = PRIORITY_COLORS[item.priority] ?? PRIORITY_COLORS.low;

  return (
    <div
      className="group rounded-2xl p-4 transition-all duration-200"
      style={{
        background: "white",
        border: `1px solid ${isOverdue ? "rgba(220,38,38,0.20)" : "#E8EDF3"}`,
        boxShadow: isOverdue ? "0 2px 8px rgba(220,38,38,0.06)" : "0 1px 4px rgba(15,27,76,0.04)",
      }}
    >
      <div className="flex items-start gap-3">

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: sc.bg, color: sc.text, fontFamily: "'Sora', sans-serif" }}
        >
          {initials(item.fullName)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                {item.fullName}
              </p>
              {item.organisationName && (
                <p className="text-[11px] text-neutral-400 truncate" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {item.organisationName}
                </p>
              )}
            </div>

            {/* Date badge */}
            <div className="flex-shrink-0 text-right">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isOverdue ? "rgba(220,38,38,0.10)" : "rgba(37,99,235,0.08)",
                  color:      isOverdue ? "#DC2626" : "#1E3A8A",
                }}
              >
                {relativeDate(item.followUpDate)}
              </span>
              <p className="text-[10px] text-neutral-400 mt-0.5">{fullDate(item.followUpDate)}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 mt-2">
            <a
              href={`tel:${item.phone}`}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-600 hover:text-blue-700 transition-colors"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <PhoneCall size={11} /> {item.phone}
            </a>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.text }}>
              {item.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: pc.bg, color: pc.text }}>
              {item.priority}
            </span>
          </div>

          {/* Notes preview */}
          {(item.internalNotes || item.notes) && (
            <p className="text-[11px] text-neutral-500 mt-1.5 line-clamp-1 flex items-center gap-1">
              <MessageSquare size={10} />
              {item.internalNotes || item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">

        {/* Mark Done */}
        <button
          onClick={() => onDone(item._id)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: "rgba(22,163,74,0.08)", color: "#15803D" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(22,163,74,0.08)"; }}
        >
          <CheckCircle2 size={12} /> Done
        </button>

        {/* Snooze dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: "rgba(217,119,6,0.08)", color: "#B45309" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(217,119,6,0.15)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(217,119,6,0.08)"; }}
          >
            <AlarmClock size={12} /> Snooze <MoreHorizontal size={10} />
          </button>
          {menuOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-50 rounded-xl shadow-xl border py-1"
              style={{ background: "white", borderColor: "#E8EDF3", minWidth: "120px", boxShadow: "0 8px 24px rgba(15,27,76,0.12)" }}
            >
              {SNOOZE_OPTIONS.map((o) => (
                <button
                  key={o.days}
                  onClick={() => { onSnooze(item._id, o.days); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-neutral-50 transition-colors"
                  style={{ color: "#334155", fontFamily: "'DM Sans', sans-serif" }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Open lead */}
        <button
          onClick={() => onNavigate(item._id)}
          className="ml-auto flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-blue-700 transition-colors"
        >
          Open <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function FollowUpCenter() {
  const navigate = useNavigate();

  const [counts,    setCounts]    = useState<FollowUpCounts | null>(null);
  const [bucket,    setBucket]    = useState<FollowUpBucket>("overdue");
  const [items,     setItems]     = useState<ApiFollowUp[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [pages,     setPages]     = useState(1);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error,     setError]     = useState(false);

  const LIMIT = 15;

  // Load counts (badge numbers)
  const loadCounts = useCallback(async () => {
    try {
      const c = await fetchFollowUpCounts();
      setCounts(c);
    } catch { /* non-critical */ }
  }, []);

  // Load list
  const loadList = useCallback(async (b: FollowUpBucket, p: number, q: string) => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchFollowUps({ bucket: b, page: p, limit: LIMIT, search: q || undefined });
      setItems(result.followUps);
      setTotal(result.total);
      setPages(result.meta.pages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  useEffect(() => {
    setPage(1);
    loadList(bucket, 1, search);
  }, [bucket, search, loadList]);

  useEffect(() => {
    if (page > 1) loadList(bucket, page, search);
  }, [page, bucket, search, loadList]);

  // ── Actions ────────────────────────────────────────────────

  const handleDone = useCallback(async (id: string) => {
    setActioning(id);
    try {
      await markFollowUpDone(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      loadCounts();
    } catch { /* silent */ }
    setActioning(null);
  }, [loadCounts]);

  const handleSnooze = useCallback(async (id: string, days: number) => {
    setActioning(id);
    try {
      const result = await snoozeFollowUp(id, days);
      setItems((prev) =>
        prev.map((i) => i._id === id ? { ...i, followUpDate: result.newFollowUpDate } : i)
      );
      loadCounts();
    } catch { /* silent */ }
    setActioning(null);
  }, [loadCounts]);

  // ── Count helper ───────────────────────────────────────────

  function bucketCount(b: FollowUpBucket): number {
    if (!counts) return 0;
    if (b === "overdue")  return counts.overdue;
    if (b === "today")    return counts.today;
    if (b === "upcoming") return counts.upcoming;
    return counts.total;
  }

  function bucketVariant(b: FollowUpBucket): "red" | "amber" | "blue" | "gray" {
    if (b === "overdue")  return "red";
    if (b === "today")    return "amber";
    if (b === "upcoming") return "blue";
    return "gray";
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button
            onClick={() => navigate("/crm/admin")}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 mb-2 transition-colors"
          >
            <ArrowLeft size={12} /> Dashboard
          </button>
          <div className="flex items-center gap-2 mb-0.5">
            <Bell size={15} style={{ color: "#1E3A8A" }} />
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">CRM</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Follow-Up Center
          </h1>
          <p className="text-neutral-400 text-xs mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {total} follow-up{total !== 1 ? "s" : ""} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton compact label="Export Follow-ups" onExport={exportFollowups} />
          {counts && counts.overdue > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}
            >
              <AlertCircle size={11} strokeWidth={2.5} /> {counts.overdue} overdue
            </div>
          )}
          <button
            onClick={() => { loadList(bucket, page, search); loadCounts(); }}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={`text-neutral-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or organisation…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "white",
            border: "1px solid #E8EDF3",
            color: "#0F172A",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
          }}
          onFocus={(e) => { (e.currentTarget).style.borderColor = "#2563EB"; (e.currentTarget).style.boxShadow = "0 0 0 3px rgba(37,99,235,0.10)"; }}
          onBlur={(e)  => { (e.currentTarget).style.borderColor = "#E8EDF3"; (e.currentTarget).style.boxShadow = "0 1px 4px rgba(15,27,76,0.04)"; }}
        />
      </div>

      {/* Bucket tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {BUCKETS.map((b) => {
          const Icon    = b.icon;
          const active  = bucket === b.key;
          const cnt     = bucketCount(b.key);
          const variant = bucketVariant(b.key);
          return (
            <button
              key={b.key}
              onClick={() => setBucket(b.key)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
              style={{
                background: active ? "#1E3A8A" : "white",
                color:      active ? "white"   : "#64748B",
                border:     `1px solid ${active ? "#1E3A8A" : "#E8EDF3"}`,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow:  active ? "0 2px 8px rgba(30,58,138,0.20)" : "none",
              }}
            >
              <Icon size={12} />
              {b.label}
              {!active && <CountBadge count={cnt} variant={variant} />}
              {active && cnt > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.20)", color: "white" }}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-neutral-500">Failed to load follow-ups.</p>
          <button
            onClick={() => loadList(bucket, page, search)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "#1E3A8A", color: "white" }}
          >
            Retry
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Inbox size={36} className="text-neutral-300" />
          <p className="text-sm font-semibold text-neutral-500">
            {search ? "No results for that search." : bucket === "overdue" ? "No overdue follow-ups 🎉" : "Nothing here."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="relative">
              {actioning === item._id && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.75)" }}>
                  <Loader2 size={18} className="animate-spin text-neutral-400" />
                </div>
              )}
              <FollowUpCard
                item={item}
                onDone={handleDone}
                onSnooze={handleSnooze}
                onNavigate={(id) => navigate(`/crm/admin/clients?lead=${id}`)}
                loading={actioning === item._id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-neutral-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Page {page} of {pages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
              style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }}
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
              style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
