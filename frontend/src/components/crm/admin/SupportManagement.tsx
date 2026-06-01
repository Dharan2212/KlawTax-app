/**
 * SupportManagement — Batch 3 (smart table)
 * Full admin support ticket table: search + status/priority filters + sort + pagination
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  AlertCircle, Loader2, RefreshCw, Filter,
  MessageSquare, Clock, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Send,
} from "lucide-react";
import {
  fetchTickets, updateTicketStatus, addTicketMessage, exportSupport,
  type ApiSupportTicket,
} from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtRelative(d: string): string {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (diff < 1)   return "Just now";
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: typeof MessageSquare }> = {
  open:           { label: "Open",           color: "#2563EB", bg: "rgba(37,99,235,0.10)",   icon: MessageSquare },
  in_progress:    { label: "In Progress",    color: "#D97706", bg: "rgba(217,119,6,0.10)",   icon: Clock         },
  waiting_client: { label: "Waiting Client", color: "#7C3AED", bg: "rgba(124,58,237,0.10)",  icon: Clock         },
  resolved:       { label: "Resolved",       color: "#15803D", bg: "rgba(22,163,74,0.10)",   icon: CheckCircle2  },
  closed:         { label: "Closed",         color: "#64748B", bg: "rgba(100,116,139,0.10)", icon: XCircle       },
};

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  urgent: { label: "Urgent", color: "#DC2626", bg: "rgba(220,38,38,0.10)"   },
  high:   { label: "High",   color: "#B45309", bg: "rgba(217,119,6,0.10)"   },
  medium: { label: "Medium", color: "#2563EB", bg: "rgba(37,99,235,0.10)"   },
  low:    { label: "Low",    color: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

const STATUS_PILLS: PillFilter[] = [
  { key: "all",           label: "All",           bg: "#1E3A8A", color: "white" },
  { key: "open",          label: "Open",          bg: "#2563EB", color: "white" },
  { key: "in_progress",   label: "In Progress",   bg: "#D97706", color: "white" },
  { key: "waiting_client",label: "Waiting Client",bg: "#7C3AED", color: "white" },
  { key: "resolved",      label: "Resolved",      bg: "#16A34A", color: "white" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "updatedAt", label: "Last Updated" },
  { value: "priority",  label: "Priority"     },
  { value: "status",    label: "Status"       },
];

const PAGE_SIZE = 20;

// ── Ticket row with expand ─────────────────────────────────────

function TicketRow({
  ticket,
  onStatusChange,
}: {
  ticket: ApiSupportTicket;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
  const pc = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.medium;
  const isEscalated = (ticket.escalationTier ?? 0) >= 1;
  const lastMsg = ticket.messages?.[ticket.messages.length - 1];

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try { await onStatusChange(ticket._id, newStatus); }
    finally { setUpdatingStatus(false); }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await addTicketMessage(ticket._id, replyText.trim());
      setReplyText("");
    } catch { /* ignore */ }
    finally { setSendingReply(false); }
  };

  const nextStatuses: Record<string, string[]> = {
    open:           ["in_progress", "closed"],
    in_progress:    ["waiting_client", "resolved", "closed"],
    waiting_client: ["in_progress", "resolved", "closed"],
    resolved:       ["closed", "open"],
    closed:         ["open"],
  };
  const allowed = nextStatuses[ticket.status] ?? [];

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "white",
        border: `1px solid ${isEscalated ? "#FED7D7" : "#E8EDF3"}`,
        boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
      }}>
      {/* Header row */}
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3 flex-wrap hover:bg-neutral-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: sc.bg, color: sc.color }}>
            <sc.icon size={14} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-xs font-bold text-neutral-400 font-mono">{ticket.ticketNumber}</p>
              {isEscalated && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#FEF2F2", color: "#DC2626" }}>
                  ESC T{ticket.escalationTier}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-900 truncate">{ticket.subject}</p>
            {lastMsg && (
              <p className="text-xs text-neutral-400 truncate mt-0.5 max-w-[300px]">
                {lastMsg.content}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
          <span className="text-[10px] text-neutral-400">{fmtRelative(ticket.updatedAt)}</span>
          {expanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "#F1F5F9" }}>
          {/* Meta */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-neutral-400">
            <span>Created: {fmtDate(ticket.createdAt)}</span>
            <span>Updated: {fmtDate(ticket.updatedAt)}</span>
            {ticket.category && <span>Category: <span className="font-semibold text-neutral-600 capitalize">{ticket.category.replace(/_/g, " ")}</span></span>}
          </div>

          {/* Messages thread */}
          {ticket.messages && ticket.messages.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ticket.messages.map((msg, i) => (
                <div key={i}
                  className={`text-xs p-2.5 rounded-xl ${msg.senderRole === "client" ? "ml-4" : "mr-4"}`}
                  style={{
                    background: msg.senderRole === "client" ? "#F8FAFC" : "#EFF6FF",
                    color: "#334155",
                    border: "1px solid " + (msg.senderRole === "client" ? "#E8EDF3" : "#BFDBFE"),
                  }}>
                  <p className="font-semibold capitalize mb-0.5"
                    style={{ color: msg.senderRole === "client" ? "#64748B" : "#1E3A8A" }}>
                    {msg.senderRole}
                  </p>
                  <p>{msg.content}</p>
                  <p className="text-neutral-400 mt-1 text-[10px]">{fmtRelative(msg.createdAt)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply box */}
          <div className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              placeholder="Type a reply…"
              className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
              style={{ background: "#F8FAFC", border: "1.5px solid #E8EDF3", color: "#1E1E1E" }}
            />
            <button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sendingReply}
              className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
              style={{ background: "#1E3A8A", color: "white" }}>
              {sendingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            </button>
          </div>

          {/* Status actions */}
          {allowed.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[10px] text-neutral-400 font-semibold">Update status:</span>
              {allowed.map((s) => {
                const cfg = STATUS_CFG[s] ?? STATUS_CFG.open;
                return (
                  <button key={s}
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange(s)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.bg}` }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export default function SupportManagement() {
  const [tickets, setTickets]   = useState<ApiSupportTicket[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusPill, setStatusPill]   = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage]               = useState(1);
  const [sortBy, setSortBy]           = useState("updatedAt");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q: Record<string, string | number> = { page, limit: PAGE_SIZE };
      if (statusPill !== "all")  q.status = statusPill;
      if (priorityFilter)        q.priority = priorityFilter;
      const res = await fetchTickets(q as Parameters<typeof fetchTickets>[0]);
      let list = res.tickets ?? [];
      // client-side search on subject (backend may not support full-text search)
      if (debouncedSearch) {
        const q2 = debouncedSearch.toLowerCase();
        list = list.filter((t) =>
          t.subject.toLowerCase().includes(q2) ||
          t.ticketNumber.toLowerCase().includes(q2)
        );
      }
      // client-side sort
      list = [...list].sort((a, b) => {
        const aVal = sortBy === "priority"
          ? (["urgent","high","medium","low"].indexOf(a.priority))
          : sortBy === "status"
          ? a.status.localeCompare(b.status)
          : new Date(sortBy === "createdAt" ? a.createdAt : a.updatedAt).getTime() -
            new Date(sortBy === "createdAt" ? b.createdAt : b.updatedAt).getTime();
        const bVal = sortBy === "priority"
          ? (["urgent","high","medium","low"].indexOf(b.priority))
          : sortBy === "status"
          ? b.status.localeCompare(a.status)
          : new Date(sortBy === "createdAt" ? a.createdAt : a.updatedAt).getTime() -
            new Date(sortBy === "createdAt" ? b.createdAt : b.updatedAt).getTime();
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDir === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
      setTickets(list);
      setTotal(res.total ?? list.length);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusPill, priorityFilter, sortBy, sortDir]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateTicketStatus(id, status);
    loadData();
  };

  const pages = Math.ceil(total / PAGE_SIZE);
  const openCount     = tickets.filter((t) => t.status === "open").length;
  const urgentCount   = tickets.filter((t) => t.priority === "urgent").length;
  const escalCount    = tickets.filter((t) => (t.escalationTier ?? 0) >= 1).length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load support tickets.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            Support Tickets
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} total · {openCount} open · {urgentCount} urgent · {escalCount} escalated
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportSupport({
              search,
              status: statusPill !== "all" ? statusPill : undefined,
              priority: priorityFilter || undefined,
            })}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: showFilters ? "#EFF6FF" : "white",
              border: `1px solid ${showFilters ? "#BFDBFE" : "#E8EDF3"}`,
              color: showFilters ? "#1E3A8A" : "#64748B",
            }}>
            <Filter size={12} /> Filters
          </button>
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Open",      count: openCount,     color: "#2563EB", bg: "#EFF6FF" },
          { label: "Urgent",    count: urgentCount,   color: "#DC2626", bg: "#FEF2F2" },
          { label: "Escalated", count: escalCount,    color: "#B45309", bg: "#FEF3C7" },
          { label: "Resolved",  count: resolvedCount, color: "#15803D", bg: "#DCFCE7" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: bg, color }}>
              <MessageSquare size={14} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>{count}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <CRMFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by ticket number, subject…"
        pills={STATUS_PILLS}
        activePill={statusPill}
        onPillChange={(k) => { setStatusPill(k); setPage(1); }}
        rightSlot={
          <SortSelector
            value={sortBy}
            options={SORT_OPTIONS}
            dir={sortDir}
            onValueChange={(v) => { setSortBy(v); setPage(1); }}
            onDirChange={(d) => { setSortDir(d); setPage(1); }}
          />
        }
      />

      {/* Extended filters */}
      {showFilters && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              className="rounded-lg px-2.5 py-2 text-xs outline-none"
              style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155", minWidth: "130px" }}>
              <option value="">All priorities</option>
              {Object.entries(PRIORITY_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => { setPriorityFilter(""); setSearch(""); setStatusPill("all"); setPage(1); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
            Clear all filters
          </button>
        </div>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No tickets found</p>
          <button onClick={() => { setSearch(""); setStatusPill("all"); setPriorityFilter(""); setPage(1); }}
            className="mt-3 text-xs text-blue-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tickets.map((ticket) => (
            <TicketRow key={ticket._id} ticket={ticket} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <PaginationBar page={page} pages={pages} total={total} limit={PAGE_SIZE}
          onPageChange={(p) => setPage(p)} loading={loading} />
      )}
    </motion.div>
  );
}
