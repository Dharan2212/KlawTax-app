/**
 * ClientProjectView — Batch 3 (live API)
 * Shows the primary active project with timeline, docs, and payment status.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchClientProjects, fetchClientTimeline, fetchClientPayments,
  fetchClientDocuments,
  type ApiProject, type ApiTimelineEntry, type ApiInvoice,
} from "@/lib/crmApi";
import {
  Loader2, AlertCircle, RefreshCw, Calendar, CreditCard,
  Activity, FileText, ChevronDown, ChevronUp,
} from "lucide-react";

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

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: "Getting Started",  bg: "rgba(100,116,139,0.10)", color: "#475569" },
  onboarding:     { label: "Onboarding",       bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  active:         { label: "In Progress",      bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress:    { label: "In Progress",      bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_client: { label: "Action Required",  bg: "rgba(245,158,11,0.12)", color: "#B45309" },
  in_review:      { label: "Under Review",     bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  completed:      { label: "Completed",        bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  delivered:      { label: "Delivered",        bg: "rgba(22,163,74,0.15)",  color: "#14532D" },
  cancelled:      { label: "Cancelled",        bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

const PROGRESS_STEP: Record<string, number> = {
  draft: 0, onboarding: 1, active: 2, in_progress: 2,
  waiting_client: 3, in_review: 4, completed: 5, delivered: 5,
};

type Tab = "timeline" | "payments" | "documents";

export default function ClientProjectView() {
  const { user } = useAuth();

  const [project, setProject]   = useState<ApiProject | null>(null);
  const [timeline, setTimeline] = useState<ApiTimelineEntry[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [documents, setDocuments] = useState<unknown[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [tab, setTab]           = useState<Tab>("timeline");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [projects, tl, invs, docs] = await Promise.all([
        fetchClientProjects(),
        fetchClientTimeline(),
        fetchClientPayments(),
        fetchClientDocuments(),
      ]);
      // Show the first active project, or any project
      const active = (projects ?? []).find(
        (p) => !["completed", "cancelled", "archived"].includes(p.projectStatus ?? "")
      ) ?? (projects?.[0] ?? null);
      setProject(active);
      setTimeline(tl ?? []);
      setInvoices(invs ?? []);
      setDocuments(docs ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (!user) return null;

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  }
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

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={32} className="text-neutral-300 mb-3" />
        <h3 className="font-bold text-neutral-700 mb-1">No Active Project</h3>
        <p className="text-sm text-neutral-400">Once you register a service, your project details will appear here.</p>
      </div>
    );
  }

  const sc         = STATUS_CFG[project.projectStatus ?? ""] ?? STATUS_CFG.active;
  const stepIdx    = PROGRESS_STEP[project.projectStatus ?? ""] ?? 1;
  const totalBilled = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid   = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalDue    = invoices.reduce((s, i) => s + i.amountDue, 0);

  const steps = ["Started", "Onboarding", "Processing", "Your Input", "Review", "Done"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            {project.title || project.primaryServiceSlug?.replace(/-/g, " ") || project.projectCode}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-xs text-neutral-400">{project.projectCode}</p>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={sc}>{sc.label}</span>
            {project.isOverdue && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>Overdue</span>
            )}
          </div>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-neutral-700">{sc.label}</p>
          <p className="text-xs text-neutral-400">Step {stepIdx + 1} of {steps.length}</p>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: "#F1F5F9" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.round(((stepIdx + 1) / steps.length) * 100)}%`, background: "linear-gradient(90deg, #1E3A8A, #3B82F6)" }} />
        </div>
        <div className="grid grid-cols-6 gap-1">
          {steps.map((s, i) => {
            const done   = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: done ? "#1E3A8A" : active ? "#EFF6FF" : "#F1F5F9", color: done ? "white" : active ? "#1E3A8A" : "#94A3B8", border: active ? "2px solid #1E3A8A" : "none" }}>
                  {done ? "✓" : i + 1}
                </div>
                <p className="text-[8px] text-center text-neutral-400 leading-tight">{s}</p>
              </div>
            );
          })}
        </div>
        {project.expectedDeliveryDate && (
          <p className="text-xs text-neutral-400 mt-4 flex items-center gap-1.5">
            <Calendar size={11} /> Expected: {fmtDate(project.expectedDeliveryDate)}
          </p>
        )}
      </div>

      {/* Payment summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Billed", value: fmtCurrency(totalBilled), color: "#1E3A8A" },
          { label: "Paid",         value: fmtCurrency(totalPaid),   color: "#15803D" },
          { label: "Due",          value: fmtCurrency(totalDue),    color: totalDue > 0 ? "#B45309" : "#15803D" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <p className="text-base font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {(["timeline", "payments", "documents"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{ background: tab === t ? "white" : "transparent", color: tab === t ? "#0F172A" : "#64748B", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {t === "timeline" ? "Updates" : t === "documents" ? `Docs (${documents.length})` : t}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {tab === "timeline" && (
        <div className="space-y-2">
          {timeline.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No updates yet — we'll post milestones here</p>
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
                    <p className="text-[10px] text-neutral-400 mt-1.5">{ageLabel(entry.createdAt)}</p>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-2">
          {invoices.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No invoices found</p>
            : invoices.map((inv) => {
                const isPaid = inv.invoiceStatus === "paid";
                return (
                  <div key={inv._id} className="flex items-center justify-between p-4 rounded-xl gap-3"
                    style={{ background: "white", border: `1px solid ${inv.amountDue > 0 ? "#FDE68A" : "#E8EDF3"}` }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{inv.invoiceNumber}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{inv.title} · {fmtDate(inv.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#1E3A8A" }}>{fmtCurrency(inv.totalAmount)}</p>
                      <p className="text-xs mt-0.5" style={{ color: isPaid ? "#15803D" : "#B45309" }}>
                        {isPaid ? "Paid" : `Due: ${fmtCurrency(inv.amountDue)}`}
                      </p>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* Documents */}
      {tab === "documents" && (
        <div className="space-y-2">
          {documents.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText size={28} className="text-neutral-300 mb-2" />
                <p className="text-sm text-neutral-400">No documents available yet</p>
                <p className="text-xs text-neutral-400 mt-1">Completed certificates will appear here for download</p>
              </div>
            )
            : documents.map((doc: any, i) => (
                <div key={doc._id ?? i} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "white", border: "1px solid #E8EDF3" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={14} className="text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{doc.fileName || doc.documentType}</p>
                      {doc.uploadedAt && <p className="text-xs text-neutral-400 mt-0.5">{fmtDate(doc.uploadedAt)}</p>}
                    </div>
                  </div>
                  {doc.downloadUrl && (
                    <a href={doc.downloadUrl} target="_blank" rel="noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: "#EFF6FF", color: "#1E3A8A" }}>
                      Download
                    </a>
                  )}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}
