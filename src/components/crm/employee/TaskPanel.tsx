import { useState } from "react";
import { useCRMStore } from "@/store/useCRMStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle, CircleDot, CheckCircle2, ListTodo,
  ChevronDown, Clock, Flag,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "todo",        label: "Pending",     bg: "#F1F5F9", color: "#64748B" },
  { value: "active", label: "In Progress", bg: "#EFF6FF", color: "#1E3A8A" },
  { value: "done",        label: "Completed",   bg: "#DCFCE7", color: "#15803D" },
] as const;

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  high:   { label: "High",   bg: "#FEE2E2", color: "#B91C1C" },
  medium: { label: "Medium", bg: "#FEF3C7", color: "#92400E" },
  low:    { label: "Low",    bg: "#F0FDF4", color: "#15803D" },
};

type TaskStatus = "todo" | "active" | "done";
type Filter = "all" | TaskStatus;

// ─── Status Selector ──────────────────────────────────────────
function StatusSelector({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (v: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((o) => o.value === value) ?? STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{ background: current.bg, color: current.color }}
      >
        {current.label}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl overflow-hidden"
            style={{ border: "1px solid #E8EDF3", boxShadow: "0 8px 24px rgba(15,27,76,0.12)", minWidth: "130px" }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value as TaskStatus); setOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors"
                style={{
                  color: opt.color,
                  background: opt.value === value ? opt.bg : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = opt.bg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = opt.value === value ? opt.bg : "transparent")}
              >
                {opt.value === "todo"        && <Circle size={12} />}
                {opt.value === "active" && <CircleDot size={12} />}
                {opt.value === "done"        && <CheckCircle2 size={12} />}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────
function TaskRow({
  task,
  onStatusChange,
}: {
  task: ReturnType<typeof useCRMStore.getState>["tasks"][0];
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const isDone = task.status === "done";
  const priCfg = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.low;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isDone ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 rounded-xl p-4"
      style={{
        background: isDone ? "#F8FAFC" : "#FFFFFF",
        border: `1px solid ${isDone ? "#E8EDF3" : task.status === "active" ? "#BFDBFE" : "#E8EDF3"}`,
        boxShadow: isDone ? "none" : "0 1px 3px rgba(15,27,76,0.05)",
      }}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {isDone ? (
          <CheckCircle2 size={18} style={{ color: "#22C55E" }} />
        ) : task.status === "active" ? (
          <CircleDot size={18} style={{ color: "#3B82F6" }} />
        ) : (
          <Circle size={18} style={{ color: "#CBD5E1" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold leading-snug"
          style={{
            color: isDone ? "#94A3B8" : "#0F172A",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: priCfg.bg, color: priCfg.color }}
          >
            <Flag size={8} />
            {priCfg.label}
          </span>
          {!isDone && task.status === "active" && (
            <span className="flex items-center gap-1 text-[10px] text-blue-600">
              <Clock size={9} />
              In progress
            </span>
          )}
        </div>
      </div>

      {/* Status selector */}
      <StatusSelector
        value={task.status}
        onChange={(v) => onStatusChange(task.id, v)}
      />
    </motion.div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────
function FilterTab({
  label, active, count, onClick,
}: {
  label: string; active: boolean; count: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
      style={{
        background: active ? "#1E3A8A" : "#F1F5F9",
        color: active ? "#FFFFFF" : "#64748B",
      }}
    >
      {label}
      <span
        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
        style={{
          background: active ? "rgba(255,255,255,0.2)" : "#E2E8F0",
          color: active ? "#FFFFFF" : "#94A3B8",
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────
interface TaskPanelProps {
  projectId: string;
}

export default function TaskPanel({ projectId }: TaskPanelProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const users         = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const tasks         = useCRMStore((s) => s.tasks);
  const updateTaskStatus = useCRMStore((s) => s.updateTaskStatus);

  if (!currentUser || currentUser.role !== "employee") return null;

  const projectTasks = tasks.filter(
    (t) => t.projectId === projectId && t.assignedTo === currentUser.id
  );

  const todoCount   = projectTasks.filter((t) => t.status === "todo").length;
  const activeCount = projectTasks.filter((t) => t.status === "active").length;
  const doneCount   = projectTasks.filter((t) => t.status === "done").length;

  const filtered =
    filter === "all"
      ? projectTasks
      : projectTasks.filter((t) => t.status === filter);

  // Sort: active → todo → done
  const sorted = [...filtered].sort((a, b) => {
    const order = { active: 0, todo: 1, done: 2 };
    return order[a.status] - order[b.status];
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={16} style={{ color: "#1E3A8A" }} />
          <h3 className="text-sm font-bold text-neutral-900">
            Tasks ({projectTasks.length})
          </h3>
        </div>
        <span className="text-xs text-neutral-400">
          {doneCount} of {projectTasks.length} completed
        </span>
      </div>

      {/* Progress bar */}
      {projectTasks.length > 0 && (
        <div className="mb-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #15803D, #22C55E)" }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((doneCount / projectTasks.length) * 100)}%` }}
              transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
            />
          </div>
          <p className="text-right text-xs text-neutral-400 mt-1">
            {Math.round((doneCount / projectTasks.length) * 100)}% complete
          </p>
        </div>
      )}

      {/* Filters */}
      {projectTasks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterTab label="All"         active={filter === "all"}         count={projectTasks.length} onClick={() => setFilter("all")} />
          <FilterTab label="In Progress" active={filter === "active"} count={activeCount}         onClick={() => setFilter("active")} />
          <FilterTab label="Pending"     active={filter === "todo"}        count={todoCount}           onClick={() => setFilter("todo")} />
          <FilterTab label="Done"        active={filter === "done"}        count={doneCount}           onClick={() => setFilter("done")} />
        </div>
      )}

      {/* Task list */}
      {projectTasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 text-center rounded-2xl"
          style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}
        >
          <ListTodo size={24} style={{ color: "#CBD5E1" }} className="mb-2" />
          <p className="text-sm font-semibold text-neutral-500">No tasks assigned</p>
          <p className="text-xs text-neutral-400 mt-0.5">Tasks for this project will appear here</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {sorted.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onStatusChange={(id, status) => updateTaskStatus(id, status)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
