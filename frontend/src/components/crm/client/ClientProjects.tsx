/**
 * ClientProjects — Batch 5.3 (correct backend types)
 * Uses ClientProjectListResponse from backend.
 */

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchClientProjects,
  type ClientProjectSummary,
} from "@/lib/crmApi";
import { Loader2, AlertCircle, RefreshCw, FolderKanban, ChevronRight, Clock } from "lucide-react";
import { fmtDate, CLIENT_PROJECT_STATUS_CFG } from "@/lib/crmUtils";

// ── Status config imported from crmUtils ──────────────────────────────────────
const STATUS_CFG = CLIENT_PROJECT_STATUS_CFG;

type Filter = "all" | "active" | "completed" | "overdue";

export default function ClientProjects() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [projects, setProjects] = useState<ClientProjectSummary[]>([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState<Filter>("all");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  // loadData is stable (empty deps). It receives the filter explicitly so
  // it never closes over the filter state value.
  const loadData = useCallback(async (f: Filter) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetchClientProjects({
        status: f !== "all" ? f : undefined,
        limit: 50,
      });
      setProjects(res.projects ?? []);
      setTotal(res.meta?.total ?? (res.projects?.length ?? 0));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []); // stable — no closure over filter state

  // Runs on mount and whenever the active filter changes.
  useEffect(() => { loadData(filter); }, [filter, loadData]);

  if (!user) return null;

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={28} className="animate-spin text-blue-600" />
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load projects.</p>
        <button onClick={() => loadData(filter)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const filters: { key: Filter; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "active",    label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "overdue",   label: "Overdue" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>My Services</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{total} service{total !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => loadData(filter)}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? "white" : "transparent",
              color: filter === f.key ? "#0F172A" : "#64748B",
              boxShadow: filter === f.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No services found</p>
          <p className="text-neutral-400 text-xs mt-1">Your registered services will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const sc = STATUS_CFG[p.projectStatus] ?? STATUS_CFG.active;
            return (
              <button key={p.projectId}
                onClick={() => navigate(`/crm/client/project`)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{ background: "white", border: `1px solid ${p.isOverdue ? "#FED7D7" : "#E8EDF3"}`, boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                    </p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-neutral-400">{p.projectCode}</p>
                      {/* Progress */}
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full" style={{ width: `${p.progressPercentage}%`, background: "#1E3A8A" }} />
                        </div>
                        <span className="text-[10px] text-neutral-400">{p.progressPercentage}%</span>
                      </div>
                      {p.expectedDeliveryDate && (
                        <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock size={9} />
                          {fmtDate(p.expectedDeliveryDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.isOverdue && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>Overdue</span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </div>
                </div>
                {p.pendingDocuments > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold"
                    style={{ color: "#B45309" }}>
                    <AlertCircle size={11} />
                    {p.pendingDocuments} document{p.pendingDocuments !== 1 ? "s" : ""} pending review
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
