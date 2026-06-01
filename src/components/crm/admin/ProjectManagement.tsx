/**
 * ProjectManagement — Batch 3 (smart table)
 * Full search + filter + sort + pagination + quick filter pills
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";
import {
  Calendar, ArrowRight, AlertTriangle, Loader2,
  FolderOpen, RefreshCw, AlertCircle, Filter,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchProjects, exportProjects, type ApiProject } from "@/lib/crmApi";
import { CRMFilterBar, PaginationBar, SortSelector, type PillFilter } from "@/components/crm/shared/CRMFilterBar";
import { ExportButton } from "@/components/crm/shared/ExportButton";

// ── Helpers ────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:              { label: "Draft",           color: "#64748B", bg: "rgba(100,116,139,0.10)" },
  onboarding:         { label: "Onboarding",      color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  active:             { label: "In Progress",     color: "#2563EB", bg: "rgba(37,99,235,0.10)"  },
  in_progress:        { label: "In Progress",     color: "#2563EB", bg: "rgba(37,99,235,0.10)"  },
  waiting_client:     { label: "Waiting Client",  color: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
  in_review:          { label: "Under Review",    color: "#D97706", bg: "rgba(217,119,6,0.10)"  },
  revisions_requested:{ label: "Revisions",       color: "#EA580C", bg: "rgba(234,88,12,0.10)"  },
  completed:          { label: "Completed",       color: "#16A34A", bg: "rgba(22,163,74,0.10)"  },
  delivered:          { label: "Delivered",       color: "#15803D", bg: "rgba(22,163,74,0.12)"  },
  cancelled:          { label: "Cancelled",       color: "#DC2626", bg: "rgba(220,38,38,0.10)"  },
  archived:           { label: "Archived",        color: "#64748B", bg: "rgba(100,116,139,0.10)" },
};

const ACTIVE_STATUSES = ["active", "in_progress", "onboarding", "waiting_client", "in_review", "revisions_requested"];

const SORT_OPTIONS = [
  { value: "createdAt",             label: "Date Created"    },
  { value: "updatedAt",             label: "Last Updated"    },
  { value: "expectedDeliveryDate",  label: "Delivery Date"   },
  { value: "lastActivityAt",        label: "Last Activity"   },
  { value: "projectPriority",       label: "Priority"        },
  { value: "projectCode",           label: "Project Code"    },
];

const PAGE_SIZE = 20;

// ── Badges ─────────────────────────────────────────────────────

function StatusBadge({ status, isOverdue }: { status: string; isOverdue?: boolean }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626" }}>
        <AlertTriangle size={9} strokeWidth={3} /> Overdue
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Quick pill definitions ──────────────────────────────────────

type QuickPill = "all" | "active" | "overdue" | "stalled" | "completed" | "waiting_client";

const QUICK_PILLS: PillFilter[] = [
  { key: "all",            label: "All",             bg: "#1E3A8A", color: "white" },
  { key: "active",         label: "Active",          bg: "#2563EB", color: "white" },
  { key: "overdue",        label: "Overdue",         bg: "#DC2626", color: "white" },
  { key: "stalled",        label: "Stalled",         bg: "#B45309", color: "white" },
  { key: "waiting_client", label: "Waiting Client",  bg: "#7C3AED", color: "white" },
  { key: "completed",      label: "Completed",       bg: "#16A34A", color: "white" },
];

// ── Main component ─────────────────────────────────────────────

export default function ProjectManagement() {
  const navigate = useNavigate();

  const [projects, setProjects]   = useState<ApiProject[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const [search, setSearch]       = useState("");
  const [quickPill, setQuickPill] = useState<QuickPill>("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy]       = useState("createdAt");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const buildQuery = useCallback(() => {
    const q: Parameters<typeof fetchProjects>[0] = {
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      sortBy: sortBy as string,
      sortOrder: sortDir,
    };
    if (quickPill === "overdue")        { q.isOverdue = "true"; }
    else if (quickPill === "stalled")   { q.isStalled = "true"; }
    else if (quickPill === "active")    { q.status = "in_progress"; }
    else if (quickPill === "waiting_client") { q.status = "waiting_client"; }
    else if (quickPill === "completed") { q.status = "completed"; }
    else if (statusFilter)              { q.status = statusFilter; }
    return q;
  }, [page, debouncedSearch, sortBy, sortDir, quickPill, statusFilter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchProjects(buildQuery());
      setProjects(res.projects ?? []);
      setTotal(res.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePillChange = (key: string) => {
    setQuickPill(key as QuickPill);
    setStatusFilter("");
    setPage(1);
  };

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const pages = Math.ceil(total / PAGE_SIZE);
  const activeCount   = total; // shown from server
  const overdueCount  = projects.filter((p) => p.isOverdue).length;
  const stalledCount  = projects.filter((p) => p.isStalled).length;

  // Pill counts (client-side from current page for quick visual)
  const pillsWithCounts: PillFilter[] = QUICK_PILLS.map((p) => ({ ...p }));

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

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
            All Projects
          </h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {total} total · {overdueCount} overdue · {stalledCount} stalled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            label="Export"
            onExport={() => exportProjects({ search, status: statusFilter })}
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

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total",     count: total,        color: "#1E3A8A", bg: "#EFF6FF" },
          { label: "Overdue",   count: overdueCount,  color: "#DC2626", bg: "#FEF2F2" },
          { label: "Stalled",   count: stalledCount,  color: "#B45309", bg: "#FEF3C7" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{ background: "white", border: "1px solid #E2E8F0" }}>
            <p className="text-2xl font-bold" style={{ fontFamily: "'JetBrains Mono', monospace", color }}>{count}</p>
            <p className="text-xs mt-0.5 text-neutral-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <CRMFilterBar
        search={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search by project name, code…"
        pills={pillsWithCounts}
        activePill={quickPill}
        onPillChange={handlePillChange}
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

      {/* Extended filters (collapsible) */}
      {showFilters && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setQuickPill("all"); setPage(1); }}
                className="rounded-lg px-2.5 py-2 text-xs outline-none"
                style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155", minWidth: "140px" }}
              >
                <option value="">All statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => { setStatusFilter(""); setQuickPill("all"); setSearch(""); setPage(1); }}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Project list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No projects found</p>
          <button onClick={() => { setSearch(""); setQuickPill("all"); setStatusFilter(""); setPage(1); }}
            className="mt-3 text-xs text-blue-600 hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map((p) => {
            const overdue = p.isOverdue;
            const days    = p.expectedDeliveryDate ? daysUntil(p.expectedDeliveryDate) : null;
            return (
              <button key={p._id}
                onClick={() => navigate(`/crm/admin/projects/${p._id}`)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{
                  background: "white",
                  border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}`,
                  boxShadow: "0 1px 4px rgba(15,27,76,0.04)",
                }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-neutral-900 truncate"
                        style={{ fontFamily: "'Sora', sans-serif" }}>
                        {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                      </p>
                      {p.isStalled && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: "#FEF3C7", color: "#92400E" }}>STALLED</span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">{p.projectCode}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <StatusBadge status={p.projectStatus ?? ""} isOverdue={overdue} />
                    {days !== null && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: overdue ? "rgba(220,38,38,0.08)" : days <= 3 ? "rgba(217,119,6,0.10)" : days <= 7 ? "rgba(217,119,6,0.06)" : "rgba(100,116,139,0.08)",
                          color: overdue ? "#DC2626" : days <= 3 ? "#B45309" : days <= 7 ? "#D97706" : "#64748B",
                        }}>
                        <Calendar size={9} />
                        {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                      </span>
                    )}
                    <ArrowRight size={14} className="text-neutral-300" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <PaginationBar
          page={page}
          pages={pages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={(p) => setPage(p)}
          loading={loading}
        />
      )}
    </motion.div>
  );
}
