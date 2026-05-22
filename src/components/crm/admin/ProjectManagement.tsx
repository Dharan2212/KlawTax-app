/**
 * ProjectManagement — Batch 3 (live API)
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  Calendar, User, ArrowRight, AlertTriangle, Clock,
  CheckCircle2, Loader2, Circle, Search,
  FolderOpen, RefreshCw, AlertCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { fetchProjects, type ApiProject } from "@/lib/crmApi";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Draft",           color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  onboarding:     { label: "Onboarding",      color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  active:         { label: "In Progress",     color: "#2563EB", bg: "rgba(37,99,235,0.10)"  },
  in_progress:    { label: "In Progress",     color: "#2563EB", bg: "rgba(37,99,235,0.10)"  },
  waiting_client: { label: "Waiting Client",  color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  in_review:      { label: "Under Review",    color: "#D97706", bg: "rgba(217,119,6,0.10)"  },
  completed:      { label: "Completed",       color: "#16A34A", bg: "rgba(22,163,74,0.10)"  },
  delivered:      { label: "Delivered",       color: "#15803D", bg: "rgba(22,163,74,0.12)"  },
  cancelled:      { label: "Cancelled",       color: "#DC2626", bg: "rgba(220,38,38,0.10)"  },
  archived:       { label: "Archived",        color: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

function StatusBadge({ status, isOverdue }: { status: string; isOverdue?: boolean }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626" }}>
        <AlertTriangle size={11} strokeWidth={2.5} /> Overdue
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

type FilterStatus = "all" | string;

export default function ProjectManagement() {
  const navigate = useNavigate();
  const [projects, setProjects]       = useState<ApiProject[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchProjects({ limit: 50 });
      setProjects(res.projects ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load projects.</p>
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

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.title ?? "").toLowerCase().includes(q) ||
      p.projectCode.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.projectStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount    = projects.filter((p) => ["active", "in_progress", "onboarding", "waiting_client", "in_review"].includes(p.projectStatus ?? "")).length;
  const overdueCount   = projects.filter((p) => p.isOverdue).length;
  const completedCount = projects.filter((p) => p.projectStatus === "completed").length;

  const statuses = ["all", ...Array.from(new Set(projects.map((p) => p.projectStatus ?? "").filter(Boolean)))];

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>All Projects</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {activeCount} active · {overdueCount} overdue · {completedCount} completed
          </p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
          style={{ color: "#64748B", border: "1px solid #E8EDF3" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active",    count: activeCount,    color: "#2563EB", bg: "rgba(37,99,235,0.07)"  },
          { label: "Overdue",   count: overdueCount,   color: "#DC2626", bg: "rgba(220,38,38,0.07)"  },
          { label: "Completed", count: completedCount, color: "#16A34A", bg: "rgba(22,163,74,0.07)"  },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>{count}</p>
            <p className="text-xs mt-0.5 text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1px solid #E8EDF3", color: "#1E1E1E" }}
          />
        </div>
        <select
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }}>
          {statuses.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All statuses" : STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      {/* Project list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const overdue = p.isOverdue;
            const days = p.expectedDeliveryDate ? daysUntil(p.expectedDeliveryDate) : null;
            return (
              <button key={p._id} onClick={() => navigate(`/crm/admin/projects/${p._id}`)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{ background: "white", border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}`, boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-neutral-900 truncate"
                        style={{ fontFamily: "'Sora', sans-serif" }}>
                        {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                      </p>
                      {p.isStalled && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#FEF3C7", color: "#92400E" }}>Stalled</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">{p.projectCode}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <StatusBadge status={p.projectStatus ?? ""} isOverdue={overdue} />
                    {days !== null && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ background: overdue ? "rgba(220,38,38,0.08)" : days <= 7 ? "rgba(217,119,6,0.08)" : "rgba(100,116,139,0.08)", color: overdue ? "#DC2626" : days <= 7 ? "#B45309" : "#64748B" }}>
                        <Calendar size={10} />
                        {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                      </span>
                    )}
                    <ArrowRight size={14} className="text-neutral-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
