/**
 * ClientSupport — Batch 3 (live API)
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTickets, createTicket, addTicketMessage, fetchClientProjects,
  type ApiSupportTicket, type ApiProject,
} from "@/lib/crmApi";
import {
  Loader2, AlertCircle, RefreshCw, MessageCircle,
  Plus, Send, ChevronDown, ChevronUp,
} from "lucide-react";

function ageLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  open:        { label: "Open",         bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  in_progress: { label: "In Progress",  bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  resolved:    { label: "Resolved",     bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  closed:      { label: "Closed",       bg: "rgba(100,116,139,0.10)", color: "#475569" },
  escalated:   { label: "Escalated",    bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};

const PRIORITY_CFG: Record<string, { label: string; color: string }> = {
  low:    { label: "Low",    color: "#64748B" },
  medium: { label: "Medium", color: "#B45309" },
  high:   { label: "High",   color: "#DC2626" },
  urgent: { label: "Urgent", color: "#7C2D12" },
};

export default function ClientSupport() {
  const { user } = useAuth();

  const [tickets, setTickets]     = useState<ApiSupportTicket[]>([]);
  const [projects, setProjects]   = useState<ApiProject[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [expandedId, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sending, setSending]     = useState<string | null>(null);

  // New ticket form
  const [subject, setSubject]   = useState("");
  const [message, setMessage]   = useState("");
  const [projId, setProjId]     = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [tickRes, projRes] = await Promise.all([
        fetchTickets(),
        fetchClientProjects(),
      ]);
      setTickets(tickRes.tickets ?? []);
      setProjects(projRes ?? []);
      if ((projRes ?? []).length > 0) setProjId((projRes ?? [])[0]._id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleCreate() {
    if (!subject.trim() || !message.trim()) { setCreateError("Subject and message are required."); return; }
    setCreating(true);
    setCreateError("");
    try {
      await createTicket({ subject: subject.trim(), message: message.trim(), projectId: projId || undefined });
      setSubject(""); setMessage(""); setShowNew(false);
      await loadData();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create ticket.");
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
    } catch { /* silent */ }
    setSending(null);
  }

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>Support</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <Plus size={13} /> New Ticket
        </button>
      </div>

      {/* New ticket form */}
      {showNew && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #BFDBFE" }}>
          <h2 className="text-sm font-bold text-neutral-900">New Support Ticket</h2>
          {projects.length > 1 && (
            <select value={projId} onChange={(e) => setProjId(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }}>
              <option value="">No specific project</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.title || p.projectCode}</option>)}
            </select>
          )}
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }} />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue…" rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }} />
          {createError && <p className="text-xs text-red-600">{createError}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
              style={{ background: "#1E3A8A", color: "white" }}>
              {creating ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Submit
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle size={32} className="text-neutral-300 mb-3" />
          <h3 className="font-bold text-neutral-700 mb-1">No Support Tickets</h3>
          <p className="text-sm text-neutral-400">Need help? Create a support ticket above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const sc = STATUS_CFG[ticket.status] ?? STATUS_CFG.open;
            const pc = PRIORITY_CFG[ticket.priority] ?? PRIORITY_CFG.low;
            const isExpanded = expandedId === ticket._id;
            return (
              <div key={ticket._id} className="rounded-2xl overflow-hidden"
                style={{ background: "white", border: "1px solid #E8EDF3" }}>
                <button onClick={() => setExpanded(isExpanded ? null : ticket._id)}
                  className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                      <MessageCircle size={13} style={{ color: "#1E3A8A" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">{ticket.subject}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-neutral-400">#{ticket.ticketNumber}</span>
                        <span className="text-[10px] text-neutral-400">{ageLabel(ticket.createdAt)}</span>
                        <span className="text-[10px] font-semibold" style={{ color: pc.color }}>{pc.label}</span>
                        {ticket.escalationTier && ticket.escalationTier > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                            Escalated T{ticket.escalationTier}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid #F1F5F9" }}>
                    <div className="pt-3 space-y-2">
                      {ticket.messages.map((msg, i) => {
                        const isClient = msg.senderRole === "client";
                        return (
                          <div key={i} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[80%] rounded-xl p-3"
                              style={{ background: isClient ? "#EFF6FF" : "#F8FAFC", border: "1px solid #E8EDF3" }}>
                              <p className="text-xs text-neutral-700">{msg.content}</p>
                              <p className="text-[9px] text-neutral-400 mt-1">{ageLabel(msg.createdAt)} · {isClient ? "You" : "KlawTax Team"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!["resolved", "closed"].includes(ticket.status) && (
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Reply…"
                          value={replyText[ticket._id] ?? ""}
                          onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket._id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleReply(ticket._id); }}
                          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                          style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}
                        />
                        <button onClick={() => handleReply(ticket._id)} disabled={sending === ticket._id}
                          className="px-3 py-2 rounded-xl flex items-center justify-center disabled:opacity-60"
                          style={{ background: "#1E3A8A" }}>
                          {sending === ticket._id ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                        </button>
                      </div>
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
