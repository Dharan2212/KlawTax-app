/**
 * ClientSupport — Batch 5.3 (correct backend types)
 *
 * Uses:
 *  - fetchTickets()          → { tickets: ApiSupportTicket[]; total: number }
 *  - fetchClientProjects()   → ClientProjectListResponse (projectId, not _id)
 *  - createTicket()          → ApiSupportTicket
 *  - addTicketMessage()      → void/unknown
 *
 * ApiSupportTicket uses _id, ticketNumber, subject, status, priority,
 * messages[], escalationTier, createdAt.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTickets, createTicket, addTicketMessage, fetchClientProjects,
  type ApiSupportTicket,
  type ClientProjectSummary,
} from "@/lib/crmApi";
import {
  Loader2, AlertCircle, RefreshCw, MessageCircle,
  Plus, Send, ChevronDown, ChevronUp, CheckCircle2,
} from "lucide-react";

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Open",        bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  in_progress: { label: "In Progress", bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  resolved:    { label: "Resolved",    bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  closed:      { label: "Closed",      bg: "rgba(100,116,139,0.10)", color: "#475569" },
  escalated:   { label: "Escalated",   bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#64748B" },
  medium: { label: "Medium", color: "#B45309" },
  high:   { label: "High",   color: "#DC2626" },
  urgent: { label: "Urgent", color: "#7C2D12" },
};

export default function ClientSupport() {
  const { user } = useAuth();

  const [tickets, setTickets]       = useState<ApiSupportTicket[]>([]);
  const [projects, setProjects]     = useState<ClientProjectSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [expandedId, setExpanded]   = useState<string | null>(null);
  const [replyText, setReplyText]   = useState<Record<string, string>>({});
  const [sending, setSending]       = useState<string | null>(null);

  // New ticket form state
  const [subject, setSubject]         = useState("");
  const [message, setMessage]         = useState("");
  const [selProjectId, setSelProject] = useState("");
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [tickRes, projRes] = await Promise.all([
        fetchTickets({ limit: 50 } as Parameters<typeof fetchTickets>[0]),
        fetchClientProjects({ limit: 20 }),
      ]);
      const loadedTickets  = tickRes.tickets ?? [];
      const loadedProjects = projRes.projects ?? [];
      setTickets(loadedTickets);
      setProjects(loadedProjects);
      // Pre-select first project
      if (loadedProjects.length > 0 && !selProjectId) {
        setSelProject(loadedProjects[0].projectId);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!subject.trim() || !message.trim()) {
      setCreateError("Subject and message are required.");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      await createTicket({
        subject: subject.trim(),
        message: message.trim(),
        projectId: selProjectId || undefined,
      });
      setSubject("");
      setMessage("");
      setShowNew(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create ticket.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }

  async function handleReply(ticketId: string) {
    const text = (replyText[ticketId] ?? "").trim();
    if (!text) return;
    setSending(ticketId);
    try {
      await addTicketMessage(ticketId, text);
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
      await loadData();
    } catch { /* silent — ticket still visible */ }
    setSending(null);
  }

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load support tickets.</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const openCount     = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Support</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            {openCount > 0 && <span className="ml-2 text-blue-600 font-semibold">({openCount} open)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100"
            title="Refresh">
            <RefreshCw size={13} className="text-neutral-400" />
          </button>
          <button onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "#1E3A8A", color: "white" }}>
            <Plus size={13} /> New Ticket
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#EFF6FF" }}>
              <MessageCircle size={14} style={{ color: "#1E3A8A" }} />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900">{openCount}</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Open</p>
            </div>
          </div>
          <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#DCFCE7" }}>
              <CheckCircle2 size={14} style={{ color: "#15803D" }} />
            </div>
            <div>
              <p className="text-base font-bold text-neutral-900">{resolvedCount}</p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Resolved</p>
            </div>
          </div>
        </div>
      )}

      {/* New ticket form */}
      {showNew && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #BFDBFE" }}>
          <h2 className="text-sm font-bold text-neutral-900">New Support Ticket</h2>

          {/* Project selector — uses projectId (ClientProjectSummary) */}
          {projects.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-neutral-500 mb-1 block">Related Project (optional)</label>
              <select
                value={selProjectId}
                onChange={(e) => setSelProject(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}>
                <option value="">No specific project</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-500 mb-1 block">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail…"
              rows={4}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}
            />
          </div>

          {createError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={11} /> {createError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
              style={{ background: "#1E3A8A", color: "white" }}>
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              Submit Ticket
            </button>
            <button
              onClick={() => { setShowNew(false); setCreateError(""); }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ticket list */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle size={32} className="text-neutral-300 mb-3" />
          <h3 className="font-bold text-neutral-700 mb-1">No Support Tickets</h3>
          <p className="text-sm text-neutral-400">Need help? Create a support ticket and our team will respond within 24 hours.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const sc         = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
            const pc         = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.low;
            const isExpanded = expandedId === ticket._id;
            const isClosed   = ticket.status === "resolved" || ticket.status === "closed";

            return (
              <div key={ticket._id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "white", border: "1px solid #E8EDF3" }}>

                {/* Ticket header — always visible */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : ticket._id)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: sc.bg }}>
                      <MessageCircle size={13} style={{ color: sc.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-neutral-400">#{ticket.ticketNumber}</span>
                        <span className="text-[10px] text-neutral-400">{ageLabel(ticket.createdAt)}</span>
                        <span className="text-[10px] font-semibold" style={{ color: pc.color }}>{pc.label}</span>
                        {(ticket.escalationTier ?? 0) > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                            Escalated T{ticket.escalationTier}
                          </span>
                        )}
                        {ticket.messages.length > 0 && (
                          <span className="text-[10px] text-neutral-400">
                            {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                    {isExpanded
                      ? <ChevronUp size={14} className="text-neutral-400" />
                      : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </button>

                {/* Expanded thread */}
                {isExpanded && (
                  <div className="px-4 pb-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                    {ticket.messages.length === 0 ? (
                      <p className="text-xs text-neutral-400 text-center py-4">No messages yet</p>
                    ) : (
                      <div className="pt-3 space-y-2">
                        {ticket.messages.map((msg, i) => {
                          const isClient = msg.senderRole === "client";
                          return (
                            <div key={i} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                              <div
                                className="max-w-[82%] rounded-xl p-3"
                                style={{ background: isClient ? "#EFF6FF" : "#F8FAFC", border: "1px solid #E8EDF3" }}>
                                <p className="text-xs text-neutral-700 leading-relaxed">{msg.content}</p>
                                <p className="text-[9px] text-neutral-400 mt-1.5">
                                  {ageLabel(msg.createdAt)} · {isClient ? "You" : "KlawTax Team"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Reply box — hidden for closed/resolved tickets */}
                    {!isClosed && (
                      <div className="flex gap-2 pt-3">
                        <input
                          type="text"
                          placeholder="Reply to this ticket…"
                          value={replyText[ticket._id] ?? ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({ ...prev, [ticket._id]: e.target.value }))
                          }
                          onKeyDown={(e) => { if (e.key === "Enter") handleReply(ticket._id); }}
                          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                          style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}
                        />
                        <button
                          onClick={() => handleReply(ticket._id)}
                          disabled={sending === ticket._id}
                          className="px-3 py-2 rounded-xl flex items-center justify-center disabled:opacity-60"
                          style={{ background: "#1E3A8A" }}>
                          {sending === ticket._id
                            ? <Loader2 size={14} className="animate-spin text-white" />
                            : <Send size={14} className="text-white" />}
                        </button>
                      </div>
                    )}

                    {isClosed && (
                      <p className="text-xs text-neutral-400 text-center mt-3 flex items-center justify-center gap-1">
                        <CheckCircle2 size={11} /> This ticket has been {ticket.status}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
