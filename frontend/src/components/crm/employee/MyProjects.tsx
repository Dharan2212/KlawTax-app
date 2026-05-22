/**
 * MyProjects — Batch 3 (live API, employee-scoped)
 */
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchProjects, fetchTasks, type ApiProject, type ApiTask } from "@/lib/crmApi";
import {
  Loader2, AlertCircle, RefreshCw, FolderKanban,
  Calendar, ChevronRight, ListTodo, AlertTriangle,
} from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: "Draft",           bg: "#F1F5F9",            color: "#64748B" },
  onboarding:     { label: "Onboarding",      bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  active:         { label: "In Progress",     bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress:    { label: "In Progress",     bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_client: { label: "Waiting Client",  bg: "rgba(217,119,6,0.10)",  color: "#B45309" },
  in_review:      { label: "Under Review",    bg: "rgba(20,184,166,0.10)", color: "#0F766E" },
  completed:      { label: "Completed",       bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  cancelled:      { label: "Cancelled",       bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

export default function MyProjects() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [tasks, setTasks]       = useState<ApiTask[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [projRes, taskRes] = await Promise.all([
        fetchProjects({ limit: 50 }),
        fetchTasks(),
      ]);
      setProjects(projRes.projects ?? []);
      setTasks(taskRes ?? []);
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

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (p.title ?? "").toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || p.projectStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount   = projects.filter((p) => !["completed","cancelled","archived"].includes(p.projectStatus ?? "")).length;
  const overdueCount  = projects.filter((p) => p.isOverdue).length;

  const tasksByProject = (id: string) => tasks.filter((t) => t.projectId === id);
  const pendingTaskCount = (id: string) => tasksByProject(id).filter((t) => t.taskStatus !== "done").length;

  const statuses = Array.from(new Set(projects.map((p) => p.projectStatus ?? "").filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>My Projects</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {activeCount} active · {overdueCount > 0 ? `${overdueCount} overdue · ` : ""}{projects.length} total
          </p>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-3 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "white", border: "1px solid #E8EDF3", color: "#1E1E1E" }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ background: "white", border: "1px solid #E8EDF3", color: "#334155" }}>
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban size={32} className="text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm">No projects found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const sc       = STATUS_CFG[p.projectStatus ?? ""] ?? STATUS_CFG.active;
            const overdue  = p.isOverdue;
            const days     = p.expectedDeliveryDate ? daysUntil(p.expectedDeliveryDate) : null;
            const pending  = pendingTaskCount(p._id);
            return (
              <button key={p._id} onClick={() => navigate(`/crm/employee/project/${p._id}`)}
                className="w-full text-left rounded-2xl p-4 transition-all hover:-translate-y-px hover:shadow-md"
                style={{ background: "white", border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}`, boxShadow: "0 1px 4px rgba(15,27,76,0.05)" }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                      {p.title || p.primaryServiceSlug?.replace(/-/g, " ") || p.projectCode}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">{p.projectCode}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <ChevronRight size={14} className="text-neutral-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {days !== null && (
                    <span className="flex items-center gap-1 text-xs"
                      style={{ color: overdue ? "#DC2626" : days <= 7 ? "#B45309" : "#64748B" }}>
                      <Calendar size={10} />
                      {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#6D28D9" }}>
                      <ListTodo size={10} /> {pending} task{pending !== 1 ? "s" : ""}
                    </span>
                  )}
                  {overdue && <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle size={10} /> Overdue</span>}
                  {p.isStalled && <span className="text-xs text-amber-600">Stalled</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
