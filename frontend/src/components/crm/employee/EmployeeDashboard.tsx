/**
 * EmployeeDashboard — Batch 5.2
 *
 * Fully rewritten to consume the rich EmployeeDashboardResponse from
 * the backend (v1.5 architecture). Uses workload, tasks, dueToday,
 * pendingReviews, and activeProjects sections directly.
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchEmployeeDashboard,
  type EmployeeDashboard as EmpDashData,
  type EmpProjectPreviewItem,
  type EmpTaskPreviewItem,
  type EmpDueTodayItem,
  type EmpPendingReviewItem,
} from "@/lib/crmApi";
import { motion } from "framer-motion";
import {
  FolderKanban, ListTodo, AlertCircle, CheckCircle2,
  Clock, CalendarDays, ArrowRight, TrendingUp,
  CircleDot, Activity, Loader2, RefreshCw,
  ShieldCheck, AlertTriangle, Zap,
} from "lucide-react";
import {
  fmtDateNoYear as fmtDate,
  INTERNAL_PROJECT_STATUS_CFG,
  TASK_STATUS_CFG,
  APPROVAL_STATUS_CFG,
  PRIORITY_CFG,
} from "@/lib/crmUtils";

// ── Local alias ────────────────────────────────────────────────
// INTERNAL_PROJECT_STATUS_CFG is aliased as STATUS_CFG to keep
// call-sites unchanged from the original local definition.
const STATUS_CFG = INTERNAL_PROJECT_STATUS_CFG;

// ── Helpers ────────────────────────────────────────────────────

function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

// ── Sub-components ─────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent, alert }: {
  icon: React.ReactNode; label: string; value: number | string;
  sub?: string; accent: string; alert?: boolean;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-start justify-between gap-3"
      style={{
        border: alert && Number(value) > 0 ? `1px solid ${accent}40` : "1px solid #E8EDF3",
        boxShadow: alert && Number(value) > 0 ? `0 2px 12px ${accent}18` : "0 1px 4px rgba(15,27,76,0.06)",
      }}
    >
      <div>
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{label}</p>
        <p className="text-3xl font-bold" style={{ fontFamily: "'Sora', sans-serif", color: alert && Number(value) > 0 ? accent : "#0F172A" }}>
          {value}
        </p>
        {sub && <p className="text-xs text-neutral-400 mt-1">{sub}</p>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
    </div>
  );
}

function SectionCard({ title, icon, accent, badge, count, onViewAll, children }: {
  title: string; icon: React.ReactNode; accent: string;
  badge?: number; count?: number; onViewAll?: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>{icon}</span>
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          {count !== undefined && count > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${accent}15`, color: accent }}>
              {count}
            </span>
          )}
          {badge !== undefined && badge > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626" }}>
              {badge} overdue
            </span>
          )}
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
            View all<ArrowRight size={11} strokeWidth={2.5} />
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#F1F5F9" }}>
        <span className="text-neutral-400">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-neutral-600 mb-1">{title}</p>
      <p className="text-xs text-neutral-400">{sub}</p>
    </div>
  );
}

function TaskRow({ task }: { task: EmpTaskPreviewItem }) {
  const tsc = TASK_STATUS_CFG[task.taskStatus] ?? TASK_STATUS_CFG.todo;
  const pc  = PRIORITY_CFG[task.taskPriority] ?? PRIORITY_CFG.low;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: task.isOverdue ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${task.isOverdue ? "#FED7D7" : "#E8EDF3"}` }}
    >
      <CircleDot size={14} style={{ color: task.isBlocked ? "#DC2626" : tsc.color, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-900 truncate">{task.title}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">{task.projectCode}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: tsc.bg, color: tsc.color }}>
          {tsc.label}
        </span>
        {task.dueDate && (
          <span className="text-[10px] font-bold" style={{ color: task.isOverdue ? "#DC2626" : pc.color }}>
            {task.isOverdue ? `${Math.abs(daysUntil(task.dueDate))}d overdue` : `Due ${fmtDate(task.dueDate)}`}
          </span>
        )}
      </div>
    </div>
  );
}

function DueTodayRow({ item }: { item: EmpDueTodayItem }) {
  const isTask = item.type === "task";
  const sc = STATUS_CFG[item.status] ?? STATUS_CFG.active;
  const days = item.dueDate ? daysUntil(item.dueDate) : 0;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: item.isOverdue ? "#FFF5F5" : "#FFFBEB", border: `1px solid ${item.isOverdue ? "#FED7D7" : "#FDE68A"}` }}
    >
      {isTask
        ? <ListTodo size={14} style={{ color: "#6D28D9", flexShrink: 0 }} />
        : <FolderKanban size={14} style={{ color: "#1E3A8A", flexShrink: 0 }} />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-900 truncate">{item.title}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">{item.projectCode ?? item.type}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
          {sc.label}
        </span>
        <span className="text-[10px] font-bold" style={{ color: item.isOverdue ? "#DC2626" : days === 0 ? "#B91C1C" : "#B45309" }}>
          {item.isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today!" : `${days}d left`}
        </span>
      </div>
    </div>
  );
}

function ReviewRow({ item }: { item: EmpPendingReviewItem }) {
  const asc = APPROVAL_STATUS_CFG[item.approvalStatus] ?? APPROVAL_STATUS_CFG.pending;
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8FAFC", border: "1px solid #E8EDF3" }}>
      <ShieldCheck size={14} style={{ color: "#1E3A8A", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-900 truncate capitalize">{item.approvalType?.replace(/_/g, " ")}</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">{item.projectCode ?? item.taskTitle ?? "—"}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: asc.bg, color: asc.color }}>
          {asc.label}
        </span>
        {item.resubmissionCount > 0 && (
          <span className="text-[10px] font-bold text-amber-600">Rev #{item.resubmissionCount}</span>
        )}
      </div>
    </div>
  );
}

function ProjectRow({ project, onClick }: { project: EmpProjectPreviewItem; onClick: () => void }) {
  const sc = STATUS_CFG[project.projectStatus] ?? STATUS_CFG.active;
  const totalTasks = project.openTaskCount + project.completedTaskCount;
  const progress = totalTasks > 0 ? Math.round((project.completedTaskCount / totalTasks) * 100) : 0;
  const days = project.expectedDeliveryDate ? daysUntil(project.expectedDeliveryDate) : null;
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl transition-all hover:-translate-y-px hover:shadow-sm"
      style={{ background: project.isOverdue ? "#FFF5F5" : "#F8FAFC", border: `1px solid ${project.isOverdue ? "#FED7D7" : "#E8EDF3"}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-neutral-900 truncate">{project.clientName}</p>
          <p className="text-[10px] text-neutral-400">{project.projectCode}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {project.isOverdue && <AlertTriangle size={11} style={{ color: "#DC2626" }} />}
          {project.isStalled && <Clock size={11} style={{ color: "#B45309" }} />}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#E8EDF3" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: project.isOverdue ? "linear-gradient(90deg,#EF4444,#DC2626)" : "linear-gradient(90deg,#1E3A8A,#3B82F6)",
            }}
          />
        </div>
        <span className="text-[10px] font-bold text-neutral-500 flex-shrink-0">{progress}%</span>
        {days !== null && (
          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: project.isOverdue ? "#DC2626" : days <= 3 ? "#B45309" : "#94A3B8" }}>
            {project.isOverdue ? `${Math.abs(days)}d over` : days === 0 ? "Due today" : `${days}d`}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const [dash, setDash]       = useState<EmpDashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchEmployeeDashboard();
      setDash(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Auth guard ─────────────────────────────────────────────

  if (!user || role !== "employee") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">Employee session required.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-neutral-500 text-sm">Failed to load your dashboard.</p>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#1E3A8A", color: "white" }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: "#E8EDF3" }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: "#F1F5F9" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Derived data ────────────────────────────────────────────

  const wl = dash?.workload;
  const tasks = dash?.tasks;
  const dueToday = dash?.dueToday;
  const reviews = dash?.pendingReviews;
  const projects = dash?.activeProjects;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">

      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Employee Workspace</p>
          <h1 className="text-xl font-bold text-neutral-900" style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}>
            Hi, {user.firstName} 👋
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(wl?.overdueTasks ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(220,38,38,0.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.20)" }}>
              <AlertCircle size={11} strokeWidth={2.5} />{wl!.overdueTasks} overdue
            </span>
          )}
          {(wl?.completedTodayTasks ?? 0) > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(22,163,74,0.10)", color: "#15803D", border: "1px solid rgba(22,163,74,0.20)" }}>
              <CheckCircle2 size={11} strokeWidth={2.5} />{wl!.completedTodayTasks} done today
            </span>
          )}
          <button onClick={loadData} className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-neutral-100" title="Refresh">
            <RefreshCw size={13} className="text-neutral-400" />
          </button>
        </div>
      </motion.div>

      {/* Workload stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<FolderKanban size={20} />} label="Active Projects" value={wl?.activeProjects ?? 0} sub={`${wl?.overdueProjects ?? 0} overdue`} accent="#1E3A8A" alert={!!wl?.overdueProjects} />
        <StatCard icon={<ListTodo size={20} />}     label="Open Tasks"      value={wl?.openTasks ?? 0}      sub={`${wl?.blockedTasks ?? 0} blocked`}  accent="#6D28D9" alert={!!wl?.blockedTasks} />
        <StatCard icon={<Clock size={20} />}        label="Due Today"       value={dueToday?.total ?? 0}    sub={`${dueToday?.overdue ?? 0} overdue`} accent="#D97706" alert={!!(dueToday?.overdue)} />
        <StatCard icon={<Activity size={20} />}     label="Pending Reviews" value={wl?.pendingApprovals ?? 0} sub={`${reviews?.revisionRequested ?? 0} need revision`} accent="#15803D" />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "My Projects",    icon: <FolderKanban size={13} />, path: "/crm/employee/projects", accent: "#1E3A8A", badge: wl?.overdueProjects ?? 0 },
          { label: "Overdue Tasks",  icon: <AlertCircle size={13} />,  path: "/crm/employee/projects", accent: "#DC2626", badge: wl?.overdueTasks ?? 0 },
          { label: "Pending Reviews", icon: <ShieldCheck size={13} />, path: "/crm/employee/projects", accent: "#15803D", badge: wl?.pendingApprovals ?? 0 },
          { label: "Stalled Work",   icon: <Zap size={13} />,          path: "/crm/employee/projects", accent: "#B45309", badge: wl?.stalledProjects ?? 0 },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all relative"
            style={{ background: `${a.accent}09`, border: `1px solid ${a.accent}20`, color: a.accent }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}14`; el.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${a.accent}09`; el.style.transform = ""; }}>
            {a.icon} {a.label}
            {a.badge > 0 && (
              <span className="ml-auto text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: a.accent, color: "white" }}>
                {a.badge}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Main grid — Due Today + Task Summary */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Due Today */}
        <motion.div variants={itemVariants}>
          <SectionCard title="Due Today" icon={<CalendarDays size={16} />} accent="#D97706" count={dueToday?.total} badge={dueToday?.overdue}>
            {!dueToday?.items.length
              ? <EmptyState icon={<CalendarDays size={22} />} title="All clear today!" sub="No tasks or projects due today." />
              : <div className="space-y-2">
                  {dueToday.items.map((item) => <DueTodayRow key={item.id} item={item} />)}
                </div>
            }
          </SectionCard>
        </motion.div>

        {/* Task Summary */}
        <motion.div variants={itemVariants}>
          <SectionCard title="My Tasks" icon={<ListTodo size={16} />} accent="#6D28D9" count={tasks?.counts.total} badge={tasks?.counts.overdue}>
            {!tasks?.recentlyAssigned.length
              ? <EmptyState icon={<ListTodo size={22} />} title="No tasks assigned" sub="Tasks assigned to you will appear here." />
              : (
                <div className="space-y-2">
                  {/* overdue first */}
                  {tasks.overdueTasks.slice(0, 3).map((t) => <TaskRow key={t.taskId} task={t} />)}
                  {tasks.recentlyAssigned
                    .filter((t) => !tasks.overdueTasks.some((o) => o.taskId === t.taskId))
                    .slice(0, 4)
                    .map((t) => <TaskRow key={t.taskId} task={t} />)}
                  {tasks.counts.total > 5 && (
                    <p className="text-center text-xs text-neutral-400 pt-1">+{tasks.counts.total - 5} more tasks</p>
                  )}
                </div>
              )
            }
          </SectionCard>
        </motion.div>
      </div>

      {/* Active Projects */}
      <motion.div variants={itemVariants}>
        <SectionCard
          title="Active Projects"
          icon={<FolderKanban size={16} />}
          accent="#1E3A8A"
          count={projects?.total}
          badge={projects?.overdue}
          onViewAll={() => navigate("/crm/employee/projects")}
        >
          {!projects?.projects.length
            ? <EmptyState icon={<FolderKanban size={22} />} title="No active projects" sub="Projects assigned to you will appear here." />
            : (
              <div className="grid sm:grid-cols-2 gap-2">
                {projects.projects.map((p) => (
                  <ProjectRow
                    key={p.projectId}
                    project={p}
                    onClick={() => navigate(`/crm/employee/project/${p.projectId}`)}
                  />
                ))}
              </div>
            )
          }
        </SectionCard>
      </motion.div>

      {/* Pending Reviews */}
      {(reviews?.total ?? 0) > 0 && (
        <motion.div variants={itemVariants}>
          <SectionCard title="Pending Reviews" icon={<ShieldCheck size={16} />} accent="#15803D" count={reviews?.total}>
            <div className="space-y-2">
              {reviews!.items.map((item) => <ReviewRow key={item.approvalId} item={item} />)}
              {reviews!.total > reviews!.items.length && (
                <p className="text-center text-xs text-neutral-400 pt-1">+{reviews!.total - reviews!.items.length} more submissions</p>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}

      {/* Task distribution */}
      {tasks && tasks.counts.total > 0 && (
        <motion.div variants={itemVariants} className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8EDF3", boxShadow: "0 1px 4px rgba(15,27,76,0.06)" }}>
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
            <TrendingUp size={16} style={{ color: "#6D28D9" }} />
            <h2 className="text-sm font-bold text-neutral-900">Task Distribution</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
              {[
                { label: "To Do",       value: tasks.counts.todo,         accent: "#64748B" },
                { label: "Active",      value: tasks.counts.active,        accent: "#1E3A8A" },
                { label: "Reviewing",   value: tasks.counts.waitingReview, accent: "#0F766E" },
                { label: "Blocked",     value: tasks.counts.blocked,       accent: "#DC2626" },
                { label: "Overdue",     value: tasks.counts.overdue,       accent: "#B91C1C" },
                { label: "Completed",   value: tasks.counts.completed,     accent: "#15803D" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-bold" style={{ fontFamily: "'Sora',sans-serif", color: s.value > 0 ? s.accent : "#CBD5E1" }}>
                    {s.value}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
