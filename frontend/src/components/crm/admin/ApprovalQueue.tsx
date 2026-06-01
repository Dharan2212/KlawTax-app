/**
 * ApprovalQueue — Batch 3 (live API only)
 *
 * All approval data comes from the backend API.
 * No mock store dependency for business data.
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchApprovals,
  approveSubmission as apiApprove,
  rejectSubmission as apiReject,
  requestRevision as apiRevise,
  type ApiApproval,
} from "@/lib/crmApi";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  CheckCircle2, X, AlertCircle, FileText,
  Clock, History, CheckCheck, XCircle, Search,
  Loader2, RefreshCw, MessageSquare,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

function ageLabel(dateStr: string): { text: string; color: string; bg: string } {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return { text: "Today",           color: "#15803D", bg: "rgba(22,163,74,0.10)"  };
  if (days === 1) return { text: "1 day ago",        color: "#D97706", bg: "rgba(217,119,6,0.10)"  };
  if (days < 7)   return { text: `${days} days ago`, color: "#D97706", bg: "rgba(217,119,6,0.10)"  };
  return           { text: `${days}d old`,            color: "#DC2626", bg: "rgba(220,38,38,0.10)"  };
}

// ── Status badges ──────────────────────────────────────────────

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(217,119,6,0.12)", color: "#B45309" }}>
      <Clock size={9} strokeWidth={3} /> Pending Review
    </span>
  );
}
function ApprovedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(22,163,74,0.10)", color: "#15803D" }}>
      <CheckCircle2 size={9} strokeWidth={3} /> Approved
    </span>
  );
}
function RejectedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
      <XCircle size={9} strokeWidth={3} /> Rejected
    </span>
  );
}
function RevisionBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9" }}>
      <MessageSquare size={9} strokeWidth={3} /> Revision Requested
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending")           return <PendingBadge />;
  if (status === "approved")          return <ApprovedBadge />;
  if (status === "rejected")          return <RejectedBadge />;
  if (status === "revision_requested") return <RevisionBadge />;
  return <span className="text-[10px] text-neutral-400">{status}</span>;
}

function EmptyPending() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(22,163,74,0.08)" }}>
        <CheckCheck size={28} strokeWidth={1.5} style={{ color: "#15803D" }} />
      </div>
      <h3 className="text-base font-bold text-neutral-900 mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>All clear!</h3>
      <p className="text-sm text-neutral-500">No pending approvals — great work.</p>
    </div>
  );
}

type Tab = "pending" | "history";

// ── Main Component ─────────────────────────────────────────────

export default function ApprovalQueue() {
  const [tab, setTab]                   = useState<Tab>("pending");
  const [approvals, setApprovals]       = useState<ApiApproval[]>([]);
  const [history, setHistory]           = useState<ApiApproval[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [rejectingId, setRejectingId]   = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [revisingId, setRevisingId]     = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [processing, setProcessing]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        fetchApprovals("pending"),
        fetchApprovals(),
      ]);
      setApprovals(pendingRes.approvals ?? []);
      setHistory((historyRes.approvals ?? []).filter((a) => a.status !== "pending"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Actions ────────────────────────────────────────────────────

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      await apiApprove(id);
      await loadData();
    } catch { /* silent — UI stays */ }
    setProcessing(null);
  }

  async function handleConfirmReject(id: string) {
    setProcessing(id);
    try {
      await apiReject(id, rejectReason.trim() || "No reason provided");
      setRejectingId(null);
      setRejectReason("");
      await loadData();
    } catch { /* silent */ }
    setProcessing(null);
  }

  async function handleConfirmRevision(id: string) {
    setProcessing(id);
    try {
      await apiRevise(id, revisionNote.trim() || "Please revise and resubmit.");
      setRevisingId(null);
      setRevisionNote("");
      await loadData();
    } catch { /* silent */ }
    setProcessing(null);
  }

  // ── Error / loading states ────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load approvals.</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  // ── Filtered history ──────────────────────────────────────────

  const filteredHistory = history.filter((a) => {
    if (!historySearch) return true;
    const hs = historySearch.toLowerCase();
    return a._id.toLowerCase().includes(hs) || a.status.toLowerCase().includes(hs);
  });

  // ── Render ────────────────────────────────────────────────────

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-bold text-xl text-neutral-900" style={{ fontFamily: "'Sora',sans-serif" }}>Approval Queue</h1>
          <p className="text-neutral-500 text-sm mt-0.5">Review and action client document submissions</p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
          style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending",  count: approvals.length,                                color: "#B45309", bg: "rgba(217,119,6,0.08)"   },
          { label: "Approved", count: history.filter((a) => a.status === "approved").length, color: "#15803D", bg: "rgba(22,163,74,0.08)"   },
          { label: "Rejected", count: history.filter((a) => a.status === "rejected").length, color: "#DC2626", bg: "rgba(220,38,38,0.08)"  },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <p className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono',monospace", color }}>{count}</p>
            <p className="text-xs mt-0.5 text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 p-1 rounded-xl mb-5" style={{ background: "#F1F5F9" }}>
        {(["pending", "history"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{ background: tab === t ? "white" : "transparent", color: tab === t ? "#0F172A" : "#64748B", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {t === "pending"
              ? <><AlertCircle size={14} strokeWidth={2} /> Pending ({approvals.length})</>
              : <><History size={14} strokeWidth={2} /> History ({history.length})</>
            }
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* PENDING tab */}
        {tab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            {approvals.length === 0
              ? <EmptyPending />
              : (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
                  {approvals.map((sub) => {
                    const isRejecting = rejectingId === sub._id;
                    const isRevising  = revisingId === sub._id;
                    const age = ageLabel(sub.submittedAt);
                    const isProcessing = processing === sub._id;

                    return (
                      <motion.div key={sub._id} variants={staggerItem}>
                        <div className="rounded-2xl overflow-hidden"
                          style={{ background: "white", border: "1.5px solid rgba(217,119,6,0.22)", boxShadow: "0 2px 12px rgba(217,119,6,0.08)" }}>
                          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)" }} />
                          <div className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: "rgba(217,119,6,0.10)" }}>
                                <FileText size={16} strokeWidth={2} style={{ color: "#D97706" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className="text-[11px] font-mono text-neutral-400 uppercase">#{sub._id.slice(-8).toUpperCase()}</span>
                                  <PendingBadge />
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: age.bg, color: age.color }}>{age.text}</span>
                                  {sub.resubmissionCount > 0 && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EDE9FE", color: "#6D28D9" }}>
                                      Revision #{sub.resubmissionCount}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-neutral-900">Project: {sub.projectId.slice(-8).toUpperCase()}</p>
                                {sub.reviewNote && (
                                  <p className="text-xs text-neutral-500 mt-1 italic">"{sub.reviewNote}"</p>
                                )}
                              </div>
                            </div>

                            {/* Rejection form */}
                            {isRejecting && (
                              <div className="mt-4 p-4 rounded-xl" style={{ background: "#FFF5F5", border: "1px solid #FED7D7" }}>
                                <p className="text-xs font-semibold text-red-700 mb-2">Rejection Reason</p>
                                <textarea
                                  className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
                                  style={{ background: "white", border: "1px solid #FECACA", color: "#1E1E1E" }}
                                  rows={3}
                                  placeholder="Explain why this is being rejected…"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleConfirmReject(sub._id)} disabled={isProcessing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    style={{ background: "#DC2626", color: "white" }}>
                                    {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Confirm Reject
                                  </button>
                                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Revision form */}
                            {isRevising && (
                              <div className="mt-4 p-4 rounded-xl" style={{ background: "#F5F3FF", border: "1px solid #C4B5FD" }}>
                                <p className="text-xs font-semibold text-purple-700 mb-2">Revision Instructions</p>
                                <textarea
                                  className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
                                  style={{ background: "white", border: "1px solid #DDD6FE", color: "#1E1E1E" }}
                                  rows={3}
                                  placeholder="Describe what needs to be revised…"
                                  value={revisionNote}
                                  onChange={(e) => setRevisionNote(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button onClick={() => handleConfirmRevision(sub._id)} disabled={isProcessing}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                                    style={{ background: "#6D28D9", color: "white" }}>
                                    {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <MessageSquare size={11} />} Request Revision
                                  </button>
                                  <button onClick={() => { setRevisingId(null); setRevisionNote(""); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-500 hover:bg-neutral-100">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            {!isRejecting && !isRevising && (
                              <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
                                <button onClick={() => handleApprove(sub._id)} disabled={!!processing}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all hover:shadow-md"
                                  style={{ background: "linear-gradient(135deg, #15803D, #22C55E)", color: "white" }}>
                                  {processing === sub._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} strokeWidth={2.5} />}
                                  Approve
                                </button>
                                <button onClick={() => { setRevisingId(sub._id); setRejectingId(null); }}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px"
                                  style={{ background: "rgba(124,58,237,0.10)", color: "#6D28D9", border: "1px solid rgba(124,58,237,0.20)" }}>
                                  <MessageSquare size={12} strokeWidth={2} /> Request Revision
                                </button>
                                <button onClick={() => { setRejectingId(sub._id); setRevisingId(null); }}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:-translate-y-px"
                                  style={{ background: "rgba(220,38,38,0.07)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.18)" }}>
                                  <X size={12} strokeWidth={2.5} /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            }
          </motion.div>
        )}

        {/* HISTORY tab */}
        {tab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search history…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "white", border: "1px solid #E8EDF3", color: "#1E1E1E" }}
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-neutral-400 text-sm">No history found</div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((a) => {
                  const age = ageLabel(a.submittedAt);
                  return (
                    <div key={a._id} className="flex items-center justify-between p-4 rounded-2xl gap-4"
                      style={{ background: "white", border: "1px solid #E8EDF3" }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(100,116,139,0.08)" }}>
                          <FileText size={14} style={{ color: "#64748B" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">#{a._id.slice(-8).toUpperCase()}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: age.bg, color: age.color }}>{age.text}</span>
                            {a.reviewNote && <span className="text-[10px] text-neutral-400 truncate">"{a.reviewNote}"</span>}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
