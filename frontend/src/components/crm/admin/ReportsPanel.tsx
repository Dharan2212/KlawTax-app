/**
 * ReportsPanel — Batch 5.3 type fix
 *
 * Uses AdminDashboardResponse (Batch 5.1 shape):
 *   dash.workload.totalActiveProjects
 *   dash.overdueProjects.total
 *   dash.pendingApprovals.total
 *   dash.leads.todayNew
 *   dash.revenue.monthCollected
 *   dash.revenue.periodCollected   (used for "last period" proxy)
 *   dash.revenue.totalCollected
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import { AlertCircle, Loader2, RefreshCw, Download, BarChart2 } from "lucide-react";
import {
  fetchAdminDashboard, fetchProjects, fetchInvoices,
  requestExport, exportDashboardReport,
  type AdminDashboard, type ApiProject, type ApiInvoice,
} from "@/lib/crmApi";
import { ExportButton } from "@/components/crm/shared/ExportButton";

function fmtCurrency(n: number) { return `₹${n.toLocaleString("en-IN")}`; }

export default function ReportsPanel() {
  const [dash, setDash]         = useState<AdminDashboard | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [d, p, i] = await Promise.all([
        fetchAdminDashboard(),
        fetchProjects({ limit: 100 }),
        fetchInvoices(),
      ]);
      setDash(d);
      setProjects(p.projects ?? []);
      setInvoices(i.invoices ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleExport() {
    setExporting(true);
    try {
      await requestExport({ exportType: "admin_report" });
      setExportDone(true);
      setTimeout(() => setExportDone(false), 3000);
    } catch { /* silent */ }
    setExporting(false);
  }

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
        <p className="text-neutral-500 text-sm">Failed to load report data.</p>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Derived values from AdminDashboardResponse (Batch 5.1 shape) ───────────

  // Workload
  const activeProjectCount  = dash?.workload?.totalActiveProjects  ?? projects.filter(
    (p) => !["completed","cancelled","archived"].includes(p.projectStatus ?? "")
  ).length;

  // Overdue
  const overdueProjectCount = dash?.overdueProjects?.total ?? projects.filter((p) => p.isOverdue).length;

  // Pending approvals
  const pendingApprovalsCount = dash?.pendingApprovals?.total ?? 0;

  // Leads
  const newLeadsToday = dash?.leads?.todayNew ?? 0;

  // Revenue — from AdminRevenueSummary
  const revenueThisMonth  = dash?.revenue?.monthCollected  ?? 0;
  const revenuePeriod     = dash?.revenue?.periodCollected ?? 0;
  const revenueTotalCollected = dash?.revenue?.totalCollected ?? 0;

  // Invoice totals from ApiInvoice[] list (raw totals always available)
  const totalBilled = invoices.reduce((s: number, inv: ApiInvoice) => s + (inv.totalAmount ?? 0), 0);
  const totalPaid   = invoices.reduce((s: number, inv: ApiInvoice) => s + (inv.amountPaid  ?? 0), 0);
  const collectionPct = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  // Status breakdown from project list
  const statusGroups = Array.from(
    projects.reduce((acc, p) => {
      const s = p.projectStatus ?? "unknown";
      acc.set(s, (acc.get(s) ?? 0) + 1);
      return acc;
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1]);

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            Reports & Analytics
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">Live data from backend</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100"
            style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <ExportButton label="Excel Report" onExport={exportDashboardReport} />
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-60"
            style={{ background: exportDone ? "#15803D" : "#1E3A8A", color: "white" }}>
            {exporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {exportDone ? "Queued!" : "Export Report"}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Projects",   value: activeProjectCount,   color: "#1E3A8A", bg: "#EFF6FF" },
          { label: "Overdue Projects",  value: overdueProjectCount,  color: "#DC2626", bg: "#FEF2F2" },
          { label: "Pending Approvals", value: pendingApprovalsCount, color: "#B45309", bg: "#FEF3C7" },
          { label: "New Leads Today",   value: newLeadsToday,        color: "#6D28D9", bg: "#F5F3FF" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl p-5 text-center"
            style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <p className="text-3xl font-bold mb-1"
              style={{ fontFamily: "'Sora', sans-serif", color: m.color }}>
              {m.value}
            </p>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue overview */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} style={{ color: "#1E3A8A" }} />
          <h2 className="text-sm font-bold text-neutral-900">Revenue Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: "This Month",     value: fmtCurrency(revenueThisMonth),      color: "#1E3A8A" },
            { label: "Period",         value: fmtCurrency(revenuePeriod),         color: "#6D28D9" },
            { label: "Total Billed",   value: fmtCurrency(totalBilled),           color: "#B45309" },
            { label: "Collected",      value: fmtCurrency(revenueTotalCollected || totalPaid), color: "#15803D" },
          ].map((r) => (
            <div key={r.label} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-1">{r.label}</p>
              <p className="text-base font-bold"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: r.color }}>
                {r.value}
              </p>
            </div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-500">Collection rate</span>
            <span className="text-xs font-bold"
              style={{ color: collectionPct >= 70 ? "#15803D" : "#B45309" }}>
              {collectionPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div className="h-full rounded-full"
              style={{ width: `${collectionPct}%`, background: "linear-gradient(90deg, #1E3A8A, #22C55E)" }} />
          </div>
        </div>
      </div>

      {/* Project status breakdown */}
      <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3" }}>
        <h2 className="text-sm font-bold text-neutral-900 mb-4">Project Status Breakdown</h2>
        {statusGroups.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-4">No project data available</p>
        ) : (
          <div className="space-y-3">
            {statusGroups.map(([status, count]) => {
              const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold capitalize text-neutral-700">
                      {status.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-neutral-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: "#1E3A8A" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lead funnel from AdminLeadMetricsSummary */}
      {dash?.leads && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3" }}>
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Lead Funnel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Total",     value: dash.leads.total },
              { label: "Active",    value: dash.leads.active },
              { label: "This Month",value: dash.leads.monthNew },
              { label: "Converted",value: dash.leads.byStatus?.converted ?? 0 },
              { label: "Conversion", value: `${Math.round(dash.leads.conversionRate ?? 0)}%` },
            ].map((l) => (
              <div key={l.label} className="rounded-xl p-3 text-center" style={{ background: "#F8FAFC" }}>
                <p className="text-xl font-bold text-neutral-900">{l.value}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 uppercase tracking-wide">{l.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workload summary from AdminWorkloadSummary */}
      {dash?.workload && (
        <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E8EDF3" }}>
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Team Workload</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Active Projects",    value: dash.workload.totalActiveProjects },
              { label: "Unassigned",         value: dash.workload.totalUnassignedProjects },
              { label: "In Review",          value: dash.workload.inReviewProjects },
              { label: "Waiting Client",     value: dash.workload.waitingClientProjects },
              { label: "Blocked Tasks",      value: dash.workload.totalBlockedTasks },
              { label: "Overdue Tasks",      value: dash.workload.totalOverdueTasks },
            ].map((w) => (
              <div key={w.label} className="rounded-xl p-3" style={{ background: "#F8FAFC" }}>
                <p className="text-lg font-bold text-neutral-900">{w.value}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wide">{w.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
