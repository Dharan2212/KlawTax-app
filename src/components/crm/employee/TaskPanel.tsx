/**
 * TaskPanel — Batch 3 (live API, employee-scoped)
 * Standalone task panel — used inside ProjectWorkspace.
 * No dependency on useCRMStore operational data.
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchTasks, completeTask, updateTask, type ApiTask } from "@/lib/crmApi";
import { Loader2, CheckCircle2, Circle, AlertCircle, RefreshCw, CircleDot } from "lucide-react";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  todo:        { label: "To Do",       bg: "#F1F5F9",            color: "#64748B" },
  in_progress: { label: "In Progress", bg: "rgba(37,99,235,0.10)",  color: "#1E3A8A" },
  blocked:     { label: "Blocked",     bg: "rgba(220,38,38,0.10)",  color: "#DC2626" },
  done:        { label: "Done",        bg: "rgba(22,163,74,0.10)",  color: "#15803D" },
};

const PRIORITY_CFG: Record<string, { color: string }> = {
  high:   { color: "#DC2626" },
  medium: { color: "#B45309" },
  low:    { color: "#64748B" },
};

interface Props {
  projectId?: string; // if undefined, loads all tasks for the employee
}

export default function TaskPanel({ projectId }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks]     = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchTasks(projectId);
      setTasks(data ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleToggle(task: ApiTask) {
    setToggling(task._id);
    try {
      if (task.taskStatus === "done") {
        await updateTask(task._id, { taskStatus: "todo" });
      } else {
        await completeTask(task._id);
      }
      await loadData();
    } catch { /* silent */ }
    setToggling(null);
  }

  if (!user) return null;
  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 size={20} className="animate-spin text-blue-600" /></div>;
  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-10">
        <AlertCircle size={20} className="text-red-400" />
        <button onClick={loadData} className="text-xs font-semibold text-blue-700">Retry</button>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.taskStatus !== "done");
  const done    = tasks.filter((t) => t.taskStatus === "done");

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle2 size={24} className="text-neutral-300 mb-2" />
        <p className="text-sm text-neutral-400">No tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pending.map((task) => {
        const tsc = STATUS_CFG[task.taskStatus ?? "todo"] ?? STATUS_CFG.todo;
        const pc  = PRIORITY_CFG[task.priority ?? "low"] ?? PRIORITY_CFG.low;
        const isToggling = toggling === task._id;
        return (
          <div key={task._id} className="flex items-start gap-3 p-3 rounded-xl"
            style={{ background: "white", border: "1px solid #E8EDF3" }}>
            <button
              onClick={() => handleToggle(task)}
              disabled={isToggling}
              className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors disabled:opacity-60"
              style={{ border: `2px solid ${tsc.color}`, background: "transparent" }}>
              {isToggling
                ? <Loader2 size={10} className="animate-spin" style={{ color: tsc.color }} />
                : <CircleDot size={10} style={{ color: tsc.color }} />
              }
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{task.title}</p>
              {task.description && <p className="text-xs text-neutral-400 mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-2 mt-1">
                {task.dueDate && <span className="text-[10px] text-neutral-400">Due {fmtDate(task.dueDate)}</span>}
                <span className="text-[10px] font-bold" style={{ color: pc.color }}>{task.priority}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: tsc.bg, color: tsc.color }}>
              {tsc.label}
            </span>
          </div>
        );
      })}
      {done.length > 0 && (
        <div className="pt-2">
          <p className="text-[10px] text-neutral-400 uppercase tracking-wide mb-2 font-semibold">
            Completed ({done.length})
          </p>
          {done.map((task) => (
            <div key={task._id} className="flex items-center gap-3 p-2.5 rounded-xl opacity-60"
              style={{ background: "#F8FAFC" }}>
              <CheckCircle2 size={14} style={{ color: "#15803D", flexShrink: 0 }} />
              <p className="text-xs text-neutral-500 line-through truncate">{task.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
