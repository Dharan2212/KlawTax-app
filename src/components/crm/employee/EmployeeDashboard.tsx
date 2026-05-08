import { useCRMStore } from "@/store/useCRMStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderKanban, ListTodo, AlertCircle, CheckCircle2,
  Clock, CalendarDays, ArrowRight, TrendingUp, Circle,
  CircleDot, Zap,
} from "lucide-react";

// ─── Helpers ───────────────────────────────────────────────────
const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
};
const isOverdue = (d: string, s: string) => s !== "completed" && new Date(d) < new Date();

// ─── Status config ────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending: { label: "Not Started",  bg: "#F1F5F9", color: "#64748B", dot: "#94A3B8" },
  active: { label: "In Progress",  bg: "#EFF6FF", color: "#1E3A8A", dot: "#3B82F6" },
  review:      { label: "In Review",    bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  "waiting-client": { label: "Waiting — Client", bg: "#F5F3FF", color: "#6D28D9", dot: "#8B5CF6" },
  rejected:    { label: "Rejected",    bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  completed:   { label: "Completed",    bg: "#DCFCE7", color: "#15803D", dot: "#22C55E" },
};

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  high:   { label: "High",   bg: "#FEE2E2", color: "#B91C1C" },
  medium: { label: "Medium", bg: "#FEF3C7", color: "#92400E" },
  low:    { label: "Low",    bg: "#F0FDF4", color: "#15803D" },
};

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-start justify-between gap-4"
      style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}
    >
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          {label}
        </p>
        <p className="text-3xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: accent + "18" }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: "#F1F5F9" }}
      >
        <span className="text-neutral-400">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-neutral-700 mb-1">{title}</p>
      <p className="text-xs text-neutral-400">{sub}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const users        = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser  = users.find((u) => u.id === currentUserId);
  const projects     = useCRMStore((s) => s.projects);
  const tasks        = useCRMStore((s) => s.tasks);
  const clients      = useCRMStore((s) => s.clients);

  if (!currentUser || currentUser.role !== "employee") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">No employee session. Switch to Employee role.</p>
      </div>
    );
  }

  const myProjects     = projects.filter((p) => p.assignedTo === currentUser.id);
  const myTasks        = tasks.filter((t) => t.assignedTo === currentUser.id);
  const pendingTasks   = myTasks.filter((t) => t.status !== "done");
  const doneTasks      = myTasks.filter((t) => t.status === "done");
  const activeTasks    = myTasks.filter((t) => t.status === "active");
  const overduePrj     = myProjects.filter((p) => isOverdue(p.deadline, p.status));
  const urgentProjects = myProjects
    .filter((p) => p.status !== "completed" && daysUntil(p.deadline) <= 7)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ── Welcome ─────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} style={{ color: "#F59E0B" }} />
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Your Workspace
          </span>
        </div>
        <h1
          className="text-2xl font-bold text-neutral-900"
          style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}
        >
          Welcome back, {currentUser.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {pendingTasks.length > 0
            ? `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? "s" : ""} across ${myProjects.filter((p) => p.status !== "completed").length} active project${myProjects.filter((p) => p.status !== "completed").length !== 1 ? "s" : ""}.`
            : "All tasks complete — great work!"}
        </p>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FolderKanban size={20} />}
          label="Projects"
          value={myProjects.length}
          sub={`${myProjects.filter((p) => p.status === "completed").length} completed`}
          accent="#1E3A8A"
        />
        <StatCard
          icon={<ListTodo size={20} />}
          label="Pending Tasks"
          value={pendingTasks.length}
          sub={`${activeTasks.length} in progress`}
          accent="#7C3AED"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Done"
          value={doneTasks.length}
          sub="tasks completed"
          accent="#15803D"
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Overdue"
          value={overduePrj.length}
          sub={overduePrj.length > 0 ? "needs attention" : "all on track"}
          accent={overduePrj.length > 0 ? "#B91C1C" : "#15803D"}
        />
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── My Projects ─────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <div className="flex items-center gap-2">
              <FolderKanban size={16} style={{ color: "#1E3A8A" }} />
              <h2 className="text-sm font-bold text-neutral-900">Assigned Projects</h2>
            </div>
            <button
              onClick={() => navigate("/crm/employee/projects")}
              className="text-xs font-semibold flex items-center gap-1 transition-colors hover:text-neutral-900"
              style={{ color: "#1E3A8A" }}
            >
              View all <ArrowRight size={11} />
            </button>
          </div>

          <div className="p-4">
            {myProjects.length === 0 ? (
              <EmptyCard
                icon={<FolderKanban size={22} />}
                title="No projects assigned"
                sub="You'll see your projects here once assigned"
              />
            ) : (
              <div className="space-y-2">
                {myProjects.slice(0, 4).map((p) => {
                  const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                  const overdue = isOverdue(p.deadline, p.status);
                  const days = daysUntil(p.deadline);
                  return (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/crm/employee/project/${p.id}`)}
                      className="w-full text-left rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-px group"
                      style={{
                        background: overdue ? "#FFF5F5" : "#F8FAFC",
                        border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-neutral-900 truncate leading-snug">
                          {p.title}
                        </p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-neutral-400 truncate">{getClientName(p.clientId)}</p>
                        <span
                          className="text-[10px] font-medium flex-shrink-0"
                          style={{ color: overdue ? "#B91C1C" : days <= 3 ? "#92400E" : "#64748B" }}
                        >
                          {overdue
                            ? `${Math.abs(days)}d overdue`
                            : days === 0
                            ? "Due today"
                            : `${days}d left`}
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EDF3" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.progress}%`,
                            background: overdue
                              ? "linear-gradient(90deg, #EF4444, #DC2626)"
                              : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Active Tasks ─────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <div className="flex items-center gap-2">
              <ListTodo size={16} style={{ color: "#7C3AED" }} />
              <h2 className="text-sm font-bold text-neutral-900">Active Tasks</h2>
              {activeTasks.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "#EDE9FE", color: "#7C3AED" }}
                >
                  {activeTasks.length}
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {myTasks.length === 0 ? (
              <EmptyCard
                icon={<ListTodo size={22} />}
                title="No tasks yet"
                sub="Your assigned tasks will appear here"
              />
            ) : (
              <div className="space-y-2">
                {myTasks
                  .filter((t) => t.status !== "done")
                  .slice(0, 5)
                  .map((task) => {
                    const projTitle = projects.find((p) => p.id === task.projectId)?.title;
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 rounded-xl p-3.5"
                        style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {task.status === "active" ? (
                            <CircleDot size={16} style={{ color: "#3B82F6" }} />
                          ) : (
                            <Circle size={16} style={{ color: "#CBD5E1" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 leading-snug truncate">
                            {task.title}
                          </p>
                          {projTitle && (
                            <p className="text-xs text-neutral-400 mt-0.5 truncate">{projTitle}</p>
                          )}
                        </div>
                        <PriorityBadge priority={task.priority} />
                      </div>
                    );
                  })}
                {doneTasks.length > 0 && (
                  <p className="text-center text-xs text-neutral-400 pt-1">
                    + {doneTasks.length} completed
                  </p>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Urgent Deadlines ─────────────────────────────── */}
        {urgentProjects.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #FDE68A", boxShadow: "0 1px 4px rgba(217,119,6,0.10)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid #FEF3C7", background: "#FFFBEB" }}
            >
              <Clock size={16} style={{ color: "#B45309" }} />
              <h2 className="text-sm font-bold" style={{ color: "#92400E" }}>
                Deadlines This Week
              </h2>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "#FDE68A", color: "#92400E" }}
              >
                {urgentProjects.length}
              </span>
            </div>
            <div className="p-4 grid sm:grid-cols-2 gap-2">
              {urgentProjects.map((p) => {
                const days = daysUntil(p.deadline);
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                return (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/crm/employee/project/${p.id}`)}
                    className="text-left rounded-xl p-3.5 transition-all hover:-translate-y-px"
                    style={{
                      background: isOverdue(p.deadline, p.status) ? "#FFF5F5" : "#FFFBEB",
                      border: `1px solid ${isOverdue(p.deadline, p.status) ? "#FED7D7" : "#FDE68A"}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{p.title}</p>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-neutral-400">{getClientName(p.clientId)}</p>
                      <span
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: days < 0 ? "#DC2626" : days === 0 ? "#B91C1C" : "#B45309" }}
                      >
                        <CalendarDays size={11} />
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today!" : `${days}d left`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Progress Overview ────────────────────────────── */}
        {myProjects.length > 0 && (
          <motion.div
            variants={itemVariants}
            className={`bg-white rounded-2xl overflow-hidden ${urgentProjects.length > 0 ? "" : "lg:col-span-2"}`}
            style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}
          >
            <div
              className="flex items-center gap-2 px-5 py-4"
              style={{ borderBottom: "1px solid #F1F5F9" }}
            >
              <TrendingUp size={16} style={{ color: "#15803D" }} />
              <h2 className="text-sm font-bold text-neutral-900">Progress Overview</h2>
            </div>
            <div className="p-4 space-y-3">
              {myProjects.map((p) => {
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                const overdue = isOverdue(p.deadline, p.status);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <p className="text-xs font-semibold text-neutral-700 truncate">{p.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{ fontFamily: "'JetBrains Mono', monospace", color: overdue ? "#B91C1C" : "#1E3A8A" }}
                        >
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.progress}%`,
                          background: overdue
                            ? "linear-gradient(90deg, #EF4444, #DC2626)"
                            : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
