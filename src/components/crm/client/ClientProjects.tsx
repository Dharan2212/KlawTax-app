/**
 * ClientProjects — Batch 3 (live API)
 */

import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchClientProjects, type ApiProject } from "@/lib/crmApi";
import { Loader2, AlertCircle, RefreshCw, FolderKanban, ChevronRight } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
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

export default function ClientProjects() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchClientProjects();
      setProjects(data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>My Services</h1>
          <p className="text-neutral-500 text-sm mt-0.5">{projects.length} service{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
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
            const sc = STATUS_CFG[p.projectStatus ?? ""] ?? STATUS_CFG.active;
            return (
              <button key={p._id} onClick={() => navigate("/crm/client/project")}
                className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{ background: "white", border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-neutral-400">{p.projectCode}</p>
                      {p.startedAt && <p className="text-xs text-neutral-400">· Started {fmtDate(p.startedAt)}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
