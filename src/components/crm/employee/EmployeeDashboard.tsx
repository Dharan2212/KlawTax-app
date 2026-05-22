/**
 * EmployeeDashboard — Batch 3 (live API + auth identity)
 *
 * Uses useAuth() for identity. Uses fetchEmployeeDashboard() for metrics.
 * Uses fetchProjects() for project list. No mock data imports.
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchEmployeeDashboard, fetchProjects, fetchTasks, type EmployeeDashboard as EmpDashData, type ApiProject, type ApiTask } from "@/lib/crmApi";
import { motion } from "framer-motion";
import {
  FolderKanban, ListTodo, AlertCircle, CheckCircle2,
  Clock, CalendarDays, ArrowRight, TrendingUp,
  CircleDot, Zap, Activity, MessageSquare,
  Loader2, RefreshCw,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────

const daysUntil = (d: string) => Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
const isOverdue = (d: string, s: string) => s !== "completed" && s !== "cancelled" && new Date(d) < new Date();
function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Status / Priority config ───────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  draft:          { label: "Draft",            bg: "#F1F5F9", color: "#64748B" },
  onboarding:     { label: "Onboarding",       bg: "#F5F3FF", color: "#6D28D9" },
  active:         { label: "In Progress",      bg: "#EFF6FF", color: "#1E3A8A" },
  in_progress:    { label: "In Progress",      bg: "#EFF6FF", color: "#1E3A8A" },
  waiting_client: { label: "Waiting — Client", bg: "#F5F3FF", color: "#6D28D9" },
  in_review:      { label: "In Review",        bg: "#FEF3C7", color: "#92400E" },
  completed:      { label: "Completed",        bg: "#DCFCE7", color: "#15803D" },
  cancelled:      { label: "Cancelled",        bg: "#FEF2F2", color: "#DC2626" },
};

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  high:   { label: "High",   bg: "#FEE2E2", color: "#B91C1C" },
  medium: { label: "Medium", bg: "#FEF3C7", color: "#92400E" },
  low:    { label: "Low",    bg: "#F0FDF4", color: "#15803D" },
};

const TASK_STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  todo:        { label: "To Do",       bg: "#F1F5F9", color: "#64748B" },
  in_progress: { label: "In Progress", bg: "#EFF6FF", color: "#1E3A8A" },
  blocked:     { label: "Blocked",     bg: "#FEF2F2", color: "#DC2626" },
  done:        { label: "Done",        bg: "#DCFCE7", color: "#15803D" },
};

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 flex items-start justify-between gap-4"
      style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif" }}>{value}</p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: accent + "18" }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
    </div>
  );
}

function EmptyCard({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F1F5F9" }}>
        <span className="text-neutral-400">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-neutral-700 mb-1">{title}</p>
      <p className="text-xs text-neutral-400">{sub}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [dash, setDash]         = useState<EmpDashData | null>(null);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [tasks, setTasks]       = useState<ApiTask[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [dashData, projData, taskData] = await Promise.all([
        fetchEmployeeDashboard(),
        fetchProjects({}),
        fetchTasks(),
      ]);
      setDash(dashData);
      setProjects(projData.projects ?? []);
      setTasks(taskData ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auth guard ────────────────────────────────────────────────

  if (!user || role !== "employee") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">Employee session required.</p>
      </div>
    );
  }

  // ── Error / loading states ────────────────────────────────────

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load your dashboard.</p>
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

  // ── Derived data ──────────────────────────────────────────────

  const myProjects   = dash?.recentProjects ?? projects;
  const myTasks      = dash?.myTasksList    ?? tasks;
  const pendingTasks = myTasks.filter((t) => t.taskStatus !== "done");
  const doneTasks    = myTasks.filter((t) => t.taskStatus === "done");
  const overduePrj   = myProjects.filter((p) => p.isOverdue);
  const urgentProjects = myProjects
    .filter((p) => p.projectStatus !== "completed" && p.expectedDeliveryDate && daysUntil(p.expectedDeliveryDate) <= 7)
    .sort((a, b) => new Date(a.expectedDeliveryDate!).getTime() - new Date(b.expectedDeliveryDate!).getTime());

  const assignedCount  = dash?.assignedProjectCount ?? myProjects.length;
  const overdueCount   = dash?.tasksOverdueCount    ?? overduePrj.length;
  const dueTodayCount  = dash?.tasksDueToday        ?? 0;
  const pendingReview  = dash?.pendingSubmissions    ?? 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Employee Workspace</p>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Hi, {user.firstName}
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <button onClick={() => navigate("/crm/employee/projects")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}>
              <AlertCircle size={11} strokeWidth={2.5} />{overdueCount} overdue
            </button>
          )}
          <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
            <RefreshCw size={13} className="text-neutral-400" />
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<FolderKanban size={20} />} label="Assigned" value={assignedCount} sub="active projects" accent="#1E3A8A" />
        <StatCard icon={<ListTodo size={20} />}     label="Tasks Pending" value={pendingTasks.length} sub="open tasks" accent="#6D28D9" />
        <StatCard icon={<Clock size={20} />}        label="Due Today" value={dueTodayCount} sub="tasks due today" accent="#D97706" />
        <StatCard icon={<CheckCircle2 size={20} />} label="Pending Review" value={pendingReview} sub="submissions" accent="#15803D" />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {[
          { label: "My Projects",     icon: <FolderKanban size={14} />, path: "/crm/employee/projects", accent: "#1E3A8A", badge: overduePrj.length },
          { label: "Submit for Review", icon: <CheckCircle2 size={14} />, path: "/crm/employee/projects", accent: "#15803D", badge: pendingReview },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative"
            style={{ background: `${a.accent}09`, border: `1px solid ${a.accent}20`, color: a.accent }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}14`; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}09`; el.style.transform = "translateY(0)"; }}>
            {a.icon}{a.label}
            {a.badge > 0 && <span className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: a.accent, color: "white" }}>{a.badge}</span>}
          </button>
        ))}
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* My Projects */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <div className="flex items-center gap-2">
              <FolderKanban size={16} style={{ color: "#1E3A8A" }} />
              <h2 className="text-sm font-bold text-neutral-900">My Projects</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: "#1E3A8A" }}>{assignedCount}</span>
            </div>
            <button onClick={() => navigate("/crm/employee/projects")}
              className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#1E3A8A" }}>
              View all<ArrowRight size={11} strokeWidth={2.5} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {myProjects.length === 0
              ? <EmptyCard icon={<FolderKanban size={22} />} title="No projects yet" sub="Projects assigned to you will appear here" />
              : myProjects.slice(0, 5).map((p) => {
                  const sc  = STATUS_CFG[p.projectStatus ?? ""] ?? STATUS_CFG.active;
                  const overdue = p.isOverdue;
                  const days = p.expectedDeliveryDate ? daysUntil(p.expectedDeliveryDate) : null;
                  return (
                    <button key={p._id} onClick={() => navigate(`/crm/employee/project/${p._id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-xl gap-3 text-left transition-all hover:-translate-y-px hover:shadow-sm"
                      style={{ background: overdue ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${overdue ? "#FED7D7" : "#E8EDF3"}` }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-neutral-900 truncate">{p.title || p.projectCode}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{p.projectCode}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        {days !== null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: overdue ? "rgba(220,38,38,0.10)" : days <= 3 ? "rgba(217,119,6,0.10)" : "rgba(100,116,139,0.08)", color: overdue ? "#DC2626" : days <= 3 ? "#B45309" : "#64748B" }}>
                            {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
            }
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <div className="flex items-center gap-2">
              <ListTodo size={16} style={{ color: "#6D28D9" }} />
              <h2 className="text-sm font-bold text-neutral-900">My Tasks</h2>
              {pendingTasks.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#F5F3FF", color: "#6D28D9" }}>{pendingTasks.length}</span>
              )}
            </div>
          </div>
          <div className="p-4">
            {myTasks.length === 0
              ? <EmptyCard icon={<ListTodo size={22} />} title="No tasks" sub="Tasks assigned to you will appear here" />
              : (
                <div className="space-y-2">
                  {pendingTasks.slice(0, 6).map((task) => {
                    const tsc = TASK_STATUS_CFG[task.taskStatus ?? "todo"] ?? TASK_STATUS_CFG.todo;
                    const pc  = PRIORITY_CFG[task.priority ?? "low"] ?? PRIORITY_CFG.low;
                    return (
                      <div key={task._id} className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
                        <CircleDot size={14} style={{ color: tsc.color, flexShrink: 0, marginTop: 2 }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-neutral-900 truncate">{task.title}</p>
                          {task.dueDate && (
                            <p className="text-[10px] mt-0.5" style={{ color: daysUntil(task.dueDate) < 0 ? "#B91C1C" : "#94A3B8" }}>
                              Due {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: pc.bg, color: pc.color }}>
                          {pc.label}
                        </span>
                      </div>
                    );
                  })}
                  {doneTasks.length > 0 && (
                    <p className="text-center text-xs text-neutral-400 pt-1">+ {doneTasks.length} completed</p>
                  )}
                </div>
              )
            }
          </div>
        </motion.div>
      </div>

      {/* Urgent deadlines */}
      {urgentProjects.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #FDE68A", boxShadow: "0 1px 4px rgba(217,119,6,0.10)" }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #FEF3C7", background: "#FFFBEB" }}>
            <Clock size={16} style={{ color: "#B45309" }} />
            <h2 className="text-sm font-bold" style={{ color: "#92400E" }}>Deadlines This Week</h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FDE68A", color: "#92400E" }}>
              {urgentProjects.length}
            </span>
          </div>
          <div className="p-4 grid sm:grid-cols-2 gap-2">
            {urgentProjects.map((p) => {
              const days = p.expectedDeliveryDate ? daysUntil(p.expectedDeliveryDate) : 0;
              const sc = STATUS_CFG[p.projectStatus ?? ""] ?? STATUS_CFG.active;
              return (
                <button key={p._id} onClick={() => navigate(`/crm/employee/project/${p._id}`)}
                  className="text-left rounded-xl p-3.5 transition-all hover:-translate-y-px"
                  style={{ background: p.isOverdue ? "#FFF5F5" : "#FFFBEB", border: `1px solid ${p.isOverdue ? "#FED7D7" : "#FDE68A"}` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{p.title || p.projectCode}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400">{p.projectCode}</p>
                    <span className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: days < 0 ? "#DC2626" : days === 0 ? "#B91C1C" : "#B45309" }}>
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

      {/* Progress overview */}
      {myProjects.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <TrendingUp size={16} style={{ color: "#15803D" }} />
            <h2 className="text-sm font-bold text-neutral-900">Project Status Overview</h2>
          </div>
          <div className="p-4 grid sm:grid-cols-2 gap-4">
            {myProjects.map((p) => {
              const sc = STATUS_CFG[p.projectStatus ?? ""] ?? STATUS_CFG.active;
              return (
                <div key={p._id}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <p className="text-xs font-semibold text-neutral-700 truncate">{p.title || p.projectCode}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                    <div className="h-full rounded-full"
                      style={{
                        width: p.projectStatus === "completed" ? "100%" :
                               p.projectStatus === "in_review" ? "80%" :
                               p.projectStatus === "waiting_client" ? "60%" :
                               p.projectStatus === "active" || p.projectStatus === "in_progress" ? "40%" :
                               p.projectStatus === "onboarding" ? "20%" : "10%",
                        background: p.isOverdue ? "linear-gradient(90deg, #EF4444, #DC2626)" : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
