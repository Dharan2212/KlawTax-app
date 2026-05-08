import { useCRMStore } from "@/store/useCRMStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/motion";
import {
  Calendar, User, ArrowRight, AlertTriangle, Clock,
  CheckCircle2, Loader2, Circle, Search, SlidersHorizontal,
  FolderOpen, ChevronRight,
} from "lucide-react";
import { useState } from "react";

// ── Helpers ──────────────────────────────────────────────
const isOverdue = (deadline: string, status: string) =>
  status !== "completed" && new Date(deadline) < new Date();

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(deadline: string) {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  return diff;
}

// ── Status badge ─────────────────────────────────────────
type ProjectStatus = "pending" | "active" | "waiting-client" | "review" | "completed" | "rejected";

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string; icon: React.ComponentType<{ size: number; strokeWidth: number }> }> = {
  pending: { label: "Not Started",  color: "#64748B", bg: "rgba(100,116,139,0.10)", icon: Circle        },
  active: { label: "In Progress",  color: "#2563EB", bg: "rgba(37,99,235,0.10)",  icon: Loader2        },
  review:      { label: "Under Review", color: "#D97706", bg: "rgba(217,119,6,0.10)",  icon: Clock          },
  completed:       { label: "Completed",      color: "#16A34A", bg: "rgba(22,163,74,0.10)",  icon: CheckCircle2 },
  "waiting-client": { label: "Waiting Client",  color: "#7C3AED", bg: "rgba(124,58,237,0.10)", icon: Clock        },
  rejected:         { label: "Rejected",         color: "#DC2626", bg: "rgba(220,38,38,0.10)",  icon: AlertTriangle },
};

function StatusBadge({ status, overdue }: { status: ProjectStatus; overdue?: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: "rgba(239,68,68,0.10)", color: "#DC2626" }}>
        <AlertTriangle size={11} strokeWidth={2.5} />
        Overdue
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

// ── Priority pill ─────────────────────────────────────────
function PriorityDot({ days }: { days: number }) {
  if (days < 0)  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#DC2626" }} />;
  if (days < 7)  return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#D97706" }} />;
  if (days < 21) return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#2563EB" }} />;
  return          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#CBD5E1" }} />;
}

// ── Main component ─────────────────────────────────────────
export default function ProjectManagement() {
  const navigate = useNavigate();
  const projects   = useCRMStore((s) => s.projects);
  const clients    = useCRMStore((s) => s.clients);
  const users      = useCRMStore((s) => s.users);
  const tasks      = useCRMStore((s) => s.tasks);
  const submissions = useCRMStore((s) => s.clientSubmissions);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProjectStatus>("all");

  const getClient  = (id: string) => clients.find((c) => c.id === id);
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || "Unassigned";

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      getClient(p.clientId)?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Counts for filter tabs
  const counts: Record<string, number> = { all: projects.length };
  (Object.keys(STATUS_CONFIG) as ProjectStatus[]).forEach((s) => {
    counts[s] = projects.filter((p) => p.status === s).length;
  });
  const overdueCount = projects.filter((p) => isOverdue(p.deadline, p.status)).length;

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground">Project Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} of {projects.length} projects
            {overdueCount > 0 && (
              <span style={{ color: "#DC2626" }}> · {overdueCount} overdue</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {(["pending", "active", "review", "completed", "rejected"] as ProjectStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className="text-left rounded-xl p-3.5 border transition-all duration-150"
              style={{
                background: filterStatus === s ? cfg.bg : "hsl(var(--color-white))",
                borderColor: filterStatus === s ? cfg.color + "40" : "hsl(var(--color-neutral-200))",
                boxShadow: filterStatus === s ? `0 0 0 1.5px ${cfg.color}30` : "var(--shadow-xs)",
              }}
            >
              <p className="text-xl font-bold font-mono" style={{ color: cfg.color }}>{counts[s]}</p>
              <p className="text-xs mt-0.5" style={{ color: "#64748B", fontFamily: "'DM Sans', sans-serif" }}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── Search & filter bar ── */}
      <div className="flex gap-2.5 mb-5 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
        <button
          onClick={() => { setSearch(""); setFilterStatus("all"); }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <SlidersHorizontal size={14} strokeWidth={2} />
          Reset
        </button>
      </div>

      {/* ── Project list ── */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {filtered.map((project) => {
            const overdue    = isOverdue(project.deadline, project.status);
            const client     = getClient(project.clientId);
            const projTasks  = tasks.filter((t) => t.projectId === project.id);
            const doneTasks  = projTasks.filter((t) => t.status === "done").length;
            const pendingSubs = submissions.filter((s) => s.projectId === project.id && s.status === "pending");
            const days       = daysUntil(project.deadline);

            return (
              <motion.button
                key={project.id}
                variants={staggerItem}
                onClick={() => navigate(`/crm/admin/projects/${project.id}`)}
                className="w-full text-left group"
              >
                <div
                  className="rounded-2xl border p-5 transition-all duration-200 cursor-pointer"
                  style={{
                    background: "hsl(var(--color-white))",
                    borderColor: overdue ? "rgba(239,68,68,0.30)" : "hsl(var(--color-neutral-200))",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = overdue ? "rgba(239,68,68,0.50)" : "hsl(var(--color-primary-300, 214 80% 72%))";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = overdue ? "rgba(239,68,68,0.30)" : "hsl(var(--color-neutral-200))";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                          #{project.id}
                        </span>
                        <StatusBadge status={project.status} overdue={overdue} />
                        {pendingSubs.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: "rgba(217,119,6,0.10)", color: "#D97706" }}>
                            {pendingSubs.length} pending review
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground text-[0.9375rem] leading-snug truncate"
                        style={{ fontFamily: "'Sora', sans-serif" }}>
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {client?.name || "—"}
                      </p>
                    </div>

                    {/* Right meta */}
                    <div className="flex items-center gap-5 flex-shrink-0">
                      <MetaItem icon={<User size={13} strokeWidth={2} />} value={getUserName(project.assignedTo)} />
                      <MetaItem
                        icon={<PriorityDot days={days} />}
                        value={fmtDate(project.deadline)}
                        muted={!overdue}
                        danger={overdue}
                      />
                      <ChevronRight size={15} strokeWidth={2} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                        {doneTasks}/{projTasks.length} tasks completed
                      </span>
                      <span className="text-xs font-semibold font-mono" style={{ color: "#2563EB" }}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--color-neutral-100))" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${project.progress}%`,
                          background: overdue
                            ? "linear-gradient(90deg, #DC2626, #EF4444)"
                            : project.status === "completed"
                              ? "linear-gradient(90deg, #16A34A, #22C55E)"
                              : "linear-gradient(90deg, #1E3A8A, #7C3AED)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}

function MetaItem({
  icon, value, muted, danger
}: { icon: React.ReactNode; value: string; muted?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-sm"
      style={{
        color: danger ? "#DC2626" : muted ? "#64748B" : "#334155",
        fontFamily: "'DM Sans', sans-serif",
      }}>
      {icon}
      {value}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed text-center py-16"
      style={{ borderColor: "hsl(var(--color-neutral-200))", background: "hsl(var(--color-neutral-50))" }}>
      <FolderOpen size={36} strokeWidth={1.5} className="mx-auto mb-3 text-muted-foreground opacity-40" />
      <p className="font-semibold text-foreground text-sm">No projects found</p>
      <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
    </div>
  );
}
