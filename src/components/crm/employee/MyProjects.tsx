import { useNavigate } from "react-router-dom";
import { useCRMStore } from "@/store/useCRMStore";
import { motion } from "framer-motion";
import {
  FolderKanban, CalendarDays, ArrowRight, ListTodo,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, Circle,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────
const daysUntil = (d: string) =>
  Math.ceil((new Date(d).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
const isOverdue = (d: string, s: string) => s !== "completed" && new Date(d) < new Date();

// ─── Status config ────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pending: { label: "Not Started",  bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" },
  active: { label: "In Progress",  bg: "#EFF6FF", color: "#1E3A8A", border: "#BFDBFE" },
  review:      { label: "In Review",    bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "waiting-client": { label: "Waiting — Client", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  rejected:    { label: "Rejected",    bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  completed:   { label: "Completed",    bg: "#DCFCE7", color: "#15803D", border: "#BBF7D0" },
};

// ─── Empty State ─────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      className="bg-white rounded-2xl flex flex-col items-center justify-center py-20 text-center"
      style={{ border: "1px solid #E8EDF3" }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#F1F5F9" }}
      >
        <FolderKanban size={28} style={{ color: "#94A3B8" }} />
      </div>
      <h3 className="text-base font-bold text-neutral-900 mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>
        No Projects Yet
      </h3>
      <p className="text-sm text-neutral-400">
        Projects assigned to you will appear here.
      </p>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────
function ProjectCard({
  project,
  clientName,
  taskCount,
  doneCount,
}: {
  project: ReturnType<typeof useCRMStore.getState>["projects"][0];
  clientName: string;
  taskCount: number;
  doneCount: number;
}) {
  const navigate = useNavigate();
  const overdue = isOverdue(project.deadline, project.status);
  const days = daysUntil(project.deadline);
  const cfg = STATUS_CFG[project.status] ?? STATUS_CFG.pending;

  const urgencyColor = overdue
    ? "#B91C1C"
    : days <= 3
    ? "#B45309"
    : days <= 7
    ? "#92400E"
    : "#64748B";

  return (
    <motion.button
      onClick={() => navigate(`/crm/employee/project/${project.id}`)}
      className="w-full text-left group"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          border: overdue ? "1px solid #FCA5A5" : `1px solid ${cfg.border}`,
          boxShadow: "0 1px 4px rgba(15,27,76,0.06)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(15,27,76,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(15,27,76,0.06)";
        }}
      >
        {/* Card top stripe */}
        <div
          className="h-1"
          style={{
            background: overdue
              ? "linear-gradient(90deg, #EF4444, #DC2626)"
              : project.status === "completed"
              ? "linear-gradient(90deg, #15803D, #22C55E)"
              : project.status === "review"
              ? "linear-gradient(90deg, #B45309, #F59E0B)"
              : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
          }}
        />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-mono text-neutral-400"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  #{project.id.toUpperCase()}
                </span>
                {overdue && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#FEE2E2", color: "#B91C1C" }}>
                    <AlertTriangle size={9} /> Overdue
                  </span>
                )}
              </div>
              <h3
                className="text-base font-bold text-neutral-900 leading-snug"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {project.title}
              </h3>
              <p className="text-sm text-neutral-400 mt-0.5">{clientName}</p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <ArrowRight size={16} style={{ color: "#CBD5E1" }} className="group-hover:text-neutral-700 transition-colors" />
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mb-4">
            <span
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: urgencyColor }}
            >
              <CalendarDays size={13} />
              {overdue
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? "Due today"
                : days === 1
                ? "Due tomorrow"
                : `${days} days left`}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-neutral-400">
              <ListTodo size={13} />
              {doneCount}/{taskCount} tasks
            </span>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-neutral-400">Progress</span>
              <span
                className="text-xs font-bold"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: overdue ? "#B91C1C" : "#1E3A8A",
                }}
              >
                {project.progress}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${project.progress}%`,
                  background: overdue
                    ? "linear-gradient(90deg, #EF4444, #DC2626)"
                    : project.status === "completed"
                    ? "linear-gradient(90deg, #15803D, #22C55E)"
                    : "linear-gradient(90deg, #1E3A8A, #3B82F6)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────
function SummaryBar({
  myProjects,
}: {
  myProjects: ReturnType<typeof useCRMStore.getState>["projects"];
}) {
  const active    = myProjects.filter((p) => p.status === "active").length;
  const review    = myProjects.filter((p) => p.status === "review").length;
  const completed = myProjects.filter((p) => p.status === "completed").length;
  const overdue   = myProjects.filter((p) => isOverdue(p.deadline, p.status)).length;

  const stats = [
    { label: "Total",     value: myProjects.length, color: "#64748B", bg: "#F1F5F9" },
    { label: "Active",    value: active,    color: "#1E3A8A", bg: "#EFF6FF" },
    { label: "In Review", value: review,    color: "#92400E", bg: "#FEF3C7" },
    { label: "Completed", value: completed, color: "#15803D", bg: "#DCFCE7" },
    { label: "Overdue",   value: overdue,   color: overdue > 0 ? "#B91C1C" : "#94A3B8", bg: overdue > 0 ? "#FEE2E2" : "#F1F5F9" },
  ];

  return (
    <div
      className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-3"
      style={{ border: "1px solid #E8EDF3" }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: s.bg }}
        >
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: s.color }}
          >
            {s.value}
          </span>
          <span className="text-xs font-medium" style={{ color: s.color }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function MyProjects() {
  const users         = useCRMStore((s) => s.users);
  const currentUserId = useCRMStore((s) => s.currentUserId);
  const currentUser   = users.find((u) => u.id === currentUserId);
  const projects      = useCRMStore((s) => s.projects);
  const tasks         = useCRMStore((s) => s.tasks);
  const clients       = useCRMStore((s) => s.clients);

  if (!currentUser || currentUser.role !== "employee") {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-neutral-400 text-sm">No employee session found.</p>
      </div>
    );
  }

  const myProjects = projects.filter((p) => p.assignedTo === currentUser.id);
  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0, 0, 0.2, 1] } },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* ── Page header ─────────────────────────────────── */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1
          className="text-2xl font-bold text-neutral-900"
          style={{ fontFamily: "'Sora', sans-serif", letterSpacing: "-0.02em" }}
        >
          My Projects
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          {myProjects.length} project{myProjects.length !== 1 ? "s" : ""} assigned to you
        </p>
      </motion.div>

      {/* ── Summary bar ─────────────────────────────────── */}
      {myProjects.length > 0 && (
        <motion.div variants={itemVariants}>
          <SummaryBar myProjects={myProjects} />
        </motion.div>
      )}

      {/* ── Projects grid / list ─────────────────────────── */}
      {myProjects.length === 0 ? (
        <motion.div variants={itemVariants}>
          <EmptyState />
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid sm:grid-cols-2 gap-4">
          {myProjects.map((project) => {
            const projectTasks = tasks.filter((t) => t.projectId === project.id);
            const doneCount    = projectTasks.filter((t) => t.status === "done").length;
            return (
              <motion.div key={project.id} variants={itemVariants}>
                <ProjectCard
                  project={project}
                  clientName={getClientName(project.clientId)}
                  taskCount={projectTasks.length}
                  doneCount={doneCount}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
