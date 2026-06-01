/**
 * ProjectDetail — Batch 3 (live API)
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  ArrowLeft, AlertCircle, Loader2, RefreshCw, Calendar,
  CheckCircle2, Clock, FileText, Activity, CreditCard,
  ChevronRight, User, AlertTriangle,
} from "lucide-react";
import {
  fetchProjectSummary, fetchProjectTimeline, fetchApprovals,
  fetchInvoices, updateProjectStatus,
  type ApiProject, type ApiApproval, type ApiInvoice, type ApiTimelineEntry,
} from "@/lib/crmApi";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }
function ageLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:          { bg: "rgba(100,116,139,0.10)", color: "#475569" },
  onboarding:     { bg: "rgba(124,58,237,0.10)",  color: "#6D28D9" },
  active:         { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  in_progress:    { bg: "rgba(37,99,235,0.10)",   color: "#1E3A8A" },
  waiting_client: { bg: "rgba(217,119,6,0.10)",   color: "#B45309" },
  in_review:      { bg: "rgba(20,184,166,0.10)",  color: "#0F766E" },
  completed:      { bg: "rgba(22,163,74,0.10)",   color: "#15803D" },
  delivered:      { bg: "rgba(22,163,74,0.15)",   color: "#14532D" },
  cancelled:      { bg: "rgba(220,38,38,0.10)",   color: "#DC2626" },
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Draft", onboarding: "Onboarding", active: "Active",
  in_progress: "In Progress", waiting_client: "Waiting — Client",
  in_review: "Under Review", completed: "Completed",
  delivered: "Delivered", cancelled: "Cancelled",
};

// Valid next statuses per current status
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:          ["onboarding", "cancelled"],
  onboarding:     ["active", "waiting_client", "cancelled"],
  active:         ["in_progress", "waiting_client", "in_review", "completed", "cancelled"],
  in_progress:    ["waiting_client", "in_review", "completed", "cancelled"],
  waiting_client: ["active", "in_progress", "in_review", "cancelled"],
  in_review:      ["active", "in_progress", "completed", "delivered", "cancelled"],
  completed:      ["delivered", "archived"],
  delivered:      ["archived"],
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject]   = useState<ApiProject | null>(null);
  const [timeline, setTimeline] = useState<ApiTimelineEntry[]>([]);
  const [approvals, setApprovals] = useState<ApiApproval[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "approvals" | "payments">("timeline");
  const [statusChanging, setStatusChanging] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(false);
    try {
      const [proj, tl, apps, invs] = await Promise.all([
        fetchProjectSummary(projectId),
        fetchProjectTimeline(projectId),
        fetchApprovals(),
        fetchInvoices(),
      ]);
      setProject(proj);
      setTimeline(tl ?? []);
      setApprovals((apps.approvals ?? []).filter((a) => a.projectId === projectId));
      setInvoices((invs.invoices ?? []).filter((i) => i.projectId === projectId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleStatusChange(newStatus: string) {
    if (!project) return;
    setStatusChanging(true);
    try {
      await updateProjectStatus(project._id, newStatus);
      await loadData();
    } catch { /* silent */ }
    setStatusChanging(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  }
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Project not found or failed to load.</p>
        <button onClick={() => navigate("/crm/admin/projects")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  const sc = STATUS_COLORS[project.projectStatus ?? ""] ?? STATUS_COLORS.draft;
  const nextStatuses = STATUS_TRANSITIONS[project.projectStatus ?? ""] ?? [];
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid   = invoices.reduce((s, i) => s + i.amountPaid, 0);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Back + header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/crm/admin/projects")}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft size={16} className="text-neutral-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                {project.title || project.primaryServiceSlug?.replace(/-/g, " ") || project.projectCode}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={sc}>
                {STATUS_LABELS[project.projectStatus ?? ""] ?? project.projectStatus}
              </span>
              {project.isOverdue && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
                  <AlertTriangle size={11} /> Overdue
                </span>
              )}
              {project.isStalled && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "#FEF3C7", color: "#92400E" }}>Stalled</span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{project.projectCode}</p>
          </div>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
          style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Calendar size={14} />, label: "Started", value: project.startedAt ? fmtDate(project.startedAt) : "—", color: "#1E3A8A" },
          { icon: <Clock size={14} />, label: "Deadline", value: project.expectedDeliveryDate ? fmtDate(project.expectedDeliveryDate) : "—", color: project.isOverdue ? "#DC2626" : "#64748B" },
          { icon: <CreditCard size={14} />, label: "Billed", value: fmtCurrency(totalBilled), color: "#15803D" },
          { icon: <CheckCircle2 size={14} />, label: "Collected", value: fmtCurrency(totalPaid), color: "#1E3A8A" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl p-3 flex items-center gap-3"
            style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <span style={{ color: m.color }}>{m.icon}</span>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide">{m.label}</p>
              <p className="text-sm font-bold" style={{ color: m.color, fontFamily: "'JetBrains Mono', monospace" }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
          style={{ background: "white", border: "1px solid #E8EDF3" }}>
          <User size={14} className="text-neutral-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-neutral-700">Change status:</span>
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((s) => {
              const ns = STATUS_COLORS[s] ?? STATUS_COLORS.draft;
              return (
                <button key={s} onClick={() => handleStatusChange(s)} disabled={statusChanging}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-50"
                  style={{ background: ns.bg, color: ns.color }}>
                  {statusChanging ? <Loader2 size={11} className="animate-spin inline" /> : null}
                  {STATUS_LABELS[s] ?? s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {(["timeline", "approvals", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{ background: activeTab === t ? "white" : "transparent", color: activeTab === t ? "#0F172A" : "#64748B", boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {t}{t === "approvals" && approvals.length > 0 ? ` (${approvals.length})` : ""}
          </button>
        ))}
      </div>

      {/* Timeline tab */}
      {activeTab === "timeline" && (
        <div className="space-y-2">
          {timeline.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No timeline entries yet</p>
            : timeline.map((entry) => (
                <div key={entry._id} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: "white", border: "1px solid #E8EDF3" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#EFF6FF" }}>
                    <Activity size={12} style={{ color: "#1E3A8A" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{entry.title}</p>
                    {entry.content && <p className="text-xs text-neutral-500 mt-1">{entry.content}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-neutral-400">{ageLabel(entry.createdAt)}</span>
                      {!entry.isClientVisible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>Internal</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Approvals tab */}
      {activeTab === "approvals" && (
        <div className="space-y-2">
          {approvals.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No approvals for this project</p>
            : approvals.map((a) => {
                const statusColor = a.status === "approved" ? "#15803D" : a.status === "rejected" ? "#DC2626" : "#B45309";
                const statusBg    = a.status === "approved" ? "rgba(22,163,74,0.10)" : a.status === "rejected" ? "rgba(220,38,38,0.10)" : "rgba(217,119,6,0.10)";
                return (
                  <div key={a._id} className="flex items-center justify-between p-4 rounded-xl gap-3"
                    style={{ background: "white", border: "1px solid #E8EDF3" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={14} className="text-neutral-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">#{a._id.slice(-8).toUpperCase()}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">{fmtDate(a.submittedAt)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: statusBg, color: statusColor }}>
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* Payments tab */}
      {activeTab === "payments" && (
        <div className="space-y-2">
          {invoices.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No invoices for this project</p>
            : invoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between p-4 rounded-xl gap-3"
                  style={{ background: "white", border: "1px solid #E8EDF3" }}>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{inv.invoiceNumber}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{fmtDate(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}>
                      {fmtCurrency(inv.totalAmount)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: inv.amountDue > 0 ? "#B45309" : "#15803D" }}>
                      {inv.amountDue > 0 ? `${fmtCurrency(inv.amountDue)} due` : "Paid"}
                    </p>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </motion.div>
  );
}
