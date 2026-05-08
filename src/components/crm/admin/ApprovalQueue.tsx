import { useState } from "react";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  CheckCircle2, X, AlertCircle, FileText, User,
  FolderOpen, Clock, History, CheckCheck, XCircle, Search,
} from "lucide-react";

// ── Aging indicator ──────────────────────────────────────
function ageLabel(dateStr: string): { text: string; color: string; bg: string } {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return { text: "Today",          color: "#15803D", bg: "rgba(22,163,74,0.10)"  };
  if (days === 1) return { text: "1 day ago",       color: "#D97706", bg: "rgba(217,119,6,0.10)"  };
  if (days < 7)   return { text: `${days} days ago`, color: "#D97706", bg: "rgba(217,119,6,0.10)"  };
  return           { text: `${days}d old`,           color: "#DC2626", bg: "rgba(220,38,38,0.10)"  };
}



// ── Token-safe status helpers ─────────────────────────────
function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(217,119,6,0.12)", color: "#B45309", fontFamily: "'DM Sans',sans-serif" }}>
      <Clock size={9} strokeWidth={3} /> Pending Review
    </span>
  );
}
function ApprovedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(22,163,74,0.10)", color: "#15803D", fontFamily: "'DM Sans',sans-serif" }}>
      <CheckCircle2 size={9} strokeWidth={3} /> Approved
    </span>
  );
}
function RejectedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", fontFamily: "'DM Sans',sans-serif" }}>
      <XCircle size={9} strokeWidth={3} /> Rejected
    </span>
  );
}

type Tab = "pending" | "history";

export default function ApprovalQueue() {
  const allSubmissions   = useCRMStore((s) => s.clientSubmissions);
  const clients          = useCRMStore((s) => s.clients);
  const projects         = useCRMStore((s) => s.projects);
  const rejectedLog      = useCRMStore((s) => s.rejectedLog);
  const approveSubmission = useCRMStore((s) => s.approveSubmission);
  const rejectSubmission  = useCRMStore((s) => s.rejectSubmission);

  const [tab, setTab]               = useState<Tab>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const pending  = allSubmissions.filter((s) => s.status === "pending");
  const approved = allSubmissions.filter((s) => s.status === "approved");
  const rejected = allSubmissions.filter((s) => s.status === "rejected");

  const getClient  = (id: string) => clients.find((c) => c.id === id);
  const getProject = (id: string) => projects.find((p) => p.id === id);

  const historyItems = allSubmissions
    .filter((s) => s.status !== "pending")
    .filter((s) => {
      if (!historySearch) return true;
      const c = getClient(s.clientId);
      const p = getProject(s.projectId);
      return (
        s.description.toLowerCase().includes(historySearch.toLowerCase()) ||
        c?.name.toLowerCase().includes(historySearch.toLowerCase()) ||
        p?.title.toLowerCase().includes(historySearch.toLowerCase())
      );
    });

  const handleConfirmReject = (id: string) => {
    rejectSubmission(id, rejectReason.trim() || "No reason provided");
    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">Approval Queue</h1>
          <p className="text-muted-foreground text-sm mt-0.5" style={{ fontFamily: "'DM Sans',sans-serif" }}>
            Review and action client document submissions
          </p>
        </div>
      </div>

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending",  count: pending.length,  color: "#B45309", bg: "rgba(217,119,6,0.08)"  },
          { label: "Approved", count: approved.length, color: "#15803D", bg: "rgba(22,163,74,0.08)"  },
          { label: "Rejected", count: rejected.length + rejectedLog.length, color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
        ].map(({ label, count, color, bg }) => (
          <div key={label}
            className="rounded-xl p-4 text-center"
            style={{
              background: "hsl(var(--color-white))",
              border: "1px solid hsl(var(--color-neutral-200))",
              boxShadow: "var(--shadow-xs)",
            }}>
            <p className="text-2xl font-bold font-mono" style={{ color }}>{count}</p>
            <p className="text-xs mt-0.5" style={{ color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-0.5 p-1 rounded-xl mb-5"
        style={{ background: "hsl(var(--color-neutral-100))" }}>
        {(["pending", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              fontFamily: "'DM Sans',sans-serif",
              background: tab === t ? "hsl(var(--color-white))" : "transparent",
              color: tab === t ? "hsl(var(--color-foreground))" : "hsl(var(--color-muted-foreground))",
              boxShadow: tab === t ? "var(--shadow-sm)" : "none",
            }}
          >
            {t === "pending"
              ? <><AlertCircle size={14} strokeWidth={2} /> Pending ({pending.length})</>
              : <><History  size={14} strokeWidth={2} /> History ({approved.length + rejected.length})</>
            }
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── PENDING tab ── */}
        {tab === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {pending.length === 0 ? (
              <EmptyPending />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {pending.map((sub) => {
                  const client  = getClient(sub.clientId);
                  const project = getProject(sub.projectId);
                  const isRejecting = rejectingId === sub.id;

                  return (
                    <motion.div key={sub.id} variants={staggerItem}>
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: "hsl(var(--color-white))",
                          border: "1.5px solid rgba(217,119,6,0.22)",
                          boxShadow: "0 2px 12px rgba(217,119,6,0.08)",
                        }}
                      >
                        {/* Top accent bar */}
                        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)" }} />

                        <div className="p-5">
                          {/* Header row */}
                          <div className="flex items-start gap-4">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: "rgba(217,119,6,0.10)" }}
                            >
                              <FileText size={16} strokeWidth={2} style={{ color: "#D97706" }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                                  #{sub.id.toUpperCase()}
                                </span>
                                <PendingBadge />
                                <span className="text-xs text-muted-foreground ml-auto">{sub.submittedAt}</span>
                              </div>

                              <p className="text-sm font-semibold text-foreground leading-snug"
                                style={{ fontFamily: "'DM Sans',sans-serif" }}>
                                {sub.description}
                              </p>

                              {/* Meta */}
                              <div className="flex flex-wrap items-center gap-4 mt-2.5">
                                <MetaChip icon={<User size={11} strokeWidth={2.5} />} value={client?.name || "Unknown"} />
                                <MetaChip icon={<FolderOpen size={11} strokeWidth={2.5} />} value={project?.title || "Unknown Project"} />
                              </div>
                            </div>
                          </div>

                          {/* Action area */}
                          <div className="mt-4 pt-4" style={{ borderTop: "1px solid hsl(var(--color-neutral-100))" }}>
                            {isRejecting ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  aria-label="Rejection reason"
                  placeholder="State reason for rejection..."
                                  autoFocus
                                  className="flex-1 min-w-[180px] text-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                                  style={{ fontFamily: "'DM Sans',sans-serif" }}
                                />
                                <button
                                  onClick={() => handleConfirmReject(sub.id)}
                                  aria-label="Confirm rejection"
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                                  style={{ background: "#DC2626", color: "white" }}
                                >
                                  <X size={13} strokeWidth={2.5} /> Confirm Reject
                                </button>
                                <button
                                  onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                                  style={{ fontFamily: "'DM Sans',sans-serif" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => approveSubmission(sub.id)}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                                  style={{
                                    background: "rgba(22,163,74,0.10)",
                                    color: "#15803D",
                                    fontFamily: "'DM Sans',sans-serif",
                                    border: "1px solid rgba(22,163,74,0.20)",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(22,163,74,0.18)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(22,163,74,0.10)")}
                                >
                                  <CheckCheck size={15} strokeWidth={2.5} /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectingId(sub.id)}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                  style={{
                                    background: "rgba(220,38,38,0.08)",
                                    color: "#DC2626",
                                    fontFamily: "'DM Sans',sans-serif",
                                    border: "1px solid rgba(220,38,38,0.16)",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.15)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.08)")}
                                >
                                  <X size={15} strokeWidth={2.5} /> Reject
                                </button>
                                <p className="text-xs text-muted-foreground ml-auto"
                                  style={{ fontFamily: "'DM Sans',sans-serif" }}>
                                  Review carefully before actioning
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── HISTORY tab ── */}
        {tab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search */}
            <div className="relative mb-4">
              <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                aria-label="Search approval history"
              placeholder="Search history..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                style={{ fontFamily: "'DM Sans',sans-serif" }}
              />
            </div>

            {historyItems.length === 0 ? (
              <EmptyHistory />
            ) : (
              <div className="space-y-2">
                {/* Group: approved */}
                {historyItems.filter((s) => s.status === "approved").length > 0 && (
                  <div className="mb-5">
                    <SectionLabel label="Approved" color="#15803D" />
                    <div className="space-y-2 mt-2">
                      {historyItems.filter((s) => s.status === "approved").map((sub) => (
                        <HistoryCard key={sub.id} sub={sub} client={getClient(sub.clientId)} project={getProject(sub.projectId)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Group: rejected */}
                {historyItems.filter((s) => s.status === "rejected").length > 0 && (
                  <div>
                    <SectionLabel label="Rejected" color="#DC2626" />
                    <div className="space-y-2 mt-2">
                      {historyItems.filter((s) => s.status === "rejected").map((sub) => {
                        const log = rejectedLog.find((r) => r.submissionId === sub.id);
                        return (
                          <HistoryCard
                            key={sub.id}
                            sub={sub}
                            client={getClient(sub.clientId)}
                            project={getProject(sub.projectId)}
                            rejectionReason={log?.reason}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function MetaChip({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"
      style={{ fontFamily: "'DM Sans',sans-serif" }}>
      {icon} {value}
    </span>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider"
      style={{ color, fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.07em" }}>
      {label}
    </p>
  );
}

function HistoryCard({
  sub, client, project, rejectionReason
}: {
  sub: { id: string; description: string; status: string; date: string; clientId: string; projectId: string };
  client: { name: string } | undefined;
  project: { title: string } | undefined;
  rejectionReason?: string;
}) {
  const isRejected = sub.status === "rejected";
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: isRejected ? "rgba(254,242,242,0.5)" : "hsl(var(--color-white))",
        border: `1px solid ${isRejected ? "rgba(220,38,38,0.18)" : "hsl(var(--color-neutral-200))"}`,
        opacity: 0.85,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">#{sub.id.toUpperCase()}</span>
            {isRejected ? <RejectedBadge /> : <ApprovedBadge />}
            <span className="text-xs text-muted-foreground">{sub.submittedAt}</span>
          </div>
          <p className="text-sm text-foreground" style={{ fontFamily: "'DM Sans',sans-serif" }}>
            {sub.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <MetaChip icon={<User size={11} strokeWidth={2.5} />} value={client?.name || "Unknown"} />
            <MetaChip icon={<FolderOpen size={11} strokeWidth={2.5} />} value={project?.title || "—"} />
          </div>
          {isRejected && rejectionReason && (
            <p className="text-xs mt-2 px-2.5 py-1.5 rounded-lg"
              style={{
                background: "rgba(220,38,38,0.06)",
                color: "#DC2626",
                fontFamily: "'DM Sans',sans-serif",
                borderLeft: "3px solid #DC2626",
              }}>
              Reason: {rejectionReason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPending() {
  return (
    <div
      className="rounded-2xl text-center py-16"
      style={{
        background: "hsl(var(--color-white))",
        border: "1px solid hsl(var(--color-neutral-200))",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "rgba(22,163,74,0.10)" }}
      >
        <CheckCheck size={24} strokeWidth={2} style={{ color: "#15803D" }} />
      </div>
      <h3 className="font-semibold text-foreground text-base mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>
        Queue is clear
      </h3>
      <p className="text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        No submissions pending review at this time.
      </p>
    </div>
  );
}

function EmptyHistory() {
  return (
    <div
      className="rounded-2xl text-center py-14 border border-dashed"
      style={{
        borderColor: "hsl(var(--color-neutral-200))",
        background: "hsl(var(--color-neutral-50))",
      }}
    >
      <History size={28} strokeWidth={1.5} className="mx-auto mb-3 opacity-30 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">No history found</p>
      <p className="text-xs text-muted-foreground mt-1">Approved and rejected submissions will appear here.</p>
    </div>
  );
}
