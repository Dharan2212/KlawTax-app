/**
 * ProjectWorkspace — Batch 3 (live API, employee-scoped)
 */
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchProjectSummary, fetchProjectTimeline, fetchTasks,
  updateProjectStatus, submitProjectForReview, addTimelineEntry,
  updateTask, completeTask,
  type ApiProject, type ApiTask, type ApiTimelineEntry,
} from "@/lib/crmApi";
import {
  ArrowLeft, Loader2, AlertCircle, RefreshCw, Calendar,
  CheckCircle2, Clock, FileText, Activity, ListTodo,
  Send, Plus, ChevronRight,
} from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function ageLabel(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: "Draft",           bg: "rgba(100,116,139,0.10)", color: "#64748B" },
  onboarding:     { label: "Onboarding",      bg: "rgba(124,58,237,0.10)", color: "#6D28D9" },
  active:         { label: "In Progress",     bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  in_progress:    { label: "In Progress",     bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  waiting_client: { label: "Waiting Client",  bg: "rgba(217,119,6,0.10)",  color: "#B45309" },
  in_review:      { label: "Under Review",    bg: "rgba(20,184,166,0.10)", color: "#0F766E" },
  completed:      { label: "Completed",       bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
  cancelled:      { label: "Cancelled",       bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
};

const TASK_STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  todo:        { label: "To Do",       bg: "#F1F5F9",            color: "#64748B" },
  in_progress: { label: "In Progress", bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  blocked:     { label: "Blocked",     bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  done:        { label: "Done",        bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
};

// Valid employee-level status transitions
const EMPLOYEE_TRANSITIONS: Record<string, string[]> = {
  active:         ["in_progress", "waiting_client"],
  in_progress:    ["waiting_client", "in_review"],
  onboarding:     ["active"],
  waiting_client: ["in_progress"],
};

type Tab = "tasks" | "timeline" | "update";

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]   = useState<ApiProject | null>(null);
  const [tasks, setTasks]       = useState<ApiTask[]>([]);
  const [timeline, setTimeline] = useState<ApiTimelineEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [tab, setTab]           = useState<Tab>("tasks");

  // Update form
  const [updateTitle, setUpdateTitle]     = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateVisible, setUpdateVisible] = useState(false);
  const [posting, setPosting]             = useState(false);

  // Status
  const [statusChanging, setStatusChanging] = useState(false);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(false);
    try {
      const [proj, tl, taskData] = await Promise.all([
        fetchProjectSummary(projectId),
        fetchProjectTimeline(projectId),
        fetchTasks(projectId),
      ]);
      setProject(proj);
      setTimeline(tl ?? []);
      setTasks(taskData ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleStatusChange(status: string) {
    if (!project) return;
    setStatusChanging(true);
    try {
      await updateProjectStatus(project._id, status);
      await loadData();
    } catch { /* silent */ }
    setStatusChanging(false);
  }

  async function handleSubmitReview() {
    if (!project) return;
    setStatusChanging(true);
    try {
      await submitProjectForReview(project._id);
      await loadData();
    } catch { /* silent */ }
    setStatusChanging(false);
  }

  async function handleTaskToggle(task: ApiTask) {
    try {
      if (task.taskStatus === "done") {
        await updateTask(task._id, { taskStatus: "todo" });
      } else {
        await completeTask(task._id);
      }
      await loadData();
    } catch { /* silent */ }
  }

  async function handlePostUpdate() {
    if (!project || !updateTitle.trim()) return;
    setPosting(true);
    try {
      await addTimelineEntry(project._id, {
        title: updateTitle.trim(),
        content: updateContent.trim(),
        isClientVisible: updateVisible,
      });
      setUpdateTitle(""); setUpdateContent(""); setUpdateVisible(false);
      setTab("timeline");
      await loadData();
    } catch { /* silent */ }
    setPosting(false);
  }

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin text-blue-600" /></div>;
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <button onClick={() => navigate("/crm/employee/projects")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: "#1E3A8A", color: "white" }}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );
  }

  const sc            = STATUS_CFG[project.projectStatus ?? ""] ?? STATUS_CFG.active;
  const nextStatuses  = EMPLOYEE_TRANSITIONS[project.projectStatus ?? ""] ?? [];
  const pendingTasks  = tasks.filter((t) => t.taskStatus !== "done");
  const doneTasks     = tasks.filter((t) => t.taskStatus === "done");
  const canSubmit     = project.projectStatus === "in_progress" || project.projectStatus === "active";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/crm/employee/projects")}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100">
            <ArrowLeft size={16} className="text-neutral-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                {project.title || project.primaryServiceSlug?.replace(/-/g, " ") || project.projectCode}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={sc}>{sc.label}</span>
              {project.isOverdue && <span className="text-xs text-red-600 font-semibold">Overdue</span>}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{project.projectCode}</p>
          </div>
        </div>
        <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100">
          <RefreshCw size={13} className="text-neutral-400" />
        </button>
      </div>

      {/* Deadline */}
      {project.expectedDeliveryDate && (
        <div className="flex items-center gap-2 text-xs" style={{ color: project.isOverdue ? "#DC2626" : "#64748B" }}>
          <Calendar size={12} />
          <span>Deadline: {fmtDate(project.expectedDeliveryDate)}</span>
        </div>
      )}

      {/* Status actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {nextStatuses.map((s) => {
          const ns = STATUS_CFG[s] ?? STATUS_CFG.active;
          return (
            <button key={s} onClick={() => handleStatusChange(s)} disabled={statusChanging}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: ns.bg, color: ns.color }}>
              {statusChanging ? <Loader2 size={11} className="animate-spin inline mr-1" /> : null}
              → {ns.label}
            </button>
          );
        })}
        {canSubmit && (
          <button onClick={handleSubmitReview} disabled={statusChanging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "#15803D", color: "white" }}>
            {statusChanging ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            Submit for Review
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
        {(["tasks", "timeline", "update"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize"
            style={{ background: tab === t ? "white" : "transparent", color: tab === t ? "#0F172A" : "#64748B", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {t === "tasks" ? `Tasks (${pendingTasks.length})` : t === "update" ? "Post Update" : "Timeline"}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {tab === "tasks" && (
        <div className="space-y-2">
          {tasks.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No tasks for this project</p>
            : (
              <>
                {pendingTasks.map((task) => {
                  const tsc = TASK_STATUS_CFG[task.taskStatus ?? "todo"] ?? TASK_STATUS_CFG.todo;
                  return (
                    <div key={task._id} className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ background: "white", border: "1px solid #E8EDF3" }}>
                      <button onClick={() => handleTaskToggle(task)}
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                        style={{ border: `2px solid ${task.taskStatus === "done" ? "#15803D" : "#CBD5E1"}`, background: task.taskStatus === "done" ? "#15803D" : "transparent" }}>
                        {task.taskStatus === "done" && <CheckCircle2 size={10} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
                        {task.description && <p className="text-xs text-neutral-400 mt-0.5">{task.description}</p>}
                        {task.dueDate && (
                          <p className="text-[10px] mt-1" style={{ color: "#94A3B8" }}>
                            Due {fmtDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: tsc.bg, color: tsc.color }}>
                        {tsc.label}
                      </span>
                    </div>
                  );
                })}
                {doneTasks.length > 0 && (
                  <p className="text-center text-xs text-neutral-400">{doneTasks.length} completed task{doneTasks.length !== 1 ? "s" : ""}</p>
                )}
              </>
            )
          }
        </div>
      )}

      {/* Timeline */}
      {tab === "timeline" && (
        <div className="space-y-2">
          {timeline.length === 0
            ? <p className="text-center text-neutral-400 text-sm py-8">No timeline entries</p>
            : timeline.map((entry) => (
                <div key={entry._id} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: "white", border: "1px solid #E8EDF3" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#EFF6FF" }}>
                    <Activity size={12} style={{ color: "#1E3A8A" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900">{entry.title}</p>
                    {entry.content && <p className="text-xs text-neutral-500 mt-1">{entry.content}</p>}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-neutral-400">{ageLabel(entry.createdAt)}</span>
                      {entry.isClientVisible && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#15803D" }}>Client visible</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {/* Post update */}
      {tab === "update" && (
        <div className="rounded-2xl p-5 space-y-3" style={{ background: "white", border: "1px solid #E8EDF3" }}>
          <h2 className="text-sm font-bold text-neutral-900">Post a Project Update</h2>
          <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)}
            placeholder="Update title"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }} />
          <textarea value={updateContent} onChange={(e) => setUpdateContent(e.target.value)}
            placeholder="Details (optional)…" rows={3}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF3", color: "#334155" }} />
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input type="checkbox" checked={updateVisible} onChange={(e) => setUpdateVisible(e.target.checked)}
              className="rounded" />
            Show to client
          </label>
          <button onClick={handlePostUpdate} disabled={!updateTitle.trim() || posting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: "#1E3A8A", color: "white" }}>
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post Update
          </button>
        </div>
      )}
    </div>
  );
}
